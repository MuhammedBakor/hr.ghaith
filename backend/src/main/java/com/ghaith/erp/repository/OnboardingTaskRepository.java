package com.ghaith.erp.repository;

import com.ghaith.erp.model.OnboardingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, Long> {
    List<OnboardingTask> findByEmployee_Id(Long employeeId);
    List<OnboardingTask> findByAssignedToUserIdAndStatus(Long userId, String status);
}
