package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;

public record UserResponse(
        Long   id,
        String name,
        String email,
        Role   role,
        String rollNumber,
        String registrationNumber,
        String phone,
        Integer batch,
        String designation,
        String department,
        boolean isActive
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole(),
                u.getRollNumber(),
                u.getRegistrationNumber(),
                u.getPhone(),
                u.getBatch(),
                u.getDesignation(),
                u.getDepartment(),
                u.isActive()
        );
    }
}
