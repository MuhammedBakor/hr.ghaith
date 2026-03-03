package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "hr_field_tracking_points")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FieldTrackingPoint extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "session_id")
    private FieldTrackingSession session;

    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;

    private String pointType; // checkpoint, stop
    private Integer stopDuration; // in minutes
    private String notes;
}
