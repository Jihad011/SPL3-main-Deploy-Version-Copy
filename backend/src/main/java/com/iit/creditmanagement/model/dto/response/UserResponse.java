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
        boolean isActive,
        Long   studentId,
        Long   teacherId,
        Long   adminId
) {
    public static UserResponse from(User u) {
        Long sId = u.getRole() == Role.STUDENT ? u.getId() : null;
        Long tId = u.getRole() == Role.TEACHER ? u.getId() : null;
        Long aId = u.getRole() == Role.ADMIN   ? u.getId() : null;
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
                u.isActive(),
                sId,
                tId,
                aId
        );
    }
}
