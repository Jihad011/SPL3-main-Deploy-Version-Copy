package com.iit.creditmanagement;

import com.iit.creditmanagement.model.dto.request.RegisterRequest;
import com.iit.creditmanagement.model.dto.response.UserResponse;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminServiceTest {

    @Autowired
    private AdminService adminService;

    @Test
    public void testCreateStudent() {
        RegisterRequest req = new RegisterRequest("Test User", "test_admin_created@test.com", "password123", Role.STUDENT, "TEST1234", "TESTREG34", "123", 2026, null, null);
        UserResponse response = adminService.createStudent(req);
        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals("test_admin_created@test.com", response.email());
    }
}
