package com.ghaith.erp.repository;

import com.ghaith.erp.model.LegalTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalTaskRepository extends JpaRepository<LegalTask, Long> {
}
