package com.ghaith.erp.repository;

import com.ghaith.erp.model.LegalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalDocumentRepository extends JpaRepository<LegalDocument, Long> {
}
