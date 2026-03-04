package com.ghaith.erp.repository;

import com.ghaith.erp.model.InvoiceStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceStatusHistoryRepository extends JpaRepository<InvoiceStatusHistory, Long> {
}
