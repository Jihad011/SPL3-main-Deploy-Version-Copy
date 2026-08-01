package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.response.NotificationResponse;
import com.iit.creditmanagement.model.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

public interface NotificationService {

    void sendNotification(User user, String title, String message, String type);

    void sendNotification(Long userId, String title, String message, String type);

    List<NotificationResponse> getMyNotifications(Long userId, int limit);

    long getUnreadCount(Long userId);

    void markAllAsRead(Long userId);
}
