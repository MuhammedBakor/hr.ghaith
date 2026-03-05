package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr")
@CrossOrigin(origins = "*")
public class HrExtendedController {

    @GetMapping("/leave-types")
    public ResponseEntity<?> getLeaveTypes() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/leave-balances")
    public ResponseEntity<?> getLeaveBalances() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/salary-components")
    public ResponseEntity<?> getSalaryComponents() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/approval-chains")
    public ResponseEntity<?> getApprovalChains() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/work-schedules")
    public ResponseEntity<?> getWorkSchedules() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/employee-documents")
    public ResponseEntity<?> getEmployeeDocuments() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/employee-documents")
    public ResponseEntity<?> createEmployeeDocument(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/penalties")
    public ResponseEntity<?> getPenalties() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/penalties")
    public ResponseEntity<?> createPenalty(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }
}
