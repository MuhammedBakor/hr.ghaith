package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "recruitment_jobs")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentJob extends BaseEntity {

    private String title;

    @Column(name = "title_ar")
    private String titleAr;

    private String location;

    @Column(name = "employment_type")
    private String employmentType; // full_time, part_time, contract, internship

    @Column(name = "experience_level")
    private String experienceLevel; // entry, mid, senior, executive

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    private Integer openings;

    @Column(name = "application_deadline")
    private LocalDateTime applicationDeadline;

    @Builder.Default
    private String status = "draft"; // draft, open, closed, filled, on_hold
}
