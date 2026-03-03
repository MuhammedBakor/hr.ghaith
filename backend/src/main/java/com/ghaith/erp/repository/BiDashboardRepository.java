package com.ghaith.erp.repository;

import com.ghaith.erp.model.BiDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BiDashboardRepository extends JpaRepository<BiDashboard, Long> {
    List<BiDashboard> findByOwnerId(Long ownerId);

    List<BiDashboard> findByType(String type);
}
