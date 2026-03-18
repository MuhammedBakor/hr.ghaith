package com.ghaith.erp.repository;

import com.ghaith.erp.model.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    List<PurchaseRequest> findByCompanyId(Long companyId);
    List<PurchaseRequest> findByCompanyIdAndStatus(Long companyId, String status);
    Optional<PurchaseRequest> findByRequestNumber(String requestNumber);
    List<PurchaseRequest> findByRequestedById(Long employeeId);
}
