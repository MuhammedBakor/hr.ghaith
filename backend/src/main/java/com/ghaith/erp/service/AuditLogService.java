package com.ghaith.erp.service;

import com.ghaith.erp.model.AuditLog;
import com.ghaith.erp.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> getLogsByModule(String module) {
        return auditLogRepository.findByModule(module);
    }

    public List<AuditLog> getWorkflowLogs() {
        // Simple logic for now: all logs with a workflow name are workflow logs
        return auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(log -> log.getWorkflowName() != null)
                .toList();
    }

    @Transactional
    public AuditLog createLog(AuditLog log) {
        return auditLogRepository.save(log);
    }
}
