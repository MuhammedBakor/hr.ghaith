package com.ghaith.erp.repository;

import com.ghaith.erp.model.Lease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaseRepository extends JpaRepository<Lease, Long> {
    List<Lease> findByTenantId(Long tenantId);

    List<Lease> findByUnitId(Long unitId);
}
