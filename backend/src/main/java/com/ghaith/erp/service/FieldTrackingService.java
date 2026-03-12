package com.ghaith.erp.service;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.FieldTrackingPoint;
import com.ghaith.erp.model.FieldTrackingSession;
import com.ghaith.erp.repository.FieldTrackingPointRepository;
import com.ghaith.erp.repository.FieldTrackingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FieldTrackingService {
    private final FieldTrackingSessionRepository sessionRepository;
    private final FieldTrackingPointRepository pointRepository;
    private final EmployeeService employeeService;

    public List<FieldTrackingSession> getSessionsByEmployee(Long employeeId) {
        return sessionRepository.findByEmployeeId(employeeId);
    }

    public FieldTrackingSession getSessionById(Long id) {
        return sessionRepository.findById(id).orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Transactional
    public FieldTrackingSession startSession(Long userId, Double lat, Double lng) {
        List<Employee> employees = employeeService.getEmployeesByUserId(userId);
        Employee employee = employees.stream()
                .filter(e -> e.getStatus() == Employee.EmployeeStatus.active)
                .findFirst()
                .orElse(employees.isEmpty() ? null : employees.get(0));

        if (employee == null) {
            throw new RuntimeException("Employee not found");
        }

        FieldTrackingSession session = FieldTrackingSession.builder()
                .employee(employee)
                .startTime(LocalDateTime.now())
                .startLatitude(lat)
                .startLongitude(lng)
                .status("active")
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public FieldTrackingSession endSession(Long sessionId, Double lat, Double lng) {
        FieldTrackingSession session = getSessionById(sessionId);
        session.setEndTime(LocalDateTime.now());
        session.setEndLatitude(lat);
        session.setEndLongitude(lng);
        session.setStatus("completed");
        return sessionRepository.save(session);
    }

    @Transactional
    public FieldTrackingPoint recordPoint(Long sessionId, Double lat, Double lng, String type, Integer duration,
            String notes) {
        FieldTrackingSession session = getSessionById(sessionId);

        FieldTrackingPoint point = FieldTrackingPoint.builder()
                .session(session)
                .timestamp(LocalDateTime.now())
                .latitude(lat)
                .longitude(lng)
                .pointType(type)
                .stopDuration(duration)
                .notes(notes)
                .build();

        return pointRepository.save(point);
    }
}
