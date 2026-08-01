package com.iit.creditmanagement.model.dto.request;

import com.iit.creditmanagement.model.enums.FeeType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Admin-initiated fee creation (e.g., semester gap penalty). */
public record FeeCreateRequest(

        @NotNull(message = "Student ID is required")
        Long studentId,

        @NotNull(message = "Fee type is required")
        FeeType feeType,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
        BigDecimal amount,

        String description,

        Long semesterId,

        LocalDate dueDate
) {}
