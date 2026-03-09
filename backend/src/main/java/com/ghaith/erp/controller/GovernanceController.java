package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/governance")
@CrossOrigin(origins = "*")
public class GovernanceController {

    private static final List<Map<String, Object>> accessRestrictions = new CopyOnWriteArrayList<>();
    private static final AtomicLong accessRestrictionIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> businessRules = new CopyOnWriteArrayList<>();
    private static final AtomicLong businessRuleIdCounter = new AtomicLong(1);

    @GetMapping("")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/anomaly-detections")
    public ResponseEntity<?> getAnomalyDetections() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/dual-control-requests")
    public ResponseEntity<?> getDualControlRequests() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/risks")
    public ResponseEntity<?> getRisks() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/risks/stats")
    public ResponseEntity<?> getRiskStats() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/decisions")
    public ResponseEntity<?> getDecisions() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/exceptions")
    public ResponseEntity<?> getExceptions() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ===== Access Restrictions =====

    @GetMapping("/access-restrictions")
    public ResponseEntity<?> getAccessRestrictions() {
        return ResponseEntity.ok(accessRestrictions);
    }

    @PostMapping("/access-restrictions")
    public ResponseEntity<?> createAccessRestriction(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", accessRestrictionIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        accessRestrictions.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/access-restrictions/{id}")
    public ResponseEntity<?> updateAccessRestriction(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> item : accessRestrictions) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                if (body != null) item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/access-restrictions/{id}")
    public ResponseEntity<?> deleteAccessRestriction(@PathVariable Long id) {
        accessRestrictions.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Business Rules =====

    @GetMapping("/business-rules")
    public ResponseEntity<?> getBusinessRules() {
        return ResponseEntity.ok(businessRules);
    }

    @PostMapping("/business-rules")
    public ResponseEntity<?> createBusinessRule(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", businessRuleIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        businessRules.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/business-rules/{id}")
    public ResponseEntity<?> updateBusinessRule(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> item : businessRules) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                if (body != null) item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/business-rules/{id}")
    public ResponseEntity<?> deleteBusinessRule(@PathVariable Long id) {
        businessRules.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
