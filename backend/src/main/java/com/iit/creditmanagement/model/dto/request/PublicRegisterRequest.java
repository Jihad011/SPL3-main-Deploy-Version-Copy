package com.iit.creditmanagement.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Public registration request for students only.
 * Omits privileged roles and teacher-specific fields.
 */
public record PublicRegisterRequest(

        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @NotBlank(message = "Roll number is required for students")
        String rollNumber,

        @NotNull(message = "Batch year is required for students")
        Integer batch,

        String registrationNumber,
        
        String phone
) {}
