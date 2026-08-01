package com.iit.creditmanagement.model.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GradeLetter {
    A_PLUS ("A+", 4.00),
    A      ("A",  3.75),
    A_MINUS("A-", 3.50),
    B_PLUS ("B+", 3.25),
    B      ("B",  3.00),
    B_MINUS("B-", 2.75),
    C_PLUS ("C+", 2.50),
    C      ("C",  2.25),
    D      ("D",  2.00),
    F      ("F",  0.00);

    private final String display;
    private final double point;

    /**
     * Compute grade letter from total marks (out of 100).
     * University of Dhaka standard grading scale.
     */
    public static GradeLetter fromMarks(double totalMarks) {
        if (totalMarks >= 80) return A_PLUS;
        if (totalMarks >= 75) return A;
        if (totalMarks >= 70) return A_MINUS;
        if (totalMarks >= 65) return B_PLUS;
        if (totalMarks >= 60) return B;
        if (totalMarks >= 55) return B_MINUS;
        if (totalMarks >= 50) return C_PLUS;
        if (totalMarks >= 45) return C;
        if (totalMarks >= 40) return D;
        return F;
    }
}
