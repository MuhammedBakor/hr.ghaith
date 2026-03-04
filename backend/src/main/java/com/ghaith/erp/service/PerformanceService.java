package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceReviewRepository reviewRepository;
    private final PerformanceGoalRepository goalRepository;
    private final PerformanceKPIRepository kpiRepository;
    private final EmployeeRepository employeeRepository;

    // Reviews
    public List<PerformanceReview> getAllReviews() {
        return reviewRepository.findAll();
    }

    @Transactional
    public PerformanceReview createReview(Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        Employee reviewer = null;
        if (payload.get("reviewerId") != null && !payload.get("reviewerId").toString().isEmpty()) {
            try {
                Long reviewerId = ((Number) payload.get("reviewerId")).longValue();
                reviewer = employeeRepository.findById(reviewerId).orElse(null);
            } catch (Exception e) {
                // Ignore invalid reviewer ID
            }
        }

        // Handle rating as Number
        Integer rating = null;
        if (payload.get("rating") != null) {
            rating = ((Number) payload.get("rating")).intValue();
        }

        // Handle status safely
        PerformanceReview.ReviewStatus status = PerformanceReview.ReviewStatus.draft;
        if (payload.get("status") != null) {
            try {
                status = PerformanceReview.ReviewStatus.valueOf(payload.get("status").toString());
            } catch (Exception e) {
                // Keep default
            }
        }

        PerformanceReview review = PerformanceReview.builder()
                .employee(employee)
                .reviewer(reviewer != null ? reviewer : employee) // Fallback to employee if null to satisfy
                                                                  // nullable=false
                .period((String) payload.get("period"))
                .rating(rating)
                .feedback((String) payload.get("feedback"))
                .strengths((String) payload.get("strengths"))
                .improvements((String) payload.get("improvements"))
                .status(status)
                .build();

        if (payload.get("reviewDate") != null) {
            try {
                review.setReviewDate(java.time.LocalDate.parse(payload.get("reviewDate").toString()));
            } catch (Exception e) {
                review.setReviewDate(java.time.LocalDate.now());
            }
        } else {
            review.setReviewDate(java.time.LocalDate.now());
        }

        return reviewRepository.save(review);
    }

    // Goals
    public List<PerformanceGoal> getAllGoals() {
        return goalRepository.findAll();
    }

    @Transactional
    public PerformanceGoal createGoal(Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        // Handle status safely
        PerformanceGoal.GoalStatus status = PerformanceGoal.GoalStatus.in_progress;
        if (payload.get("status") != null) {
            try {
                status = PerformanceGoal.GoalStatus.valueOf(payload.get("status").toString());
            } catch (Exception e) {
                // Keep default
            }
        }

        PerformanceGoal goal = PerformanceGoal.builder()
                .employee(employee)
                .title((String) payload.get("title"))
                .description((String) payload.get("description"))
                .progress(payload.get("progress") != null ? ((Number) payload.get("progress")).intValue() : 0)
                .status(status)
                .build();

        if (payload.get("deadline") != null && !payload.get("deadline").toString().isEmpty()) {
            try {
                goal.setDeadline(java.time.LocalDate.parse(payload.get("deadline").toString()));
            } catch (Exception e) {
                // Ignore invalid date
            }
        }

        return goalRepository.save(goal);
    }

    // KPIs
    public List<PerformanceKPI> getAllKPIs() {
        return kpiRepository.findAll();
    }
}
