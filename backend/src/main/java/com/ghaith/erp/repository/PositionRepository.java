package com.ghaith.erp.repository;

import com.ghaith.erp.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    java.util.List<Position> findAllByBranchId(Long branchId);

    java.util.List<Position> findAllByBranchIdOrBranchIdIsNull(Long branchId);
}
