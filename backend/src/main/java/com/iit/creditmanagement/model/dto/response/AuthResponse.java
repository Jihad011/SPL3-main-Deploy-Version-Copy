package com.iit.creditmanagement.model.dto.response;

import com.iit.creditmanagement.model.enums.Role;

/**
 * Auth response returned on successful login or registration.
 * Contains the JWT token and essential user info for the Angular client
 * to bootstrap the session without an extra /me API call.
 */
public record AuthResponse(
        String token,
        String tokenType,   // always "Bearer"
        Long   userId,
        String name,
        String email,
        Role   role,
        String rollNumber,
        String registrationNumber,
        Long   studentId,
        Long   teacherId,
        Long   adminId
) {
    /** Factory for cleaner construction. */
    public static AuthResponse of(String token, com.iit.creditmanagement.model.entity.User user) {
        Long sId = user.getRole() == Role.STUDENT ? user.getId() : null;
        Long tId = user.getRole() == Role.TEACHER ? user.getId() : null;
        Long aId = user.getRole() == Role.ADMIN   ? user.getId() : null;
        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getRollNumber(),
                user.getRegistrationNumber(),
                sId,
                tId,
                aId
        );
    }
}
