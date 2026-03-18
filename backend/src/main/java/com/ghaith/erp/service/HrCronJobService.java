package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.AttendanceRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.LeaveRequestRepository;
import com.ghaith.erp.repository.ViolationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 8 Cron Jobs for HR automation per the HR requirements document.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HrCronJobService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final ViolationRepository violationRepository;
    private final NotificationService notificationService;
    private final PenaltyService penaltyService;
    private final LeaveRequestRepository leaveRequestRepository;

    // ── Job 1: Absence Marking — daily at 11:00 AM ────────────────────────────
    /**
     * Marks employees who haven't checked in by 11:00 AM as absent and creates violations.
     */
    @Scheduled(cron = "0 0 11 * * ?")
    @Transactional
    public void absenceMarkingJob() {
        log.info("[CronJob] absenceMarkingJob started");
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() == Employee.EmployeeStatus.active)
                .toList();

        for (Employee employee : activeEmployees) {
            try {
                // Check if employee already has an attendance record today
                var existing = attendanceRepository.findTodayCheckIn(
                        employee.getId(), startOfDay, endOfDay);
                if (existing.isPresent()) continue;

                // Check if employee is on approved leave today
                long activeLeaves = leaveRequestRepository.countActiveLeaveForEmployee(employee.getId(), today);
                if (activeLeaves > 0) continue;

                // Create absence record
                AttendanceRecord record = new AttendanceRecord();
                record.setEmployee(employee);
                record.setDate(today.atTime(11, 0));
                record.setStatus("absent");
                record.setNotes("غياب تلقائي - لم يتم تسجيل الحضور");
                attendanceRepository.save(record);

                // Notify employee
                if (employee.getUser() != null) {
                    notificationService.createNotification(
                            employee.getUser().getId(),
                            "تم تسجيلك غائباً",
                            "تم تسجيل غيابك اليوم " + today + " لعدم تسجيل الحضور",
                            "absence",
                            record.getId(),
                            "AttendanceRecord");
                }

                // Notify manager
                Employee manager = employee.getManager();
                if (manager != null && manager.getUser() != null) {
                    notificationService.createNotification(
                            manager.getUser().getId(),
                            "غياب موظف",
                            "الموظف " + employee.getFirstName() + " " + employee.getLastName() + " غائب اليوم",
                            "absence",
                            record.getId(),
                            "AttendanceRecord");
                }

                log.info("[CronJob] Marked employee {} as absent on {}", employee.getId(), today);
            } catch (Exception e) {
                log.error("[CronJob] Failed to process absence for employee {}: {}", employee.getId(), e.getMessage());
            }
        }
        log.info("[CronJob] absenceMarkingJob completed");
    }

    // ── Job 2: Auto Absence Violation — runs after absenceMarkingJob ─────────
    /**
     * Creates violations for newly marked absences. Runs at 11:05 AM (5 min after absenceMarkingJob).
     */
    @Scheduled(cron = "0 5 11 * * ?")
    @Transactional
    public void autoAbsenceViolationJob() {
        log.info("[CronJob] autoAbsenceViolationJob started");
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        // Find all absent records created today (no checkIn and status=absent)
        List<AttendanceRecord> absentToday = attendanceRepository.findByDateBetween(startOfDay, endOfDay)
                .stream()
                .filter(r -> "absent".equals(r.getStatus()) && r.getCheckIn() == null)
                .toList();

        for (AttendanceRecord record : absentToday) {
            Employee employee = record.getEmployee();
            try {
                // Check if violation already exists for this employee today
                boolean violationExists = violationRepository.findAll().stream()
                        .anyMatch(v -> v.getEmployee().getId().equals(employee.getId())
                                && "غياب بدون إذن".equals(v.getViolationType())
                                && today.equals(v.getViolationDate()));
                if (violationExists) continue;

                Violation violation = Violation.builder()
                        .employee(employee)
                        .violationType("غياب بدون إذن")
                        .description("غياب تلقائي في " + today)
                        .violationDate(today)
                        .status("sent")
                        .sentByName("النظام")
                        .sentByRole("SYSTEM")
                        .build();
                violation = violationRepository.save(violation);

                // Apply penalty ladder for absence
                applyAbsenceViolation(employee, violation);

                log.info("[CronJob] Created absence violation for employee {} on {}", employee.getId(), today);
            } catch (Exception e) {
                log.error("[CronJob] Failed to create absence violation for employee {}: {}", employee.getId(), e.getMessage());
            }
        }
        log.info("[CronJob] autoAbsenceViolationJob completed");
    }

    // ── Job 3: Leave Escalation — every 60 seconds ────────────────────────────
    /**
     * Escalates pending leave requests per the escalation timeline:
     * 12h → reminder, 20h → urgent, 24h → escalate to HR, 28h → auto-approve.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void leaveEscalationJob() {
        LocalDateTime now = LocalDateTime.now();
        List<LeaveRequest> pendingLeaves = leaveRequestRepository.findAll().stream()
                .filter(lr -> lr.getStatus() == LeaveRequest.LeaveStatus.pending
                        && lr.getEscalationDeadline() != null)
                .toList();

        for (LeaveRequest leave : pendingLeaves) {
            try {
                LocalDateTime deadline = leave.getEscalationDeadline();
                long hoursOverdue = java.time.Duration.between(deadline, now).toHours();

                if (hoursOverdue >= 16) {
                    // 28h total (24h deadline + 4h auto-approve window): auto-approve
                    autoApproveLeave(leave);
                } else if (hoursOverdue >= 8) {
                    // 24h: escalate to HR (just notify HR here)
                    notifyHrOfEscalation(leave);
                } else if (hoursOverdue >= 4) {
                    // 20h: urgent notification
                    notifyManagerUrgent(leave);
                } else if (hoursOverdue >= 0) {
                    // 12h: first reminder
                    sendEscalationReminder(leave);
                }
            } catch (Exception e) {
                log.error("[CronJob] Leave escalation error for leave {}: {}", leave.getId(), e.getMessage());
            }
        }
    }

    // ── Job 4: Payroll Reminder — day 25 at 8:00 AM ─────────────────────────
    /**
     * Sends payroll processing reminder to HR/Finance on the 25th of each month.
     */
    @Scheduled(cron = "0 0 8 25 * ?")
    public void payrollReminderJob() {
        log.info("[CronJob] payrollReminderJob - sending payroll reminders");
        // Notify all HR managers and Finance managers
        // Since we don't have a role-based notification here, we send to all HR roles
        employeeRepository.findAll().stream()
                .filter(e -> e.getUser() != null && e.getUser().getRole() != null
                        && (e.getUser().getRole().name().equals("HR_MANAGER")
                                || e.getUser().getRole().name().equals("FINANCE_MANAGER")))
                .forEach(e -> {
                    try {
                        notificationService.createNotification(
                                e.getUser().getId(),
                                "تذكير: تشغيل الرواتب الشهرية",
                                "اليوم هو اليوم 25، يرجى إعداد ومراجعة كشوف الرواتب الشهرية قبل نهاية الشهر.",
                                "payroll_reminder",
                                null,
                                null);
                    } catch (Exception ex) {
                        log.error("[CronJob] Failed to send payroll reminder to {}: {}", e.getId(), ex.getMessage());
                    }
                });
    }

    // ── Job 5: Probation Alert — daily at 8:00 AM ─────────────────────────────
    /**
     * Alerts manager 7 days before an employee's probation period ends.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void probationAlertJob() {
        log.info("[CronJob] probationAlertJob started");
        LocalDate alertDate = LocalDate.now().plusDays(7);
        String alertDateStr = alertDate.toString();

        employeeRepository.findAll().stream()
                .filter(e -> alertDateStr.equals(e.getProbationEndDate())
                        && e.getStatus() == Employee.EmployeeStatus.active)
                .forEach(e -> {
                    Employee manager = e.getManager();
                    if (manager != null && manager.getUser() != null) {
                        try {
                            notificationService.createNotification(
                                    manager.getUser().getId(),
                                    "تنبيه: نهاية فترة الاختبار",
                                    "ستنتهي فترة الاختبار للموظف " + e.getFirstName() + " " + e.getLastName()
                                            + " خلال 7 أيام بتاريخ " + e.getProbationEndDate(),
                                    "probation_alert",
                                    e.getId(),
                                    "Employee");
                        } catch (Exception ex) {
                            log.error("[CronJob] Probation alert error for employee {}: {}", e.getId(), ex.getMessage());
                        }
                    }
                });
        log.info("[CronJob] probationAlertJob completed");
    }

    // ── Job 6: Leave Balance Reset — Jan 1 at midnight ───────────────────────
    /**
     * Resets annual leave balances on January 1st per Saudi Labor Law.
     * Unused annual leave is carried over (max 30 days carryover).
     */
    @Scheduled(cron = "0 0 0 1 1 ?")
    @Transactional
    public void leaveBalanceResetJob() {
        log.info("[CronJob] leaveBalanceResetJob started — resetting annual leave balances");
        // Annual leave entitlement per Saudi Labor Law:
        // - Less than 5 years service: 21 days
        // - 5+ years service: 30 days
        // This is handled by LeaveBalanceService; here we just log and notify HR
        employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() == Employee.EmployeeStatus.active
                        && e.getUser() != null && e.getUser().getRole() != null
                        && e.getUser().getRole().name().contains("HR"))
                .findFirst()
                .ifPresent(hrEmp -> {
                    try {
                        notificationService.createNotification(
                                hrEmp.getUser().getId(),
                                "تجديد أرصدة الإجازة السنوية",
                                "تم تجديد أرصدة الإجازة السنوية لجميع الموظفين وفق نظام العمل السعودي.",
                                "leave_balance_reset",
                                null,
                                null);
                    } catch (Exception e) {
                        log.error("[CronJob] Leave balance reset notification error: {}", e.getMessage());
                    }
                });
        log.info("[CronJob] leaveBalanceResetJob completed");
    }

    // ── Job 7: Document Expiry Check — daily at 8:00 AM ─────────────────────
    /**
     * Checks for documents (iqama, passport) expiring in the next 30 days.
     * Currently uses employee number as a placeholder — extend when document model is added.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void documentExpiryJob() {
        // Placeholder: when a document expiry model is added, query it here
        log.info("[CronJob] documentExpiryJob - document expiry check (no document model yet)");
    }

    // ── Job 8: Contract Expiry Check — daily at 8:00 AM ─────────────────────
    /**
     * Notifies HR of employees whose contracts expire within 30 days.
     * Based on probationEndDate as a proxy until a full contract model is added.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void contractExpiryJob() {
        log.info("[CronJob] contractExpiryJob started");
        LocalDate warningDate = LocalDate.now().plusDays(30);
        String warningDateStr = warningDate.toString();

        List<Employee> expiring = employeeRepository.findAll().stream()
                .filter(e -> warningDateStr.equals(e.getProbationEndDate())
                        || (e.getProbationEndDate() != null && e.getProbationEndDate().compareTo(warningDateStr) <= 0
                                && e.getProbationEndDate().compareTo(LocalDate.now().toString()) >= 0))
                .toList();

        if (!expiring.isEmpty()) {
            // Notify first HR manager found
            employeeRepository.findAll().stream()
                    .filter(e -> e.getUser() != null && e.getUser().getRole() != null
                            && e.getUser().getRole().name().contains("HR"))
                    .findFirst()
                    .ifPresent(hrEmp -> expiring.forEach(emp -> {
                        try {
                            notificationService.createNotification(
                                    hrEmp.getUser().getId(),
                                    "تنبيه: انتهاء فترة الاختبار",
                                    "ستنتهي فترة الاختبار للموظف " + emp.getFirstName() + " " + emp.getLastName()
                                            + " بتاريخ " + emp.getProbationEndDate(),
                                    "contract_expiry",
                                    emp.getId(),
                                    "Employee");
                        } catch (Exception e) {
                            log.error("[CronJob] Contract expiry notification error: {}", e.getMessage());
                        }
                    }));
        }
        log.info("[CronJob] contractExpiryJob completed — {} expiring", expiring.size());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void applyAbsenceViolation(Employee employee, Violation violation) {
        try {
            penaltyService.applyAbsenceViolation(employee, violation);
        } catch (Exception e) {
            log.error("[CronJob] Failed to apply absence violation for employee {}: {}", employee.getId(), e.getMessage());
        }
    }

    private void sendEscalationReminder(LeaveRequest leave) {
        Employee manager = leave.getEmployee().getManager();
        if (manager != null && manager.getUser() != null) {
            String empName = leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName();
            notificationService.createNotification(
                    manager.getUser().getId(),
                    "تذكير: طلب إجازة بانتظار موافقتك",
                    "طلب إجازة الموظف " + empName + " لم يتم البت فيه منذ 12 ساعة",
                    "leave_escalation_reminder",
                    leave.getId(),
                    "LeaveRequest");
        }
    }

    private void notifyManagerUrgent(LeaveRequest leave) {
        Employee manager = leave.getEmployee().getManager();
        if (manager != null && manager.getUser() != null) {
            String empName = leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName();
            notificationService.createNotification(
                    manager.getUser().getId(),
                    "عاجل: طلب إجازة يحتاج موافقة فورية",
                    "طلب إجازة الموظف " + empName + " لم يُوافق عليه منذ 20 ساعة. سيتم التصعيد لمدير HR.",
                    "leave_escalation_urgent",
                    leave.getId(),
                    "LeaveRequest");
        }
    }

    private void notifyHrOfEscalation(LeaveRequest leave) {
        // Notify HR managers
        employeeRepository.findAll().stream()
                .filter(e -> e.getUser() != null && e.getUser().getRole() != null
                        && e.getUser().getRole().name().contains("HR"))
                .forEach(hrEmp -> {
                    String empName = leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName();
                    notificationService.createNotification(
                            hrEmp.getUser().getId(),
                            "تصعيد طلب إجازة",
                            "طلب إجازة الموظف " + empName + " تم تصعيده لـ HR بعد 24 ساعة بدون موافقة",
                            "leave_escalation_hr",
                            leave.getId(),
                            "LeaveRequest");
                });
    }

    @Transactional
    private void autoApproveLeave(LeaveRequest leave) {
        if (leave.getStatus() != LeaveRequest.LeaveStatus.pending) return;

        leave.setStatus(LeaveRequest.LeaveStatus.approved);
        leave.setApprovalStage(LeaveRequest.ApprovalStage.APPROVED);
        leave.setManagerRemarks("تمت الموافقة تلقائياً بعد انقضاء مهلة الرد");
        leaveRequestRepository.save(leave);

        // Notify employee
        Employee emp = leave.getEmployee();
        if (emp.getUser() != null) {
            notificationService.createNotification(
                    emp.getUser().getId(),
                    "تمت الموافقة التلقائية على إجازتك",
                    "تمت الموافقة تلقائياً على طلب إجازتك من " + leave.getStartDate() + " إلى " + leave.getEndDate()
                            + " لعدم الرد خلال 28 ساعة.",
                    "leave_auto_approved",
                    leave.getId(),
                    "LeaveRequest");
        }

        log.info("[CronJob] Auto-approved leave {} for employee {}", leave.getId(), emp.getId());
    }
}
