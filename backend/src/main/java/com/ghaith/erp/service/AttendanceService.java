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

    public List<AttendanceRecord> getAllAttendance(Long branchId) {
        if (branchId != null) {
            return attendanceRepository.findByEmployeeBranchId(branchId);
        }
        return attendanceRepository.findAll();
    }

    public List<AttendanceRecord> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployee_Id(employeeId);
    }

    public List<AttendanceRecord> getAttendanceByDate(java.time.LocalDate date, Long branchId) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59, 999999999);
        if (branchId != null) {
            return attendanceRepository.findByEmployeeBranchIdAndDateBetween(branchId, startOfDay, endOfDay);
        }
        return attendanceRepository.findByDateBetween(startOfDay, endOfDay);
    }

    public List<AttendanceRecord> getAttendanceByDateRange(LocalDateTime start, LocalDateTime end) {
        return attendanceRepository.findByDateBetween(start, end);
    }

    public List<AttendanceRecord> getAttendanceByMonth(int year, int month, Long branchId) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime end = start.plusMonths(1).minusSeconds(1);
        if (branchId != null) {
            return attendanceRepository.findByEmployeeBranchIdAndDateBetween(branchId, start, end);
        }
        return attendanceRepository.findByDateBetween(start, end);
    }

    public List<AttendanceRecord> getAttendanceByDepartment(Long departmentId) {
        return attendanceRepository.findByEmployeeDepartmentId(departmentId);
    }

    public List<AttendanceRecord> getAttendanceByDepartmentAndDate(Long departmentId, java.time.LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59, 999999999);
        return attendanceRepository.findByEmployeeDepartmentIdAndDateBetween(departmentId, startOfDay, endOfDay);
    }

    public AttendanceRecord checkIn(Map<String, Object> payload) {
        Object empIdObj = payload.get("employeeId");
        if (empIdObj == null) {
            throw new RuntimeException("لم يتم تحديد الموظف. تأكد من وجود سجل موظف مرتبط بحسابك.");
        }
        Long employeeId = ((Number) empIdObj).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(now);
        record.setCheckIn(now);
        record.setStatus("checked_in");
        record.setWorkHours(0.0);

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            record.setCheckInLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            record.setCheckInLongitude(((Number) payload.get("longitude")).doubleValue());

        return attendanceRepository.save(record);
    }

    public AttendanceRecord checkOut(Long id, Map<String, Object> payload) {
        AttendanceRecord record = attendanceRepository.findById(id).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        record.setCheckOut(now);
        record.setStatus("present"); // checked out normally

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            record.setCheckOutLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            record.setCheckOutLongitude(((Number) payload.get("longitude")).doubleValue());

        // Calculate work hours
        if (record.getCheckIn() != null) {
            long durationMinutes = java.time.Duration.between(record.getCheckIn(), now).toMinutes();
            double hours = durationMinutes / 60.0;
            record.setWorkHours(Math.round(hours * 10.0) / 10.0); // round to 1 decimal
        } else {
            record.setWorkHours(0.0);
        }

        return attendanceRepository.save(record);
    }

    public AttendanceRecord createManual(Map<String, Object> payload) {
        Object empIdObj = payload.get("employeeId");
        if (empIdObj == null) {
            throw new RuntimeException("لم يتم تحديد الموظف");
        }
        Long employeeId = ((Number) empIdObj).longValue();
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

    public AttendanceRecord requestEarlyLeave(Map<String, Object> payload) {
        String reason = (String) payload.getOrDefault("reason", "");
        java.time.LocalDate today = java.time.LocalDate.now();
        List<AttendanceRecord> todayRecords = getAttendanceByDate(today, null);

        Object empIdObj = payload.get("employeeId");
        if (empIdObj != null) {
            Long employeeId = ((Number) empIdObj).longValue();
            AttendanceRecord found = todayRecords.stream()
                    .filter(r -> r.getEmployee() != null && r.getEmployee().getId().equals(employeeId))
                    .findFirst()
                    .orElse(null);

            if (found != null) {
                // Mark as pending early leave approval
                found.setStatus("pending_early_leave");
                found.setApprovalStatus("pending");
                found.setNotes(reason);
                return attendanceRepository.save(found);
            }
        }
        return null;
    }

    public AttendanceRecord approveEarlyLeave(Long recordId) {
        AttendanceRecord record = attendanceRepository.findById(recordId).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        record.setStatus("early_leave");
        record.setApprovalStatus("approved");
        record.setCheckOut(now);
        if (record.getCheckIn() != null) {
            long durationMinutes = java.time.Duration.between(record.getCheckIn(), now).toMinutes();
            record.setWorkHours(Math.round(durationMinutes / 60.0 * 10.0) / 10.0);
        }
        return attendanceRepository.save(record);
    }

    public AttendanceRecord rejectEarlyLeave(Long recordId) {
        AttendanceRecord record = attendanceRepository.findById(recordId).orElseThrow();
        record.setStatus("checked_in"); // revert to checked_in
        record.setApprovalStatus("rejected");
        return attendanceRepository.save(record);
    }

    public AttendanceRecord approveAttendance(Long recordId) {
        AttendanceRecord record = attendanceRepository.findById(recordId).orElseThrow();
        record.setApprovalStatus("approved");
        record.setStatus("present");
        if (record.getCheckIn() != null && record.getCheckOut() != null) {
            long durationMinutes = java.time.Duration.between(record.getCheckIn(), record.getCheckOut()).toMinutes();
            record.setWorkHours(Math.round(durationMinutes / 60.0 * 10.0) / 10.0);
        }
        return attendanceRepository.save(record);
    }

    public AttendanceRecord rejectAttendance(Long recordId) {
        AttendanceRecord record = attendanceRepository.findById(recordId).orElseThrow();
        record.setApprovalStatus("rejected");
        record.setStatus("rejected");
        return attendanceRepository.save(record);
    }

    public AttendanceRecord checkInWithQR(Map<String, Object> payload, Long userId) {
        // Simple implementation: find employee by userId and check in
        Employee employee = employeeRepository.findAllByUserId(userId).stream()
                .findFirst()
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
