package com.iit.creditmanagement.constants;

public final class AppConstants {

    private AppConstants() {}

    // ── Credit Rules ─────────────────────────────────────────
    public static final int MAX_CREDITS_PER_SEMESTER = 12;
    public static final int TOTAL_CREDITS_TO_COMPLETE = 36;

    // ── Seat Rules ───────────────────────────────────────────
    public static final int MAX_SEATS_PER_COURSE = 40;
    public static final int MAX_SEATS_OPTIONAL_COURSE = 40;

    // ── Mark Boundaries ──────────────────────────────────────
    public static final double MAX_MIDTERM_MARKS = 40.0;
    public static final double MAX_FINAL_MARKS   = 60.0;
    public static final double MAX_TOTAL_MARKS   = 100.0;
    public static final double PASSING_MARKS     = 40.0;

    // ── Grading Scale (IIT Dhaka) ────────────────────────────
    public static final double A_PLUS_MIN  = 80.0;
    public static final double A_MIN       = 75.0;
    public static final double A_MINUS_MIN = 70.0;
    public static final double B_PLUS_MIN  = 65.0;
    public static final double B_MIN       = 60.0;
    public static final double B_MINUS_MIN = 55.0;
    public static final double C_PLUS_MIN  = 50.0;
    public static final double C_MIN       = 45.0;
    public static final double D_MIN       = 40.0;

    // ── Default Fees (BDT - DU IIT EMIT Notice) ─────────────
    public static final double DEFAULT_RETAKE_FEE       = 500.0;
    public static final double DEFAULT_SEMESTER_GAP_FEE = 10000.0;
    public static final double DEFAULT_REGISTRATION_FEE = 200.0;

    // ── Official Program Fees (BDT - DU IIT EMIT Brochure Page 5) ──
    public static final double ADMISSION_FEE_1ST_SEM     = 12000.0;
    public static final double SEMESTER_FEE              = 10000.0;
    public static final double LAB_USAGE_FEE             = 8000.0;
    public static final double COST_PER_CREDIT           = 4500.0;
    public static final double FIRST_SEMESTER_TOTAL_FEE  = 84000.0;  // 12000 + 10000 + 8000 + (12 * 4500)
    public static final double SUBSEQUENT_SEMESTER_FEE   = 72000.0;  // 10000 + 8000 + (12 * 4500)
    public static final double TOTAL_PROGRAM_FEE         = 228000.0; // 84000 + 72000 + 72000
}
