package com.ghaith.erp.repository;

import com.ghaith.erp.model.FieldTrackingPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FieldTrackingPointRepository extends JpaRepository<FieldTrackingPoint, Long> {
    List<FieldTrackingPoint> findBySessionId(Long sessionId);
}
