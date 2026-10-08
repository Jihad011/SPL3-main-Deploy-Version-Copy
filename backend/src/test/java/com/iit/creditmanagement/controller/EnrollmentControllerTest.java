package com.iit.creditmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.GlobalExceptionHandler;
import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.security.jwt.JwtUtil;
import com.iit.creditmanagement.service.EnrollmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EnrollmentController.class)
@Import({GlobalExceptionHandler.class, EnrollmentControllerTest.TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("EnrollmentController Integration Tests (MockMvc)")
class EnrollmentControllerTest {

    @Autowired private MockMvc       mockMvc;
    @Autowired private ObjectMapper  objectMapper;

    @MockBean  private EnrollmentService enrollmentService;
    @MockBean  private JwtUtil           jwtUtil;
    @MockBean  private com.iit.creditmanagement.security.service.UserDetailsServiceImpl userDetailsService;

    @org.springframework.boot.test.context.TestConfiguration
    @org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
    static class TestSecurityConfig {
    }

    private EnrollmentResponse sampleResponse;
    private User studentUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        studentUser = User.builder().id(1L).email("jihad@iit.du.ac.bd").role(Role.STUDENT).build();
        adminUser = User.builder().id(2L).email("admin@iit.du.ac.bd").role(Role.ADMIN).build();

        sampleResponse = new EnrollmentResponse(
                100L, 1L, "Jihad", "1413",
                10L, "MITM 303", "Advanced Computer Networks & Internetworking", 3,
                1L, "1st Year 1st Semester (2026)",
                EnrollmentStatus.ACTIVE, false, null, null,
                OffsetDateTime.now()
        );
    }

    @Test
    @DisplayName("POST /enrollments — enroll succeeds → 201 Created")
    void enrollSucceeds() throws Exception {
        when(enrollmentService.enroll(any(), any(EnrollRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/enrollments")
                        .with(csrf())
                        .with(user(studentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollRequest(10L, 1L, false))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseCode").value("MITM 303"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /enrollments — credit limit exceeded → 422 Unprocessable")
    void enrollCreditLimitExceeded() throws Exception {
        when(enrollmentService.enroll(any(), any(EnrollRequest.class)))
                .thenThrow(new BusinessRuleException("Credit limit exceeded"));

        mockMvc.perform(post("/enrollments")
                        .with(csrf())
                        .with(user(studentUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollRequest(10L, 1L, false))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("Credit limit exceeded"));
    }

    @Test
    @DisplayName("POST /enrollments — admin role → 403 Forbidden")
    void enrollForbiddenForAdmin() throws Exception {
        mockMvc.perform(post("/enrollments")
                        .with(csrf())
                        .with(user(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollRequest(10L, 1L, false))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /enrollments/my — returns student's enrollment list")
    void getMyEnrollments() throws Exception {
        when(enrollmentService.getMyEnrollments(any()))
                .thenReturn(java.util.List.of(sampleResponse));

        mockMvc.perform(get("/enrollments/my").with(user(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].courseCode").value("MITM 303"));
    }

    @Test
    @DisplayName("PATCH /enrollments/{id}/drop — drops active enrollment")
    void dropEnrollment() throws Exception {
        EnrollmentResponse dropped = new EnrollmentResponse(
                100L, 1L, "Jihad", "1413",
                10L, "MITM 303", "Advanced Computer Networks & Internetworking", 3,
                1L, "1st Year 1st Semester (2026)",
                EnrollmentStatus.DROPPED, false, null, null,
                OffsetDateTime.now()
        );
        when(enrollmentService.dropCourse(eq(100L), any())).thenReturn(dropped);

        mockMvc.perform(patch("/enrollments/100/drop").with(csrf()).with(user(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DROPPED"));
    }
}
