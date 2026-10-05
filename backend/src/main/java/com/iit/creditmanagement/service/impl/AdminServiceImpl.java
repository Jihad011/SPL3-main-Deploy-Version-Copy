package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.RegisterRequest;
import com.iit.creditmanagement.model.dto.response.*;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository     userRepository;
    private final EnrollmentService  enrollmentService;
    private final GradeService       gradeService;
    private final FeeService         feeService;
    private final CourseService      courseService;
    private final PasswordEncoder    passwordEncoder;
    private final AuditService       auditService;

    @Override
    @Transactional
    public UserResponse createStudent(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email is already registered: " + request.email());
        }
        if (request.rollNumber() == null || request.rollNumber().isBlank()) {
            throw new BusinessRuleException("Roll number is required for students");
        }
        if (userRepository.existsByRollNumber(request.rollNumber())) {
            throw new BusinessRuleException("Roll number already in use: " + request.rollNumber());
        }
        if (request.registrationNumber() != null && !request.registrationNumber().isBlank()) {
            if (userRepository.existsByRegistrationNumber(request.registrationNumber())) {
                throw new BusinessRuleException("Registration number already in use: " + request.registrationNumber());
            }
        }
        if (request.batch() == null) {
            throw new BusinessRuleException("Batch year is required for students");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.STUDENT)
                .rollNumber(request.rollNumber())
                .registrationNumber(request.registrationNumber())
                .phone(request.phone())
                .batch(request.batch())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        auditService.logAction(savedUser.getId(), "STUDENT_CREATED", "Student", "Registered new student: " + savedUser.getName() + " [" + savedUser.getEmail() + "]");
        log.info("Admin created student: {} [Roll: {}]", savedUser.getEmail(), savedUser.getRollNumber());
        return UserResponse.from(savedUser);
    }

    @Override
    @Transactional
    public UserResponse createTeacher(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email is already registered: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.TEACHER)
                .designation(request.designation())
                .department(request.department())
                .phone(request.phone())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        auditService.logAction(savedUser.getId(), "TEACHER_CREATED", "Teacher", "Registered new faculty member: " + savedUser.getName() + " [" + savedUser.getEmail() + "]");
        log.info("Admin created teacher: {}", savedUser.getEmail());
        return UserResponse.from(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateTeacher(Long teacherId, com.iit.creditmanagement.model.dto.request.UserUpdateRequest request) {
        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
        if (request.name() != null) user.setName(request.name());
        if (request.email() != null) user.setEmail(request.email());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.designation() != null) user.setDesignation(request.designation());
        if (request.department() != null) user.setDepartment(request.department());
        if (request.isActive() != null) user.setActive(request.isActive());
        User savedUser = userRepository.save(user);
        auditService.logAction(savedUser.getId(), "TEACHER_UPDATED", "Teacher", "Updated faculty profile: " + savedUser.getName());
        return UserResponse.from(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateStudent(Long studentId, com.iit.creditmanagement.model.dto.request.UserUpdateRequest request) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        if (request.name() != null) user.setName(request.name());
        if (request.email() != null) user.setEmail(request.email());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.rollNumber() != null) user.setRollNumber(request.rollNumber());
        if (request.registrationNumber() != null) user.setRegistrationNumber(request.registrationNumber());
        if (request.batch() != null) user.setBatch(request.batch());
        if (request.isActive() != null) user.setActive(request.isActive());
        User savedUser = userRepository.save(user);
        auditService.logAction(savedUser.getId(), "STUDENT_UPDATED", "Student", "Updated student profile: " + savedUser.getName());
        return UserResponse.from(savedUser);
    }

    @Override
    @Transactional
    public UserResponse createAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email is already registered: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.ADMIN)
                .phone(request.phone())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        auditService.logAction(savedUser.getId(), "ADMIN_CREATED", "Admin", "Registered new admin account: " + savedUser.getName());
        log.info("Admin created admin: {}", savedUser.getEmail());
        return UserResponse.from(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllStudents(Pageable pageable) {
        return userRepository.findAllByRole(Role.STUDENT, pageable)
                .map(UserResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllTeachers(Pageable pageable) {
        return userRepository.findAllByRole(Role.TEACHER, pageable)
                .map(UserResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchStudents(String query) {
        return userRepository.searchStudents(query)
                .stream().map(UserResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getStudentById(Long studentId) {
        return userRepository.findById(studentId)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        return enrollmentService.getMyEnrollments(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GradeResponse> getStudentGrades(Long studentId) {
        return gradeService.getMyGrades(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeResponse> getStudentFees(Long studentId) {
        return feeService.getFeesByStudent(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getSystemStats() {
        return Map.of(
            "totalStudents", userRepository.countByRole(Role.STUDENT),
            "totalTeachers", userRepository.countByRole(Role.TEACHER),
            "totalCourses",  (long) courseService.getAllActiveCourses().size()
        );
    }
}
