package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.EnrollmentService;
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
@RequestMapping("/enrollments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Enrollment", description = "Course enrollment management")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Enroll in a course (enforces 12-credit and 40-seat rules)")
    public ResponseEntity<EnrollmentResponse> enroll(
            @AuthenticationPrincipal User student,
            @Valid @RequestBody EnrollRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(student.getId(), request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get all my enrollments across all semesters")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(
            @AuthenticationPrincipal User student) {
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(student.getId()));
    }

    @GetMapping("/my/semester/{semesterId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my enrollments for a specific semester")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsForSemester(
            @AuthenticationPrincipal User student,
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(
                enrollmentService.getEnrollmentsForSemester(student.getId(), semesterId));
    }

    @PatchMapping("/{enrollmentId}/drop")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Drop an active course enrollment")
    public ResponseEntity<EnrollmentResponse> dropCourse(
            @AuthenticationPrincipal User student,
            @PathVariable Long enrollmentId) {
        return ResponseEntity.ok(enrollmentService.dropCourse(enrollmentId, student.getId()));
    }

    @GetMapping("/course/{courseId}/semester/{semesterId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get all enrollments for a course (teacher only) — used for grade entry")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsByCourse(
            @PathVariable Long courseId,
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId, semesterId));
    }
}
