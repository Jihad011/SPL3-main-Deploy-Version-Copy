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
        boolean retake
) {}
