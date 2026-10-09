package com.iit.creditmanagement.unit.service;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.model.dto.request.LoginRequest;
import com.iit.creditmanagement.model.dto.request.PublicRegisterRequest;
import com.iit.creditmanagement.model.dto.response.AuthResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.security.jwt.JwtUtil;
import com.iit.creditmanagement.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock private UserRepository       userRepository;
    @Mock private PasswordEncoder      passwordEncoder;
    @Mock private JwtUtil              jwtUtil;
    @Mock private AuthenticationManager authManager;

    @InjectMocks private AuthServiceImpl authService;

    private User testStudent;

    @BeforeEach
    void setUp() {
        testStudent = User.builder()
                .id(1L)
                .name("Md. Jihad Hossain")
                .email("jihad@iit.du.ac.bd")
                .passwordHash("$2a$12$encodedPassword")
                .role(Role.STUDENT)
                .rollNumber("1413")
                .registrationNumber("REG-2021-1413")
                .build();
    }

    @Test
    @DisplayName("Login with valid credentials returns AuthResponse with token")
    void loginSuccess() {
        when(userRepository.findByEmail("jihad@iit.du.ac.bd"))
                .thenReturn(Optional.of(testStudent));
        when(jwtUtil.generateToken(testStudent)).thenReturn("mock.jwt.token");

        AuthResponse response = authService.login(
                new LoginRequest("jihad@iit.du.ac.bd", "Password@123"));

        assertThat(response.token()).isEqualTo("mock.jwt.token");
        assertThat(response.role()).isEqualTo(Role.STUDENT);
        assertThat(response.email()).isEqualTo("jihad@iit.du.ac.bd");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        verify(authManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Login with wrong password throws BadCredentialsException")
    void loginWrongPassword() {
        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("jihad@iit.du.ac.bd", "wrongpass")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Register new student succeeds and returns token")
    void registerStudentSuccess() {
        var request = new PublicRegisterRequest(
                "New Student", "newstudent@iit.du.ac.bd", "Password@123",
                "1414", 2021, "REG-2021-1414", "01700000001");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByRollNumber(request.rollNumber())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenReturn(testStudent);
        when(jwtUtil.generateToken(any())).thenReturn("new.jwt.token");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("new.jwt.token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register with duplicate email throws BusinessRuleException")
    void registerDuplicateEmail() {
        var request = new PublicRegisterRequest(
                "Duplicate", "jihad@iit.du.ac.bd", "Password@123",
                "9999", 2021, null, null);

        when(userRepository.existsByEmail("jihad@iit.du.ac.bd")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("Register student without roll number throws BusinessRuleException")
    void registerStudentWithoutRollNumber() {
        var request = new PublicRegisterRequest(
                "No Roll", "noroll@iit.du.ac.bd", "Password@123",
                null, 2021, null, null);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Roll number is required");
    }
}
