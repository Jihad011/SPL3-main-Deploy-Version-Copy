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
        "100.0, A",
        "80.0,  A",
        "79.9,  A_MINUS",
        "75.0,  A_MINUS",
        "74.9,  B_PLUS",
        "70.0,  B_PLUS",
        "69.9,  B",
        "65.0,  B",
        "64.9,  B_MINUS",
        "60.0,  B_MINUS",
        "59.9,  C_PLUS",
        "55.0,  C_PLUS",
        "54.9,  C",
        "50.0,  C",
        "49.9,  D",
        "45.0,  D",
        "44.9,  F",
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
    @DisplayName("Midterm marks above 40 throws exception")
    void midtermAbove40Throws() {
        assertThatThrownBy(() -> calculator.validateMidtermMarks(40.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("40");
    }

    @Test
    @DisplayName("Final marks above 60 throws exception")
    void finalAbove60Throws() {
        assertThatThrownBy(() -> calculator.validateFinalMarks(60.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("60");
    }

    @Test
    @DisplayName("Passing threshold is at 45 marks")
    void passingAt45() {
        assertThat(calculator.isPassing(45.0)).isTrue();
        assertThat(calculator.isPassing(44.9)).isFalse();
    }
}
