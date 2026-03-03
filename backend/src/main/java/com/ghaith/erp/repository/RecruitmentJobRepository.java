package com.ghaith.erp.repository;

import com.ghaith.erp.model.RecruitmentJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruitmentJobRepository extends JpaRepository<RecruitmentJob, Long> {
    List<RecruitmentJob> findByStatus(String status);
}
