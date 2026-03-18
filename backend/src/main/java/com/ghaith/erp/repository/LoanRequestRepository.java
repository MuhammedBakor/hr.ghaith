package com.ghaith.erp.repository;

import com.ghaith.erp.model.LoanRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoanRequestRepository extends JpaRepository<LoanRequest, Long> {
    List<LoanRequest> findByEmployee_Id(Long employeeId);
    List<LoanRequest> findByEmployee_IdAndStatus(Long employeeId, String status);
}
