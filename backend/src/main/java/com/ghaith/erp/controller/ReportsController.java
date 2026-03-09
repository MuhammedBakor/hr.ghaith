package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/reports")
@CrossOrigin(origins = "*")
public class ReportsController {

    private static final List<Map<String, Object>> customReports = new CopyOnWriteArrayList<>();
    private static final AtomicLong customReportIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> scheduledReports = new CopyOnWriteArrayList<>();
    private static final AtomicLong scheduledReportIdCounter = new AtomicLong(1);

    // ===== Custom Reports =====

    @GetMapping("/custom")
    public ResponseEntity<?> getCustomReports() {
        return ResponseEntity.ok(customReports);
    }

    @PostMapping("/custom")
    public ResponseEntity<?> createCustomReport(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", customReportIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        customReports.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/custom/{id}")
    public ResponseEntity<?> updateCustomReport(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> report : customReports) {
            if (report.get("id") != null && report.get("id").toString().equals(id.toString())) {
                report.putAll(body);
                report.put("id", id);
                return ResponseEntity.ok(report);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/custom/{id}")
    public ResponseEntity<?> deleteCustomReport(@PathVariable Long id) {
        customReports.removeIf(r -> r.get("id") != null && r.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/custom/{id}/run")
    public ResponseEntity<?> runCustomReport(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        result.put("reportId", id);
        result.put("executedAt", new java.util.Date());
        result.put("status", "completed");

        List<Map<String, Object>> data = new ArrayList<>();
        Map<String, Object> row1 = new HashMap<>();
        row1.put("label", "Category A");
        row1.put("value", 120);
        data.add(row1);
        Map<String, Object> row2 = new HashMap<>();
        row2.put("label", "Category B");
        row2.put("value", 85);
        data.add(row2);
        Map<String, Object> row3 = new HashMap<>();
        row3.put("label", "Category C");
        row3.put("value", 200);
        data.add(row3);

        result.put("data", data);

        // Include report metadata if it exists
        for (Map<String, Object> report : customReports) {
            if (report.get("id") != null && report.get("id").toString().equals(id.toString())) {
                result.put("reportName", report.get("name"));
                break;
            }
        }

        return ResponseEntity.ok(result);
    }

    // ===== Scheduled Reports =====

    @GetMapping("/scheduled")
    public ResponseEntity<?> getScheduledReports() {
        return ResponseEntity.ok(scheduledReports);
    }

    @PostMapping("/scheduled")
    public ResponseEntity<?> createScheduledReport(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", scheduledReportIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        body.putIfAbsent("nextRunAt", new java.util.Date());
        scheduledReports.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/scheduled/{id}")
    public ResponseEntity<?> updateScheduledReport(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> report : scheduledReports) {
            if (report.get("id") != null && report.get("id").toString().equals(id.toString())) {
                report.putAll(body);
                report.put("id", id);
                return ResponseEntity.ok(report);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/scheduled/{id}")
    public ResponseEntity<?> deleteScheduledReport(@PathVariable Long id) {
        scheduledReports.removeIf(r -> r.get("id") != null && r.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
