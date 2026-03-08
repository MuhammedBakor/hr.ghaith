package com.ghaith.erp.repository;

import com.ghaith.erp.model.DocumentFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentFolderRepository extends JpaRepository<DocumentFolder, Long> {
    List<DocumentFolder> findAllByOrderByCreatedAtDesc();
}
