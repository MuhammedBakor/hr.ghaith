package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping("/performance")
    public ResponseEntity<List<PerformanceReview>> getAllReviews() {
        return ResponseEntity.ok(performanceService.getAllReviews());
    }

    @PostMapping("/performance")
    public ResponseEntity<PerformanceReview> createReview(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(performanceService.createReview(payload));
    }

    @DeleteMapping("/performance/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        performanceService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/goals")
    public ResponseEntity<List<PerformanceGoal>> getAllGoals() {
        return ResponseEntity.ok(performanceService.getAllGoals());
    }

    @PostMapping("/goals")
    public ResponseEntity<PerformanceGoal> createGoal(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(performanceService.createGoal(payload));
    }

    @GetMapping("/kpis")
    public ResponseEntity<List<PerformanceKPI>> getAllKPIs() {
        return ResponseEntity.ok(performanceService.getAllKPIs());
    }
}
