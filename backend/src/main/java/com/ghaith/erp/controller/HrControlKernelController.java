package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr/control-kernel")
@CrossOrigin(origins = "*")
public class HrControlKernelController {

    @GetMapping("/violations")
    public ResponseEntity<?> getViolations() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/violation-types")
    public ResponseEntity<?> getViolationTypes() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/penalties")
    public ResponseEntity<?> getPenalties() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/penalty-types")
    public ResponseEntity<?> getPenaltyTypes() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/escalation")
    public ResponseEntity<?> escalation(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<?> seedDefaults(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
