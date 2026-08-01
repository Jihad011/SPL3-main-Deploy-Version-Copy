package com.iit.creditmanagement.model.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AuditLogResponse(
        Long id,
        Long userId,
        String userName,
        String actionType,
        String entityTarget,
        String details,
        LocalDateTime createdAt
) {}
