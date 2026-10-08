package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.enrollment.event.CourseEnrolledEvent;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.entity.*;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.repository.*;
import com.iit.creditmanagement.service.EnrollmentService;
import com.iit.creditmanagement.util.CreditValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository  enrollmentRepository;
    private final CourseRepository      courseRepository;
    private final UserRepository        userRepository;
    private final SemesterRepository    semesterRepository;
    private final CreditValidator       creditValidator;
    /** Publishes domain events to decouple enrollment from billing/notification */
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public EnrollmentResponse enroll(Long studentId, EnrollRequest request) {
        // 1. Resolve student, course, active semester
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        Course course = courseRepository.findByIdForUpdate(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.courseId()));

        Semester semester = semesterRepository.findById(request.semesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester", request.semesterId()));
        if (!semester.isActive()) {
            throw new BusinessRuleException(
                    "Selected semester is not active. Enrollment is closed for this semester.");
        }

        // 2. Business rule checks (app-layer for friendly messages)
        Integer targetLevel = request.targetSemesterLevel() != null ? request.targetSemesterLevel() :
                (course.getSemesterLevel() != null ? course.getSemesterLevel() :
                (java.util.List.of("MITM 303", "MITM 304", "MITM 310", "MITM 311").contains(course.getCode()) ? 1 :
                (java.util.List.of("MITM 301", "MITM 305").contains(course.getCode()) ? 2 :
                ("MITM 421".equals(course.getCode()) ? 3 : 2))));
        String intakeType = request.intakeType() != null ? request.intakeType() : "Spring";

        creditValidator.validateNoDuplicateEnrollment(studentId, course.getId(), semester.getId());
        creditValidator.validateCreditLimit(studentId, semester.getId(), course, targetLevel, intakeType);
        creditValidator.validateSeatAvailability(
                course.getCurrentEnrollment(), course.getMaxSeats(), course.getName());

        // 3. Persist enrollment (Handle re-enrolling if previously dropped)
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseIdAndSemesterId(studentId, course.getId(), semester.getId())
                .orElse(null);

        if (enrollment != null) {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setRetake(request.retake());
            enrollment.setTargetSemesterLevel(targetLevel);
            enrollment.setIntakeType(intakeType);
        } else {
            enrollment = Enrollment.builder()
                    .student(student)
                    .course(course)
                    .semester(semester)
                    .status(EnrollmentStatus.ACTIVE)
                    .isRetake(request.retake())
                    .targetSemesterLevel(targetLevel)
                    .intakeType(intakeType)
                    .build();
        }

        enrollment = enrollmentRepository.save(enrollment);

        // Update course seat count
        course.setCurrentEnrollment(course.getCurrentEnrollment() + 1);
        courseRepository.save(course);

        log.info("Student {} enrolled in course {} for semester {}",
                studentId, course.getCode(), semester.getLabel());

        // ── Publish domain event (replaces inline fee creation) ──────────────────
        // BillingEnrollmentEventListener handles retake fee generation AFTER COMMIT.
        // This decouples enrollment from billing, preventing tight coupling.
        CourseEnrolledEvent event = new CourseEnrolledEvent(
                enrollment.getId(),
                studentId,
                course.getId(),
                course.getCode(),
                course.getName(),
                course.getCreditHours(),
                semester.getId(),
                request.retake(),
                Instant.now()
        );
        eventPublisher.publishEvent(event);

        return EnrollmentResponse.from(enrollment);
    }

    @Override
    @Transactional
    public EnrollmentResponse dropCourse(Long enrollmentId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", enrollmentId));

        // Ownership check: student can only drop their own enrollments
        if (!enrollment.getStudent().getId().equals(studentId)) {
            throw new BusinessRuleException("You can only drop your own enrollments.");
        }

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleException(
                    "Only ACTIVE enrollments can be dropped. Current status: " + enrollment.getStatus());
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        
        // Acquire pessimistic lock on course before updating seats
        Course course = courseRepository.findByIdForUpdate(enrollment.getCourse().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", enrollment.getCourse().getId()));
        
        course.setCurrentEnrollment(Math.max(0, course.getCurrentEnrollment() - 1));
        courseRepository.save(course);
        
        return EnrollmentResponse.from(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments(Long studentId) {
        return enrollmentRepository.findAllByStudentId(studentId)
                .stream()
                .map(EnrollmentResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsForSemester(Long studentId, Long semesterId) {
        return enrollmentRepository
                .findAllByStudentIdAndSemesterId(studentId, semesterId)
                .stream()
                .map(EnrollmentResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId, Long semesterId) {
        List<Enrollment> enrollments = enrollmentRepository.findEnrollmentsForGradeEntry(courseId, semesterId);
        if (enrollments.isEmpty()) {
            enrollments = enrollmentRepository.findEnrollmentsForGradeEntry(courseId, null);
        }
        return enrollments.stream()
                .map(EnrollmentResponse::from)
                .toList();
    }
}
