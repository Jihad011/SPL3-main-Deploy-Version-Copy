package com.iit.creditmanagement.util;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.SemesterName;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class StudentRollHelper {

    private StudentRollHelper() {}

    // Pattern for Dynamic Semester Roll: e.g. 26FS1413, 26FF1413, 26S0204, 26F0204, 26T0204
    private static final Pattern DYNAMIC_ROLL_PATTERN = Pattern.compile("^(\\d{2})([SFT123])([SF]?)([0-9]{2})(\\d{2,4})$", Pattern.CASE_INSENSITIVE);
    
    // Pattern for Legacy BSSE Roll: e.g. BSSE1204
    private static final Pattern BSSE_ROLL_PATTERN = Pattern.compile("^BSSE(\\d{2})(\\d{2})$", Pattern.CASE_INSENSITIVE);
    
    // Pattern for 4-digit Roll: e.g. 1413 -> Batch 14, Roll 13
    private static final Pattern FOUR_DIGIT_ROLL_PATTERN = Pattern.compile("^(\\d{2})(\\d{2})$");

    /**
     * Resolves single-character Term Type code ('S' for Spring, 'F' for Fall).
     */
    public static String resolveTermTypeCode(String intakeType) {
        if (intakeType == null || intakeType.isBlank()) {
            return "S";
        }
        String clean = intakeType.trim().toUpperCase();
        if (clean.startsWith("F")) {
            return "F";
        }
        return "S";
    }

    /**
     * Formats a dynamic semester roll ID conforming to:
     * [2-digit year] + [Term code 'F'/'S'/'T'] + [Term type 'S'/'F'] + [2-digit batch] + [2-digit class roll]
     * E.g. (2026, FIRST_SEMESTER, "Spring", 14, 13) -> "26FS1413"
     * E.g. (2026, FIRST_SEMESTER, "Fall", 14, 13)   -> "26FF1413"
     * E.g. (2026, SECOND_SEMESTER, "Spring", 14, 13)-> "26SS1413"
     */
    public static String formatSemesterRoll(int year, SemesterName term, String intakeType, Integer batch, Integer classRoll) {
        int yearTwoDigit = Math.abs(year) % 100;
        String termCode = (term == SemesterName.THIRD_SEMESTER) ? "T" : ((term == SemesterName.SECOND_SEMESTER) ? "S" : "F");
        String termTypeCode = resolveTermTypeCode(intakeType);
        int safeBatch = (batch != null && batch > 0) ? (batch > 99 ? batch % 100 : batch) : 1;
        int safeRoll = (classRoll != null && classRoll > 0) ? (classRoll > 99 ? classRoll % 100 : classRoll) : 1;

        return String.format("%02d%s%s%02d%02d", yearTwoDigit, termCode, termTypeCode, safeBatch, safeRoll);
    }

    /**
     * Formats a dynamic semester roll ID defaulting intake type to Spring.
     * E.g. (2026, FIRST_SEMESTER, 14, 13) -> "26FS1413"
     */
    public static String formatSemesterRoll(int year, SemesterName term, Integer batch, Integer classRoll) {
        return formatSemesterRoll(year, term, "Spring", batch, classRoll);
    }

    /**
     * Derives the semester-specific roll ID for a student in a given semester and intake type.
     */
    public static String deriveSemesterRoll(User student, Semester semester, String intakeType) {
        if (student == null) return "N/A";
        int classRoll = extractClassRoll(student);
        int batch = extractBatch(student);

        String effectiveIntake = intakeType;
        if (effectiveIntake == null || effectiveIntake.isBlank()) {
            if (semester != null && semester.getStartDate() != null && semester.getStartDate().getMonthValue() >= 7) {
                effectiveIntake = "Fall";
            } else {
                effectiveIntake = "Spring";
            }
        }

        if (semester == null) {
            int currentYear = java.time.LocalDate.now().getYear();
            return formatSemesterRoll(currentYear, SemesterName.FIRST_SEMESTER, effectiveIntake, batch, classRoll);
        }

        int year = (semester.getYear() != null) ? semester.getYear() : java.time.LocalDate.now().getYear();
        SemesterName term = (semester.getName() != null) ? semester.getName() : SemesterName.FIRST_SEMESTER;
        return formatSemesterRoll(year, term, effectiveIntake, batch, classRoll);
    }

    /**
     * Derives the semester-specific roll ID for a student in a given semester (defaulting intake from semester start date).
     */
    public static String deriveSemesterRoll(User student, Semester semester) {
        return deriveSemesterRoll(student, semester, null);
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
                    return Integer.parseInt(dynMatcher.group(4));
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

        // Check Dynamic Roll Pattern: e.g. 26FS1413 -> Class Roll is 13; 26S0204 -> Class Roll is 04
        Matcher dynMatcher = DYNAMIC_ROLL_PATTERN.matcher(roll);
        if (dynMatcher.matches()) {
            try {
                return Integer.parseInt(dynMatcher.group(5));
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
    public record ParsedRoll(Integer year, String term, String intakeType, Integer batch, Integer classRoll, String rawInput) {
        public ParsedRoll(Integer year, String term, Integer batch, Integer classRoll, String rawInput) {
            this(year, term, null, batch, classRoll, rawInput);
        }
    }

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
            String intakeType = (dynMatcher.group(3) != null && !dynMatcher.group(3).isBlank()) ? dynMatcher.group(3).toUpperCase() : null;
            int batch = Integer.parseInt(dynMatcher.group(4));
            int roll = Integer.parseInt(dynMatcher.group(5));
            return new ParsedRoll(fullYear, term, intakeType, batch, roll, clean);
        }

        Matcher bsseMatcher = BSSE_ROLL_PATTERN.matcher(clean);
        if (bsseMatcher.matches()) {
            int batch = Integer.parseInt(bsseMatcher.group(1));
            int roll = Integer.parseInt(bsseMatcher.group(2));
            return new ParsedRoll(null, null, null, batch, roll, clean);
        }

        Matcher fourMatcher = FOUR_DIGIT_ROLL_PATTERN.matcher(clean);
        if (fourMatcher.matches()) {
            int batch = Integer.parseInt(fourMatcher.group(1));
            int roll = Integer.parseInt(fourMatcher.group(2));
            return new ParsedRoll(null, null, null, batch, roll, clean);
        }

        return new ParsedRoll(null, null, null, null, null, clean);
    }
}
