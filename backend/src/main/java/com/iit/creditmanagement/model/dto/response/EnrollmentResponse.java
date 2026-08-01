package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;

import java.time.OffsetDateTime;

public record EnrollmentResponse(
        Long             id,
        Long             studentId,
        String           studentName,
        String           rollNumber,
        Long             courseId,
        String           courseCode,
        String           courseName,
        Integer          creditHours,
        Long             semesterId,
        String           semesterLabel,
        EnrollmentStatus status,
        boolean          isRetake,
        OffsetDateTime   enrolledAt
) {
    public static EnrollmentResponse from(Enrollment e) {
        return new EnrollmentResponse(
                e.getId(),
                e.getStudent().getId(),
                e.getStudent().getName(),
                e.getStudent().getRollNumber(),
                e.getCourse().getId(),
                e.getCourse().getCode(),
                e.getCourse().getName(),
                e.getCourse().getCreditHours(),
                e.getSemester().getId(),
                e.getSemester().getLabel(),
                e.getStatus(),
                e.isRetake(),
                e.getEnrolledAt()
        );
    }
}
