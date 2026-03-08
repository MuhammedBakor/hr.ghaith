package com.ghaith.erp.controller;

import com.ghaith.erp.model.DocumentFolder;
import com.ghaith.erp.repository.DocumentFolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents/folders")
@RequiredArgsConstructor
public class DocumentFolderController {

    private final DocumentFolderRepository folderRepository;

    @GetMapping
    public ResponseEntity<List<DocumentFolder>> getAll() {
        return ResponseEntity.ok(folderRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentFolder> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
            folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("المجلد غير موجود"))
        );
    }

    @PostMapping
    public ResponseEntity<DocumentFolder> create(@RequestBody DocumentFolder folder) {
        return ResponseEntity.ok(folderRepository.save(folder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentFolder> update(@PathVariable Long id, @RequestBody DocumentFolder folderDetails) {
        DocumentFolder folder = folderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("المجلد غير موجود"));
        if (folderDetails.getName() != null) {
            folder.setName(folderDetails.getName());
        }
        return ResponseEntity.ok(folderRepository.save(folder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        folderRepository.deleteById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
