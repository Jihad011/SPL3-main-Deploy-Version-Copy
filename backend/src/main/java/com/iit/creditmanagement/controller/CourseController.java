package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.CourseRequest;
import com.iit.creditmanagement.model.dto.response.ApiResponse;
import com.iit.creditmanagement.model.dto.response.CourseResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Courses", description = "Course catalogue management")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "Get all active courses (all authenticated users)")
    public ResponseEntity<List<CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllActiveCourses());
    }

    @GetMapping("/{courseId}")
    @Operation(summary = "Get a course by ID")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getCourseById(courseId));
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get courses available for the student to enroll in this semester")
    public ResponseEntity<List<CourseResponse>> getAvailableCourses(
            @AuthenticationPrincipal User student) {
        return ResponseEntity.ok(courseService.getAvailableCoursesForStudent(student.getId()));
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get courses assigned to the logged-in teacher")
    public ResponseEntity<List<CourseResponse>> getMyCourses(
            @AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(courseService.getCoursesByTeacher(teacher.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new course (admin only)")
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request));
    }

    @PutMapping("/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @Operation(summary = "Update course details or syllabus (admin or teacher)")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(courseId, request));
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a course (soft delete — admin only)")
    public ResponseEntity<ApiResponse> deactivateCourse(@PathVariable Long courseId) {
        courseService.deactivateCourse(courseId);
        return ResponseEntity.ok(ApiResponse.ok("Course deactivated successfully"));
    }
}
