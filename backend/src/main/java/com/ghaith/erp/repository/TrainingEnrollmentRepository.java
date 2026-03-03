package com.ghaith.erp.repository;

import com.ghaith.erp.model.TrainingEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingEnrollmentRepository extends JpaRepository<TrainingEnrollment, Long> {
    List<TrainingEnrollment> findByEmployeeId(Long employeeId);

    List<TrainingEnrollment> findByProgramId(Long programId);
}
