package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.response.FeeResponse;
import com.iit.creditmanagement.model.entity.Fee;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.FeeStatus;
import com.iit.creditmanagement.model.enums.PaymentMethod;
import com.iit.creditmanagement.repository.FeeRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.FeeService;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeeServiceImpl implements FeeService {

    private final FeeRepository      feeRepository;
    private final UserRepository     userRepository;
    private final SemesterRepository semesterRepository;
    private final NotificationService notificationService;
    private final AuditService       auditService;

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getMyFees(Long studentId) {
        return feeRepository.findAllByStudentId(studentId)
                .stream().map(FeeResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getUnpaidFees(Long studentId) {
        return feeRepository.findAllByStudentIdAndStatus(studentId, FeeStatus.UNPAID)
                .stream().map(FeeResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalDues(Long studentId) {
        return feeRepository.totalUnpaidByStudent(studentId);
    }

    @Override
    @Transactional
    public FeeResponse createFee(Long adminId, FeeCreateRequest request) {
        User student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.studentId()));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", adminId));

        Semester semester = null;
        if (request.semesterId() != null) {
            semester = semesterRepository.findById(request.semesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Semester", request.semesterId()));
        }

        Fee fee = Fee.builder()
                .student(student)
                .feeType(request.feeType())
                .amount(request.amount())
                .description(request.description())
                .semester(semester)
                .dueDate(request.dueDate())
                .createdBy(admin)
                .status(FeeStatus.UNPAID)
                .build();

        fee = feeRepository.save(fee);
        
        notificationService.sendNotification(
            student,
            "New Fee Generated",
            String.format("A new fee of ৳%s (%s) has been added to your account.", request.amount(), request.feeType()),
            "FEE_CREATED"
        );
        
        log.info("Fee created for student {} by admin {}: {} BDT [{}]",
                student.getId(), adminId, request.amount(), request.feeType());
        return FeeResponse.from(fee);
    }

    @Override
    @Transactional
    public FeeResponse markAsPaid(Long feeId, Long adminId, PaymentMethod paymentMethod) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee", feeId));

        if (fee.getStatus() == FeeStatus.PAID) {
            throw new BusinessRuleException("This fee has already been marked as PAID.");
        }

        fee.setStatus(FeeStatus.PAID);
        fee.setPaidAt(OffsetDateTime.now());
        if (paymentMethod != null) {
            fee.setPaymentMethod(paymentMethod);
        } else {
            fee.setPaymentMethod(PaymentMethod.CASH);
        }
        fee = feeRepository.save(fee);
        
        notificationService.sendNotification(
            fee.getStudent(),
            "Fee Payment Confirmed",
            String.format("Your payment of ৳%s for %s has been confirmed by administration.", fee.getAmount(), fee.getFeeType()),
            "FEE_PAID"
        );
        
        log.info("Fee {} marked as PAID by admin {}", feeId, adminId);
        return FeeResponse.from(fee);
    }

    @Override
    @Transactional
    public FeeResponse payFeeStudent(Long feeId, Long studentId, PaymentMethod paymentMethod) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee", feeId));

        if (!fee.getStudent().getId().equals(studentId)) {
            throw new BusinessRuleException("You can only pay your own fees.");
        }

        if (fee.getStatus() == FeeStatus.PAID) {
            throw new BusinessRuleException("This fee has already been paid.");
        }

        fee.setStatus(FeeStatus.PAID);
        fee.setPaidAt(OffsetDateTime.now());
        fee.setPaymentMethod(paymentMethod);
        fee = feeRepository.save(fee);
        
        notificationService.sendNotification(
            fee.getStudent(),
            "Payment Successful",
            String.format("You have successfully paid ৳%s for %s.", fee.getAmount(), fee.getFeeType()),
            "FEE_PAID"
        );
        
        log.info("Fee {} paid by student {}", feeId, studentId);
        return FeeResponse.from(fee);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getFeesByStudent(Long studentId) {
        return feeRepository.findAllByStudentId(studentId)
                .stream().map(FeeResponse::from).toList();
    }
}
