package com.ghaith.erp.repository;

import com.ghaith.erp.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByManagerId(Long managerId);

    Optional<Employee> findByEmail(String email);

    List<Employee> findByBranchId(Long branchId);

    List<Employee> findByBranchIdAndDepartmentId(Long branchId, Long departmentId);

    List<Employee> findByDepartmentId(Long departmentId);
}
