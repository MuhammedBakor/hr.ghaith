package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "tickets")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket extends BaseEntity {

    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String priority; // low, medium, high, urgent

    private String category; // general, technical, billing, hr, it, complaint, suggestion

    private String status; // open, in_progress, resolved, closed

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "assigned_to_id")
    private Long assignedToId;

    @jakarta.persistence.Transient
    private String authorName;

    @jakarta.persistence.Transient
    private String authorRole;

    @jakarta.persistence.Transient
    private String authorDepartment;

    @jakarta.persistence.Transient
    private String authorBranch;
}
