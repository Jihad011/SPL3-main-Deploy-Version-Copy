package com.iit.creditmanagement.util;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Validates business rules related to course enrollment.
 * Runs checks BEFORE hitting the database to provide clear error messages.
 */
@Component
@RequiredArgsConstructor
public class CreditValidator {

    private final EnrollmentRepository enrollmentRepository;

    /**
     * Validates that enrolling in a course won't exceed the 12-credit limit.
     *
     * @param studentId    the student attempting to enroll
     * @param semesterId   the current semester id
     * @param newCourseCredits  credit hours of the course being added
     * @throws BusinessRuleException if the limit would be exceeded
     */
    public void validateCreditLimit(Long studentId, Long semesterId, int newCourseCredits) {
        int currentCredits = enrollmentRepository
                .sumCreditsByStudentAndSemester(studentId, semesterId);

        if (currentCredits + newCourseCredits > AppConstants.MAX_CREDITS_PER_SEMESTER) {
            throw new BusinessRuleException(
                String.format(
                    "Credit limit exceeded. You currently have %d credits this semester. " +
                    "Adding %d credit(s) would exceed the %d-credit limit.",
                    currentCredits,
                    newCourseCredits,
                    AppConstants.MAX_CREDITS_PER_SEMESTER
                )
            );
        }
    }

    public void validateCreditLimit(Long studentId, Long semesterId, com.iit.creditmanagement.model.entity.Course newCourse, Integer targetSemesterLevel, String intakeType) {
        if (newCourse == null) {
            return;
        }

        int targetLvl = targetSemesterLevel != null ? targetSemesterLevel :
                (newCourse.getSemesterLevel() != null ? newCourse.getSemesterLevel() :
                (java.util.List.of("MITM 303", "MITM 304", "MITM 310", "MITM 311").contains(newCourse.getCode()) ? 1 :
                (java.util.List.of("MITM 301", "MITM 305").contains(newCourse.getCode()) ? 2 :
                ("MITM 421".equals(newCourse.getCode()) ? 3 : 2))));

        String targetIntake = (intakeType != null && !intakeType.isBlank()) ? intakeType.trim() : "Spring";

        List<com.iit.creditmanagement.model.entity.Enrollment> levelEnrollments = enrollmentRepository
                .findAllByStudentId(studentId)
                .stream()
                .filter(e -> e.getStatus() == com.iit.creditmanagement.model.enums.EnrollmentStatus.ACTIVE ||
                             e.getStatus() == com.iit.creditmanagement.model.enums.EnrollmentStatus.COMPLETED)
                .toList();

        int currentCredits = 0;
        for (com.iit.creditmanagement.model.entity.Enrollment e : levelEnrollments) {
            int eLvl = e.getTargetSemesterLevel() != null ? e.getTargetSemesterLevel() :
                    (e.getCourse().getSemesterLevel() != null ? e.getCourse().getSemesterLevel() :
                    (java.util.List.of("MITM 303", "MITM 304", "MITM 310", "MITM 311").contains(e.getCourse().getCode()) ? 1 :
                    (java.util.List.of("MITM 301", "MITM 305").contains(e.getCourse().getCode()) ? 2 :
                    ("MITM 421".equals(e.getCourse().getCode()) ? 3 : 2))));

            String eIntake = e.getIntakeType() != null ? e.getIntakeType().trim() : "Spring";

            if (eLvl == targetLvl && eIntake.equalsIgnoreCase(targetIntake)) {
                currentCredits += e.getCourse().getCreditHours();
            }
        }

        if (currentCredits + newCourse.getCreditHours() > AppConstants.MAX_CREDITS_PER_SEMESTER) {
            throw new BusinessRuleException(
                String.format(
                    "Credit limit exceeded. You currently have %d credits for Semester %d (%s Intake). " +
                    "Adding %d credit(s) would exceed the %d-credit limit.",
                    currentCredits,
                    targetLvl,
                    targetIntake,
                    newCourse.getCreditHours(),
                    AppConstants.MAX_CREDITS_PER_SEMESTER
                )
            );
        }
    }

    public void validateCreditLimit(Long studentId, Long semesterId, com.iit.creditmanagement.model.entity.Course newCourse, Integer targetSemesterLevel) {
        validateCreditLimit(studentId, semesterId, newCourse, targetSemesterLevel, "Spring");
    }

    public void validateCreditLimit(Long studentId, Long semesterId, com.iit.creditmanagement.model.entity.Course newCourse) {
        validateCreditLimit(studentId, semesterId, newCourse, null, "Spring");
    }

    /**
     * Validates that the course still has available seats.
     *
     * @param currentEnrollment  current number of enrolled students
     * @param maxSeats           maximum allowed seats
     * @param courseName         used in the error message
     * @throws BusinessRuleException if the course is full
     */
    public void validateSeatAvailability(int currentEnrollment, int maxSeats, String courseName) {
        if (currentEnrollment >= maxSeats) {
            throw new BusinessRuleException(
                String.format(
                    "Course '%s' is full. Maximum %d seats reached.",
                    courseName, maxSeats
                )
            );
        }
    }

    /**
     * Validates seat availability specifically for the target intake type (Spring vs Fall).
     */
    public void validateSeatAvailability(Long courseId, Long semesterId, String intakeType, int maxSeats, String courseName, int defaultCurrentEnrollment) {
        if (courseId == null || semesterId == null) {
            validateSeatAvailability(defaultCurrentEnrollment, maxSeats, courseName);
            return;
        }
        String targetIntake = (intakeType != null && !intakeType.isBlank()) ? intakeType.trim() : "Spring";
        long enrolledInIntake = enrollmentRepository.findAllByCourseIdAndSemesterId(courseId, semesterId)
                .stream()
                .filter(e -> e.getStatus() == com.iit.creditmanagement.model.enums.EnrollmentStatus.ACTIVE && 
                        targetIntake.equalsIgnoreCase(e.getIntakeType()))
                .count();

        if (enrolledInIntake >= maxSeats) {
            throw new BusinessRuleException(
                String.format(
                    "Course '%s' is full for %s Intake. Maximum %d seats reached.",
                    courseName, targetIntake, maxSeats
                )
            );
        }
    }

    public void validateNoDuplicateEnrollment(Long studentId, Long courseId, Long semesterId) {
        enrollmentRepository.findByStudentIdAndCourseIdAndSemesterId(studentId, courseId, semesterId)
            .ifPresent(enrollment -> {
                if (enrollment.getStatus() == com.iit.creditmanagement.model.enums.EnrollmentStatus.ACTIVE) {
                    throw new BusinessRuleException(
                        "You are already enrolled in this course for the current semester.");
                }
            });
    }
}
