package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "performance_reviews")
public class PerformanceReview extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Employee reviewer;

    private LocalDate reviewDate;
    private String period; // e.g., "Q1 2024", "Annual 2023"

    private Integer rating; // 1-5
    private String feedback;
    private String strengths;
    private String improvements;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private ReviewStatus status = ReviewStatus.draft;

    public enum ReviewStatus {
        draft, submitted, finalized
    }
}
