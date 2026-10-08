package com.iit.creditmanagement.util;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.SemesterName;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StudentRollHelperTest {

    @Test
    @DisplayName("Should format dynamic semester roll ID correctly for First and Second Semester")
    void testFormatSemesterRoll() {
        // Second Semester 2026, Batch 2, Class Roll 4 -> 26S0204
        String springRoll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, 2, 4);
        assertEquals("26S0204", springRoll);

        // First Semester 2026, Batch 2, Class Roll 4 -> 26F0204
        String fallRoll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, 2, 4);
        assertEquals("26F0204", fallRoll);

        // Third Semester 2026, Batch 2, Class Roll 4 -> 26T0204
        String thirdRoll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.THIRD_SEMESTER, 2, 4);
        assertEquals("26T0204", thirdRoll);

        // Second Semester 2027, Batch 2, Class Roll 4 -> 27S0204
        String nextYearSpringRoll = StudentRollHelper.formatSemesterRoll(2027, SemesterName.SECOND_SEMESTER, 2, 4);
        assertEquals("27S0204", nextYearSpringRoll);
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
                .build();

        String roll = StudentRollHelper.deriveSemesterRoll(student, sem);
        assertEquals("26S0204", roll);
    }

    @Test
    @DisplayName("Should parse various roll formats universally")
    void testParseRoll() {
        // Dynamic roll: 26S0204
        StudentRollHelper.ParsedRoll parsedDyn = StudentRollHelper.parseRoll("26S0204");
        assertNotNull(parsedDyn);
        assertEquals(2026, parsedDyn.year());
        assertEquals("S", parsedDyn.term());
        assertEquals(2, parsedDyn.batch());
        assertEquals(4, parsedDyn.classRoll());

        // Legacy BSSE: BSSE1204
        StudentRollHelper.ParsedRoll parsedBsse = StudentRollHelper.parseRoll("BSSE1204");
        assertNotNull(parsedBsse);
        assertEquals(12, parsedBsse.batch());
        assertEquals(4, parsedBsse.classRoll());

        // 4-digit numeric: 1413 -> Batch 14, Roll 13
        StudentRollHelper.ParsedRoll parsedFour = StudentRollHelper.parseRoll("1413");
        assertNotNull(parsedFour);
        assertEquals(14, parsedFour.batch());
        assertEquals(13, parsedFour.classRoll());
    }

    @Test
    @DisplayName("Should enforce strict uniqueness of dynamic rolls across different students and semesters")
    void testDynamicRollUniqueness() {
        // Different students in same semester must have distinct roll IDs
        String student1Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, 2, 1);
        String student2Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, 2, 2);
        String student3Roll = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, 3, 1);
        
        assertNotEquals(student1Roll, student2Roll);
        assertNotEquals(student1Roll, student3Roll);
        assertNotEquals(student2Roll, student3Roll);

        // Same student across different semesters must have distinct semester-specific roll IDs
        String spring26 = StudentRollHelper.formatSemesterRoll(2026, SemesterName.SECOND_SEMESTER, 2, 4);
        String fall26 = StudentRollHelper.formatSemesterRoll(2026, SemesterName.FIRST_SEMESTER, 2, 4);
        String spring27 = StudentRollHelper.formatSemesterRoll(2027, SemesterName.SECOND_SEMESTER, 2, 4);

        assertEquals("26S0204", spring26);
        assertEquals("26F0204", fall26);
        assertEquals("27S0204", spring27);
        assertNotEquals(spring26, fall26);
        assertNotEquals(spring26, spring27);
    }

    @Test
    @DisplayName("Should handle case-insensitivity and whitespace in roll parsing")
    void testCaseInsensitiveAndWhitespaceParsing() {
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
