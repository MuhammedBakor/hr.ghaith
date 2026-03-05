package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        // Return empty list for now - can be implemented with a Notification entity later
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", 0));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
