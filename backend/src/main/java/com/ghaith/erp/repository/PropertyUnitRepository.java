package com.ghaith.erp.repository;

import com.ghaith.erp.model.PropertyUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long> {
    List<PropertyUnit> findByPropertyId(Long propertyId);
}
