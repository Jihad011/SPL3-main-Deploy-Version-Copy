package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.GradeEntryRequest;
import com.iit.creditmanagement.model.dto.response.CourseResponse;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.CourseService;
import com.iit.creditmanagement.service.EnrollmentService;
import com.iit.creditmanagement.service.GradeService;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.repository.SemesterRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import com.iit.creditmanagement.model.dto.response.StudentHistoryResponse;
import com.iit.creditmanagement.service.StudentHistoryService;
import com.iit.creditmanagement.service.TranscriptService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Teacher", description = "Teacher dashboard, grade-entry, and student history endpoints")
public class TeacherController {

    private final CourseService         courseService;
    private final EnrollmentService     enrollmentService;
    private final GradeService          gradeService;
    private final SemesterRepository    semesterRepository;
    private final StudentHistoryService studentHistoryService;
    private final TranscriptService     transcriptService;

    /**
     * Teacher profile — returns the logged-in teacher's own data.
     */
    @GetMapping("/profile")
    @Operation(summary = "Get teacher profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(UserResponse.from(teacher));
    }

    /**
     * Teacher dashboard — lists all courses assigned to this teacher.
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get teacher dashboard: all assigned courses with enrollment counts")
    public ResponseEntity<List<CourseResponse>> getDashboard(
            @AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(courseService.getCoursesByTeacher(teacher.getId()));
    }

    /**
     * Get all students enrolled in a specific course this semester.
     * Used to populate the grade-entry table in the UI.
     */
    @GetMapping("/courses/{courseId}/students")
    @Operation(summary = "Get students enrolled in a course for the active semester (grade entry table)")
    public ResponseEntity<List<EnrollmentResponse>> getEnrolledStudents(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long semesterId) {
        if (semesterId == null) {
            semesterId = semesterRepository.findActiveSemester()
                    .map(Semester::getId)
                    .orElse(null);
        }
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId, semesterId));
    }

    /**
     * Get existing grades for a course + semester.
     * Returns both graded and un-graded enrollments so the teacher can
     * see who still needs marks entered.
     */
    @GetMapping("/courses/{courseId}/grades")
    @Operation(summary = "Get all grade records for a course in the active semester")
    public ResponseEntity<List<GradeResponse>> getCourseGrades(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long courseId,
            @RequestParam(required = false) Long semesterId) {
        if (semesterId == null) {
            semesterId = semesterRepository.findActiveSemester()
                    .map(Semester::getId)
                    .orElse(null);
        }
        return ResponseEntity.ok(gradeService.getGradesForCourse(courseId, semesterId, teacher));
    }

    @PostMapping("/courses/{courseId}/grades/bulk")
    @Operation(summary = "Bulk submit or update grades for a course via JSON")
    public ResponseEntity<List<GradeResponse>> bulkSubmitGrades(
            @PathVariable Long courseId,
            @RequestBody List<GradeEntryRequest> requests,
            @AuthenticationPrincipal User teacher) {
        
        return ResponseEntity.ok(gradeService.bulkEnterGrades(teacher.getId(), requests));
    }
    
    @PostMapping("/courses/{courseId}/grades/upload")
    @Operation(summary = "Bulk submit or update grades for a course via CSV upload")
    public ResponseEntity<List<GradeResponse>> uploadGradesCsv(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User teacher) {
        
        return ResponseEntity.ok(gradeService.uploadGradesCsv(teacher.getId(), courseId, file));
    }

    /**
     * Look up student full academic dossier by roll number, dynamic roll (e.g. 26S0204), or ID.
     */
    @GetMapping("/students/{query}/history")
    @Operation(summary = "Get full student academic history by roll ID, registration, or name")
    public ResponseEntity<StudentHistoryResponse> getStudentHistory(@PathVariable String query) {
        return ResponseEntity.ok(studentHistoryService.getStudentHistoryByQuery(query));
    }

    /**
     * Search students by query for autocomplete.
     */
    @GetMapping("/students/search")
    @Operation(summary = "Search students by roll, name, or registration for autocomplete")
    public ResponseEntity<List<UserResponse>> searchStudents(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(studentHistoryService.searchStudents(q));
    }

    /**
     * Download official PDF transcript for a student directly from teacher view.
     */
    @GetMapping("/students/{studentId}/transcript")
    @Operation(summary = "Download official student PDF transcript")
    public ResponseEntity<byte[]> getStudentTranscript(@PathVariable Long studentId) {
        byte[] pdfBytes = transcriptService.generateTranscriptPdf(studentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transcript_" + studentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
