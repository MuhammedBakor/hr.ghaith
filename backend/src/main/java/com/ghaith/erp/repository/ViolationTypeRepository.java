package com.ghaith.erp.repository;

import com.ghaith.erp.model.ViolationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ViolationTypeRepository extends JpaRepository<ViolationType, Long> {
    List<ViolationType> findByIsActiveTrue();
}
