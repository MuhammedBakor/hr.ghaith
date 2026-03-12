package com.ghaith.erp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ghaith.erp.model.AdminCompany;
import com.ghaith.erp.model.Department;
import com.ghaith.erp.repository.AdminCompanyRepository;
import com.ghaith.erp.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final AdminCompanyRepository adminCompanyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Department> getAllDepartments(Long branchId) {
        if (branchId != null) {
            List<Department> result = new ArrayList<>(departmentRepository.findAllByBranchId(branchId));

            // Also add departments that match the company's departmentCodes
            adminCompanyRepository.findByBranchId(branchId).ifPresent(company -> {
                String codesStr = company.getDepartmentCodes();
                if (codesStr != null && !codesStr.isEmpty()) {
                    try {
                        List<String> hubCodes = objectMapper.readValue(codesStr, new TypeReference<List<String>>() {
                        });
                        if (hubCodes != null && !hubCodes.isEmpty()) {
                            // Map Hub IDs to DB Codes
                            List<String> dbCodes = new ArrayList<>();
                            for (String hc : hubCodes) {
                                String upper = hc.toUpperCase();
                                dbCodes.add(upper);
                                // Add common mappings
                                if (hc.equals("finance"))
                                    dbCodes.add("FIN");
                                if (hc.equals("property"))
                                    dbCodes.add("PROP");
                                if (hc.equals("operations"))
                                    dbCodes.add("PROJ");
                                if (hc.equals("store"))
                                    dbCodes.add("WH");
                            }

                            List<Department> codeMatched = departmentRepository.findAllByCodeIn(dbCodes);
                            for (Department d : codeMatched) {
                                // Only include if it's either global or matches the branchId
                                if (d.getBranchId() == null || d.getBranchId().equals(branchId)) {
                                    if (result.stream().noneMatch(existing -> existing.getId().equals(d.getId()))) {
                                        result.add(d);
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Ignore parsing errors
                    }
                }
            });
            return result;
        }
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id).orElse(null);
    }

    public Department createDepartment(Department department) {
        if (department.getStatus() == null) {
            department.setStatus("active");
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department departmentDetails) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department != null) {
            department.setName(departmentDetails.getName());
            department.setNameAr(departmentDetails.getNameAr());
            department.setCode(departmentDetails.getCode());
            department.setDescription(departmentDetails.getDescription());
            department.setStatus(departmentDetails.getStatus());
            department.setParentId(departmentDetails.getParentId());
            department.setManagerId(departmentDetails.getManagerId());
            department.setBranchId(departmentDetails.getBranchId());
            return departmentRepository.save(department);
        }
        return null;
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }
}
