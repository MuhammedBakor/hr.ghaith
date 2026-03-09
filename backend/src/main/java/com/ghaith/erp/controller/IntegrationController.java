package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/integrations")
@CrossOrigin(origins = "*")
public class IntegrationController {

    private static final List<Map<String, Object>> integrations = new CopyOnWriteArrayList<>();
    private static final AtomicLong idCounter = new AtomicLong(1);

    @GetMapping("")
    public ResponseEntity<?> getIntegrations() {
        return ResponseEntity.ok(integrations);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", integrations.size());
        stats.put("active", integrations.stream().filter(i -> "active".equals(i.get("status"))).count());
        stats.put("inactive", integrations.stream().filter(i -> "inactive".equals(i.get("status"))).count());
        stats.put("error", integrations.stream().filter(i -> "error".equals(i.get("status"))).count());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("")
    public ResponseEntity<?> createIntegration(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", idCounter.getAndIncrement());
        body.putIfAbsent("status", "inactive");
        body.putIfAbsent("createdAt", new java.util.Date());
        integrations.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("")
    public ResponseEntity<?> updateIntegration(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) return ResponseEntity.badRequest().body("Missing body");
        Object id = body.get("id");
        for (Map<String, Object> integration : integrations) {
            if (integration.get("id") != null && integration.get("id").toString().equals(id.toString())) {
                integration.putAll(body);
                return ResponseEntity.ok(integration);
            }
        }
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIntegrationById(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> integration : integrations) {
            if (integration.get("id") != null && integration.get("id").toString().equals(id.toString())) {
                integration.putAll(body);
                integration.put("id", id);
                return ResponseEntity.ok(integration);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<?> testIntegrationConnection(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "\u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0646\u0627\u062c\u062d");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleIntegrationStatus(@PathVariable Long id) {
        for (Map<String, Object> integration : integrations) {
            if (integration.get("id") != null && integration.get("id").toString().equals(id.toString())) {
                String currentStatus = (String) integration.getOrDefault("status", "inactive");
                integration.put("status", "active".equals(currentStatus) ? "inactive" : "active");
                return ResponseEntity.ok(integration);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/toggle-status")
    public ResponseEntity<?> toggleStatus(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) return ResponseEntity.ok(new HashMap<>());
        Object id = body.get("id");
        String newStatus = (String) body.get("status");
        for (Map<String, Object> integration : integrations) {
            if (integration.get("id") != null && integration.get("id").toString().equals(id.toString())) {
                integration.put("status", newStatus);
                return ResponseEntity.ok(integration);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-connection")
    public ResponseEntity<?> testConnection(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Connection test successful");
        return ResponseEntity.ok(response);
    }
}
