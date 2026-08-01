package com.iit.creditmanagement.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.entity.*;
import com.iit.creditmanagement.model.enums.*;
import com.iit.creditmanagement.repository.*;
import com.iit.creditmanagement.service.impl.EnrollmentServiceImpl;
import com.iit.creditmanagement.util.CreditValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EnrollmentService Unit Tests")
class EnrollmentServiceTest {

    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private CourseRepository     courseRepository;
    @Mock private UserRepository       userRepository;
    @Mock private SemesterRepository   semesterRepository;
    @Mock private CreditValidator      creditValidator;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private EnrollmentServiceImpl enrollmentService;

    private User     student;
    private Course   course;
    private Semester activeSemester;
    private Enrollment savedEnrollment;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L).name("Jihad").email("jihad@iit.du.ac.bd")
                .role(Role.STUDENT).rollNumber("1413").build();

        course = Course.builder()
                .id(10L).code("MIT-601").name("Cloud Computing")
                .creditHours(3).courseType(CourseType.OPTIONAL)
                .maxSeats(40).currentEnrollment(5).build();

        activeSemester = Semester.builder()
                .id(1L).name(SemesterName.SPRING).year(2026)
                .startDate(LocalDate.of(2026, 2, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .isActive(true).build();

        savedEnrollment = Enrollment.builder()
                .id(100L).student(student).course(course)
                .semester(activeSemester).status(EnrollmentStatus.ACTIVE)
                .isRetake(false).build();
    }

    @Test
    @DisplayName("Successful enrollment returns EnrollmentResponse")
    void enrollSuccessfully() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(activeSemester));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(savedEnrollment);

        // CreditValidator does nothing (passes all checks)
        doNothing().when(creditValidator).validateNoDuplicateEnrollment(any(), any(), any());
        doNothing().when(creditValidator).validateCreditLimit(any(), any(), anyInt());
        doNothing().when(creditValidator).validateSeatAvailability(anyInt(), anyInt(), anyString());

        EnrollmentResponse response = enrollmentService.enroll(1L, new EnrollRequest(10L, 1L, false));

        assertThat(response).isNotNull();
        assertThat(response.courseCode()).isEqualTo("MIT-601");
        assertThat(response.status()).isEqualTo(EnrollmentStatus.ACTIVE);
        verify(enrollmentRepository).save(any(Enrollment.class));
    }

    @Test
    @DisplayName("Enrollment blocked when semester is not active")
    void enrollFailsInactiveSemester() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        
        Semester inactiveSemester = Semester.builder().id(1L).isActive(false).build();
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(inactiveSemester));

        assertThatThrownBy(() -> enrollmentService.enroll(1L, new EnrollRequest(10L, 1L, false)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");
    }

    @Test
    @DisplayName("Credit limit violation propagates from CreditValidator")
    void enrollFailsCreditLimit() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(activeSemester));

        doNothing().when(creditValidator).validateNoDuplicateEnrollment(any(), any(), any());
        doThrow(new BusinessRuleException("Credit limit exceeded"))
                .when(creditValidator).validateCreditLimit(any(), any(), anyInt());

        assertThatThrownBy(() -> enrollmentService.enroll(1L, new EnrollRequest(10L, 1L, false)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Credit limit exceeded");

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Seat availability violation propagates from CreditValidator")
    void enrollFailsNoSeats() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(activeSemester));

        doNothing().when(creditValidator).validateNoDuplicateEnrollment(any(), any(), any());
        doNothing().when(creditValidator).validateCreditLimit(any(), any(), anyInt());
        doThrow(new BusinessRuleException("course is full"))
                .when(creditValidator).validateSeatAvailability(anyInt(), anyInt(), anyString());

        assertThatThrownBy(() -> enrollmentService.enroll(1L, new EnrollRequest(10L, 1L, false)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("full");

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Drop active enrollment succeeds")
    void dropEnrollmentSuccess() {
        when(enrollmentRepository.findById(100L)).thenReturn(Optional.of(savedEnrollment));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(savedEnrollment);

        EnrollmentResponse response = enrollmentService.dropCourse(100L, 1L);
        assertThat(response).isNotNull();
        verify(enrollmentRepository).save(argThat(e -> e.getStatus() == EnrollmentStatus.DROPPED));
    }

    @Test
    @DisplayName("Student cannot drop another student's enrollment")
    void dropEnrollmentOwnershipCheck() {
        when(enrollmentRepository.findById(100L)).thenReturn(Optional.of(savedEnrollment));

        // student ID 99 ≠ enrollment's student ID 1
        assertThatThrownBy(() -> enrollmentService.dropCourse(100L, 99L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("own enrollments");
    }
}
