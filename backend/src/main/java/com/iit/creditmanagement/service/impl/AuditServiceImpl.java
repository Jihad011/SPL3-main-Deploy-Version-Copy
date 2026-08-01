package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.model.entity.AuditLog;
import com.iit.creditmanagement.repository.AuditLogRepository;
import com.iit.creditmanagement.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.iit.creditmanagement.model.dto.response.AuditLogResponse;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long userId, String actionType, String entityTarget, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .actionType(actionType)
                    .entityTarget(entityTarget)
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
            // Intentionally not throwing so we don't break main business logic on audit failure
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getRecentLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(log -> {
                    String userName = "System";
                    if (log.getUserId() != null) {
                        userName = userRepository.findById(log.getUserId())
                                .map(User::getName)
                                .orElse("Unknown User");
                    }
                    return AuditLogResponse.builder()
                            .id(log.getId())
                            .userId(log.getUserId())
                            .userName(userName)
                            .actionType(log.getActionType())
                            .entityTarget(log.getEntityTarget())
                            .details(log.getDetails())
                            .createdAt(log.getCreatedAt())
                            .build();
                });
    }
}
