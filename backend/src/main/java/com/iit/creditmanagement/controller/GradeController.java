package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.GradeEntryRequest;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.GradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/grades")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Grades", description = "Mark entry and result viewing")
public class GradeController {

    private final GradeService gradeService;

    /** Teacher: enter or update midterm/final marks */
    @PostMapping("/enter")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Enter or update marks for an enrollment. Auto-computes grade and CGPA.")
    public ResponseEntity<GradeResponse> enterGrade(
            @AuthenticationPrincipal User teacher,
            @Valid @RequestBody GradeEntryRequest request) {
        return ResponseEntity.ok(gradeService.enterOrUpdateGrade(teacher.getId(), request));
    }

    /** Teacher: bulk enter or update marks */
    @PostMapping("/bulk-enter")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Bulk enter or update marks for multiple enrollments. Atomic operation.")
    public ResponseEntity<List<GradeResponse>> bulkEnterGrades(
            @AuthenticationPrincipal User teacher,
            @Valid @RequestBody List<GradeEntryRequest> requests) {
        return ResponseEntity.ok(gradeService.bulkEnterGrades(teacher.getId(), requests));
    }

    /** Teacher: get all grades for a course in a semester */
    @GetMapping("/course/{courseId}/semester/{semesterId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get all grades for a course in a semester (teacher grade entry table)")
    public ResponseEntity<List<GradeResponse>> getGradesForCourse(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long courseId,
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(gradeService.getGradesForCourse(courseId, semesterId, currentUser));
    }

    /** Student: get all my grades */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get all my grades across all semesters")
    public ResponseEntity<List<GradeResponse>> getMyGrades(
            @AuthenticationPrincipal User student) {
        return ResponseEntity.ok(gradeService.getMyGrades(student.getId()));
    }

    /** Student: get my CGPA */
    @GetMapping("/my/cgpa")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my current CGPA (weighted average)")
    public ResponseEntity<Map<String, BigDecimal>> getMyCgpa(
            @AuthenticationPrincipal User student) {
        BigDecimal cgpa = gradeService.getStudentCgpa(student.getId());
        return ResponseEntity.ok(Map.of("cgpa", cgpa));
    }

    /** Get grade by enrollment ID */
    @GetMapping("/enrollment/{enrollmentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get grade record by enrollment ID")
    public ResponseEntity<GradeResponse> getGradeByEnrollment(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long enrollmentId) {
        return ResponseEntity.ok(gradeService.getGradeByEnrollment(enrollmentId, currentUser));
    }
}
