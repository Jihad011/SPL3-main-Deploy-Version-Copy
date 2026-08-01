package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.response.FeeResponse;
import com.iit.creditmanagement.model.entity.User;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fees")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Fees", description = "Student fee and dues management")
public class FeeController {

    private final FeeService feeService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get all my fees")
    public ResponseEntity<List<FeeResponse>> getMyFees(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(feeService.getMyFees(student.getId()));
    }

    @GetMapping("/my/unpaid")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my unpaid fees")
    public ResponseEntity<List<FeeResponse>> getMyUnpaidFees(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(feeService.getUnpaidFees(student.getId()));
    }

    @GetMapping("/my/total-dues")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get total unpaid dues amount")
    public ResponseEntity<Map<String, BigDecimal>> getTotalDues(
            @AuthenticationPrincipal User student) {
        return ResponseEntity.ok(Map.of("totalDues", feeService.getTotalDues(student.getId())));
    }

    @PatchMapping("/my/{feeId}/pay")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Pay a fee (student)")
    public ResponseEntity<FeeResponse> payFeeStudent(
            @AuthenticationPrincipal User student,
            @PathVariable Long feeId) {
        return ResponseEntity.ok(feeService.payFeeStudent(feeId, student.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a fee record for a student (admin only)")
    public ResponseEntity<FeeResponse> createFee(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody FeeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feeService.createFee(admin.getId(), request));
    }

    @PatchMapping("/{feeId}/pay")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark a fee as paid (admin only)")
    public ResponseEntity<FeeResponse> markAsPaid(
            @AuthenticationPrincipal User admin,
            @PathVariable Long feeId) {
        return ResponseEntity.ok(feeService.markAsPaid(feeId, admin.getId()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all fees for a specific student (admin only)")
    public ResponseEntity<List<FeeResponse>> getFeesByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(feeService.getFeesByStudent(studentId));
    }
}
