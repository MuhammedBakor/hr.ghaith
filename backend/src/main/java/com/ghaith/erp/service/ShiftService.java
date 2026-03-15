package com.ghaith.erp.service;

import com.ghaith.erp.model.AttendancePolicy;
import com.ghaith.erp.model.Shift;
import com.ghaith.erp.repository.AttendancePolicyRepository;
import com.ghaith.erp.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final AttendancePolicyRepository attendancePolicyRepository;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
    }

    @Transactional
    public Shift createShiftFromPayload(Map<String, Object> payload) {
        Shift shift = buildShiftFromPayload(new Shift(), payload);
        if (Boolean.TRUE.equals(shift.getIsDefault())) {
            shiftRepository.findByIsDefaultTrue().ifPresent(s -> {
                s.setIsDefault(false);
                shiftRepository.save(s);
            });
        }
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift createShift(Shift shift) {
        if (Boolean.TRUE.equals(shift.getIsDefault())) {
            shiftRepository.findByIsDefaultTrue().ifPresent(s -> {
                s.setIsDefault(false);
                shiftRepository.save(s);
            });
        }
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift updateShiftFromPayload(Long id, Map<String, Object> payload) {
        Shift shift = getShiftById(id);
        Boolean wasDefault = shift.getIsDefault();
        buildShiftFromPayload(shift, payload);
        if (Boolean.TRUE.equals(shift.getIsDefault()) && !Boolean.TRUE.equals(wasDefault)) {
            shiftRepository.findByIsDefaultTrue().ifPresent(s -> {
                if (!s.getId().equals(id)) {
                    s.setIsDefault(false);
                    shiftRepository.save(s);
                }
            });
        }
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift updateShift(Long id, Shift shiftDetails) {
        Shift shift = getShiftById(id);

        if (Boolean.TRUE.equals(shiftDetails.getIsDefault()) && !Boolean.TRUE.equals(shift.getIsDefault())) {
            shiftRepository.findByIsDefaultTrue().ifPresent(s -> {
                s.setIsDefault(false);
                shiftRepository.save(s);
            });
        }

        shift.setCode(shiftDetails.getCode());
        shift.setName(shiftDetails.getName());
        shift.setNameEn(shiftDetails.getNameEn());
        shift.setDescription(shiftDetails.getDescription());
        shift.setShiftType(shiftDetails.getShiftType());
        shift.setStartTime(shiftDetails.getStartTime());
        shift.setEndTime(shiftDetails.getEndTime());
        shift.setFlexibleStartMin(shiftDetails.getFlexibleStartMin());
        shift.setFlexibleStartMax(shiftDetails.getFlexibleStartMax());
        shift.setFlexibleEndMin(shiftDetails.getFlexibleEndMin());
        shift.setFlexibleEndMax(shiftDetails.getFlexibleEndMax());
        shift.setGraceMinutesBefore(shiftDetails.getGraceMinutesBefore());
        shift.setGraceMinutesAfter(shiftDetails.getGraceMinutesAfter());
        shift.setEarlyLeaveGrace(shiftDetails.getEarlyLeaveGrace());
        shift.setRequiredWorkHours(shiftDetails.getRequiredWorkHours());
        shift.setMinWorkHours(shiftDetails.getMinWorkHours());
        shift.setBreakDurationMinutes(shiftDetails.getBreakDurationMinutes());
        shift.setBreakStartTime(shiftDetails.getBreakStartTime());
        shift.setBreakEndTime(shiftDetails.getBreakEndTime());
        shift.setIsBreakPaid(shiftDetails.getIsBreakPaid());
        shift.setWorkDays(shiftDetails.getWorkDays());
        shift.setAllowOvertime(shiftDetails.getAllowOvertime());
        shift.setMaxOvertimeHours(shiftDetails.getMaxOvertimeHours());
        shift.setOvertimeMultiplier(shiftDetails.getOvertimeMultiplier());
        shift.setIsActive(shiftDetails.getIsActive());
        shift.setIsDefault(shiftDetails.getIsDefault());
        shift.setPolicy(shiftDetails.getPolicy());

        return shiftRepository.save(shift);
    }

    private Shift buildShiftFromPayload(Shift shift, Map<String, Object> p) {
        if (p.get("code") != null) shift.setCode(p.get("code").toString());
        if (p.get("name") != null) shift.setName(p.get("name").toString());
        if (p.get("nameEn") != null) shift.setNameEn(p.get("nameEn").toString());
        if (p.get("description") != null) shift.setDescription(p.get("description").toString());
        if (p.get("shiftType") != null) shift.setShiftType(Shift.ShiftType.valueOf(p.get("shiftType").toString()));
        if (p.get("startTime") != null) shift.setStartTime(p.get("startTime").toString());
        if (p.get("endTime") != null) shift.setEndTime(p.get("endTime").toString());
        if (p.get("flexibleStartMin") != null) shift.setFlexibleStartMin(p.get("flexibleStartMin").toString());
        if (p.get("flexibleStartMax") != null) shift.setFlexibleStartMax(p.get("flexibleStartMax").toString());
        if (p.get("flexibleEndMin") != null) shift.setFlexibleEndMin(p.get("flexibleEndMin").toString());
        if (p.get("flexibleEndMax") != null) shift.setFlexibleEndMax(p.get("flexibleEndMax").toString());
        if (p.get("graceMinutesBefore") != null) shift.setGraceMinutesBefore(((Number) p.get("graceMinutesBefore")).intValue());
        if (p.get("graceMinutesAfter") != null) shift.setGraceMinutesAfter(((Number) p.get("graceMinutesAfter")).intValue());
        if (p.get("earlyLeaveGrace") != null) shift.setEarlyLeaveGrace(((Number) p.get("earlyLeaveGrace")).intValue());
        if (p.get("requiredWorkHours") != null) shift.setRequiredWorkHours(new BigDecimal(p.get("requiredWorkHours").toString()));
        if (p.get("minWorkHours") != null) shift.setMinWorkHours(new BigDecimal(p.get("minWorkHours").toString()));
        if (p.get("breakDurationMinutes") != null) shift.setBreakDurationMinutes(((Number) p.get("breakDurationMinutes")).intValue());
        if (p.get("breakStartTime") != null) shift.setBreakStartTime(p.get("breakStartTime").toString());
        if (p.get("breakEndTime") != null) shift.setBreakEndTime(p.get("breakEndTime").toString());
        if (p.get("isBreakPaid") != null) shift.setIsBreakPaid(Boolean.parseBoolean(p.get("isBreakPaid").toString()));
        if (p.get("workDays") != null && p.get("workDays") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> days = (List<String>) p.get("workDays");
            shift.setWorkDays(days);
        }
        if (p.get("allowOvertime") != null) shift.setAllowOvertime(Boolean.parseBoolean(p.get("allowOvertime").toString()));
        if (p.get("maxOvertimeHours") != null) shift.setMaxOvertimeHours(new BigDecimal(p.get("maxOvertimeHours").toString()));
        if (p.get("overtimeMultiplier") != null) shift.setOvertimeMultiplier(new BigDecimal(p.get("overtimeMultiplier").toString()));
        if (p.get("isActive") != null) shift.setIsActive(Boolean.parseBoolean(p.get("isActive").toString()));
        if (p.get("isDefault") != null) shift.setIsDefault(Boolean.parseBoolean(p.get("isDefault").toString()));

        // Handle policyId
        Object policyIdObj = p.get("policyId");
        if (policyIdObj != null && !policyIdObj.toString().isEmpty()) {
            Long policyId = Long.parseLong(policyIdObj.toString());
            AttendancePolicy policy = attendancePolicyRepository.findById(policyId).orElse(null);
            shift.setPolicy(policy);
        } else if (p.containsKey("policyId") && policyIdObj == null) {
            shift.setPolicy(null);
        }

        return shift;
    }

    public void deleteShift(Long id) {
        shiftRepository.deleteById(id);
    }

    @Transactional
    public void seedDefaults() {
        if (shiftRepository.count() == 0) {
            Shift defaultShift = Shift.builder()
                    .code("SH-001")
                    .name("الوردية الصباحية")
                    .nameEn("Morning Shift")
                    .description("وردية العمل الرسمية")
                    .shiftType(Shift.ShiftType.regular)
                    .startTime("08:00")
                    .endTime("16:00")
                    .graceMinutesBefore(30)
                    .graceMinutesAfter(30)
                    .earlyLeaveGrace(15)
                    .requiredWorkHours(new BigDecimal("8.00"))
                    .minWorkHours(new BigDecimal("6.00"))
                    .breakDurationMinutes(60)
                    .breakStartTime("12:00")
                    .breakEndTime("13:00")
                    .isBreakPaid(false)
                    .workDays(Arrays.asList("sunday", "monday", "tuesday", "wednesday", "thursday"))
                    .allowOvertime(true)
                    .maxOvertimeHours(new BigDecimal("4.00"))
                    .overtimeMultiplier(new BigDecimal("1.50"))
                    .isActive(true)
                    .isDefault(true)
                    .build();
            shiftRepository.save(defaultShift);
        }
    }
}
