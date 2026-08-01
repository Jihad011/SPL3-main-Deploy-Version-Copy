package com.iit.creditmanagement.enrollment.event;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Domain Event: raised when a student successfully enrolls in a course.
 *
 * This is an immutable Java record (sealed contract) published by
 * {@link com.iit.creditmanagement.service.impl.EnrollmentServiceImpl}
 * after a transaction commits.
 *
 * Domain events are the backbone of Event-Driven Architecture (EDA),
 * used extensively at Amazon (internal event buses), Google (Pub/Sub),
 * and Stripe (event-sourced payments).
 *
 * Consumers include:
 * - BillingEventListener: auto-generates retake fee invoices
 * - NotificationEventListener: notifies student of enrollment success
 *
 * @param enrollmentId  the saved Enrollment entity ID
 * @param studentId     the enrolling student's user ID
 * @param courseId      the enrolled course ID
 * @param courseCode    the course code (e.g. "CSE-401")
 * @param courseName    the course full name
 * @param creditHours   credit hours of the course
 * @param semesterId    the active semester ID
 * @param isRetake      true if this is a retake enrollment (triggers fee generation)
 * @param timestamp     wall-clock time of event creation
 */
public record CourseEnrolledEvent(
    Long    enrollmentId,
    Long    studentId,
    Long    courseId,
    String  courseCode,
    String  courseName,
    int     creditHours,
    Long    semesterId,
    boolean isRetake,
    Instant timestamp
) {
    /**
     * Factory method that computes the standard retake fee amount.
     * Centralizes fee calculation logic so both listener and business
     * logic agree on the amount without duplicating constants.
     *
     * @return BDT amount = 1000 × creditHours
     */
    public BigDecimal retakeFeeAmount() {
        return BigDecimal.valueOf(1000L * creditHours);
    }
}
