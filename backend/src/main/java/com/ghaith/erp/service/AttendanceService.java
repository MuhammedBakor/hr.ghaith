package com.ghaith.erp.service;

import com.ghaith.erp.model.AttendanceRecord;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.AttendanceRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public List<AttendanceRecord> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public List<AttendanceRecord> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<AttendanceRecord> getAttendanceByDateRange(LocalDateTime start, LocalDateTime end) {
        return attendanceRepository.findByDateBetween(start, end);
    }

    public AttendanceRecord checkIn(Map<String, Object> payload) {
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(LocalDateTime.now());
        record.setCheckIn(LocalDateTime.now());
        record.setStatus("present");

        if (payload.containsKey("latitude"))
            record.setCheckInLatitude((Double) payload.get("latitude"));
        if (payload.containsKey("longitude"))
            record.setCheckInLongitude((Double) payload.get("longitude"));

        return attendanceRepository.save(record);
    }

    public AttendanceRecord checkOut(Long id, Map<String, Object> payload) {
        AttendanceRecord record = attendanceRepository.findById(id).orElseThrow();
        record.setCheckOut(LocalDateTime.now());

        if (payload.containsKey("latitude"))
            record.setCheckOutLatitude((Double) payload.get("latitude"));
        if (payload.containsKey("longitude"))
            record.setCheckOutLongitude((Double) payload.get("longitude"));

        // Calculate work hours
        if (record.getCheckIn() != null) {
            long duration = java.time.Duration.between(record.getCheckIn(), record.getCheckOut()).toMinutes();
            record.setWorkHours(duration / 60.0);
        }

        return attendanceRepository.save(record);
    }

    public AttendanceRecord createManual(Map<String, Object> payload) {
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(LocalDateTime.parse(payload.get("date").toString()));
        if (payload.get("checkIn") != null)
            record.setCheckIn(LocalDateTime.parse(payload.get("checkIn").toString()));
        if (payload.get("checkOut") != null)
            record.setCheckOut(LocalDateTime.parse(payload.get("checkOut").toString()));
        record.setNotes((String) payload.get("notes"));
        record.setStatus("pending_approval");
        record.setApprovalStatus("pending");

        return attendanceRepository.save(record);
    }

    public AttendanceRecord checkInWithQR(Map<String, Object> payload, Long userId) {
        // Simple implementation: find employee by userId and check in
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found for user ID: " + userId));

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(LocalDateTime.now());
        record.setCheckIn(LocalDateTime.now());
        record.setStatus("present");
        record.setNotes("Checked in via QR: " + payload.get("qrCode"));

        if (payload.containsKey("latitude"))
            record.setCheckInLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude"))
            record.setCheckInLongitude(((Number) payload.get("longitude")).doubleValue());

        return attendanceRepository.save(record);
    }
}
