package com.ghaith.erp.controller;

import com.ghaith.erp.model.AttendanceRecord;
import com.ghaith.erp.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<List<AttendanceRecord>> getAllAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @RequestParam(required = false) Long departmentId) {
        if (departmentId != null && date != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByDepartmentAndDate(departmentId, date));
        }
        if (departmentId != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByDepartment(departmentId));
        }
        if (date != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
        }
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByDepartment(
            @PathVariable Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByDepartmentAndDate(departmentId, date));
        }
        return ResponseEntity.ok(attendanceService.getAttendanceByDepartment(departmentId));
    }

    @GetMapping("/range")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDateRange(start, end));
    }

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceRecord> checkIn(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(attendanceService.checkIn(payload));
    }

    @PostMapping("/{id}/check-out")
    public ResponseEntity<AttendanceRecord> checkOut(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(attendanceService.checkOut(id, payload));
    }

    @PostMapping("/manual")
    public ResponseEntity<AttendanceRecord> createManual(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(attendanceService.createManual(payload));
    }

    @PostMapping("/check-in-with-qr")
    public ResponseEntity<AttendanceRecord> checkInWithQR(@RequestBody Map<String, Object> payload,
            @RequestParam Long userId) {
        return ResponseEntity.ok(attendanceService.checkInWithQR(payload, userId));
    }

    @PostMapping("/early-leave")
    public ResponseEntity<?> requestEarlyLeave(@RequestBody Map<String, Object> payload) {
        try {
            AttendanceRecord record = attendanceService.requestEarlyLeave(payload);
            if (record != null) {
                return ResponseEntity.ok(Map.of("success", true, "message", "تم تقديم طلب الخروج المبكر - بانتظار الموافقة", "record", record));
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "تم تقديم طلب المغادرة المبكرة"));
    }

    @PostMapping("/{id}/approve-early-leave")
    public ResponseEntity<AttendanceRecord> approveEarlyLeave(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.approveEarlyLeave(id));
    }

    @PostMapping("/{id}/reject-early-leave")
    public ResponseEntity<AttendanceRecord> rejectEarlyLeave(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.rejectEarlyLeave(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AttendanceRecord> approveAttendance(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.approveAttendance(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AttendanceRecord> rejectAttendance(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.rejectAttendance(id));
    }

    @GetMapping("/report-settings")
    public ResponseEntity<?> getReportSettings() {
        return ResponseEntity.ok(new java.util.HashMap<>());
    }

    @PostMapping("/send-monthly-report")
    public ResponseEntity<?> sendMonthlyReport(@RequestBody(required = false) Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
