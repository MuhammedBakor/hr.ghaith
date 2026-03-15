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

    @PostMapping("/applications")
    public ResponseEntity<JobApplication> createApplication(@RequestBody JobApplication application) {
        return ResponseEntity.ok(recruitmentService.createApplication(application));
    }

    @PutMapping("/applications/{id}")
    public ResponseEntity<JobApplication> updateApplication(@PathVariable Long id, @RequestBody JobApplication application) {
        return ResponseEntity.ok(recruitmentService.updateApplication(id, application));
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<JobApplication> updateApplicationStatus(@PathVariable Long id, @RequestBody String status) {
        return ResponseEntity.ok(recruitmentService.updateApplicationStatus(id, status));
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        recruitmentService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    // Interviews
    @GetMapping("/interviews")
    public ResponseEntity<List<Interview>> getAllInterviews() {
        return ResponseEntity.ok(recruitmentService.getAllInterviews());
    }

    @GetMapping("/interviews/by-application/{applicationId}")
    public ResponseEntity<List<Interview>> getInterviewsByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(recruitmentService.getInterviewsByApplicationId(applicationId));
    }

    @PostMapping("/interviews")
    public ResponseEntity<Interview> createInterview(@RequestBody Interview interview) {
        return ResponseEntity.ok(recruitmentService.createInterview(interview));
    }

    @PutMapping("/interviews/{id}")
    public ResponseEntity<Interview> updateInterview(@PathVariable Long id, @RequestBody Interview interview) {
        return ResponseEntity.ok(recruitmentService.updateInterview(id, interview));
    }

    @PutMapping("/interviews/{id}/cancel")
    public ResponseEntity<Interview> cancelInterview(@PathVariable Long id) {
        return ResponseEntity.ok(recruitmentService.cancelInterview(id));
    }

    @DeleteMapping("/interviews/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable Long id) {
        recruitmentService.deleteInterview(id);
        return ResponseEntity.noContent().build();
    }
}
