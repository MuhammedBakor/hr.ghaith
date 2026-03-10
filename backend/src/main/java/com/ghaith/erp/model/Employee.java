package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"manager"})
@ToString(exclude = {"manager"})
@Entity
@Table(name = "employees")
public class Employee extends BaseEntity {

    @Transient // Not persisted in employees table, but used to pass role for User creation
    private String role;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(unique = true, nullable = false)
    private String employeeNumber;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String email;
    private String phone;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private HrBranch branch;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "manager" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeStatus status = EmployeeStatus.active;

    @Column(precision = 15, scale = 2)
    private BigDecimal salary;

    // Personal Info
    private String nationalId;
    private String nationality;
    private String dateOfBirth;
    private String gender;
    private String maritalStatus;
    private String address;
    private String city;

    // Emergency Contact
    private String emergencyName;
    private String emergencyRelation;
    private String emergencyPhone;

    // Bank Info
    private String bankName;
    private String bankAccount;
    private String iban;

    public String getUserRole() {
        if (user != null && user.getRole() != null) {
            return user.getRole().name();
        }
        return role;
    }

    public java.util.List<String> getUserRoles() {
        if (user != null) {
            return user.getAllRoles();
        }
        if (role != null && !role.isBlank()) {
            return java.util.List.of(role);
        }
        return java.util.List.of();
    }

    public enum EmployeeStatus {
        active, inactive, terminated, on_leave, suspended, incomplete
    }
}
