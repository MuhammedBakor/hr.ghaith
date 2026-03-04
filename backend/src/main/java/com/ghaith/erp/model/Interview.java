package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "resumeUrl" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(name = "interview_date")
    private LocalDateTime interviewDate;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt; // Preferred field name from frontend

    private String interviewer;

    @Column(name = "interview_type")
    private String interviewType; // phone, video, in_person, technical, hr, final

    private Integer duration; // in minutes

    private String location; // Physical or link

    @Column(name = "meeting_link")
    private String meetingLink;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private InterviewStatus status = InterviewStatus.scheduled;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum InterviewStatus {
        scheduled, completed, cancelled, reschedulled
    }
}
