package com.ghaith.erp.repository;

import com.ghaith.erp.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    List<Employee> findByUserId(Long userId);

    List<Employee> findByManagerId(Long managerId);

    Optional<Employee> findByEmail(String email);

    // Branch-scoped lookups for isolation
    Optional<Employee> findByEmailAndBranchId(String email, Long branchId);

    Optional<Employee> findByUserIdAndBranchId(Long userId, Long branchId);

    List<Employee> findByBranchId(Long branchId);

    List<Employee> findByBranchIdAndDepartmentId(Long branchId, Long departmentId);

    List<Employee> findByDepartmentId(Long departmentId);
}
