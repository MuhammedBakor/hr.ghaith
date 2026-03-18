package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ViolationRepository violationRepository;
    private final PenaltyService penaltyService;
    private final NotificationService notificationService;

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

    /**
     * Full 17-step check-in chain per HR requirements.
     */
    @Transactional
    public AttendanceRecord checkIn(Map<String, Object> payload) {
        // Step 1 — Resolve employee
        Object empIdObj = payload.get("employeeId");
        if (empIdObj == null) {
            throw new RuntimeException("لم يتم تحديد الموظف. تأكد من وجود سجل موظف مرتبط بحسابك.");
        }
        Long employeeId = ((Number) empIdObj).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        // Step 2 — Use server time
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // Step 3 — Duplicate check (prevent double check-in same day)
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59, 999999999);
        Optional<AttendanceRecord> existing = attendanceRepository.findTodayCheckIn(employeeId, startOfDay, endOfDay);
        if (existing.isPresent()) {
            throw new RuntimeException("تم تسجيل الحضور مسبقاً اليوم");
        }

        // Step 4 — Fetch employee shift
        Shift shift = employee.getShift();

        // Step 5 — Check workday (if shift defined and workDays configured)
        if (shift != null && shift.getWorkDays() != null && !shift.getWorkDays().isEmpty()) {
            String todayName = today.getDayOfWeek().name().toLowerCase();
            // workDays may use Arabic day names or English; do a case-insensitive contains check on English
            boolean isWorkday = shift.getWorkDays().stream()
                    .anyMatch(d -> d.equalsIgnoreCase(todayName) || d.equalsIgnoreCase(today.getDayOfWeek().toString()));
            if (!isWorkday) {
                throw new RuntimeException("اليوم ليس يوم عمل وفق جدول المناوبة");
            }
        }

        // Step 6 — Check active leave
        long activeLeaves = leaveRequestRepository.countActiveLeaveForEmployee(employeeId, today);
        if (activeLeaves > 0) {
            throw new RuntimeException("الموظف في إجازة مؤكدة، لا يمكن تسجيل الحضور");
        }

        // Step 7 — Calculate lateMinutes
        int lateMinutes = 0;
        if (shift != null && shift.getStartTime() != null && !shift.getStartTime().isBlank()) {
            try {
                LocalTime shiftStart = LocalTime.parse(shift.getStartTime());
                int graceMinutes = shift.getGraceMinutesBefore() != null ? shift.getGraceMinutesBefore() : 0;
                LocalTime allowedStart = shiftStart.plusMinutes(graceMinutes);
                LocalTime actualCheckIn = now.toLocalTime();
                if (actualCheckIn.isAfter(allowedStart)) {
                    lateMinutes = (int) java.time.Duration.between(shiftStart, actualCheckIn).toMinutes();
                    lateMinutes = Math.max(0, lateMinutes - graceMinutes);
                }
            } catch (Exception e) {
                log.warn("Could not parse shift start time '{}' for employee {}", shift.getStartTime(), employeeId);
            }
        }

        // Step 8 — Haversine geofence check
        boolean outsideGeofence = false;
        Double checkInLat = null;
        Double checkInLon = null;
        if (payload.containsKey("latitude") && payload.get("latitude") != null) {
            checkInLat = ((Number) payload.get("latitude")).doubleValue();
        }
        if (payload.containsKey("longitude") && payload.get("longitude") != null) {
            checkInLon = ((Number) payload.get("longitude")).doubleValue();
        }
        if (checkInLat != null && checkInLon != null && employee.getBranch() != null) {
            HrBranch branch = employee.getBranch();
            if (branch.getLatitude() != null && branch.getLongitude() != null
                    && Boolean.TRUE.equals(branch.getGeoFenceEnabled())) {
                double distanceMeters = haversineMeters(checkInLat, checkInLon,
                        branch.getLatitude().doubleValue(), branch.getLongitude().doubleValue());
                // Prefer policy radius, fall back to branch.geoRadius (default 100m)
                int allowedRadius = branch.getGeoRadius() != null ? branch.getGeoRadius() : 100;
                if (shift != null && shift.getPolicy() != null && shift.getPolicy().getAllowedLocationRadius() != null) {
                    allowedRadius = shift.getPolicy().getAllowedLocationRadius();
                }
                outsideGeofence = distanceMeters > allowedRadius;
            }
        }

        // Step 9 — Build and save attendance record
        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setDate(now);
        record.setCheckIn(now);
        record.setLateMinutes(lateMinutes > 0 ? lateMinutes : null);
        record.setOutsideGeofence(outsideGeofence ? true : null);

        if (checkInLat != null) record.setCheckInLatitude(checkInLat);
        if (checkInLon != null) record.setCheckInLongitude(checkInLon);

        // Determine status
        if (lateMinutes > 0) {
            record.setStatus("late");
        } else {
            record.setStatus("checked_in");
        }
        record.setWorkHours(0.0);

        AttendanceRecord saved = attendanceRepository.save(record);

        // Step 10 — Auto-violation if geofence violated and policy requires it
        if (outsideGeofence) {
            log.info("Employee {} checked in outside geofence ({} meters from branch)", employeeId, "unknown");
            // Notify manager of geofence breach
            notifyManagerOfGeofence(employee, saved);
        }

        // Steps 11-15 — Lateness violation chain
        if (lateMinutes > 0) {
            int lateThreshold = 0;
            if (shift != null && shift.getPolicy() != null && shift.getPolicy().getLateThresholdMinutes() != null) {
                lateThreshold = shift.getPolicy().getLateThresholdMinutes();
            }

            if (lateMinutes > lateThreshold) {
                triggerLatenessViolationChain(employee, lateMinutes, saved, today);
            }
        }

        // Step 16 — Notify employee (confirmation)
        if (employee.getUser() != null) {
            notificationService.createNotification(
                    employee.getUser().getId(),
                    "تم تسجيل حضورك",
                    "تم تسجيل حضورك بنجاح في " + now.toLocalTime().toString().substring(0, 5)
                            + (lateMinutes > 0 ? " (متأخر " + lateMinutes + " دقيقة)" : ""),
                    "attendance",
                    saved.getId(),
                    "AttendanceRecord");
        }

        // Step 17 — Notify manager if late
        if (lateMinutes > 0) {
            notifyManagerOfLateness(employee, lateMinutes, saved);
        }

        return saved;
    }

    /**
     * Triggers the full lateness violation → penalty ladder → deduction chain.
     */
    private void triggerLatenessViolationChain(Employee employee, int lateMinutes, AttendanceRecord record, LocalDate today) {
        try {
            // Create auto violation
            Violation violation = Violation.builder()
                    .employee(employee)
                    .violationType("تأخر")
                    .description("تأخر تلقائي - " + lateMinutes + " دقيقة في " + today)
                    .violationDate(today)
                    .status("sent")
                    .sentByName("النظام")
                    .sentByRole("SYSTEM")
                    .source("auto")
                    .build();
            violation = violationRepository.save(violation);

            // Apply penalty ladder
            penaltyService.applyLatenessViolation(employee, lateMinutes, violation);

            log.info("Lateness violation chain triggered for employee {} — {} minutes late", employee.getId(), lateMinutes);
        } catch (Exception e) {
            log.error("Failed to trigger lateness violation chain for employee {}: {}", employee.getId(), e.getMessage());
        }
    }

    private void notifyManagerOfLateness(Employee employee, int lateMinutes, AttendanceRecord record) {
        Employee manager = employee.getManager();
        if (manager != null && manager.getUser() != null) {
            String empName = employee.getFirstName() + " " + employee.getLastName();
            notificationService.createNotification(
                    manager.getUser().getId(),
                    "تأخر موظف",
                    "الموظف " + empName + " تأخر " + lateMinutes + " دقيقة اليوم",
                    "attendance_late",
                    record.getId(),
                    "AttendanceRecord");
        }
    }

    private void notifyManagerOfGeofence(Employee employee, AttendanceRecord record) {
        Employee manager = employee.getManager();
        if (manager != null && manager.getUser() != null) {
            String empName = employee.getFirstName() + " " + employee.getLastName();
            notificationService.createNotification(
                    manager.getUser().getId(),
                    "تسجيل حضور خارج النطاق الجغرافي",
                    "الموظف " + empName + " سجل حضوره خارج نطاق الفرع المحدد",
                    "attendance_geofence",
                    record.getId(),
                    "AttendanceRecord");
        }
    }

    /**
     * Haversine formula to calculate distance in meters between two GPS coordinates.
     */
    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public AttendanceRecord checkOut(Long id, Map<String, Object> payload) {
        AttendanceRecord record = attendanceRepository.findById(id).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        record.setCheckOut(now);
        record.setStatus("present");

        if (payload.containsKey("latitude") && payload.get("latitude") != null)
            record.setCheckOutLatitude(((Number) payload.get("latitude")).doubleValue());
        if (payload.containsKey("longitude") && payload.get("longitude") != null)
            record.setCheckOutLongitude(((Number) payload.get("longitude")).doubleValue());

        if (record.getCheckIn() != null) {
            long durationMinutes = java.time.Duration.between(record.getCheckIn(), now).toMinutes();
            double hours = durationMinutes / 60.0;
            record.setWorkHours(Math.round(hours * 10.0) / 10.0);
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

        if (record.getCheckIn() != null && record.getCheckOut() != null) {
            long durationMinutes = java.time.Duration.between(record.getCheckIn(), record.getCheckOut()).toMinutes();
            record.setWorkHours(Math.round(durationMinutes / 60.0 * 10.0) / 10.0);
        }

        return attendanceRepository.save(record);
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty())
            return null;
        try {
            return OffsetDateTime.parse(dateTimeStr).toLocalDateTime();
        } catch (DateTimeParseException e1) {
            try {
                return LocalDateTime.parse(dateTimeStr);
            } catch (DateTimeParseException e2) {
                try {
                    return LocalDate.parse(dateTimeStr).atStartOfDay();
                } catch (DateTimeParseException e3) {
                    throw new RuntimeException("Invalid date format: " + dateTimeStr);
                }
            }
        }
    }

    public AttendanceRecord requestEarlyLeave(Map<String, Object> payload) {
        String reason = (String) payload.getOrDefault("reason", "");
        LocalDate today = LocalDate.now();
        List<AttendanceRecord> todayRecords = getAttendanceByDate(today, null);

        Object empIdObj = payload.get("employeeId");
        if (empIdObj != null) {
            Long employeeId = ((Number) empIdObj).longValue();
            AttendanceRecord found = todayRecords.stream()
                    .filter(r -> r.getEmployee() != null && r.getEmployee().getId().equals(employeeId))
                    .findFirst()
                    .orElse(null);

            if (found != null) {
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
        record.setStatus("checked_in");
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

    public void deleteAllAttendance(Long branchId) {
        if (branchId != null) {
            List<AttendanceRecord> records = attendanceRepository.findByEmployeeBranchId(branchId);
            attendanceRepository.deleteAll(records);
        } else {
            attendanceRepository.deleteAll();
        }
    }

    public AttendanceRecord checkInWithQR(Map<String, Object> payload, Long userId) {
        Employee employee = employeeRepository.findAllByUserId(userId).stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Employee not found for user ID: " + userId));

        // Reuse the main checkIn logic by building a payload map
        payload.put("employeeId", employee.getId());
        return checkIn(payload);
    }
}
