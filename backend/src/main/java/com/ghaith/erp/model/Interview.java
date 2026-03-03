package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "recruitment_interviews")
public class Interview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(nullable = false)
    private LocalDateTime interviewDate;

    private String interviewer;

    private String location; // Physical or link

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private InterviewStatus status = InterviewStatus.scheduled;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum InterviewStatus {
        scheduled, completed, cancelled, reschedulled
    }
}
