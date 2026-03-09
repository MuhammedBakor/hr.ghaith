package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/marketing")
@CrossOrigin(origins = "*")
public class MarketingController {

    private static final List<Map<String, Object>> campaigns = new CopyOnWriteArrayList<>();
    private static final AtomicLong campaignIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> leads = new CopyOnWriteArrayList<>();
    private static final AtomicLong leadIdCounter = new AtomicLong(1);

    @GetMapping("/campaigns")
    public ResponseEntity<?> getCampaigns() {
        return ResponseEntity.ok(campaigns);
    }

    @PostMapping("/campaigns")
    public ResponseEntity<?> createCampaign(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", campaignIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        campaigns.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/campaigns/{id}")
    public ResponseEntity<?> updateCampaign(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : campaigns) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/campaigns/{id}")
    public ResponseEntity<?> deleteCampaign(@PathVariable Long id) {
        campaigns.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leads")
    public ResponseEntity<?> getLeads() {
        return ResponseEntity.ok(leads);
    }

    @PostMapping("/leads")
    public ResponseEntity<?> createLead(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", leadIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        leads.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/leads/{id}")
    public ResponseEntity<?> updateLead(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : leads) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/leads/{id}")
    public ResponseEntity<?> deleteLead(@PathVariable Long id) {
        leads.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
