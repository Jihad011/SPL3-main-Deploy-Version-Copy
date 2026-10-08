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
        String           syllabusUrl,
        String           syllabusFileName,
        String           teacherName,
        Integer          targetSemesterLevel,
        String           intakeType,
        OffsetDateTime   enrolledAt
) {
    public EnrollmentResponse(
            Long id, Long studentId, String studentName, String rollNumber,
            Long courseId, String courseCode, String courseName, Integer creditHours,
            Long semesterId, String semesterLabel, EnrollmentStatus status, boolean isRetake,
            String syllabusUrl, String syllabusFileName, OffsetDateTime enrolledAt
    ) {
        this(id, studentId, studentName, rollNumber, courseId, courseCode, courseName, creditHours,
             semesterId, semesterLabel, status, isRetake, syllabusUrl, syllabusFileName, null, null, "Spring", enrolledAt);
    }
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
                e.getCourse().getSyllabusUrl(),
                e.getCourse().getSyllabusFileName(),
                e.getCourse().getTeacher() != null ? e.getCourse().getTeacher().getName() : null,
                e.getTargetSemesterLevel(),
                e.getIntakeType() != null ? e.getIntakeType() : "Spring",
                e.getEnrolledAt()
        );
    }
}
