package com.iit.creditmanagement.model.dto.request;

public record UserUpdateRequest(
        String name,
        String email,
        String phone,
        String designation,
        String department,
        String rollNumber,
        String registrationNumber,
        Integer batch,
        Boolean isActive
) {}
