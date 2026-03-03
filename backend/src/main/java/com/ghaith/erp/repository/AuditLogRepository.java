package com.ghaith.erp.repository;

import com.ghaith.erp.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByModule(String module);

    List<AuditLog> findByWorkflowName(String workflowName);

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
