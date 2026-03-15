package com.ghaith.erp.repository;

import com.ghaith.erp.model.PayrollDeduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollDeductionRepository extends JpaRepository<PayrollDeduction, Long> {
    List<PayrollDeduction> findByPayrollRecord_Id(Long payrollRecordId);
    void deleteByPayrollRecord_Id(Long payrollRecordId);
}
