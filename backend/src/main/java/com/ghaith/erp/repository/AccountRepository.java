package com.ghaith.erp.repository;

import com.ghaith.erp.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByCompanyId(Long companyId);
    List<Account> findByCompanyIdAndIsActiveTrue(Long companyId);
    Optional<Account> findByCodeAndCompanyId(String code, Long companyId);
    List<Account> findByType(String type);
    List<Account> findByCompanyIdAndType(Long companyId, String type);
}
