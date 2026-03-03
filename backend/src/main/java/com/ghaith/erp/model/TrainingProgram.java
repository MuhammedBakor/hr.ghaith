package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "training_programs")
public class TrainingProgram extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingType trainingType = TrainingType.optional;

    private String provider;

    private Integer duration;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DurationUnit durationUnit = DurationUnit.hours;

    @Column(precision = 15, scale = 2)
    private BigDecimal cost;

    private Integer maxParticipants;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgramStatus status = ProgramStatus.draft;

    public enum TrainingType {
        mandatory, optional, certification, skill_development
    }

    public enum DurationUnit {
        hours, days, weeks
    }

    public enum ProgramStatus {
        draft, active, completed, cancelled
    }
}
