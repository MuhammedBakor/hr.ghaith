package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = "*")
public class UserController {

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/notifications/mark-read")
    public ResponseEntity<?> markNotificationsRead(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", 0);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/kpis")
    public ResponseEntity<?> getKpis() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getActivity() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
