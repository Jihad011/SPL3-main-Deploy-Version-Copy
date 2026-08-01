package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.RegisterRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;
import com.iit.creditmanagement.model.dto.response.FeeResponse;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Admin service — aggregates system-level operations and reporting.
 * Deliberately thin: delegates heavy lifting to domain services.
 */
public interface AdminService {
    UserResponse             createStudent(RegisterRequest request);
    UserResponse             createTeacher(RegisterRequest request);
    UserResponse             createAdmin(RegisterRequest request);
    Page<UserResponse>       getAllStudents(Pageable pageable);
    Page<UserResponse>       getAllTeachers(Pageable pageable);
    List<UserResponse>       searchStudents(String query);
    UserResponse             getStudentById(Long studentId);
    List<EnrollmentResponse> getStudentEnrollments(Long studentId);
    List<GradeResponse>      getStudentGrades(Long studentId);
    List<FeeResponse>        getStudentFees(Long studentId);
    Map<String, Long>        getSystemStats();
}
