package com.iit.creditmanagement.unit.util;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.util.StudentRollHelper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StudentRollHelperTest {

    @Test
    @DisplayName("Should format dynamic semester roll ID correctly with Term Code and Term Type")
    void testFormatSemesterRoll() {
        // User example: First semester Spring 2026 -> 26FS1413, Fall -> 26FF1413
        String firstSpringUser = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, "Spring", 14, 13);
        assertEquals("26FS1413", firstSpringUser);

        String firstFallUser = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, "Fall", 14, 13);
        assertEquals("26FF1413", firstFallUser);

        String secondSpring = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Spring", 2, 4);
        assertEquals("26SS0204", secondSpring);

        String secondFall = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Fall", 2, 4);
        assertEquals("26SF0204", secondFall);

        String thirdSpring = StudentRollHelper.formatSemesterRoll(2026, SemesterName.THIRD_SEMESTER, "Spring", 2, 4);
        assertEquals("26TS0204", thirdSpring);

        String nextYearSpring = StudentRollHelper.formatSemesterRoll(2027, SemesterName.SECOND_SEMESTER, "Spring", 2, 4);
        assertEquals("27SS0204", nextYearSpring);

        // Default overload (defaults to Spring)
        String defaultSpring = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, 2, 4);
        assertEquals("26FS0204", defaultSpring);
    }

    @Test
    @DisplayName("Should derive semester roll for student entity")
    void testDeriveSemesterRoll() {
        User student = User.builder()
                .batch(2)
                .rollNumber("BSSE0204")
                .build();

        Semester sem = Semester.builder()
                .year(2026)
                .name(SemesterName.SECOND_SEMESTER)
                .startDate(java.time.LocalDate.of(2026, 1, 1))
                .build();

        String roll = StudentRollHelper.deriveSemesterRoll(student, sem);
        assertEquals("26SS0204", roll);

        String fallRoll = StudentRollHelper.deriveSemesterRoll(student, sem, "Fall");
        assertEquals("26SF0204", fallRoll);
    }

    @Test
    @DisplayName("Should parse various roll formats universally")
    void testParseRoll() {
        // New 5-part dynamic format: 26FS1413
        StudentRollHelper.ParsedRoll parsedNew = StudentRollHelper.parseRoll("26FS1413");
        assertNotNull(parsedNew);
        assertEquals(2026, parsedNew.year());
        assertEquals("F", parsedNew.term());
        assertEquals("S", parsedNew.intakeType());
        assertEquals(14, parsedNew.batch());
        assertEquals(13, parsedNew.classRoll());

        // Legacy 4-part dynamic format: 26S0204
        StudentRollHelper.ParsedRoll parsedDyn = StudentRollHelper.parseRoll("26S0204");
        assertNotNull(parsedDyn);
        assertEquals(2026, parsedDyn.year());
        assertEquals("S", parsedDyn.term());
        assertEquals(2, parsedDyn.batch());
        assertEquals(4, parsedDyn.classRoll());

        StudentRollHelper.ParsedRoll parsedBsse = StudentRollHelper.parseRoll("BSSE1204");
        assertNotNull(parsedBsse);
        assertEquals(12, parsedBsse.batch());
        assertEquals(4, parsedBsse.classRoll());

        StudentRollHelper.ParsedRoll parsedFour = StudentRollHelper.parseRoll("1413");
        assertNotNull(parsedFour);
        assertEquals(14, parsedFour.batch());
        assertEquals(13, parsedFour.classRoll());
    }

    @Test
    @DisplayName("Should enforce strict uniqueness of dynamic rolls across different students and semesters")
    void testDynamicRollUniqueness() {
        String student1Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Spring", 2, 1);
        String student2Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Spring", 2, 2);
        String student3Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Spring", 3, 1);
        
        assertNotEquals(student1Roll, student2Roll);
        assertNotEquals(student1Roll, student3Roll);
        assertNotEquals(student2Roll, student3Roll);

        String spring26 = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, "Spring", 2, 4);
        String fall26 = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, "Fall", 2, 4);
        String spring27 = StudentRollHelper.formatSemesterRoll(2027, SemesterName.SECOND_SEMESTER, "Spring", 2, 4);

        assertEquals("26SS0204", spring26);
        assertEquals("26FF0204", fall26);
        assertEquals("27SS0204", spring27);
        assertNotEquals(spring26, fall26);
        assertNotEquals(spring26, spring27);
    }

    @Test
    @DisplayName("Should handle case-insensitivity and whitespace in roll parsing")
    void testCaseInsensitiveAndWhitespaceParsing() {
        StudentRollHelper.ParsedRoll parsedLowerNew = StudentRollHelper.parseRoll("  26fs1413  ");
        assertNotNull(parsedLowerNew);
        assertEquals(2026, parsedLowerNew.year());
        assertEquals("F", parsedLowerNew.term());
        assertEquals("S", parsedLowerNew.intakeType());
        assertEquals(14, parsedLowerNew.batch());
        assertEquals(13, parsedLowerNew.classRoll());

        StudentRollHelper.ParsedRoll parsedLower = StudentRollHelper.parseRoll("  26s0204  ");
        assertNotNull(parsedLower);
        assertEquals(2026, parsedLower.year());
        assertEquals("S", parsedLower.term());
        assertEquals(2, parsedLower.batch());
        assertEquals(4, parsedLower.classRoll());

        StudentRollHelper.ParsedRoll parsedBsseLower = StudentRollHelper.parseRoll("bsse1204");
        assertNotNull(parsedBsseLower);
        assertEquals(12, parsedBsseLower.batch());
        assertEquals(4, parsedBsseLower.classRoll());
    }
}
