package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.request.RegisterRequest;
import com.iit.creditmanagement.model.dto.response.*;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.AdminService;
import com.iit.creditmanagement.service.FeeService;
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
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin", description = "Admin-only system management endpoints")
public class AdminController {

    private final AdminService adminService;
    private final FeeService   feeService;

    // ── Students ─────────────────────────────────────────────

    @PostMapping("/students")
    @Operation(summary = "Create a new student account")
    public ResponseEntity<UserResponse> createStudent(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStudent(request));
    }

    @GetMapping("/students")
    @Operation(summary = "Get all students")
    public ResponseEntity<Page<UserResponse>> getAllStudents(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllStudents(pageable));
    }

    @GetMapping("/students/search")
    @Operation(summary = "Search students by name, roll number, or registration number")
    public ResponseEntity<List<UserResponse>> searchStudents(@RequestParam String q) {
        return ResponseEntity.ok(adminService.searchStudents(q));
    }

    @GetMapping("/students/{studentId}")
    @Operation(summary = "Get a student's profile by ID")
    public ResponseEntity<UserResponse> getStudentById(@PathVariable Long studentId) {
        return ResponseEntity.ok(adminService.getStudentById(studentId));
    }

    @GetMapping("/students/{studentId}/enrollments")
    @Operation(summary = "Get all enrollments for a student")
    public ResponseEntity<List<EnrollmentResponse>> getStudentEnrollments(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(adminService.getStudentEnrollments(studentId));
    }

    @GetMapping("/students/{studentId}/grades")
    @Operation(summary = "Get all grades for a student")
    public ResponseEntity<List<GradeResponse>> getStudentGrades(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(adminService.getStudentGrades(studentId));
    }

    @GetMapping("/students/{studentId}/fees")
    @Operation(summary = "Get all fees for a student")
    public ResponseEntity<List<FeeResponse>> getStudentFees(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(adminService.getStudentFees(studentId));
    }

    // ── Teachers ─────────────────────────────────────────────

    @PostMapping("/teachers")
    @Operation(summary = "Create a new teacher account")
    public ResponseEntity<UserResponse> createTeacher(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createTeacher(request));
    }

    @GetMapping("/teachers")
    @Operation(summary = "Get all teachers")
    public ResponseEntity<Page<UserResponse>> getAllTeachers(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllTeachers(pageable));
    }

    // ── Admins ─────────────────────────────────────────────────

    @PostMapping("/admins")
    @Operation(summary = "Create a new admin account")
    public ResponseEntity<UserResponse> createAdmin(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createAdmin(request));
    }

    // ── Fees ─────────────────────────────────────────────────

    @PostMapping("/fees")
    @Operation(summary = "Create a fee record for a student (e.g. semester gap penalty)")
    public ResponseEntity<FeeResponse> createFee(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody FeeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feeService.createFee(admin.getId(), request));
    }

    @PatchMapping("/fees/{feeId}/pay")
    @Operation(summary = "Mark a fee as paid")
    public ResponseEntity<FeeResponse> markAsPaid(
            @AuthenticationPrincipal User admin,
            @PathVariable Long feeId) {
        return ResponseEntity.ok(feeService.markAsPaid(feeId, admin.getId()));
    }

    // ── System Stats ──────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Get system statistics — total students, teachers, courses")
    public ResponseEntity<Map<String, Long>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }
}
