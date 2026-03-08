package com.ghaith.erp.repository;

import com.ghaith.erp.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

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
}
