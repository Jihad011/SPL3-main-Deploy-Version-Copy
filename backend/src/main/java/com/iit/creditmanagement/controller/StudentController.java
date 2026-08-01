package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.dto.response.StudentDashboardResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
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
    private final UserRepository       userRepository;
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
                .orElseThrow(() -> new BusinessRuleException("No active semester"));

        int currentCredits = enrollmentRepository
                .sumCreditsByStudentAndSemester(student.getId(), activeSemester.getId());

        List<EnrollmentResponse> currentEnrollments = enrollmentService
                .getEnrollmentsForSemester(student.getId(), activeSemester.getId());

        BigDecimal cgpa      = gradeService.getStudentCgpa(student.getId());
        BigDecimal totalDues = feeService.getTotalDues(student.getId());
        int unpaidCount      = feeService.getUnpaidFees(student.getId()).size();

        // Count completed courses for total credits earned
        long completedCourses = gradeService.getMyGrades(student.getId())
                .stream().filter(g -> g.gradePoint() != null && g.gradePoint().compareTo(BigDecimal.ZERO) > 0)
                .count();
        int totalCreditsEarned = gradeService.getMyGrades(student.getId())
                .stream()
                .filter(g -> g.gradePoint() != null && g.gradePoint().compareTo(BigDecimal.ZERO) > 0)
                .mapToInt(g -> g.creditHours())
                .sum();

        StudentDashboardResponse dashboard = new StudentDashboardResponse(
                student.getId(),
                student.getName(),
                student.getRollNumber(),
                student.getRegistrationNumber(),
                activeSemester.getLabel(),
                currentCredits,
                AppConstants.MAX_CREDITS_PER_SEMESTER,
                AppConstants.MAX_CREDITS_PER_SEMESTER - currentCredits,
                cgpa,
                totalCreditsEarned,
                (int) completedCourses,
                totalDues,
                unpaidCount,
                currentEnrollments
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
