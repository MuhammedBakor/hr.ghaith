package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "hr_leave_balances", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "leave_type"})
})
public class LeaveBalance extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "leave_type", nullable = false)
    private String leaveType; // annual, sick, emergency, unpaid, maternity

    @Builder.Default
    @Column(nullable = false)
    private Integer totalBalance = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer usedBalance = 0;

    public Integer getRemainingBalance() {
        return totalBalance - usedBalance;
    }
}
