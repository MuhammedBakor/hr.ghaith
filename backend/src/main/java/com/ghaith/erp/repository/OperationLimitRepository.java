package com.ghaith.erp.repository;

import com.ghaith.erp.model.OperationLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationLimitRepository extends JpaRepository<OperationLimit, Long> {
    List<OperationLimit> findByModuleAndAction(String module, String action);
}
