package com.iit.creditmanagement.billing.listener;

import com.iit.creditmanagement.constants.AppConstants;
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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Billing Domain Event Listener.
 *
 * Listens for {@link CourseEnrolledEvent} and automatically generates
 * retake fee invoices and semester gap penalty invoices AFTER the enrollment transaction commits.
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
     * Automatically generates retake and gap fee invoices when enrollment commits.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCourseEnrolled(CourseEnrolledEvent event) {
        log.info("[BillingListener] Processing billing checks for student={} course={} enrollment={}",
                event.studentId(), event.courseCode(), event.enrollmentId());

        // 1. Process retake fee if applicable
        if (event.isRetake()) {
            processRetakeFee(event);
        }

        // 2. Process semester gap penalty if student had missed terms prior to this active term
        processSemesterGapFee(event.studentId(), event.semesterId());
    }

    private void processRetakeFee(CourseEnrolledEvent event) {
        try {
            User student = userRepository.findById(event.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", event.studentId()));

            Semester semester = semesterRepository.findById(event.semesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Semester", event.semesterId()));

            Enrollment enrollment = enrollmentRepository.findById(event.enrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", event.enrollmentId()));

            // Idempotency guard: don't create duplicate retake fee
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
            log.error("[BillingListener] Failed to create retake fee for enrollment {}: {}",
                    event.enrollmentId(), ex.getMessage(), ex);
        }
    }

    private void processSemesterGapFee(Long studentId, Long currentSemesterId) {
        try {
            // Guard: check if gap fee already exists for this semester
            if (feeRepository.existsByStudentIdAndSemesterIdAndFeeType(studentId, currentSemesterId, FeeType.SEMESTER_GAP)) {
                return;
            }

            List<Semester> allSemesters = semesterRepository.findAll(Sort.by(Sort.Direction.ASC, "startDate", "id"));
            int currentSemIndex = -1;
            for (int i = 0; i < allSemesters.size(); i++) {
                if (allSemesters.get(i).getId().equals(currentSemesterId)) {
                    currentSemIndex = i;
                    break;
                }
            }
            if (currentSemIndex <= 0) return;

            List<Enrollment> allEnrollments = enrollmentRepository.findAllByStudentId(studentId);
            Set<Long> enrolledSemesterIds = new HashSet<>();
            for (Enrollment e : allEnrollments) {
                enrolledSemesterIds.add(e.getSemester().getId());
            }

            int firstEnrolledIndex = -1;
            for (int i = 0; i < currentSemIndex; i++) {
                if (enrolledSemesterIds.contains(allSemesters.get(i).getId())) {
                    firstEnrolledIndex = i;
                    break;
                }
            }
            if (firstEnrolledIndex == -1) {
                return; // First semester of study
            }

            // Count missed terms between last enrolled and current semester
            int gapCount = 0;
            for (int i = firstEnrolledIndex + 1; i < currentSemIndex; i++) {
                if (!enrolledSemesterIds.contains(allSemesters.get(i).getId())) {
                    gapCount++;
                }
            }

            if (gapCount > 0) {
                User student = userRepository.findById(studentId).orElse(null);
                Semester semester = semesterRepository.findById(currentSemesterId).orElse(null);

                if (student != null && semester != null) {
                    BigDecimal fineAmount = BigDecimal.valueOf(gapCount * AppConstants.DEFAULT_SEMESTER_GAP_FEE);
                    Fee gapFee = Fee.builder()
                            .student(student)
                            .feeType(FeeType.SEMESTER_GAP)
                            .amount(fineAmount)
                            .description(String.format("Auto-generated semester gap fine for %d missed term(s) prior to %s",
                                    gapCount, semester.getLabel()))
                            .semester(semester)
                            .status(FeeStatus.UNPAID)
                            .dueDate(LocalDate.now().plusDays(30))
                            .build();

                    feeRepository.save(gapFee);
                    log.info("[BillingListener] ✓ Semester gap fine of {} BDT created for student={} ({} missed term(s))",
                            fineAmount, studentId, gapCount);
                }
            }
        } catch (Exception ex) {
            log.error("[BillingListener] Failed to evaluate semester gap fee for student {}: {}",
                    studentId, ex.getMessage(), ex);
        }
    }
}
