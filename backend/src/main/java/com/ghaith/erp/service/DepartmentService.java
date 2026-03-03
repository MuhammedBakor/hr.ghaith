package com.ghaith.erp.service;

import com.ghaith.erp.model.Department;
import com.ghaith.erp.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
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
            return departmentRepository.save(department);
        }
        return null;
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }
}
