package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/inbox")
@CrossOrigin(origins = "*")
public class InboxController {

    @GetMapping("")
    public ResponseEntity<?> getInbox() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> getTasks() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> response = new HashMap<>();
        response.put("pending", 0);
        response.put("approved", 0);
        response.put("rejected", 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/approve")
    public ResponseEntity<?> approve(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reject")
    public ResponseEntity<?> reject(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
