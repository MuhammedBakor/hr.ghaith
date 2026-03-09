package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "employee_documents")
public class EmployeeDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String documentType; // cv, passport, national_id, education_certificate, etc.

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String filePath;

    private String fileSize;

    private String contentType;

    private String expiryDate;

    @Builder.Default
    private String status = "valid"; // valid, expiring, expired
}
