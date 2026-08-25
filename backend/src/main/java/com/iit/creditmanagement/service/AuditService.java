package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditService {
    void logAction(Long userId, String actionType, String entityTarget, String details);
    Page<AuditLogResponse> getRecentLogs(Pageable pageable);
}
