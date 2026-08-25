package com.iit.creditmanagement.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StudentHistoryResponse(
        Long studentId,
        String studentName,
        String email,
        String baseRollNumber,
        String currentSemesterRollId,
        String registrationNumber,
        Integer batch,
        Integer classRoll,
        String phone,
        String status,
        int totalCreditsCompleted,
        int totalCreditsAttempted,
        BigDecimal cgpa,
        BigDecimal totalDues,
        BigDecimal totalPaidFees,
        int totalGapSemesters,
        BigDecimal totalGapFines,
        List<SemesterHistoryDTO> semesters
) {}
