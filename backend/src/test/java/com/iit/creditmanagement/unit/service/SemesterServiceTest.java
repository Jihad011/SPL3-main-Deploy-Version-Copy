package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.SemesterRequest;
import com.iit.creditmanagement.model.dto.response.SemesterResponse;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.impl.SemesterServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SemesterServiceTest {

    @Mock private SemesterRepository semesterRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private SemesterServiceImpl semesterService;

    private Semester spring2026;

    @BeforeEach
    void setUp() {
        spring2026 = Semester.builder()
                .id(1L)
                .name(SemesterName.FIRST_SEMESTER)
                .year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully create a semester")
    void testCreateSemester_Success() {
        SemesterRequest request = new SemesterRequest(
                SemesterName.FIRST_SEMESTER, 2026,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30),
                false
        );

        when(semesterRepository.findAll()).thenReturn(List.of());
        when(semesterRepository.save(any(Semester.class))).thenReturn(spring2026);

        SemesterResponse response = semesterService.createSemester(request);

        assertNotNull(response);
        assertEquals(2026, response.year());
        assertEquals(SemesterName.FIRST_SEMESTER, response.name());
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when end date is before start date")
    void testCreateSemester_InvalidDates_ThrowsException() {
        SemesterRequest request = new SemesterRequest(
                SemesterName.FIRST_SEMESTER, 2026,
                LocalDate.of(2026, 6, 30), LocalDate.of(2026, 1, 1),
                false
        );

        assertThrows(BusinessRuleException.class, () -> semesterService.createSemester(request));
    }

    @Test
    @DisplayName("Should successfully activate a semester")
    void testActivateSemester_Success() {
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(spring2026));
        when(semesterRepository.save(any(Semester.class))).thenReturn(spring2026);

        SemesterResponse response = semesterService.activateSemester(1L);

        assertNotNull(response);
        assertTrue(response.isActive());
    }

    @Test
    @DisplayName("Should successfully get active semester")
    void testGetActiveSemester_Success() {
        when(semesterRepository.findActiveSemester()).thenReturn(Optional.of(spring2026));

        SemesterResponse response = semesterService.getActiveSemester();

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertTrue(response.isActive());
    }
}
