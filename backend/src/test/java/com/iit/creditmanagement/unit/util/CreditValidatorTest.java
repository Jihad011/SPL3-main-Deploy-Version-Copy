package com.iit.creditmanagement.unit.util;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.util.CreditValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreditValidatorTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private CreditValidator creditValidator;

    private Course course;

    @BeforeEach
    void setUp() {
        course = Course.builder()
                .id(100L)
                .code("MITM 303")
                .creditHours(3)
                .semesterLevel(1)
                .build();
    }

    @Test
    @DisplayName("Should pass validation when credit hours within limit (sum <= 12)")
    void testValidateCreditLimit_WithinLimit_Success() {
        when(enrollmentRepository.sumCreditsByStudentAndSemester(10L, 1L)).thenReturn(9);

        assertDoesNotThrow(() -> creditValidator.validateCreditLimit(10L, 1L, 3));
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when credit hours exceed limit (> 12)")
    void testValidateCreditLimit_ExceedsLimit_ThrowsException() {
        when(enrollmentRepository.sumCreditsByStudentAndSemester(10L, 1L)).thenReturn(10);

        assertThrows(BusinessRuleException.class, () -> creditValidator.validateCreditLimit(10L, 1L, 3));
    }
}
