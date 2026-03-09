package com.ghaith.erp.controller;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.EmployeeDocument;
import com.ghaith.erp.repository.EmployeeDocumentRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/v1/hr/employee-documents")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmployeeDocumentController {

    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<List<EmployeeDocument>> getAllDocuments() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeDocument>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(documentRepository.findByEmployeeId(employeeId));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("employeeId") Long employeeId,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "name", required = false) String name
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

            // Create upload directory for this employee
            Path employeeDir = Paths.get(uploadDir, "employee-docs", String.valueOf(employeeId));
            Files.createDirectories(employeeDir);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedFilename = documentType + "_" + System.currentTimeMillis() + extension;
            Path filePath = employeeDir.resolve(storedFilename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Save document record
            EmployeeDocument doc = EmployeeDocument.builder()
                    .employee(employee)
                    .documentType(documentType)
                    .name(name != null ? name : originalFilename)
                    .filePath(filePath.toString())
                    .fileSize(String.valueOf(file.getSize()))
                    .contentType(file.getContentType())
                    .status("valid")
                    .build();

            documentRepository.save(doc);

            response.put("success", true);
            response.put("documentId", doc.getId());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("error", "فشل في رفع الملف: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        try {
            EmployeeDocument doc = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("الوثيقة غير موجودة"));

            Path filePath = Paths.get(doc.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(doc.getContentType() != null ? doc.getContentType() : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getName() + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeDocument doc = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("الوثيقة غير موجودة"));

            // Delete file from disk
            Path filePath = Paths.get(doc.getFilePath());
            Files.deleteIfExists(filePath);

            // Delete record
            documentRepository.delete(doc);

            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
