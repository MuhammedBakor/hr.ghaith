package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.PenaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr/control-kernel")
@RequiredArgsConstructor
public class HrControlKernelController {

    private final PenaltyService penaltyService;

    @GetMapping("/violation-types")
    public ResponseEntity<List<ViolationType>> getViolationTypes() {
        return ResponseEntity.ok(penaltyService.getAllViolationTypes());
    }

    @GetMapping("/penalty-types")
    public ResponseEntity<List<PenaltyType>> getPenaltyTypes() {
        return ResponseEntity.ok(penaltyService.getAllPenaltyTypes());
    }

    @GetMapping("/escalation")
    public ResponseEntity<List<PenaltyEscalationRule>> getEscalationRules() {
        return ResponseEntity.ok(penaltyService.getAllEscalationRules());
    }

    @PostMapping("/escalation")
    public ResponseEntity<PenaltyEscalationRule> createEscalationRule(@RequestBody Map<String, Object> payload) {
        Long violationTypeId = ((Number) payload.get("violationTypeId")).longValue();
        int occurrenceNumber = ((Number) payload.get("occurrenceNumber")).intValue();
        Long penaltyTypeId = ((Number) payload.get("penaltyTypeId")).longValue();
        int periodMonths = payload.get("periodMonths") != null ? ((Number) payload.get("periodMonths")).intValue() : 12;
        return ResponseEntity.ok(penaltyService.createEscalationRule(violationTypeId, occurrenceNumber, penaltyTypeId, periodMonths));
    }

    @DeleteMapping("/escalation/{id}")
    public ResponseEntity<Map<String, Object>> deleteEscalationRule(@PathVariable Long id) {
        penaltyService.deleteEscalationRule(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<Map<String, Object>> seedDefaults() {
        penaltyService.seedDefaults();
        return ResponseEntity.ok(Map.of("success", true, "message", "تم تهيئة البيانات الافتراضية بنجاح"));
    }

    @GetMapping("/violations")
    public ResponseEntity<List<Object>> getViolations() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/penalties")
    public ResponseEntity<List<Object>> getPenalties() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
