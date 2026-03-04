package com.ghaith.erp.controller;

import com.ghaith.erp.model.OperationLimit;
import com.ghaith.erp.service.OperationLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operation-limits")
@RequiredArgsConstructor
public class OperationLimitController {

    private final OperationLimitService service;

    @GetMapping
    public ResponseEntity<List<OperationLimit>> getAllLimits() {
        return ResponseEntity.ok(service.getAllLimits());
    }

    @PostMapping
    public ResponseEntity<OperationLimit> createLimit(@RequestBody OperationLimit limit) {
        return ResponseEntity.ok(service.createLimit(limit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLimit(@PathVariable Long id) {
        service.deleteLimit(id);
        return ResponseEntity.ok().build();
    }
}
