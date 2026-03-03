package com.ghaith.erp.service;

import com.ghaith.erp.model.Interview;
import com.ghaith.erp.model.JobApplication;
import com.ghaith.erp.repository.InterviewRepository;
import com.ghaith.erp.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final JobApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;

    // Applications
    public List<JobApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Optional<JobApplication> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    public JobApplication createApplication(JobApplication application) {
        return applicationRepository.save(application);
    }

    public JobApplication updateApplication(Long id, JobApplication applicationDetails) {
        return applicationRepository.findById(id)
                .map(application -> {
                    application.setApplicantName(applicationDetails.getApplicantName());
                    application.setPosition(applicationDetails.getPosition());
                    application.setEmail(applicationDetails.getEmail());
                    application.setPhone(applicationDetails.getPhone());
                    application.setResumeUrl(applicationDetails.getResumeUrl());
                    application.setStatus(applicationDetails.getStatus());
                    return applicationRepository.save(application);
                }).orElseThrow(() -> new RuntimeException("Application not found with id " + id));
    }

    public void deleteApplication(Long id) {
        applicationRepository.deleteById(id);
    }

    // Interviews
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public List<Interview> getInterviewsByApplication(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }

    public Interview scheduleInterview(Interview interview) {
        return interviewRepository.save(interview);
    }

    public Interview updateInterview(Long id, Interview interviewDetails) {
        return interviewRepository.findById(id)
                .map(interview -> {
                    interview.setInterviewDate(interviewDetails.getInterviewDate());
                    interview.setInterviewer(interviewDetails.getInterviewer());
                    interview.setLocation(interviewDetails.getLocation());
                    interview.setStatus(interviewDetails.getStatus());
                    interview.setNotes(interviewDetails.getNotes());
                    return interviewRepository.save(interview);
                }).orElseThrow(() -> new RuntimeException("Interview not found with id " + id));
    }

    public void deleteInterview(Long id) {
        interviewRepository.deleteById(id);
    }
}
