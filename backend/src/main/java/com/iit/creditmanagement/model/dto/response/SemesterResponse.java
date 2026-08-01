package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.enums.SemesterName;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record SemesterResponse(
        Long           id,
        SemesterName   name,
        Integer        year,
        String         label,
        LocalDate      startDate,
        LocalDate      endDate,
        boolean        isActive,
        OffsetDateTime createdAt
) {
    public static SemesterResponse from(Semester s) {
        return new SemesterResponse(
                s.getId(), s.getName(), s.getYear(), s.getLabel(),
                s.getStartDate(), s.getEndDate(), s.isActive(), s.getCreatedAt());
    }
}
