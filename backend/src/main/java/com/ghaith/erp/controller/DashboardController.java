package com.ghaith.erp.controller;

import com.ghaith.erp.dto.dashboard.*;
import com.ghaith.erp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/pending-actions")
    public ResponseEntity<PendingActionsDto> getPendingActions() {
        return ResponseEntity.ok(dashboardService.getPendingActions());
    }

    @GetMapping("/kpi-summary")
    public ResponseEntity<KpiSummaryDto> getKpiSummary() {
        return ResponseEntity.ok(dashboardService.getKpiSummary());
    }

    @GetMapping("/search")
    public ResponseEntity<List<QuickSearchResultDto>> search(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(dashboardService.search(query));
    }
}
