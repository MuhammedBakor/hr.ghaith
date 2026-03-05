package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/integration")
@CrossOrigin(origins = "*")
public class IntegrationController {

    @GetMapping("/security-events")
    public ResponseEntity<?> getSecurityEvents() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/security-overview")
    public ResponseEntity<?> getSecurityOverview() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/system-health")
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        return ResponseEntity.ok(response);
    }
}
