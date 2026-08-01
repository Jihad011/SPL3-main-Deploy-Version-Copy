package com.iit.creditmanagement.util;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
