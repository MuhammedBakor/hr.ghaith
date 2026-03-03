package com.ghaith.erp.controller;

import com.ghaith.erp.model.AuditLog;
import com.ghaith.erp.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/workflow")
    public ResponseEntity<List<AuditLog>> getWorkflowLogs() {
        return ResponseEntity.ok(auditLogService.getWorkflowLogs());
    }

    @PostMapping
    public ResponseEntity<AuditLog> createLog(@RequestBody AuditLog log) {
        return ResponseEntity.ok(auditLogService.createLog(log));
    }
}
