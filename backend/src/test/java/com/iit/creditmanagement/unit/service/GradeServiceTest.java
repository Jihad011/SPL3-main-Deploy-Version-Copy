package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.GradeEntryRequest;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.entity.*;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.model.enums.GradeLetter;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.GradeRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.NotificationService;
import com.iit.creditmanagement.service.impl.GradeServiceImpl;
import com.iit.creditmanagement.util.GradeCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GradeServiceTest {

    @Mock private GradeRepository gradeRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private GradeCalculator gradeCalculator;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks
    private GradeServiceImpl gradeService;

    private User teacher;
    private User student;
    private Course course;
    private Semester semester;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        teacher = User.builder()
                .id(5L)
                .name("Dr. Teacher")
                .role(Role.TEACHER)
                .build();

        student = User.builder()
                .id(10L)
                .name("Student User")
                .role(Role.STUDENT)
                .build();

        semester = Semester.builder()
                .id(1L)
                .name(SemesterName.FIRST_SEMESTER)
                .year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .isActive(true)
                .build();

        course = Course.builder()
                .id(101L)
                .code("MITM 303")
                .name("Advanced Computer Networks")
                .teacher(teacher)
                .build();

        enrollment = Enrollment.builder()
                .id(1001L)
                .student(student)
                .course(course)
                .semester(semester)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(gradeCalculator.computeGradeLetter(80.0)).thenReturn(GradeLetter.A_PLUS);
        when(gradeCalculator.isPassing(80.0)).thenReturn(true);
    }

    @Test
    @DisplayName("Should successfully enter grade for enrollment")
    void testEnterOrUpdateGrade_Success() {
        GradeEntryRequest request = new GradeEntryRequest(1001L, BigDecimal.valueOf(35.0), BigDecimal.valueOf(45.0));

        Grade savedGrade = Grade.builder()
                .id(501L)
                .enrollment(enrollment)
                .enteredBy(teacher)
                .midtermMarks(BigDecimal.valueOf(35.0))
                .finalMarks(BigDecimal.valueOf(45.0))
                .gradeLetter(GradeLetter.A_PLUS)
                .gradePoint(BigDecimal.valueOf(4.00))
                .build();

        when(enrollmentRepository.findById(1001L)).thenReturn(Optional.of(enrollment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(teacher));
        when(gradeRepository.findByEnrollmentId(1001L)).thenReturn(Optional.empty());
        when(gradeRepository.save(any(Grade.class))).thenReturn(savedGrade);

        GradeResponse response = gradeService.enterOrUpdateGrade(5L, request);

        assertNotNull(response);
        assertEquals(GradeLetter.A_PLUS, response.gradeLetter());
        assertEquals(BigDecimal.valueOf(4.0), response.gradePoint());
        assertEquals(EnrollmentStatus.COMPLETED, enrollment.getStatus());
        verify(notificationService).sendNotification(eq(student), anyString(), anyString(), eq("GRADE_PUBLISHED"));
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when unassigned teacher tries to grade")
    void testEnterOrUpdateGrade_UnassignedTeacher_ThrowsAccessDenied() {
        User otherTeacher = User.builder().id(99L).name("Other Teacher").role(Role.TEACHER).build();
        GradeEntryRequest request = new GradeEntryRequest(1001L, BigDecimal.valueOf(30.0), BigDecimal.valueOf(40.0));

        when(enrollmentRepository.findById(1001L)).thenReturn(Optional.of(enrollment));
        when(userRepository.findById(99L)).thenReturn(Optional.of(otherTeacher));

        assertThrows(AccessDeniedException.class, () -> gradeService.enterOrUpdateGrade(99L, request));
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when grading a DROPPED enrollment")
    void testEnterOrUpdateGrade_DroppedEnrollment_ThrowsException() {
        enrollment.setStatus(EnrollmentStatus.DROPPED);
        GradeEntryRequest request = new GradeEntryRequest(1001L, BigDecimal.valueOf(30.0), BigDecimal.valueOf(40.0));

        when(enrollmentRepository.findById(1001L)).thenReturn(Optional.of(enrollment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(teacher));

        assertThrows(BusinessRuleException.class, () -> gradeService.enterOrUpdateGrade(5L, request));
    }
}
