package com.ghaith.erp.service;

import com.ghaith.erp.model.AttendancePolicy;
import com.ghaith.erp.repository.AttendancePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendancePolicyService {
    private final AttendancePolicyRepository policyRepository;

    public List<AttendancePolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    public AttendancePolicy getPolicyById(Long id) {
        return policyRepository.findById(id).orElseThrow(() -> new RuntimeException("Policy not found"));
    }

    @Transactional
    public AttendancePolicy createPolicy(AttendancePolicy policy) {
        if (Boolean.TRUE.equals(policy.getIsDefault())) {
            policyRepository.findByIsDefaultTrue().ifPresent(p -> {
                p.setIsDefault(false);
                policyRepository.save(p);
            });
        }
        return policyRepository.save(policy);
    }

    @Transactional
    public AttendancePolicy updatePolicy(Long id, AttendancePolicy policyDetails) {
        AttendancePolicy policy = getPolicyById(id);

        if (Boolean.TRUE.equals(policyDetails.getIsDefault()) && !Boolean.TRUE.equals(policy.getIsDefault())) {
            policyRepository.findByIsDefaultTrue().ifPresent(p -> {
                p.setIsDefault(false);
                policyRepository.save(p);
            });
        }

        policy.setCode(policyDetails.getCode());
        policy.setName(policyDetails.getName());
        policy.setDescription(policyDetails.getDescription());
        policy.setLateThresholdMinutes(policyDetails.getLateThresholdMinutes());
        policy.setSevereLateThresholdMinutes(policyDetails.getSevereLateThresholdMinutes());
        policy.setMaxLateMinutesPerMonth(policyDetails.getMaxLateMinutesPerMonth());
        policy.setEarlyLeaveThresholdMinutes(policyDetails.getEarlyLeaveThresholdMinutes());
        policy.setSevereEarlyLeaveMinutes(policyDetails.getSevereEarlyLeaveMinutes());
        policy.setAbsenceAfterLateMinutes(policyDetails.getAbsenceAfterLateMinutes());
        policy.setConsecutiveAbsenceDays(policyDetails.getConsecutiveAbsenceDays());
        policy.setEnableAutoDeduction(policyDetails.getEnableAutoDeduction());
        policy.setLateDeductionPerMinute(policyDetails.getLateDeductionPerMinute());
        policy.setLateDeductionFixed(policyDetails.getLateDeductionFixed());
        policy.setAbsenceDeductionDays(policyDetails.getAbsenceDeductionDays());
        policy.setEnableAutoViolation(policyDetails.getEnableAutoViolation());
        policy.setRequireCheckInLocation(policyDetails.getRequireCheckInLocation());
        policy.setAllowedLocationRadius(policyDetails.getAllowedLocationRadius());
        policy.setIsActive(policyDetails.getIsActive());
        policy.setIsDefault(policyDetails.getIsDefault());

        return policyRepository.save(policy);
    }

    public void deletePolicy(Long id) {
        policyRepository.deleteById(id);
    }

    @Transactional
    public void seedDefaults() {
        if (policyRepository.count() == 0) {
            AttendancePolicy defaultPolicy = AttendancePolicy.builder()
                    .code("POL-001")
                    .name("السياسة العامة")
                    .description("سياسة الحضور والانصراف القياسية للمنشأة")
                    .lateThresholdMinutes(15)
                    .severeLateThresholdMinutes(60)
                    .maxLateMinutesPerMonth(60)
                    .earlyLeaveThresholdMinutes(15)
                    .severeEarlyLeaveMinutes(60)
                    .absenceAfterLateMinutes(240)
                    .consecutiveAbsenceDays(3)
                    .enableAutoDeduction(true)
                    .lateDeductionPerMinute(new BigDecimal("0.00"))
                    .lateDeductionFixed(new BigDecimal("50.00"))
                    .absenceDeductionDays(new BigDecimal("1.00"))
                    .enableAutoViolation(true)
                    .requireCheckInLocation(false)
                    .allowedLocationRadius(100)
                    .isActive(true)
                    .isDefault(true)
                    .build();
            policyRepository.save(defaultPolicy);
        }
    }
}
