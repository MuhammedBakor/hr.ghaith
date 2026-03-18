package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PenaltyService {

    private final ViolationTypeRepository violationTypeRepository;
    private final PenaltyTypeRepository penaltyTypeRepository;
    private final PenaltyEscalationRuleRepository escalationRuleRepository;
    private final EmployeePenaltyRepository employeePenaltyRepository;
    private final AttendanceDeductionRepository attendanceDeductionRepository;
    private final ViolationRepository violationRepository;

    public List<ViolationType> getAllViolationTypes() {
        return violationTypeRepository.findByIsActiveTrue();
    }

    public List<PenaltyType> getAllPenaltyTypes() {
        return penaltyTypeRepository.findByIsActiveTrue();
    }

    public List<PenaltyEscalationRule> getAllEscalationRules() {
        return escalationRuleRepository.findAll();
    }

    public PenaltyEscalationRule createEscalationRule(Long violationTypeId, int occurrenceNumber, Long penaltyTypeId, int periodMonths) {
        ViolationType violationType = violationTypeRepository.findById(violationTypeId)
                .orElseThrow(() -> new RuntimeException("نوع المخالفة غير موجود"));
        PenaltyType penaltyType = penaltyTypeRepository.findById(penaltyTypeId)
                .orElseThrow(() -> new RuntimeException("نوع الجزاء غير موجود"));

        PenaltyEscalationRule rule = PenaltyEscalationRule.builder()
                .violationType(violationType)
                .occurrenceNumber(occurrenceNumber)
                .penaltyType(penaltyType)
                .periodMonths(periodMonths)
                .build();
        return escalationRuleRepository.save(rule);
    }

    public void deleteEscalationRule(Long id) {
        escalationRuleRepository.deleteById(id);
    }

    /**
     * Creates automatic violation, counts prior occurrences, looks up penalty ladder,
     * creates EmployeePenalty, and creates AttendanceDeduction.
     * Called from AttendanceService when employee is late.
     */
    @Transactional
    public EmployeePenalty applyLatenessViolation(Employee employee, int lateMinutes, Violation violation) {
        List<ViolationType> lateTypes = violationTypeRepository.findByIsActiveTrue()
                .stream()
                .filter(vt -> "late".equals(vt.getCode()) || "تأخر".equals(vt.getName()))
                .toList();

        if (lateTypes.isEmpty()) {
            log.warn("No active violation type found with code 'late' for employee {}", employee.getId());
            return null;
        }
        ViolationType lateType = lateTypes.get(0);

        int periodMonths = 12; // default
        List<PenaltyEscalationRule> rules = escalationRuleRepository.findByViolationType_Id(lateType.getId());
        if (!rules.isEmpty()) {
            periodMonths = rules.get(0).getPeriodMonths();
        }

        LocalDate since = LocalDate.now().minusMonths(periodMonths);
        long occurrenceCount = violationRepository.countByEmployee_IdAndViolationTypeAndViolationDateAfter(
                employee.getId(), lateType.getName(), since);

        int occurrence = (int) occurrenceCount; // this is the Nth occurrence (including current)

        Optional<PenaltyEscalationRule> ruleOpt = escalationRuleRepository
                .findByViolationType_IdAndOccurrenceNumber(lateType.getId(), Math.min(occurrence, 5));

        if (ruleOpt.isEmpty()) {
            log.info("No escalation rule found for occurrence {} of violation type {}", occurrence, lateType.getName());
            return null;
        }

        PenaltyEscalationRule rule = ruleOpt.get();
        PenaltyType penaltyType = rule.getPenaltyType();

        BigDecimal salary = employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO;
        BigDecimal dailyRate = salary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        BigDecimal deductionAmount = dailyRate.multiply(BigDecimal.valueOf(penaltyType.getDeductionDays()));

        EmployeePenalty penalty = EmployeePenalty.builder()
                .employee(employee)
                .violation(violation)
                .penaltyType(penaltyType)
                .deductionAmount(deductionAmount)
                .deductionDays(penaltyType.getDeductionDays())
                .status("approved")
                .effectiveDate(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth())) // end of month
                .appealDeadline(LocalDateTime.now().plusDays(15))
                .appealStatus("none")
                .build();
        EmployeePenalty savedPenalty = employeePenaltyRepository.save(penalty);

        if (deductionAmount.compareTo(BigDecimal.ZERO) > 0) {
            AttendanceDeduction deduction = AttendanceDeduction.builder()
                    .employee(employee)
                    .date(LocalDate.now())
                    .type("late_penalty")
                    .amount(deductionAmount)
                    .lateMinutes(lateMinutes)
                    .payrollStatus("pending")
                    .month(String.format("%02d", LocalDate.now().getMonthValue()))
                    .year(LocalDate.now().getYear())
                    .build();
            attendanceDeductionRepository.save(deduction);
        }

        return savedPenalty;
    }

    /**
     * Creates automatic absence violation penalty using the escalation ladder.
     * Called from HrCronJobService.
     */
    @Transactional
    public EmployeePenalty applyAbsenceViolation(Employee employee, Violation violation) {
        List<ViolationType> absenceTypes = violationTypeRepository.findByIsActiveTrue()
                .stream()
                .filter(vt -> "absence".equals(vt.getCode()) || "غياب بدون إذن".equals(vt.getName()))
                .toList();

        if (absenceTypes.isEmpty()) {
            log.warn("No active violation type found with code 'absence' for employee {}", employee.getId());
            return null;
        }
        ViolationType absenceType = absenceTypes.get(0);

        int periodMonths = 12;
        List<PenaltyEscalationRule> rules = escalationRuleRepository.findByViolationType_Id(absenceType.getId());
        if (!rules.isEmpty()) {
            periodMonths = rules.get(0).getPeriodMonths();
        }

        LocalDate since = LocalDate.now().minusMonths(periodMonths);
        long occurrenceCount = violationRepository.countByEmployee_IdAndViolationTypeAndViolationDateAfter(
                employee.getId(), absenceType.getName(), since);

        int occurrence = (int) occurrenceCount;

        Optional<PenaltyEscalationRule> ruleOpt = escalationRuleRepository
                .findByViolationType_IdAndOccurrenceNumber(absenceType.getId(), Math.min(occurrence, 5));

        if (ruleOpt.isEmpty()) {
            log.info("No escalation rule for absence occurrence {} for employee {}", occurrence, employee.getId());
            return null;
        }

        PenaltyEscalationRule rule = ruleOpt.get();
        PenaltyType penaltyType = rule.getPenaltyType();

        BigDecimal salary = employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO;
        BigDecimal dailyRate = salary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        BigDecimal deductionAmount = dailyRate.multiply(BigDecimal.valueOf(penaltyType.getDeductionDays()));

        EmployeePenalty penalty = EmployeePenalty.builder()
                .employee(employee)
                .violation(violation)
                .penaltyType(penaltyType)
                .deductionAmount(deductionAmount)
                .deductionDays(penaltyType.getDeductionDays())
                .status("approved")
                .effectiveDate(LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()))
                .appealDeadline(LocalDateTime.now().plusDays(15))
                .appealStatus("none")
                .build();
        return employeePenaltyRepository.save(penalty);
    }

    /**
     * Seeds default violation types, penalty types, and escalation rules per Saudi Labor Law.
     */
    @Transactional
    public void seedDefaults() {
        if (!violationTypeRepository.findAll().isEmpty()) {
            log.info("Violation types already seeded, skipping.");
            return;
        }

        // Violation Types
        ViolationType late = violationTypeRepository.save(ViolationType.builder().code("late").name("تأخر").nameEn("Lateness").category("attendance").isActive(true).build());
        ViolationType absent = violationTypeRepository.save(ViolationType.builder().code("absence").name("غياب بدون إذن").nameEn("Unauthorized Absence").category("attendance").isActive(true).build());
        ViolationType leaveWork = violationTypeRepository.save(ViolationType.builder().code("leave_work").name("ترك العمل").nameEn("Leaving Work").category("conduct").isActive(true).build());
        ViolationType neglect = violationTypeRepository.save(ViolationType.builder().code("neglect").name("إهمال في العمل").nameEn("Work Negligence").category("conduct").isActive(true).build());
        ViolationType conduct = violationTypeRepository.save(ViolationType.builder().code("conduct").name("سلوك غير لائق").nameEn("Inappropriate Conduct").category("conduct").isActive(true).build());
        ViolationType security = violationTypeRepository.save(ViolationType.builder().code("security").name("مخالفة أمنية").nameEn("Security Violation").category("org").isActive(true).build());

        // Penalty Types
        PenaltyType verbal = penaltyTypeRepository.save(PenaltyType.builder().code("verbal_warning").name("إنذار شفهي").nameEn("Verbal Warning").type("warning").deductionDays(0).isActive(true).build());
        PenaltyType written = penaltyTypeRepository.save(PenaltyType.builder().code("written_warning").name("إنذار كتابي").nameEn("Written Warning").type("warning").deductionDays(0).isActive(true).build());
        PenaltyType deduct1 = penaltyTypeRepository.save(PenaltyType.builder().code("deduct_1_day").name("خصم يوم").nameEn("Deduct 1 Day").type("deduction_days").deductionDays(1).isActive(true).build());
        PenaltyType deduct2 = penaltyTypeRepository.save(PenaltyType.builder().code("deduct_2_days").name("خصم يومين").nameEn("Deduct 2 Days").type("deduction_days").deductionDays(2).isActive(true).build());
        PenaltyType deduct3 = penaltyTypeRepository.save(PenaltyType.builder().code("deduct_3_days").name("خصم 3 أيام").nameEn("Deduct 3 Days").type("deduction_days").deductionDays(3).isActive(true).build());
        PenaltyType deduct5 = penaltyTypeRepository.save(PenaltyType.builder().code("deduct_5_days").name("خصم 5 أيام").nameEn("Deduct 5 Days").type("deduction_days").deductionDays(5).isActive(true).build());
        PenaltyType deduct10 = penaltyTypeRepository.save(PenaltyType.builder().code("deduct_10_days").name("خصم 10 أيام").nameEn("Deduct 10 Days").type("deduction_days").deductionDays(10).isActive(true).build());
        PenaltyType suspend5 = penaltyTypeRepository.save(PenaltyType.builder().code("suspension_5_days").name("إيقاف 5 أيام").nameEn("Suspension 5 Days").type("suspension").deductionDays(5).isActive(true).build());
        PenaltyType termination = penaltyTypeRepository.save(PenaltyType.builder().code("termination").name("فصل").nameEn("Termination").type("termination").deductionDays(0).isActive(true).build());

        // Escalation Rules -- Lateness (5 levels)
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(late).occurrenceNumber(1).penaltyType(verbal).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(late).occurrenceNumber(2).penaltyType(written).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(late).occurrenceNumber(3).penaltyType(deduct1).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(late).occurrenceNumber(4).penaltyType(deduct2).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(late).occurrenceNumber(5).penaltyType(deduct3).periodMonths(12).build());

        // Escalation Rules -- Unauthorized Absence
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(absent).occurrenceNumber(1).penaltyType(written).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(absent).occurrenceNumber(2).penaltyType(deduct2).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(absent).occurrenceNumber(3).penaltyType(deduct5).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(absent).occurrenceNumber(4).penaltyType(deduct10).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(absent).occurrenceNumber(5).penaltyType(termination).periodMonths(12).build());

        // Escalation Rules -- Leaving Work
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(leaveWork).occurrenceNumber(1).penaltyType(deduct1).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(leaveWork).occurrenceNumber(2).penaltyType(deduct2).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(leaveWork).occurrenceNumber(3).penaltyType(deduct3).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(leaveWork).occurrenceNumber(4).penaltyType(suspend5).periodMonths(12).build());
        escalationRuleRepository.save(PenaltyEscalationRule.builder().violationType(leaveWork).occurrenceNumber(5).penaltyType(termination).periodMonths(12).build());

        log.info("HR defaults seeded successfully: 6 violation types, 9 penalty types, 15 escalation rules.");
    }
}
