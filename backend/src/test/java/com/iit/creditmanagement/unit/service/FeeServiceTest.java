package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.response.FeeResponse;
import com.iit.creditmanagement.model.entity.Fee;
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
import com.iit.creditmanagement.service.NotificationService;
import com.iit.creditmanagement.service.impl.FeeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FeeServiceTest {

    @Mock private FeeRepository feeRepository;
    @Mock private UserRepository userRepository;
    @Mock private SemesterRepository semesterRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks
    private FeeServiceImpl feeService;

    private User admin;
    private User student;
    private Fee fee;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(1L).name("Admin User").role(Role.ADMIN).build();
        student = User.builder().id(10L).name("Student User").role(Role.STUDENT).build();

        fee = Fee.builder()
                .id(100L)
                .student(student)
                .feeType(FeeType.REGISTRATION)
                .amount(BigDecimal.valueOf(15000))
                .status(FeeStatus.UNPAID)
                .dueDate(LocalDate.of(2026, 12, 31))
                .build();
    }

    @Test
    @DisplayName("Should successfully create fee")
    void testCreateFee_Success() {
        FeeCreateRequest request = new FeeCreateRequest(
                10L, FeeType.REGISTRATION, BigDecimal.valueOf(15000),
                "Spring 2026 Registration Fee", null, LocalDate.of(2026, 12, 31)
        );

        when(userRepository.findById(10L)).thenReturn(Optional.of(student));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(feeRepository.save(any(Fee.class))).thenReturn(fee);

        FeeResponse response = feeService.createFee(1L, request);

        assertNotNull(response);
        assertEquals(FeeStatus.UNPAID, response.status());
        assertEquals(BigDecimal.valueOf(15000), response.amount());
        verify(notificationService).sendNotification(eq(student), anyString(), anyString(), eq("FEE_CREATED"));
    }

    @Test
    @DisplayName("Should mark fee as paid by admin")
    void testMarkAsPaid_Success() {
        when(feeRepository.findById(100L)).thenReturn(Optional.of(fee));
        when(feeRepository.save(any(Fee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FeeResponse response = feeService.markAsPaid(100L, 1L, PaymentMethod.CASH);

        assertNotNull(response);
        assertEquals(FeeStatus.PAID, response.status());
        assertEquals(PaymentMethod.CASH, response.paymentMethod());
        verify(notificationService).sendNotification(eq(student), anyString(), anyString(), eq("FEE_PAID"));
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when marking already paid fee as paid")
    void testMarkAsPaid_AlreadyPaid_ThrowsException() {
        fee.setStatus(FeeStatus.PAID);
        when(feeRepository.findById(100L)).thenReturn(Optional.of(fee));

        assertThrows(BusinessRuleException.class, () -> feeService.markAsPaid(100L, 1L, PaymentMethod.CASH));
    }
}
