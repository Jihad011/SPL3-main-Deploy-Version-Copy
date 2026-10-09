package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.CourseRequest;
import com.iit.creditmanagement.model.dto.response.CourseResponse;
import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.CourseType;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.NotificationService;
import com.iit.creditmanagement.service.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private SemesterRepository semesterRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private AuditService auditService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private CourseServiceImpl courseService;

    private Course course;
    private User teacher;

    @BeforeEach
    void setUp() {
        teacher = User.builder()
                .id(5L)
                .name("Dr. Teacher")
                .email("teacher@iit.du.ac.bd")
                .role(Role.TEACHER)
                .build();

        course = Course.builder()
                .id(101L)
                .code("MITM 303")
                .name("Advanced Computer Networks")
                .creditHours(3)
                .courseType(CourseType.CORE)
                .maxSeats(40)
                .currentEnrollment(10)
                .teacher(teacher)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully create course with teacher assignment")
    void testCreateCourse_Success() {
        CourseRequest request = new CourseRequest(
                "MITM 303", "Advanced Computer Networks", "Network Architecture",
                "http://example.com/syllabus.pdf", "syllabus.pdf", 3,
                CourseType.CORE, 1, "SOFTWARE_ENGINEERING", 40, 5L
        );

        when(courseRepository.findByCode("MITM 303")).thenReturn(Optional.empty());
        when(userRepository.findById(5L)).thenReturn(Optional.of(teacher));
        when(courseRepository.save(any(Course.class))).thenReturn(course);

        CourseResponse response = courseService.createCourse(request);

        assertNotNull(response);
        assertEquals("MITM 303", response.code());
        assertEquals(40, response.maxSeats());
        verify(notificationService).sendNotification(eq(teacher), anyString(), anyString(), eq("COURSE_ASSIGNED"));
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when creating course with existing code")
    void testCreateCourse_DuplicateCode_ThrowsException() {
        CourseRequest request = new CourseRequest(
                "MITM 303", "Advanced Computer Networks", "Network Architecture",
                null, null, 3, CourseType.CORE, 1, "SOFTWARE_ENGINEERING", 40, null
        );

        when(courseRepository.findByCode("MITM 303")).thenReturn(Optional.of(course));

        assertThrows(BusinessRuleException.class, () -> courseService.createCourse(request));
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when updating maxSeats below current enrollment count")
    void testUpdateCourse_MaxSeatsBelowEnrollment_ThrowsException() {
        CourseRequest request = new CourseRequest(
                "MITM 303", "Advanced Computer Networks", "Network Architecture",
                null, null, 3, CourseType.CORE, 1, "SOFTWARE_ENGINEERING", 5, null
        );

        when(courseRepository.findById(101L)).thenReturn(Optional.of(course));

        assertThrows(BusinessRuleException.class, () -> courseService.updateCourse(101L, request));
    }

    @Test
    @DisplayName("Should get course by ID successfully")
    void testGetCourseById_Success() {
        when(courseRepository.findById(101L)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.getCourseById(101L);

        assertNotNull(response);
        assertEquals(101L, response.id());
        assertEquals("MITM 303", response.code());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when course ID is invalid")
    void testGetCourseById_NotFound_ThrowsException() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> courseService.getCourseById(999L));
    }

    @Test
    @DisplayName("Should successfully deactivate course")
    void testDeactivateCourse_Success() {
        when(courseRepository.findById(101L)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.deactivateCourse(101L);

        assertNotNull(response);
        assertFalse(response.isActive());
        verify(auditService).logAction(isNull(), eq("COURSE_DEACTIVATED"), eq("Course"), anyString());
    }
}
