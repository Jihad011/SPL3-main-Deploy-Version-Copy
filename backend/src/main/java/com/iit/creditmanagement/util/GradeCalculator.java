package com.iit.creditmanagement.util;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.model.enums.GradeLetter;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates grade letters and CGPA.
 * Mirrors the PostgreSQL trigger logic so results are consistent
 * whether computed in Java or the database.
 */
@Component
public class GradeCalculator {

    /**
     * Compute grade letter from total marks.
     * @param totalMarks marks out of 100
     */
    public GradeLetter computeGradeLetter(double totalMarks) {
        return GradeLetter.fromMarks(totalMarks);
    }

    /**
     * Compute weighted CGPA from arrays of grade points and credit hours.
     * @param gradePoints  array of grade points per course
     * @param creditHours  array of credit hours per course (same length)
     * @return CGPA rounded to 2 decimal places
     */
    public BigDecimal computeCgpa(double[] gradePoints, int[] creditHours) {
        if (gradePoints.length != creditHours.length || gradePoints.length == 0) {
            return BigDecimal.ZERO;
        }

        double totalWeightedPoints = 0;
        int totalCredits = 0;

        for (int i = 0; i < gradePoints.length; i++) {
            totalWeightedPoints += gradePoints[i] * creditHours[i];
            totalCredits += creditHours[i];
        }

        if (totalCredits == 0) return BigDecimal.ZERO;

        return BigDecimal.valueOf(totalWeightedPoints / totalCredits)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** Returns true if the student has passed (total marks ≥ passing threshold). */
    public boolean isPassing(double totalMarks) {
        return totalMarks >= AppConstants.PASSING_MARKS;
    }

    /** Validates that midterm marks are within allowed range (0-40). */
    public void validateMidtermMarks(double marks) {
        if (marks < 0 || marks > AppConstants.MAX_MIDTERM_MARKS) {
            throw new IllegalArgumentException(
                "Midterm marks must be between 0 and " + AppConstants.MAX_MIDTERM_MARKS);
        }
    }

    /** Validates that final marks are within allowed range (0-60). */
    public void validateFinalMarks(double marks) {
        if (marks < 0 || marks > AppConstants.MAX_FINAL_MARKS) {
            throw new IllegalArgumentException(
                "Final marks must be between 0 and " + AppConstants.MAX_FINAL_MARKS);
        }
    }
}
