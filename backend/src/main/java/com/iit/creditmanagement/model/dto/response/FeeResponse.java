package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Fee;
import com.iit.creditmanagement.model.enums.FeeStatus;
import com.iit.creditmanagement.model.enums.FeeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record FeeResponse(
        Long         id,
        Long         studentId,
        String       studentName,
        String       rollNumber,
        FeeType      feeType,
        String       feeTypeDisplay,
        BigDecimal   amount,
        String       description,
        String       semesterLabel,
        FeeStatus    status,
        LocalDate    dueDate,
        OffsetDateTime paidAt,
        OffsetDateTime createdAt
) {
    public static FeeResponse from(Fee f) {
        return new FeeResponse(
                f.getId(),
                f.getStudent().getId(),
                f.getStudent().getName(),
                f.getStudent().getRollNumber(),
                f.getFeeType(),
                formatFeeType(f.getFeeType()),
                f.getAmount(),
                f.getDescription(),
                f.getSemester() != null ? f.getSemester().getLabel() : null,
                f.getStatus(),
                f.getDueDate(),
                f.getPaidAt(),
                f.getCreatedAt()
        );
    }

    private static String formatFeeType(FeeType type) {
        return switch (type) {
            case RETAKE       -> "Retake Fee";
            case SEMESTER_GAP -> "Semester Gap Penalty";
            case REGISTRATION -> "Registration Fee";
            case OTHER        -> "Other Fee";
        };
    }
}
