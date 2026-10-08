package com.iit.creditmanagement.util;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.SemesterName;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class StudentRollHelper {

    private StudentRollHelper() {}

    // Pattern for Dynamic Semester Roll: e.g. 26S0204, 26F0204, 26T0204
    private static final Pattern DYNAMIC_ROLL_PATTERN = Pattern.compile("^(\\d{2})([SFT123])(\\d{2})(\\d{2,4})$", Pattern.CASE_INSENSITIVE);
    
    // Pattern for Legacy BSSE Roll: e.g. BSSE1204
    private static final Pattern BSSE_ROLL_PATTERN = Pattern.compile("^BSSE(\\d{2})(\\d{2})$", Pattern.CASE_INSENSITIVE);
    
    // Pattern for 4-digit Roll: e.g. 1413 -> Batch 14, Roll 13
    private static final Pattern FOUR_DIGIT_ROLL_PATTERN = Pattern.compile("^(\\d{2})(\\d{2})$");

    /**
     * Formats a dynamic semester roll ID conforming to:
     * [2-digit year] + [Term code 'S'/'F'] + [2-digit batch] + [2-digit class roll]
     * E.g. (2026, SPRING, 2, 4) -> "26S0204"
     */
    public static String formatSemesterRoll(int year, SemesterName term, Integer batch, Integer classRoll) {
        int yearTwoDigit = Math.abs(year) % 100;
        String termCode = (term == SemesterName.THIRD_SEMESTER) ? "T" : ((term == SemesterName.SECOND_SEMESTER) ? "S" : "F");
        int safeBatch = (batch != null && batch > 0) ? (batch > 99 ? batch % 100 : batch) : 1;
        int safeRoll = (classRoll != null && classRoll > 0) ? (classRoll > 99 ? classRoll % 100 : classRoll) : 1;

        return String.format("%02d%s%02d%02d", yearTwoDigit, termCode, safeBatch, safeRoll);
    }

    /**
     * Derives the semester-specific roll ID for a student in a given semester.
     */
    public static String deriveSemesterRoll(User student, Semester semester) {
        if (student == null) return "N/A";
        int classRoll = extractClassRoll(student);
        int batch = extractBatch(student);

        if (semester == null) {
            int currentYear = java.time.LocalDate.now().getYear();
            return formatSemesterRoll(currentYear, SemesterName.FIRST_SEMESTER, batch, classRoll);
        }

        int year = (semester.getYear() != null) ? semester.getYear() : java.time.LocalDate.now().getYear();
        SemesterName term = (semester.getName() != null) ? semester.getName() : SemesterName.FIRST_SEMESTER;
        return formatSemesterRoll(year, term, batch, classRoll);
    }

    /**
     * Extracts the academic batch number from a student entity (parsing rollNumber if needed).
     */
    public static int extractBatch(User student) {
        if (student == null) return 1;

        if (student.getRollNumber() != null) {
            String roll = student.getRollNumber().trim();

            Matcher dynMatcher = DYNAMIC_ROLL_PATTERN.matcher(roll);
            if (dynMatcher.matches()) {
                try {
                    return Integer.parseInt(dynMatcher.group(3));
                } catch (NumberFormatException ignored) {}
            }

            Matcher bsseMatcher = BSSE_ROLL_PATTERN.matcher(roll);
            if (bsseMatcher.matches()) {
                try {
                    return Integer.parseInt(bsseMatcher.group(1));
                } catch (NumberFormatException ignored) {}
            }

            Matcher fourMatcher = FOUR_DIGIT_ROLL_PATTERN.matcher(roll);
            if (fourMatcher.matches()) {
                try {
                    return Integer.parseInt(fourMatcher.group(1));
                } catch (NumberFormatException ignored) {}
            }
        }

        if (student.getBatch() != null && student.getBatch() > 0) {
            return (student.getBatch() > 99) ? (student.getBatch() % 100) : student.getBatch();
        }

        return 1;
    }

    /**
     * Extracts the numeric class roll from a student entity (parsing rollNumber if needed).
     */
    public static int extractClassRoll(User student) {
        if (student == null || student.getRollNumber() == null) return 1;
        String roll = student.getRollNumber().trim();

        // Check Dynamic Roll Pattern: e.g. 26S0204 -> Class Roll is 04
        Matcher dynMatcher = DYNAMIC_ROLL_PATTERN.matcher(roll);
        if (dynMatcher.matches()) {
            try {
                return Integer.parseInt(dynMatcher.group(4));
            } catch (NumberFormatException ignored) {}
        }

        // Check BSSE Pattern: e.g. BSSE1204 -> Class Roll is 04
        Matcher bsseMatcher = BSSE_ROLL_PATTERN.matcher(roll);
        if (bsseMatcher.matches()) {
            try {
                return Integer.parseInt(bsseMatcher.group(2));
            } catch (NumberFormatException ignored) {}
        }

        // Check 4-digit Pattern: e.g. 1413 -> Class Roll is 13
        Matcher fourMatcher = FOUR_DIGIT_ROLL_PATTERN.matcher(roll);
        if (fourMatcher.matches()) {
            try {
                return Integer.parseInt(fourMatcher.group(2));
            } catch (NumberFormatException ignored) {}
        }

        // Fallback: extract any trailing digits
        Pattern trailingDigits = Pattern.compile("(\\d{1,4})$");
        Matcher trailMatcher = trailingDigits.matcher(roll);
        if (trailMatcher.find()) {
            try {
                return Integer.parseInt(trailMatcher.group(1));
            } catch (NumberFormatException ignored) {}
        }

        return 1;
    }

    /**
     * Parsed roll components for query resolution.
     */
    public record ParsedRoll(Integer year, String term, Integer batch, Integer classRoll, String rawInput) {}

    /**
     * Attempts to parse an input search string into its constituent roll components.
     */
    public static ParsedRoll parseRoll(String input) {
        if (input == null || input.isBlank()) return null;
        String clean = input.trim();

        Matcher dynMatcher = DYNAMIC_ROLL_PATTERN.matcher(clean);
        if (dynMatcher.matches()) {
            int yr = Integer.parseInt(dynMatcher.group(1));
            int fullYear = yr >= 70 ? 1900 + yr : 2000 + yr;
            String term = dynMatcher.group(2).toUpperCase();
            int batch = Integer.parseInt(dynMatcher.group(3));
            int roll = Integer.parseInt(dynMatcher.group(4));
            return new ParsedRoll(fullYear, term, batch, roll, clean);
        }

        Matcher bsseMatcher = BSSE_ROLL_PATTERN.matcher(clean);
        if (bsseMatcher.matches()) {
            int batch = Integer.parseInt(bsseMatcher.group(1));
            int roll = Integer.parseInt(bsseMatcher.group(2));
            return new ParsedRoll(null, null, batch, roll, clean);
        }

        Matcher fourMatcher = FOUR_DIGIT_ROLL_PATTERN.matcher(clean);
        if (fourMatcher.matches()) {
            int batch = Integer.parseInt(fourMatcher.group(1));
            int roll = Integer.parseInt(fourMatcher.group(2));
            return new ParsedRoll(null, null, batch, roll, clean);
        }

        return new ParsedRoll(null, null, null, null, clean);
    }
}
