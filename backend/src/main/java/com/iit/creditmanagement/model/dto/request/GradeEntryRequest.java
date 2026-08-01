package com.iit.creditmanagement.model.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Grade entry by teacher.
 * Either midterm or final (or both) can be submitted in one request.
 * The grade letter + grade point are computed automatically.
 */
public record GradeEntryRequest(

        @NotNull(message = "Enrollment ID is required")
        Long enrollmentId,

        @DecimalMin(value = "0.0",  message = "Midterm marks cannot be negative")
        @DecimalMax(value = "40.0", message = "Midterm marks cannot exceed 40")
        @Digits(integer = 2, fraction = 2, message = "Invalid midterm marks format")
        BigDecimal midtermMarks,

        @DecimalMin(value = "0.0",  message = "Final marks cannot be negative")
        @DecimalMax(value = "60.0", message = "Final marks cannot exceed 60")
        @Digits(integer = 2, fraction = 2, message = "Invalid final marks format")
        BigDecimal finalMarks
) {}
