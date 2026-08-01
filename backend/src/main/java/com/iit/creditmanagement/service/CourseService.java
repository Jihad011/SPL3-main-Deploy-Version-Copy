package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.CourseRequest;
import com.iit.creditmanagement.model.dto.response.CourseResponse;

import java.util.List;

public interface CourseService {
    CourseResponse createCourse(CourseRequest request);
    CourseResponse updateCourse(Long courseId, CourseRequest request);
    CourseResponse getCourseById(Long courseId);
    List<CourseResponse> getAllActiveCourses();
    List<CourseResponse> getAvailableCoursesForStudent(Long studentId);
    List<CourseResponse> getCoursesByTeacher(Long teacherId);
    CourseResponse deactivateCourse(Long courseId);
}
