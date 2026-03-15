package com.ghaith.erp.controller;

import com.ghaith.erp.model.JobApplication;
import com.ghaith.erp.model.RecruitmentJob;
import com.ghaith.erp.repository.JobApplicationRepository;
import com.ghaith.erp.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/recruitment")
@RequiredArgsConstructor
public class PublicRecruitmentController {

    private final RecruitmentService recruitmentService;
    private final JobApplicationRepository applicationRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping("/jobs/{id}")
    public ResponseEntity<RecruitmentJob> getPublicJob(@PathVariable Long id) {
        RecruitmentJob job = recruitmentService.getJobById(id);
        if (job == null || !"open".equals(job.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(job);
    }

    @PostMapping("/upload-cv")
    public ResponseEntity<Map<String, String>> uploadCv(@RequestParam("file") MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String ext = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : "";
        String filename = UUID.randomUUID() + ext;

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));

        String fileUrl = "/api/v1/public/uploads/" + filename;
        return ResponseEntity
                .ok(Map.of("url", fileUrl, "filename", originalFilename != null ? originalFilename : filename));
    }

    @PostMapping("/jobs/{id}/apply")
    public ResponseEntity<?> submitApplication(
            @PathVariable Long id,
            @RequestBody JobApplication application) {
        RecruitmentJob job = recruitmentService.getJobById(id);
        if (job == null || !"open".equals(job.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        String position = (job.getTitleAr() != null && !job.getTitleAr().isBlank())
                ? job.getTitleAr()
                : job.getTitle();
        if (application.getPosition() == null || application.getPosition().isBlank()) {
            application.setPosition(position);
        }

        // Reject duplicate application (same email + same job position)
        if (applicationRepository.existsByEmailIgnoreCaseAndPosition(application.getEmail(), position)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "لقد تقدمت لهذه الوظيفة من قبل"));
        }

        return ResponseEntity.ok(recruitmentService.createApplication(application));
    }
}
