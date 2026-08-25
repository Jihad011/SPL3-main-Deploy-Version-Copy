package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.dto.response.StudentDashboardResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.service.FeeService;
import com.iit.creditmanagement.service.GradeService;
import com.iit.creditmanagement.service.EnrollmentService;
import com.iit.creditmanagement.service.TranscriptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Student", description = "Student dashboard and profile endpoints")
public class StudentController {

    private final SemesterRepository   semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService    enrollmentService;
    private final GradeService         gradeService;
    private final FeeService           feeService;
    private final TranscriptService    transcriptService;

    /**
     * Aggregated dashboard endpoint — returns everything the student dashboard needs
     * in a single HTTP call to minimise page load time.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get student dashboard summary (credits, CGPA, dues, current enrollments)")
    public ResponseEntity<StudentDashboardResponse> getDashboard(
            @AuthenticationPrincipal User student) {

        var activeSemester = semesterRepository.findActiveSemester()
                .orElse(null);

        Long activeSemesterId = activeSemester != null ? activeSemester.getId() : null;
        String semesterLabel = activeSemester != null ? activeSemester.getLabel() : "Active Term";

        Integer sumCredits = activeSemesterId != null
                ? enrollmentRepository.sumCreditsByStudentAndSemester(student.getId(), activeSemesterId)
                : 0;
        int currentCredits = sumCredits != null ? sumCredits : 0;

        List<EnrollmentResponse> currentEnrollments = activeSemesterId != null
                ? enrollmentService.getEnrollmentsForSemester(student.getId(), activeSemesterId)
                : enrollmentRepository.findAllByStudentId(student.getId()).stream().map(EnrollmentResponse::from).toList();

        BigDecimal cgpa      = gradeService.getStudentCgpa(student.getId());
        BigDecimal totalDues = feeService.getTotalDues(student.getId());
        int unpaidCount      = feeService.getUnpaidFees(student.getId()).size();

        // Count completed courses and total credits earned
        List<GradeResponse> myGrades = gradeService.getMyGrades(student.getId());
        List<GradeResponse> passedGrades = myGrades.stream()
                .filter(g -> g.gradePoint() != null && g.gradePoint().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        long completedCourses = passedGrades.size();
        int totalCreditsEarned = passedGrades.stream()
                .mapToInt(g -> g.creditHours() != null ? g.creditHours() : 0)
                .sum();

        StudentDashboardResponse dashboard = new StudentDashboardResponse(
                student.getId(),
                student.getName(),
                student.getRollNumber(),
                student.getRegistrationNumber(),
                semesterLabel,
                currentCredits,
                AppConstants.MAX_CREDITS_PER_SEMESTER,
                Math.max(0, AppConstants.MAX_CREDITS_PER_SEMESTER - currentCredits),
                cgpa != null ? cgpa : BigDecimal.ZERO,
                totalCreditsEarned,
                (int) completedCourses,
                totalDues != null ? totalDues : BigDecimal.ZERO,
                unpaidCount,
                currentEnrollments != null ? currentEnrollments : List.of()
        );

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get student profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(UserResponse.from(student));
    }

    @GetMapping("/transcript/download")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Download Official Academic Transcript as PDF")
    public ResponseEntity<byte[]> downloadTranscript(@AuthenticationPrincipal User student) {
        byte[] pdfBytes = transcriptService.generateTranscriptPdf(student.getId());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Official_Transcript.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
