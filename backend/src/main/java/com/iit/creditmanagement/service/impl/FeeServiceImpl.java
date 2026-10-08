package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.response.FeeResponse;
import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.entity.Fee;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.FeeStatus;
import com.iit.creditmanagement.model.enums.FeeType;
import com.iit.creditmanagement.model.enums.PaymentMethod;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.FeeRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.FeeService;
import com.iit.creditmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeeServiceImpl implements FeeService {

    private final FeeRepository        feeRepository;
    private final UserRepository       userRepository;
    private final SemesterRepository   semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService  notificationService;
    private final AuditService         auditService;

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
        
        auditService.logAction(adminId, "FEE_CREATED", "Fee", String.format("Admin created fee of ৳%s (%s) for student ID %s", request.amount(), request.feeType(), student.getId()));
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
        
        auditService.logAction(adminId, "FEE_PAID_ADMIN", "Fee", String.format("Admin confirmed payment of ৳%s for fee ID %s (%s)", fee.getAmount(), feeId, fee.getFeeType()));
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
        
        auditService.logAction(studentId, "FEE_PAID_STUDENT", "Fee", String.format("Student paid fee ID %s of ৳%s via %s", feeId, fee.getAmount(), paymentMethod));
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

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getAllFees() {
        return feeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(FeeResponse::from).toList();
    }

    @Override
    @Transactional
    public List<FeeResponse> auditAndGenerateGapFines(Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", adminId));

        List<Semester> allSemesters = semesterRepository.findAll(Sort.by(Sort.Direction.ASC, "startDate", "id"));
        Semester activeSemester = semesterRepository.findActiveSemester().orElse(null);
        if (allSemesters.isEmpty() || activeSemester == null) {
            log.info("No active semester or semesters configured for gap fine audit.");
            return Collections.emptyList();
        }

        int activeIndex = -1;
        for (int i = 0; i < allSemesters.size(); i++) {
            if (allSemesters.get(i).getId().equals(activeSemester.getId())) {
                activeIndex = i;
                break;
            }
        }

        List<User> students = userRepository.findAllByRole(Role.STUDENT);
        List<Fee> generatedFees = new ArrayList<>();
        BigDecimal defaultGapFine = BigDecimal.valueOf(AppConstants.DEFAULT_SEMESTER_GAP_FEE);

        for (User student : students) {
            List<Enrollment> enrollments = enrollmentRepository.findAllByStudentId(student.getId());
            if (enrollments.isEmpty()) continue; // Hasn't started taking courses yet

            Set<Long> enrolledSemesterIds = new HashSet<>();
            for (Enrollment e : enrollments) {
                if (e.getCourse() != null && e.getCourse().isActive()) {
                    int level = resolveCourseLevel(e.getCourse(), e.getTargetSemesterLevel());
                    Long targetSemId = (level > 0 && level <= allSemesters.size())
                            ? allSemesters.get(level - 1).getId()
                            : e.getSemester().getId();
                    enrolledSemesterIds.add(targetSemId);
                } else if (e.getSemester() != null) {
                    enrolledSemesterIds.add(e.getSemester().getId());
                }
            }

            int firstEnrolledIndex = -1;
            for (int i = 0; i < allSemesters.size(); i++) {
                if (enrolledSemesterIds.contains(allSemesters.get(i).getId())) {
                    firstEnrolledIndex = i;
                    break;
                }
            }

            if (firstEnrolledIndex == -1 || firstEnrolledIndex >= activeIndex) continue;

            List<Fee> studentExistingFees = feeRepository.findAllByStudentId(student.getId());

            // Scan intermediate semesters between first enrolled and active semester
            for (int i = firstEnrolledIndex + 1; i <= activeIndex; i++) {
                Semester sem = allSemesters.get(i);
                boolean isEnrolled = enrolledSemesterIds.contains(sem.getId());
                if (!isEnrolled) {
                    // Check if gap fine already exists for this student & semester
                    boolean alreadyFined = studentExistingFees.stream().anyMatch(f ->
                            f.getFeeType() == FeeType.SEMESTER_GAP &&
                            f.getSemester() != null &&
                            f.getSemester().getId().equals(sem.getId())
                    );

                    if (!alreadyFined) {
                        Fee gapFee = Fee.builder()
                                .student(student)
                                .feeType(FeeType.SEMESTER_GAP)
                                .amount(defaultGapFine)
                                .description(String.format("Semester Gap Penalty for missing %s (Batch: %s)", sem.getLabel(), student.getBatch() != null ? student.getBatch() : "N/A"))
                                .semester(sem)
                                .dueDate(sem.getEndDate() != null ? sem.getEndDate().plusDays(30) : java.time.LocalDate.now().plusDays(30))
                                .createdBy(admin)
                                .status(FeeStatus.UNPAID)
                                .build();

                        gapFee = feeRepository.save(gapFee);
                        generatedFees.add(gapFee);

                        notificationService.sendNotification(
                                student,
                                "Semester Gap Fine Generated",
                                String.format("A penalty fee of ৳%s has been assessed for un-enrolled semester (%s).", defaultGapFine, sem.getLabel()),
                                "SEMESTER_GAP_FINE"
                        );
                        log.info("Generated gap fine of {} BDT for student {} for semester {}", defaultGapFine, student.getId(), sem.getLabel());
                    }
                }
            }
        }

        return generatedFees.stream().map(FeeResponse::from).toList();
    }

    private int resolveCourseLevel(com.iit.creditmanagement.model.entity.Course c, Integer targetSemesterLevel) {
        if (targetSemesterLevel != null && targetSemesterLevel > 0) {
            return targetSemesterLevel;
        }
        if (c != null) {
            if (c.getSemesterLevel() != null && c.getSemesterLevel() > 0) {
                return c.getSemesterLevel();
            }
            String code = c.getCode() != null ? c.getCode().trim() : "";
            if (List.of("MITM 303", "MITM 304", "MITM 310", "MITM 311").contains(code)) return 1;
            if (List.of("MITM 301", "MITM 305", "MITE 435", "MITE 439", "MITE 436", "MITE 430", "MITE 437", "MITE 432", "MITE 442", "MITE 438", "MITE 434").contains(code)) return 2;
            if (List.of("MITM 421", "MITE 441", "MITE 431", "MITE 455", "MITE 433").contains(code)) return 3;
        }
        return 1;
    }
}
