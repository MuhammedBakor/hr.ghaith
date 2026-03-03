package com.ghaith.erp.repository;

import com.ghaith.erp.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEmployeeId(Long employeeId);

    List<AttendanceRecord> findByDateBetween(LocalDateTime start, LocalDateTime end);

    List<AttendanceRecord> findByEmployeeIdAndDateBetween(Long employeeId, LocalDateTime start, LocalDateTime end);
}
