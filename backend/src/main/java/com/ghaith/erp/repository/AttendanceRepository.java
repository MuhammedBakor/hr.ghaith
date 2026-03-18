package com.ghaith.erp.repository;

import com.ghaith.erp.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEmployee_Id(Long employeeId);

    List<AttendanceRecord> findByDateBetween(LocalDateTime start, LocalDateTime end);

    List<AttendanceRecord> findByEmployee_IdAndDateBetween(Long employeeId, LocalDateTime start, LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AttendanceRecord a WHERE a.employee.department.id = :departmentId")
    List<AttendanceRecord> findByEmployeeDepartmentId(@org.springframework.data.repository.query.Param("departmentId") Long departmentId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AttendanceRecord a WHERE a.employee.department.id = :departmentId AND a.date BETWEEN :start AND :end")
    List<AttendanceRecord> findByEmployeeDepartmentIdAndDateBetween(
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId,
            @org.springframework.data.repository.query.Param("start") LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AttendanceRecord a WHERE a.employee.branch.id = :branchId")
    List<AttendanceRecord> findByEmployeeBranchId(@org.springframework.data.repository.query.Param("branchId") Long branchId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AttendanceRecord a WHERE a.employee.branch.id = :branchId AND a.date BETWEEN :start AND :end")
    List<AttendanceRecord> findByEmployeeBranchIdAndDateBetween(
            @org.springframework.data.repository.query.Param("branchId") Long branchId,
            @org.springframework.data.repository.query.Param("start") LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") LocalDateTime end);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.id = :employeeId AND a.date BETWEEN :start AND :end AND a.checkIn IS NOT NULL")
    Optional<AttendanceRecord> findTodayCheckIn(
            @Param("employeeId") Long employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.employee.department.id = :deptId AND a.date BETWEEN :start AND :end AND a.status NOT IN ('absent')")
    long countPresentByDepartmentAndDate(
            @Param("deptId") Long deptId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.employee.id = :employeeId AND a.date BETWEEN :start AND :end AND a.status = 'absent'")
    long countAbsentByEmployeeAndPeriod(
            @Param("employeeId") Long employeeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
