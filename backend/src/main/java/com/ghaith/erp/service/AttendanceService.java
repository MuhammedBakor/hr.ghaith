package com.ghaith.erp.service;

import com.ghaith.erp.model.AttendanceRecord;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.AttendanceRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public List<AttendanceRecord> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public List<AttendanceRecord> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<AttendanceRecord> getAttendanceByDate(java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59, 999999999);
        return attendanceRepository.findByDateBetween(startOfDay, endOfDay);
    }

    public List<AttendanceRecord> getAttendanceByDateRange(LocalDateTime start, LocalDateTime end) {
        return attendanceRepository.findByDateBetween(start, end);
    }

    public AttendanceRecord checkIn(Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(LocalDateTime.now());
        record.setCheckIn(LocalDateTime.now());
        record.setStatus("present");

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            record.setCheckInLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            record.setCheckInLongitude(((Number) payload.get("longitude")).doubleValue());

        return attendanceRepository.save(record);
    }

    public AttendanceRecord checkOut(Long id, Map<String, Object> payload) {
        AttendanceRecord record = attendanceRepository.findById(id).orElseThrow();
        record.setCheckOut(LocalDateTime.now());

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            record.setCheckOutLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            record.setCheckOutLongitude(((Number) payload.get("longitude")).doubleValue());

        // Calculate work hours
        if (record.getCheckIn() != null) {
            long duration = java.time.Duration.between(record.getCheckIn(), record.getCheckOut()).toMinutes();
            record.setWorkHours(duration / 60.0);
        }

        return attendanceRepository.save(record);
    }

    public AttendanceRecord createManual(Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);

        String dateStr = payload.get("date").toString();
        record.setDate(parseDateTime(dateStr));

        if (payload.get("checkIn") != null)
            record.setCheckIn(parseDateTime(payload.get("checkIn").toString()));
        if (payload.get("checkOut") != null)
            record.setCheckOut(parseDateTime(payload.get("checkOut").toString()));

        record.setNotes((String) payload.get("notes"));
        record.setStatus("pending_approval");
        record.setApprovalStatus("pending");

        return attendanceRepository.save(record);
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty())
            return null;
        try {
            // Try ISO format with offset/Z (e.g., 2023-10-27T08:00:00.000Z)
            return OffsetDateTime.parse(dateTimeStr).toLocalDateTime();
        } catch (DateTimeParseException e1) {
            try {
                // Try standard ISO LocalDateTime (e.g., 2023-10-27T08:00:00)
                return LocalDateTime.parse(dateTimeStr);
            } catch (DateTimeParseException e2) {
                try {
                    // Try LocalDate only (e.g., 2023-10-27)
                    return java.time.LocalDate.parse(dateTimeStr).atStartOfDay();
                } catch (DateTimeParseException e3) {
                    throw new RuntimeException("Invalid date format: " + dateTimeStr);
                }
            }
        }
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
