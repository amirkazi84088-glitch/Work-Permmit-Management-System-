package com.wpms.controller;

import com.wpms.dto.NotificationResponseDTO;
import com.wpms.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponseDTO> getRecentNotifications(Authentication authentication) {
        return notificationService.getRecentNotifications(authentication.getName());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        Map<String, Long> response = new LinkedHashMap<>();
        response.put("unreadCount", notificationService.getUnreadCount(authentication.getName()));
        return response;
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long notificationId, Authentication authentication) {
        notificationService.markRead(notificationId, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
