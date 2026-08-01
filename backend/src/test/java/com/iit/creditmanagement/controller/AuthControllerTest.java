package com.iit.creditmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iit.creditmanagement.model.dto.request.PublicRegisterRequest;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;



    @Test
    void register_PublicRegistration_ShouldCreateStudent() throws Exception {
        PublicRegisterRequest request = new PublicRegisterRequest(
                "Test Student",
                "test_student@test.com",
                "password123",
                "ROLL123",
                2023,
                null,
                null
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("STUDENT"));

        User savedUser = userRepository.findByEmail("test_student@test.com").orElseThrow();
        assertEquals(Role.STUDENT, savedUser.getRole());
    }

    @Test
    void protectedEndpoint_WithoutAuth_ShouldReturnRFC7807_401() throws Exception {
        mockMvc.perform(get("/admin/stats"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.detail").exists())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path").value("/admin/stats"))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    // A simple test to verify exception masking and correlationId in GlobalExceptionHandler
    // We can simulate an invalid request to trigger a 400 Bad Request
    @Test
    void invalidJson_ShouldReturnSanitizedRFC7807_400() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ invalid json }"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.detail").value("Malformed JSON request or invalid field format."))
                .andExpect(jsonPath("$.errorCode").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path").value("/auth/register"))
                .andExpect(jsonPath("$.correlationId").exists());
    }
}
