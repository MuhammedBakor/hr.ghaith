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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
        }
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
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
    public ResponseEntity<Map<String, Object>> requestEarlyLeave(@RequestBody Map<String, Object> payload) {
        // Stub implementation - can be expanded later
        return ResponseEntity.ok(Map.of("success", true, "message", "تم تقديم طلب المغادرة المبكرة"));
    }
}
