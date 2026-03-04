package com.ghaith.erp.service;

import com.ghaith.erp.model.TrainingEnrollment;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.TrainingEnrollmentRepository;
import com.ghaith.erp.repository.TrainingProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrainingEnrollmentService {

    private final TrainingEnrollmentRepository repository;

    public List<TrainingEnrollment> getAllEnrollments() {
        return repository.findAll();
    }

    public List<TrainingEnrollment> getEnrollmentsByEmployee(Long employeeId) {
        return repository.findByEmployeeId(employeeId);
    }

    public List<TrainingEnrollment> getEnrollmentsByProgram(Long programId) {
        return repository.findByProgramId(programId);
    }

    public Optional<TrainingEnrollment> getEnrollmentById(Long id) {
        return repository.findById(id);
    }

    private final EmployeeRepository employeeRepository;
    private final TrainingProgramRepository programRepository;

    public TrainingEnrollment enrollEmployee(java.util.Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Long programId = ((Number) payload.get("programId")).longValue();

        com.ghaith.erp.model.Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));
        com.ghaith.erp.model.TrainingProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("الدورة التدريبية غير موجودة"));

        TrainingEnrollment enrollment = TrainingEnrollment.builder()
                .employee(employee)
                .program(program)
                .status(TrainingEnrollment.EnrollmentStatus.enrolled)
                .enrollmentDate(java.time.LocalDateTime.now())
                .build();

        return repository.save(enrollment);
    }

    public TrainingEnrollment updateEnrollment(Long id, TrainingEnrollment enrollmentDetails) {
        return repository.findById(id).map(enrollment -> {
            enrollment.setStatus(enrollmentDetails.getStatus());
            enrollment.setCompletionDate(enrollmentDetails.getCompletionDate());
            enrollment.setScore(enrollmentDetails.getScore());
            enrollment.setCertificate(enrollmentDetails.getCertificate());
            enrollment.setFeedback(enrollmentDetails.getFeedback());
            return repository.save(enrollment);
        }).orElseThrow(() -> new RuntimeException("Enrollment not found with id " + id));
    }

    public void deleteEnrollment(Long id) {
        repository.deleteById(id);
    }
}
