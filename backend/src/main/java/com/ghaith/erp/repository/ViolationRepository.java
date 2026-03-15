package com.ghaith.erp.repository;

import com.ghaith.erp.model.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByEmployee_Id(Long employeeId);
    List<Violation> findBySentByUserId(Long sentByUserId);
}
