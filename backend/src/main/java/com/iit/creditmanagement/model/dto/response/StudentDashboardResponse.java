package com.iit.creditmanagement.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Student dashboard summary response.
 * Aggregates credit info, CGPA, and fee totals in a single API call
 * to minimise round-trips on dashboard load.
 */
public record StudentDashboardResponse(
        Long       studentId,
        String     studentName,
        String     rollNumber,
        String     registrationNumber,

        // Current semester summary
        String     currentSemester,
        int        currentSemesterCredits,
        int        maxCreditsPerSemester,     // always 12
        int        remainingCredits,

        // Academic summary
        BigDecimal cgpa,
        int        totalCreditsEarned,
        int        totalCoursesCompleted,

        // Financial summary
        BigDecimal totalDues,
        int        unpaidFeeCount,

        // Current semester enrollments
        List<EnrollmentResponse> currentEnrollments
) {}
