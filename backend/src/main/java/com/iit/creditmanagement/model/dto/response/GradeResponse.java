package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Grade;
import com.iit.creditmanagement.model.enums.GradeLetter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradeResponse(
        Long         id,
        Long         enrollmentId,
        Long         studentId,
        String       studentName,
        String       rollNumber,
        String       registrationNumber,
        Long         courseId,
        String       courseCode,
        String       courseName,
        Integer      creditHours,
        String       semesterLabel,
        BigDecimal   midtermMarks,
        BigDecimal   finalMarks,
        BigDecimal   totalMarks,
        GradeLetter  gradeLetter,
        String       gradeDisplay,     // "A", "A-", "B+", etc.
        BigDecimal   gradePoint,
        OffsetDateTime enteredAt
) {
    public static GradeResponse from(Grade g) {
        var e = g.getEnrollment();
        return new GradeResponse(
                g.getId(),
                e.getId(),
                e.getStudent().getId(),
                e.getStudent().getName(),
                e.getStudent().getRollNumber(),
                e.getStudent().getRegistrationNumber(),
                e.getCourse().getId(),
                e.getCourse().getCode(),
                e.getCourse().getName(),
                e.getCourse().getCreditHours(),
                e.getSemester().getLabel(),
                g.getMidtermMarks(),
                g.getFinalMarks(),
                g.getTotalMarks(),
                g.getGradeLetter(),
                g.getGradeLetter() != null ? g.getGradeLetter().getDisplay() : null,
                g.getGradePoint(),
                g.getEnteredAt()
        );
    }
}
