package com.ghaith.erp.repository;

import com.ghaith.erp.model.HrBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HrBranchRepository extends JpaRepository<HrBranch, Long> {
}
