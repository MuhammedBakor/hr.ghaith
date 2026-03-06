package com.ghaith.erp.repository;

import com.ghaith.erp.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    java.util.Optional<Department> findByCode(String code);
}
