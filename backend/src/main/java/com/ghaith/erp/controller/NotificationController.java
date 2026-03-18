package com.ghaith.erp.controller;

import com.ghaith.erp.model.Notification;
import com.ghaith.erp.model.User;
import com.ghaith.erp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "20") int limit) {
        if (currentUser == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Notification> notifications = notificationService.getNotificationsByUser(currentUser.getId());
        return ResponseEntity.ok(notifications.stream().limit(limit).toList());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
