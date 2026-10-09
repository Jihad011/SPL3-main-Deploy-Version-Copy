package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.model.dto.response.StudentHistoryResponse;
import com.iit.creditmanagement.model.entity.*;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.model.enums.GradeLetter;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.*;
import com.iit.creditmanagement.service.GradeService;
import com.iit.creditmanagement.service.impl.StudentHistoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentHistoryServiceTest {

    @Mock private UserRepository       userRepository;
    @Mock private SemesterRepository   semesterRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private GradeRepository      gradeRepository;
    @Mock private FeeRepository        feeRepository;
    @Mock private GradeService         gradeService;

    @InjectMocks
    private StudentHistoryServiceImpl studentHistoryService;

    private User student;
    private Semester spring2025;
    private Semester fall2025;
    private Semester spring2026;
    private Course course1;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(10L)
                .name("Arefin Shuvo")
                .email("bsse0204@iit.du.ac.bd")
                .role(Role.STUDENT)
                .rollNumber("BSSE0204")
                .registrationNumber("REG-2024-0204")
                .batch(2)
                .build();

        spring2025 = Semester.builder()
                .id(1L)
                .name(SemesterName.FIRST_SEMESTER)
                .year(2025)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 6, 30))
                .isActive(false)
                .build();

        fall2025 = Semester.builder()
                .id(2L)
                .name(SemesterName.SECOND_SEMESTER)
                .year(2025)
                .startDate(LocalDate.of(2025, 7, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .isActive(false)
                .build();

        spring2026 = Semester.builder()
                .id(3L)
                .name(SemesterName.THIRD_SEMESTER)
                .year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .isActive(true)
                .build();

        course1 = Course.builder()
                .id(100L)
                .code("MITM 303")
                .name("Advanced Computer Networks & Internetworking")
                .creditHours(3)
                .build();
    }

    @Test
    @DisplayName("Should detect gap semester and compute SGPA/CGPA properly")
    void testGetStudentHistoryWithGapSemester() {
        Enrollment e1 = Enrollment.builder()
                .id(1001L)
                .student(student)
                .course(course1)
                .semester(spring2025)
                .status(EnrollmentStatus.COMPLETED)
                .build();

        Enrollment e2 = Enrollment.builder()
                .id(1002L)
                .student(student)
                .course(course1)
                .semester(spring2026)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        Grade g1 = Grade.builder()
                .id(501L)
                .enrollment(e1)
                .midtermMarks(BigDecimal.valueOf(35))
                .finalMarks(BigDecimal.valueOf(45))
                .gradeLetter(GradeLetter.A_PLUS)
                .gradePoint(BigDecimal.valueOf(4.00))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(student));
        when(semesterRepository.findActiveSemester()).thenReturn(Optional.of(spring2026));
        when(semesterRepository.findAll(any(Sort.class))).thenReturn(List.of(spring2025, fall2025, spring2026));
        when(enrollmentRepository.findAllByStudentId(10L)).thenReturn(List.of(e1, e2));
        when(gradeRepository.findByEnrollmentId(1001L)).thenReturn(Optional.of(g1));
        when(gradeRepository.findByEnrollmentId(1002L)).thenReturn(Optional.empty());
        when(gradeService.getStudentCgpa(10L)).thenReturn(BigDecimal.valueOf(4.00));
        when(feeRepository.totalUnpaidByStudent(10L)).thenReturn(BigDecimal.ZERO);
        when(feeRepository.totalPaidByStudent(10L)).thenReturn(BigDecimal.valueOf(10000));
        when(feeRepository.totalGapFinesByStudent(10L)).thenReturn(BigDecimal.valueOf(10000));

        StudentHistoryResponse response = studentHistoryService.getStudentHistoryById(10L);

        assertNotNull(response);
        assertEquals("Arefin Shuvo", response.studentName());
        assertEquals("26T0204", response.currentSemesterRollId());
        assertEquals(3, response.semesters().size());

        // Spring 2025 (FIRST_SEMESTER) -> Roll: 25F0204
        assertEquals("25F0204", response.semesters().get(0).semesterRollId());
        assertFalse(response.semesters().get(0).isGap());
        assertEquals(BigDecimal.valueOf(4.0).setScale(2), response.semesters().get(0).sgpa());
        assertEquals(BigDecimal.valueOf(4.0).setScale(2), response.semesters().get(0).cgpa());

        // Fall 2025 (SECOND_SEMESTER, Gap semester!) -> Roll: 25S0204, isGap: true
        assertEquals("25S0204", response.semesters().get(1).semesterRollId());
        assertTrue(response.semesters().get(1).isGap());
        assertEquals(BigDecimal.valueOf(10000.0), response.semesters().get(1).gapFineAmount());

        // Spring 2026 (THIRD_SEMESTER) -> Roll: 26T0204
        assertEquals("26T0204", response.semesters().get(2).semesterRollId());
        assertFalse(response.semesters().get(2).isGap());

        assertEquals(1, response.totalGapSemesters());
    }
}
