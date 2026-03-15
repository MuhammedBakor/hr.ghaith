package com.ghaith.erp.repository;

import com.ghaith.erp.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByEmailIgnoreCaseAndPosition(String email, String position);
}
