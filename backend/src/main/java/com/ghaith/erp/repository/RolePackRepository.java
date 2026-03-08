package com.ghaith.erp.repository;

import com.ghaith.erp.model.RolePack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePackRepository extends JpaRepository<RolePack, Long> {
    List<RolePack> findAllByOrderByCreatedAtDesc();
}
