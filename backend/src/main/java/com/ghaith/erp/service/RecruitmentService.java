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
    private final EmailService emailService;

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
            String cleanStatus = status.replace("\"", "").trim();
            application.setStatus(JobApplication.ApplicationStatus.valueOf(cleanStatus.toLowerCase()));
        } catch (IllegalArgumentException e) {
            // Log error or handle fallback
            application.setStatus(JobApplication.ApplicationStatus.pending);
        }
        return applicationRepository.save(application);
    }

    // Interviews
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public List<Interview> getInterviewsByApplicationId(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }

    @Transactional
    public Interview createInterview(Interview interview) {
        // Extract applicationId BEFORE save (the deserialized object has only id set, not full fields)
        Long appId = (interview.getApplication() != null) ? interview.getApplication().getId() : null;
        Interview saved = interviewRepository.save(interview);
        if (appId != null) {
            applicationRepository.findById(appId).ifPresent(app -> {
                String scheduledAt = saved.getScheduledAt() != null
                        ? saved.getScheduledAt().toString()
                        : (saved.getInterviewDate() != null ? saved.getInterviewDate().toString() : "");
                emailService.sendInterviewScheduled(
                        app.getEmail(), app.getApplicantName(), app.getPosition(),
                        saved.getInterviewType(), scheduledAt,
                        saved.getDuration(), saved.getLocation(), saved.getMeetingLink());
            });
        }
        return saved;
    }

    @Transactional
    public JobApplication createApplication(JobApplication application) {
        return applicationRepository.save(application);
    }

    @Transactional
    public JobApplication updateApplication(Long id, JobApplication applicationDetails) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الطلب غير موجود"));
        if (applicationDetails.getApplicantName() != null)
            application.setApplicantName(applicationDetails.getApplicantName());
        if (applicationDetails.getPosition() != null)
            application.setPosition(applicationDetails.getPosition());
        if (applicationDetails.getEmail() != null)
            application.setEmail(applicationDetails.getEmail());
        if (applicationDetails.getPhone() != null)
            application.setPhone(applicationDetails.getPhone());
        if (applicationDetails.getResumeUrl() != null)
            application.setResumeUrl(applicationDetails.getResumeUrl());
        if (applicationDetails.getStatus() != null)
            application.setStatus(applicationDetails.getStatus());
        return applicationRepository.save(application);
    }

    @Transactional
    public void deleteApplication(Long id) {
        applicationRepository.deleteById(id);
    }

    @Transactional
    public Interview updateInterview(Long id, Interview interviewDetails) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("المقابلة غير موجودة"));
        if (interviewDetails.getInterviewDate() != null)
            interview.setInterviewDate(interviewDetails.getInterviewDate());
        if (interviewDetails.getScheduledAt() != null)
            interview.setScheduledAt(interviewDetails.getScheduledAt());
        if (interviewDetails.getInterviewer() != null)
            interview.setInterviewer(interviewDetails.getInterviewer());
        if (interviewDetails.getInterviewType() != null)
            interview.setInterviewType(interviewDetails.getInterviewType());
        if (interviewDetails.getDuration() != null)
            interview.setDuration(interviewDetails.getDuration());
        if (interviewDetails.getLocation() != null)
            interview.setLocation(interviewDetails.getLocation());
        if (interviewDetails.getMeetingLink() != null)
            interview.setMeetingLink(interviewDetails.getMeetingLink());
        if (interviewDetails.getStatus() != null)
            interview.setStatus(interviewDetails.getStatus());
        if (interviewDetails.getNotes() != null)
            interview.setNotes(interviewDetails.getNotes());
        // Extract applicationId from the managed entity (Hibernate proxy has id available without full load)
        Long appId = (interview.getApplication() != null) ? interview.getApplication().getId() : null;
        Interview saved = interviewRepository.save(interview);
        if (appId != null) {
            applicationRepository.findById(appId).ifPresent(app -> {
                String scheduledAt = saved.getScheduledAt() != null
                        ? saved.getScheduledAt().toString()
                        : (saved.getInterviewDate() != null ? saved.getInterviewDate().toString() : "");
                emailService.sendInterviewUpdated(
                        app.getEmail(), app.getApplicantName(), app.getPosition(),
                        saved.getInterviewType(), scheduledAt,
                        saved.getDuration(), saved.getLocation(), saved.getMeetingLink());
            });
        }
        return saved;
    }

    @Transactional
    public Interview cancelInterview(Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("المقابلة غير موجودة"));
        Long appId = (interview.getApplication() != null) ? interview.getApplication().getId() : null;
        interview.setStatus(Interview.InterviewStatus.cancelled);
        Interview saved = interviewRepository.save(interview);
        if (appId != null) {
            applicationRepository.findById(appId).ifPresent(app ->
                emailService.sendInterviewCancelled(app.getEmail(), app.getApplicantName(), app.getPosition()));
        }
        return saved;
    }

    @Transactional
    public void deleteInterview(Long id) {
        interviewRepository.deleteById(id);
    }
}
