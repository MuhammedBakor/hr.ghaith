package com.ghaith.erp.service;

import com.ghaith.erp.model.Interview;
import com.ghaith.erp.model.JobApplication;
import com.ghaith.erp.model.RecruitmentJob;
import com.ghaith.erp.repository.InterviewRepository;
import com.ghaith.erp.repository.JobApplicationRepository;
import com.ghaith.erp.repository.RecruitmentJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final RecruitmentJobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;

    // Jobs
    public List<RecruitmentJob> getAllJobs() {
        return jobRepository.findAll();
    }

    public RecruitmentJob getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الوظيفة غير موجودة"));
    }

    @Transactional
    public RecruitmentJob createJob(RecruitmentJob job) {
        return jobRepository.save(job);
    }

    @Transactional
    public RecruitmentJob updateJob(Long id, RecruitmentJob jobDetails) {
        RecruitmentJob job = getJobById(id);
        if (jobDetails.getTitle() != null)
            job.setTitle(jobDetails.getTitle());
        if (jobDetails.getTitleAr() != null)
            job.setTitleAr(jobDetails.getTitleAr());
        if (jobDetails.getLocation() != null)
            job.setLocation(jobDetails.getLocation());
        if (jobDetails.getEmploymentType() != null)
            job.setEmploymentType(jobDetails.getEmploymentType());
        if (jobDetails.getExperienceLevel() != null)
            job.setExperienceLevel(jobDetails.getExperienceLevel());
        if (jobDetails.getDescription() != null)
            job.setDescription(jobDetails.getDescription());
        if (jobDetails.getRequirements() != null)
            job.setRequirements(jobDetails.getRequirements());
        if (jobDetails.getBenefits() != null)
            job.setBenefits(jobDetails.getBenefits());
        if (jobDetails.getOpenings() != null)
            job.setOpenings(jobDetails.getOpenings());
        if (jobDetails.getApplicationDeadline() != null)
            job.setApplicationDeadline(jobDetails.getApplicationDeadline());
        if (jobDetails.getStatus() != null)
            job.setStatus(jobDetails.getStatus());
        return jobRepository.save(job);
    }

    @Transactional
    public void deleteJob(Long id) {
        jobRepository.deleteById(id);
    }

    // Applications
    public List<JobApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    @Transactional
    public JobApplication updateApplicationStatus(Long id, String status) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الطلب غير موجود"));
        // Standardize status conversion
        try {
            application.setStatus(JobApplication.ApplicationStatus.valueOf(status.toLowerCase()));
        } catch (IllegalArgumentException e) {
            // Fallback or more robust mapping if needed
            application.setStatus(JobApplication.ApplicationStatus.pending);
        }
        return applicationRepository.save(application);
    }

    // Interviews
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    @Transactional
    public Interview createInterview(Interview interview) {
        return interviewRepository.save(interview);
    }
}
