package com.ghaith.erp.repository;

import com.ghaith.erp.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    java.util.Optional<Department> findByCode(String code);

    java.util.List<Department> findAllByBranchId(Long branchId);

    java.util.List<Department> findAllByBranchIdOrBranchIdIsNull(Long branchId);

    java.util.List<Department> findAllByCodeIn(java.util.List<String> codes);
}
