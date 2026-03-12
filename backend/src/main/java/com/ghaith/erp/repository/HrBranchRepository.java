package com.ghaith.erp.repository;

import com.ghaith.erp.model.HrBranch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HrBranchRepository extends JpaRepository<HrBranch, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.branch FROM Employee e WHERE e.user.id = :userId")
    List<HrBranch> findBranchesByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
