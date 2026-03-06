package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "legal_documents")
public class LegalDocument extends BaseEntity {
    private String title;
    private String type; // template, playbook, print, etc.
    private String contentUrl;
    private String category;
}
