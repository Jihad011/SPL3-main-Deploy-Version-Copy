package com.iit.creditmanagement.model.dto.request;

import com.iit.creditmanagement.model.enums.SemesterName;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record SemesterRequest(
        @NotNull(message = "Semester name is required")
        SemesterName name,

        @NotNull(message = "Year is required")
        @Min(value = 2000, message = "Year must be 2000 or later")
        Integer year,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate,

        boolean makeActive
) {}
