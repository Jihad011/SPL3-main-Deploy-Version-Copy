package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.enums.CourseType;

import java.time.OffsetDateTime;

public record CourseResponse(
        Long         id,
        String       code,
        String       name,
        String       description,
        String       syllabusUrl,
        String       syllabusFileName,
        Integer      creditHours,
        CourseType   courseType,
        Integer      semesterLevel,
        String       track,
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
        int maxS = (c.getCourseType() == CourseType.CORE) ? Math.max(c.getMaxSeats() != null ? c.getMaxSeats() : 200, 200) : (c.getMaxSeats() != null ? c.getMaxSeats() : 40);
        int current = c.getCurrentEnrollment() != null ? c.getCurrentEnrollment() : 0;
        int available = Math.max(0, maxS - current);
        boolean full = (c.getCourseType() == CourseType.CORE) ? false : current >= maxS;

        return new CourseResponse(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getDescription(),
                c.getSyllabusUrl(),
                c.getSyllabusFileName(),
                c.getCreditHours(),
                c.getCourseType(),
                c.getSemesterLevel(),
                c.getTrack(),
                maxS,
                current,
                available,
                full,
                c.getTeacher() != null ? c.getTeacher().getId() : null,
                c.getTeacher() != null ? c.getTeacher().getName() : null,
                c.isActive(),
                c.getCreatedAt()
        );
    }
}
