package com.ghaith.erp.repository;

import com.ghaith.erp.model.FieldTrackingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FieldTrackingSessionRepository extends JpaRepository<FieldTrackingSession, Long> {
    List<FieldTrackingSession> findByEmployeeId(Long employeeId);

    List<FieldTrackingSession> findByStatus(String status);
}
