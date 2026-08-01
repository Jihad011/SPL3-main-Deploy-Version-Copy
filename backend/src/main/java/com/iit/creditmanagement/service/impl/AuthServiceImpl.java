package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.LoginRequest;
import com.iit.creditmanagement.model.dto.request.PublicRegisterRequest;
import com.iit.creditmanagement.model.dto.response.AuthResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.security.jwt.JwtUtil;
import com.iit.creditmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final AuthenticationManager authManager;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Delegates to Spring Security authentication (throws BadCredentialsException if wrong)
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(user);
        log.info("User logged in: {} [{}]", user.getEmail(), user.getRole());
        return AuthResponse.of(token, user);
    }

    @Override
    @Transactional
    public AuthResponse register(PublicRegisterRequest request) {
        // Validate uniqueness
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email is already registered: " + request.email());
        }
        // Public self-registration always assigns Role.STUDENT
        Role assignedRole = Role.STUDENT;

        if (request.rollNumber() != null
                && userRepository.existsByRollNumber(request.rollNumber())) {
            throw new BusinessRuleException("Roll number already in use: " + request.rollNumber());
        }

        // Validate student-required fields
        if (request.rollNumber() == null || request.rollNumber().isBlank()) {
            throw new BusinessRuleException("Roll number is required for students");
        }
        if (request.batch() == null) {
            throw new BusinessRuleException("Batch year is required for students");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(assignedRole)
                .rollNumber(request.rollNumber())
                .registrationNumber(request.registrationNumber())
                .phone(request.phone())
                .batch(request.batch())
                .build();

        userRepository.save(user);
        log.info("New user registered: {} [{}]", user.getEmail(), user.getRole());

        String token = jwtUtil.generateToken(user);
        return AuthResponse.of(token, user);
    }
}
