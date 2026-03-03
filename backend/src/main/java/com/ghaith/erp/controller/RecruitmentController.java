package com.ghaith.erp.controller;

import com.ghaith.erp.model.Interview;
import com.ghaith.erp.model.JobApplication;
import com.ghaith.erp.model.RecruitmentJob;
import com.ghaith.erp.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recruitment")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    // Jobs
    @GetMapping("/jobs")
    public ResponseEntity<List<RecruitmentJob>> getAllJobs() {
        return ResponseEntity.ok(recruitmentService.getAllJobs());
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<RecruitmentJob> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(recruitmentService.getJobById(id));
    }

    @PostMapping("/jobs")
    public ResponseEntity<RecruitmentJob> createJob(@RequestBody RecruitmentJob job) {
        return ResponseEntity.ok(recruitmentService.createJob(job));
    }

    @PutMapping("/jobs/{id}")
    public ResponseEntity<RecruitmentJob> updateJob(@PathVariable Long id, @RequestBody RecruitmentJob job) {
        return ResponseEntity.ok(recruitmentService.updateJob(id, job));
    }

    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        recruitmentService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    // Applications
    @GetMapping("/applications")
    public ResponseEntity<List<JobApplication>> getAllApplications() {
        return ResponseEntity.ok(recruitmentService.getAllApplications());
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<JobApplication> updateApplicationStatus(@PathVariable Long id, @RequestBody String status) {
        return ResponseEntity.ok(recruitmentService.updateApplicationStatus(id, status));
    }

    // Interviews
    @GetMapping("/interviews")
    public ResponseEntity<List<Interview>> getAllInterviews() {
        return ResponseEntity.ok(recruitmentService.getAllInterviews());
    }

    @PostMapping("/interviews")
    public ResponseEntity<Interview> createInterview(@RequestBody Interview interview) {
        return ResponseEntity.ok(recruitmentService.createInterview(interview));
    }
}
