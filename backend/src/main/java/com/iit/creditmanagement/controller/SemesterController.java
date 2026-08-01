package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.SemesterRequest;
import com.iit.creditmanagement.model.dto.response.SemesterResponse;
import com.iit.creditmanagement.service.SemesterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/semesters")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Semesters", description = "Controls which academic semesters are open for enrollment")
public class SemesterController {

    private final SemesterService semesterService;

    /** List of all currently active semesters (e.g. 1st Year 1st Sem & 1st Year 2nd Sem concurrently) */
    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all currently active semesters")
    public ResponseEntity<List<SemesterResponse>> getActiveSemesters() {
        return ResponseEntity.ok(semesterService.getActiveSemesters());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all semesters (admin only)")
    public ResponseEntity<List<SemesterResponse>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @GetMapping("/{semesterId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get semester by ID")
    public ResponseEntity<SemesterResponse> getById(@PathVariable Long semesterId) {
        return ResponseEntity.ok(semesterService.getSemesterById(semesterId));
    }

    /** Admin creates a semester; set makeActive=true to open enrollment immediately */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create semester. Set makeActive=true to open enrollment immediately.")
    public ResponseEntity<SemesterResponse> createSemester(
            @Valid @RequestBody SemesterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(semesterService.createSemester(request));
    }

    @PatchMapping("/{semesterId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate a semester — opens enrollment for this semester")
    public ResponseEntity<SemesterResponse> activateSemester(@PathVariable Long semesterId) {
        return ResponseEntity.ok(semesterService.activateSemester(semesterId));
    }

    @PatchMapping("/{semesterId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a semester — closes enrollment for this semester")
    public ResponseEntity<SemesterResponse> deactivateSemester(@PathVariable Long semesterId) {
        return ResponseEntity.ok(semesterService.deactivateSemester(semesterId));
    }
}
