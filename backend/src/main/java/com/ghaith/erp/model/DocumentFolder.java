package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_folders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class DocumentFolder extends BaseEntity {
    @Column(nullable = false)
    private String name;
}
