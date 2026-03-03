package com.ghaith.erp.service;

import com.ghaith.erp.model.LeaveRequest;
import com.ghaith.erp.repository.LeaveRequestRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRepository;
    private final EmployeeRepository employeeRepository;

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRepository.findAll();
    }

    public List<LeaveRequest> getLeaveRequestsByEmployee(Long employeeId) {
        return leaveRepository.findByEmployeeId(employeeId);
    }

    public Optional<LeaveRequest> getLeaveRequestById(Long id) {
        return leaveRepository.findById(id);
    }

    public LeaveRequest createLeaveRequest(java.util.Map<String, Object> payload) {
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType((String) payload.get("leaveType"));
        leaveRequest.setStartDate(java.time.LocalDate.parse((String) payload.get("startDate")));
        leaveRequest.setEndDate(java.time.LocalDate.parse((String) payload.get("endDate")));
        leaveRequest.setReason((String) payload.get("reason"));
        leaveRequest.setStatus(LeaveRequest.LeaveStatus.pending);

        Number empIdNum = (Number) payload.get("employeeId");
        if (empIdNum != null) {
            employeeRepository.findById(empIdNum.longValue()).ifPresent(leaveRequest::setEmployee);
        }

        return leaveRepository.save(leaveRequest);
    }

    public LeaveRequest updateLeaveRequest(Long id, LeaveRequest leaveDetails) {
        return leaveRepository.findById(id)
                .map(leave -> {
                    leave.setLeaveType(leaveDetails.getLeaveType());
                    leave.setStartDate(leaveDetails.getStartDate());
                    leave.setEndDate(leaveDetails.getEndDate());
                    leave.setReason(leaveDetails.getReason());
                    leave.setStatus(leaveDetails.getStatus());
                    leave.setManagerRemarks(leaveDetails.getManagerRemarks());
                    return leaveRepository.save(leave);
                }).orElseThrow(() -> new RuntimeException("Leave request not found with id " + id));
    }

    public void deleteLeaveRequest(Long id) {
        leaveRepository.deleteById(id);
    }
}
