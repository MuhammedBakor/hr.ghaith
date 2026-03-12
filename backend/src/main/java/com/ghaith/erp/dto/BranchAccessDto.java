package com.ghaith.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BranchAccessDto {
    private Long branchId;
    private String branchName;
    private Long employeeId;
    private String role;
    private String employeeStatus;
}
