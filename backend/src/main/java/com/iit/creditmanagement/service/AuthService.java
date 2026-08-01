package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.LoginRequest;
import com.iit.creditmanagement.model.dto.request.PublicRegisterRequest;
import com.iit.creditmanagement.model.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(PublicRegisterRequest request);
}
