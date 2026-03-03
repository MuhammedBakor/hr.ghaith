package com.ghaith.erp.controller;

import com.ghaith.erp.model.AttendancePolicy;
import com.ghaith.erp.service.AttendancePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hr/attendance-policies")
@RequiredArgsConstructor
public class AttendancePolicyController {
    private final AttendancePolicyService policyService;

    @GetMapping
    public ResponseEntity<List<AttendancePolicy>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendancePolicy> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @PostMapping
    public ResponseEntity<AttendancePolicy> createPolicy(@RequestBody AttendancePolicy policy) {
        return ResponseEntity.ok(policyService.createPolicy(policy));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AttendancePolicy> updatePolicy(@PathVariable Long id, @RequestBody AttendancePolicy policy) {
        return ResponseEntity.ok(policyService.updatePolicy(id, policy));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(@PathVariable Long id) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<Void> seedDefaults() {
        policyService.seedDefaults();
        return ResponseEntity.ok().build();
    }
}
