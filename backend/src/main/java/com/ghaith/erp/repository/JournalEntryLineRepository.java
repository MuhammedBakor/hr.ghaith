package com.ghaith.erp.repository;

import com.ghaith.erp.model.JournalEntryLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, Long> {
    List<JournalEntryLine> findByJournalEntryId(Long entryId);
    List<JournalEntryLine> findByAccountCode(String accountCode);
}
