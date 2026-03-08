package com.ghaith.erp.repository;

import com.ghaith.erp.model.AdminCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminCompanyRepository extends JpaRepository<AdminCompany, Long> {
    List<AdminCompany> findAllByOrderByCreatedAtDesc();
}
