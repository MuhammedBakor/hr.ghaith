package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/marketing")
@CrossOrigin(origins = "*")
public class MarketingController {

    @GetMapping("/campaigns")
    public ResponseEntity<?> getCampaigns() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/campaigns")
    public ResponseEntity<?> createCampaign(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/leads")
    public ResponseEntity<?> getLeads() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/leads")
    public ResponseEntity<?> createLead(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }
}
