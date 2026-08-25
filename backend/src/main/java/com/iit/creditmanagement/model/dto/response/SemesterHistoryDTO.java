package com.iit.creditmanagement.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record SemesterHistoryDTO(
        Long semesterId,
        String semesterName,
        Integer year,
        String semesterLabel,
        String semesterRollId,
        boolean isActive,
        boolean isGap,
        int totalCredits,
        BigDecimal sgpa,
        BigDecimal gapFineAmount,
        List<CourseGradeRecordDTO> courses
) {}
