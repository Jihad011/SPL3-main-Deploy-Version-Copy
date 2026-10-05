package com.iit.creditmanagement.model.dto.request;

import com.iit.creditmanagement.model.enums.Role;
import jakarta.validation.constraints.*;

/**
 * User registration request.
 * All role-specific fields are optional — validated at service layer based on role.
 */
public record RegisterRequest(

        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        Role role,

        // Student fields
        String rollNumber,
        String registrationNumber,
        String phone,
        Integer batch,

        // Teacher fields
        String designation,
        String department
) {}
