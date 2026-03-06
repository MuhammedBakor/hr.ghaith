package com.ghaith.erp.service;

import com.ghaith.erp.model.LegalCase;
import com.ghaith.erp.model.LegalContract;
import com.ghaith.erp.model.LegalDocument;
import com.ghaith.erp.model.LegalTask;
import com.ghaith.erp.repository.LegalCaseRepository;
import com.ghaith.erp.repository.LegalContractRepository;
import com.ghaith.erp.repository.LegalDocumentRepository;
import com.ghaith.erp.repository.LegalTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LegalService {

    private final LegalContractRepository contractRepository;
    private final LegalCaseRepository caseRepository;
    private final LegalDocumentRepository documentRepository;
    private final LegalTaskRepository taskRepository;

    // Contracts
    public List<LegalContract> getAllContracts() {
        return contractRepository.findAll();
    }

    public LegalContract createContract(LegalContract contract) {
        return contractRepository.save(contract);
    }

    public LegalContract renewContract(Long id) {
        LegalContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
        contract.setEndDate(contract.getEndDate().plusYears(1));
        return contractRepository.save(contract);
    }

    // Cases
    public List<LegalCase> getAllCases() {
        return caseRepository.findAll();
    }

    public LegalCase createCase(LegalCase legalCase) {
        return caseRepository.save(legalCase);
    }

    // Documents
    public List<LegalDocument> getAllDocuments(String type) {
        if (type != null) {
            return documentRepository.findAll().stream()
                    .filter(d -> type.equals(d.getType()))
                    .toList();
        }
        return documentRepository.findAll();
    }

    public LegalDocument createDocument(LegalDocument document) {
        return documentRepository.save(document);
    }

    // Tasks
    public List<LegalTask> getAllTasks() {
        return taskRepository.findAll();
    }

    public LegalTask createTask(LegalTask task) {
        return taskRepository.save(task);
    }
}
