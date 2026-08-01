package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.enums.CourseType;

import java.time.OffsetDateTime;

public record CourseResponse(
        Long         id,
        String       code,
        String       name,
        String       description,
        Integer      creditHours,
        CourseType   courseType,
        Integer      maxSeats,
        Integer      currentEnrollment,
        Integer      availableSeats,
        boolean      isFull,
        Long         teacherId,
        String       teacherName,
        boolean      isActive,
        OffsetDateTime createdAt
) {
    public static CourseResponse from(Course c) {
        return new CourseResponse(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getDescription(),
                c.getCreditHours(),
                c.getCourseType(),
                c.getMaxSeats(),
                c.getCurrentEnrollment(),
                c.getMaxSeats() - c.getCurrentEnrollment(),
                !c.hasAvailableSeats(),
                c.getTeacher() != null ? c.getTeacher().getId() : null,
                c.getTeacher() != null ? c.getTeacher().getName() : null,
                c.isActive(),
                c.getCreatedAt()
        );
    }
}
