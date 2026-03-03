package com.ghaith.erp.service;

import com.ghaith.erp.model.Shift;
import com.ghaith.erp.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
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

        return shiftRepository.save(shift);
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
