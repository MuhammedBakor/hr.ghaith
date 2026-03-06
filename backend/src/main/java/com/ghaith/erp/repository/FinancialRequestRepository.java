package com.ghaith.erp.repository;

import com.ghaith.erp.model.FinancialRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FinancialRequestRepository extends JpaRepository<FinancialRequest, Long> {
    List<FinancialRequest> findByRequesterId(Long requesterId);
}
