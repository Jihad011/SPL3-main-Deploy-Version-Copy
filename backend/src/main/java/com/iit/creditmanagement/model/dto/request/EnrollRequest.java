package com.iit.creditmanagement.model.dto.request;

import jakarta.validation.constraints.NotNull;

public record EnrollRequest(

        @NotNull(message = "Course ID is required")
        Long courseId,

        @NotNull(message = "Semester ID is required")
        Long semesterId,

        /**
         * Set to true if student is retaking a previously failed course.
         * A retake fee will be auto-generated upon enrollment.
         */
        boolean retake,

        /**
         * Semester level (1, 2, or 3) selected during enrollment.
         */
        Integer targetSemesterLevel,

        /**
         * Intake cycle type ('Spring' or 'Fall').
         */
        String intakeType
) {
    public EnrollRequest(Long courseId, Long semesterId, boolean retake) {
        this(courseId, semesterId, retake, null, "Spring");
    }
}
