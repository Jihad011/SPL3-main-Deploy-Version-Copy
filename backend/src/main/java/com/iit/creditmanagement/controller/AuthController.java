package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.LoginRequest;
import com.iit.creditmanagement.model.dto.request.PublicRegisterRequest;
import com.iit.creditmanagement.model.dto.response.AuthResponse;
import com.iit.creditmanagement.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.iit.creditmanagement.service.RateLimiterService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and registration endpoints")
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;

    @Value("${app.jwt.expiration-ms:86400000}")
    private int jwtExpirationMs;

    private void addJwtCookie(HttpServletResponse response, String token) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // set to true in production with HTTPS
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearJwtCookie(HttpServletResponse response) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", description = "Returns a JWT token on success")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        String ip = httpServletRequest.getRemoteAddr();
        Bucket bucket = rateLimiterService.resolveBucket(ip);
        if (bucket.tryConsume(1)) {
            AuthResponse authResponse = authService.login(request);
            addJwtCookie(httpServletResponse, authResponse.token());
            return ResponseEntity.ok(authResponse);
        }
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user (student, teacher, or admin)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody PublicRegisterRequest request, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        String ip = httpServletRequest.getRemoteAddr();
        Bucket bucket = rateLimiterService.resolveBucket(ip);
        if (bucket.tryConsume(1)) {
            AuthResponse authResponse = authService.register(request);
            addJwtCookie(httpServletResponse, authResponse.token());
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
        }
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Clears the JWT cookie")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearJwtCookie(response);
        return ResponseEntity.ok().build();
    }
}
