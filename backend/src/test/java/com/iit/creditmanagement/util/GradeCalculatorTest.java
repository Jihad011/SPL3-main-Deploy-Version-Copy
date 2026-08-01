package com.iit.creditmanagement.util;

import com.iit.creditmanagement.model.enums.GradeLetter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for GradeCalculator.
 * Tests the IIT Dhaka grading scale boundaries exhaustively.
 */
class GradeCalculatorTest {

    private final GradeCalculator calculator = new GradeCalculator();

    // ── Grade Letter Tests ────────────────────────────────────

    @ParameterizedTest(name = "marks={0} → expected grade={1}")
    @CsvSource({
        "100.0, A_PLUS",
        "80.0,  A_PLUS",
        "79.9,  A",
        "75.0,  A",
        "74.9,  A_MINUS",
        "70.0,  A_MINUS",
        "69.9,  B_PLUS",
        "65.0,  B_PLUS",
        "64.9,  B",
        "60.0,  B",
        "59.9,  B_MINUS",
        "55.0,  B_MINUS",
        "54.9,  C_PLUS",
        "50.0,  C_PLUS",
        "49.9,  C",
        "45.0,  C",
        "44.9,  D",
        "40.0,  D",
        "39.9,  F",
        "0.0,   F"
    })
    @DisplayName("Grade letter is correctly computed for mark boundaries")
    void gradeLetterBoundaries(double marks, GradeLetter expected) {
        assertThat(calculator.computeGradeLetter(marks)).isEqualTo(expected);
    }

    // ── CGPA Calculation ─────────────────────────────────────

    @Test
    @DisplayName("CGPA is a weighted average of grade points and credit hours")
    void cgpaWeightedAverage() {
        // A (4.0) × 3 credits + B+ (3.5) × 3 credits = 22.5 / 6 = 3.75
        BigDecimal cgpa = calculator.computeCgpa(
                new double[]{4.00, 3.50},
                new int[]{3, 3}
        );
        assertThat(cgpa).isEqualByComparingTo("3.75");
    }

    @Test
    @DisplayName("CGPA is 0 when no grades")
    void cgpaZeroWhenNoGrades() {
        assertThat(calculator.computeCgpa(new double[]{}, new int[]{}))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("CGPA rounds to 2 decimal places")
    void cgpaRounding() {
        // 4.0×3 + 3.0×3 + 2.0×3 = 27/9 = 3.0
        BigDecimal cgpa = calculator.computeCgpa(
                new double[]{4.0, 3.0, 2.0},
                new int[]{3, 3, 3}
        );
        assertThat(cgpa.scale()).isEqualTo(2);
    }

    // ── Validation Tests ─────────────────────────────────────

    @Test
    @DisplayName("Midterm marks above 100 throws exception")
    void midtermAbove100Throws() {
        assertThatThrownBy(() -> calculator.validateMidtermMarks(100.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
    }

    @Test
    @DisplayName("Final marks above 100 throws exception")
    void finalAbove100Throws() {
        assertThatThrownBy(() -> calculator.validateFinalMarks(100.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
    }

    @Test
    @DisplayName("Passing threshold is at 40 marks")
    void passingAt40() {
        assertThat(calculator.isPassing(40.0)).isTrue();
        assertThat(calculator.isPassing(39.9)).isFalse();
    }
}
