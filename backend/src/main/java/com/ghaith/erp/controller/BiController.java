package com.ghaith.erp.controller;

import com.ghaith.erp.model.BiDashboard;
import com.ghaith.erp.service.BiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bi/dashboards")
@RequiredArgsConstructor
public class BiController {

    private final BiService biService;

    @GetMapping
    public ResponseEntity<List<BiDashboard>> getAllDashboards() {
        return ResponseEntity.ok(biService.getAllDashboards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BiDashboard> getDashboardById(@PathVariable Long id) {
        return ResponseEntity.ok(biService.getDashboardById(id));
    }

    @PostMapping
    public ResponseEntity<BiDashboard> createDashboard(@RequestBody BiDashboard dashboard) {
        return ResponseEntity.ok(biService.createDashboard(dashboard));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BiDashboard> updateDashboard(@PathVariable Long id, @RequestBody BiDashboard dashboard) {
        return ResponseEntity.ok(biService.updateDashboard(id, dashboard));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable Long id) {
        biService.deleteDashboard(id);
        return ResponseEntity.ok().build();
    }
}
