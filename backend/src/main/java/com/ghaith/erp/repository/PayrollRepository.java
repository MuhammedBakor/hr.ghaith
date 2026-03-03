package com.ghaith.erp.repository;

import com.ghaith.erp.model.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PayrollRepository extends JpaRepository<PayrollRecord, Long> {
    List<PayrollRecord> findByEmployeeId(Long employeeId);

    List<PayrollRecord> findByMonthAndYear(String month, Integer year);
}
