package com.ghaith.erp.repository;

import com.ghaith.erp.model.AdminSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminSettingRepository extends JpaRepository<AdminSetting, Long> {
    List<AdminSetting> findAllByOrderByCreatedAtDesc();
}
