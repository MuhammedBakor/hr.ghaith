package com.ghaith.erp.repository;

import com.ghaith.erp.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    List<Employee> findAllByUserId(Long userId);

    List<Employee> findByManagerId(Long managerId);

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmailIgnoreCase(String email);

    // Branch-scoped lookups for isolation
    Optional<Employee> findByEmailAndBranch_Id(String email, Long branchId);

    Optional<Employee> findByEmailIgnoreCaseAndBranch_Id(String email, Long branchId);

    Optional<Employee> findByUser_IdAndBranch_Id(Long userId, Long branchId);

    List<Employee> findByBranch_Id(Long branchId);

    List<Employee> findByBranch_IdAndDepartment_Id(Long branchId, Long departmentId);

    List<Employee> findByDepartmentId(Long departmentId);
}
