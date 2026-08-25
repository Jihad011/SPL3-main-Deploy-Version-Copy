package com.iit.creditmanagement.billing.listener;

import com.iit.creditmanagement.enrollment.event.CourseEnrolledEvent;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.entity.Fee;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.FeeStatus;
import com.iit.creditmanagement.model.enums.FeeType;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.FeeRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;

/**
 * Billing Domain Event Listener.
 *
 * Listens for {@link CourseEnrolledEvent} and automatically generates
 * retake fee invoices AFTER the enrollment transaction commits.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  WHY @TransactionalEventListener(AFTER_COMMIT)?             │
 * │                                                             │
 * │  If enrollment fails and rolls back, we MUST NOT create a   │
 * │  fee invoice. Using AFTER_COMMIT guarantees the event is    │
 * │  only processed when the enrollment is permanently saved.   │
 * │                                                             │
 * │  This pattern is used at Amazon (SQS/SNS), Stripe           │
 * │  (payment events), and Netflix (viewing history events).    │
 * └─────────────────────────────────────────────────────────────┘
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BillingEnrollmentEventListener {

    private final FeeRepository        feeRepository;
    private final UserRepository       userRepository;
    private final SemesterRepository   semesterRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * Automatically generates a retake fee invoice when a retake enrollment commits.
     *
     * This runs in the SAME transaction as enrollment by default.
     * The @Async variant would need outbox pattern support for true decoupling.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCourseEnrolled(CourseEnrolledEvent event) {
        if (!event.isRetake()) {
            return; // Normal enrollments don't incur retake fees
        }

        log.info("[BillingListener] Processing retake fee for student={} course={} enrollment={}",
                event.studentId(), event.courseCode(), event.enrollmentId());

        try {
            User student = userRepository.findById(event.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", event.studentId()));

            Semester semester = semesterRepository.findById(event.semesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Semester", event.semesterId()));

            Enrollment enrollment = enrollmentRepository.findById(event.enrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", event.enrollmentId()));

            // Idempotency guard: don't create a duplicate fee if listener fires twice
            boolean feeAlreadyExists = feeRepository
                    .existsByStudentIdAndEnrollmentId(student.getId(), enrollment.getId());

            if (feeAlreadyExists) {
                log.warn("[BillingListener] Retake fee already exists for enrollment {}. Skipping duplicate.",
                        event.enrollmentId());
                return;
            }

            Fee retakeFee = Fee.builder()
                    .student(student)
                    .feeType(FeeType.RETAKE)
                    .amount(event.retakeFeeAmount())
                    .description(String.format(
                            "Auto-generated retake fee for course: %s (%s) | Semester ID: %d",
                            event.courseName(), event.courseCode(), event.semesterId()))
                    .semester(semester)
                    .enrollment(enrollment)
                    .status(FeeStatus.UNPAID)
                    .dueDate(LocalDate.now().plusDays(30))
                    .build();

            feeRepository.save(retakeFee);

            log.info("[BillingListener] ✓ Retake fee of {} BDT created for student={} course={}",
                    event.retakeFeeAmount(), event.studentId(), event.courseCode());

        } catch (Exception ex) {
            // Log but never propagate: billing failure must not block enrollment confirmation
            log.error("[BillingListener] Failed to create retake fee for enrollment {}: {}",
                    event.enrollmentId(), ex.getMessage(), ex);
        }
    }
}
