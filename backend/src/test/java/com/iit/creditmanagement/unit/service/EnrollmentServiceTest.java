package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.CourseType;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.impl.EnrollmentServiceImpl;
import com.iit.creditmanagement.util.CreditValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("EnrollmentService Unit Tests")
class EnrollmentServiceTest {

    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private UserRepository       userRepository;
    @Mock private CourseRepository     courseRepository;
    @Mock private SemesterRepository   semesterRepository;
    @Mock private CreditValidator      creditValidator;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private EnrollmentServiceImpl enrollmentService;

    private User student;
    private Course course;
    private Semester activeSemester;

    @BeforeEach
    void setUp() {
        student = User.builder().id(1L).name("Test Student").role(Role.STUDENT).email("student@iit.du.ac.bd").build();

        course = Course.builder()
                .id(10L).code("MITM 303").name("Advanced Computer Networks")
                .creditHours(3).courseType(CourseType.CORE).maxSeats(40).currentEnrollment(5).isActive(true)
                .build();

        activeSemester = Semester.builder()
                .id(100L).name(SemesterName.FIRST_SEMESTER).year(2026)
                .startDate(LocalDate.now().minusDays(1)).endDate(LocalDate.now().plusMonths(4)).isActive(true)
                .build();
    }

    @Test
    @DisplayName("Enroll student succeeds when seats available and limit not exceeded")
    void enrollSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(semesterRepository.findById(100L)).thenReturn(Optional.of(activeSemester));

        var req = new EnrollRequest(10L, 100L, false);

        Enrollment saved = Enrollment.builder()
                .id(999L).student(student).course(course).semester(activeSemester)
                .status(EnrollmentStatus.ACTIVE).isRetake(false).build();
        when(enrollmentRepository.save(any())).thenReturn(saved);

        EnrollmentResponse resp = enrollmentService.enroll(1L, req);

        assertThat(resp).isNotNull();
        assertThat(resp.courseCode()).isEqualTo("MITM 303");
        verify(enrollmentRepository).save(any());
    }

    @Test
    @DisplayName("Enroll in inactive semester throws BusinessRuleException")
    void enrollInactiveSemester_ThrowsException() {
        activeSemester.setActive(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(semesterRepository.findById(100L)).thenReturn(Optional.of(activeSemester));

        var req = new EnrollRequest(10L, 100L, false);

        assertThatThrownBy(() -> enrollmentService.enroll(1L, req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");
    }

    @Test
    @DisplayName("Drop course sets status to DROPPED")
    void dropSuccess() {
        Enrollment enrollment = Enrollment.builder()
                .id(999L).student(student).course(course).semester(activeSemester)
                .status(EnrollmentStatus.ACTIVE).isRetake(false).build();

        when(enrollmentRepository.findById(999L)).thenReturn(Optional.of(enrollment));
        when(courseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EnrollmentResponse resp = enrollmentService.dropCourse(999L, 1L);

        assertThat(resp.status()).isEqualTo(EnrollmentStatus.DROPPED);
    }
}
