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
        RegisterRequest req = new RegisterRequest("Test Student", "test_student_created@test.com", "password123", Role.STUDENT, "TEST1234", "TESTREG34", "1234567890", 2026, null, null);
        UserResponse response = adminService.createStudent(req);
        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals("test_student_created@test.com", response.email());
    }

    @Test
    public void testCreateTeacher() {
        RegisterRequest req = new RegisterRequest("Dr. Test Teacher", "test_teacher_created@test.com", "password123", null, null, null, "1234567890", null, "Professor", "Software Engineering");
        UserResponse response = adminService.createTeacher(req);
        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals("test_teacher_created@test.com", response.email());
        assertEquals("Professor", response.designation());
    }

    @Test
    public void testUpdateTeacher() {
        RegisterRequest req = new RegisterRequest("Teacher To Update", "teacher_update@test.com", "password123", Role.TEACHER, null, null, "01700000000", null, "Lecturer", "Computer Science");
        UserResponse created = adminService.createTeacher(req);

        com.iit.creditmanagement.model.dto.request.UserUpdateRequest updateReq =
                new com.iit.creditmanagement.model.dto.request.UserUpdateRequest(
                        "Dr. Updated Teacher",
                        "teacher_updated@test.com",
                        "01711111111",
                        "Associate Professor",
                        "Information Technology",
                        null, null, null, true
                );

        UserResponse updated = adminService.updateTeacher(created.id(), updateReq);
        assertNotNull(updated);
        assertEquals("Dr. Updated Teacher", updated.name());
        assertEquals("teacher_updated@test.com", updated.email());
        assertEquals("Associate Professor", updated.designation());
        assertEquals("Information Technology", updated.department());
    }

    @Test
    public void testUpdateStudent() {
        RegisterRequest req = new RegisterRequest("Student To Update", "student_update@test.com", "password123", Role.STUDENT, "ROLL999", "REG999", "01700000000", 2024, null, null);
        UserResponse created = adminService.createStudent(req);

        com.iit.creditmanagement.model.dto.request.UserUpdateRequest updateReq =
                new com.iit.creditmanagement.model.dto.request.UserUpdateRequest(
                        "Updated Student Name",
                        "student_updated@test.com",
                        "01888888888",
                        null, null,
                        "ROLL999_NEW", "REG999_NEW", 2025, true
                );

        UserResponse updated = adminService.updateStudent(created.id(), updateReq);
        assertNotNull(updated);
        assertEquals("Updated Student Name", updated.name());
        assertEquals("student_updated@test.com", updated.email());
        assertEquals("ROLL999_NEW", updated.rollNumber());
        assertEquals(2025, updated.batch());
    }
}
