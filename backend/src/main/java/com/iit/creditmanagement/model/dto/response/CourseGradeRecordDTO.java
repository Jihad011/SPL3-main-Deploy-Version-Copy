package com.iit.creditmanagement.model.dto.response;

import java.math.BigDecimal;

public record CourseGradeRecordDTO(
        Long courseId,
        String courseCode,
        String courseName,
        Integer creditHours,
        String teacherName,
        BigDecimal midtermMarks,
        BigDecimal finalMarks,
        BigDecimal totalMarks,
        String gradeLetter,
        BigDecimal gradePoint,
        boolean isRetake,
        String enrollmentStatus
) {}
