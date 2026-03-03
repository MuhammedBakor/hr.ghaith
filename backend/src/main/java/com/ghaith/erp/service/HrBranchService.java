package com.ghaith.erp.service;

import com.ghaith.erp.model.HrBranch;
import com.ghaith.erp.repository.HrBranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HrBranchService {
    private final HrBranchRepository hrBranchRepository;

    public List<HrBranch> getAllBranches() {
        return hrBranchRepository.findAll();
    }

    public HrBranch getBranchById(Long id) {
        return hrBranchRepository.findById(id).orElse(null);
    }

    public HrBranch createBranch(HrBranch branch) {
        return hrBranchRepository.save(branch);
    }

    public HrBranch updateBranch(Long id, HrBranch branchDetails) {
        HrBranch branch = hrBranchRepository.findById(id).orElse(null);
        if (branch != null) {
            branch.setName(branchDetails.getName());
            branch.setNameAr(branchDetails.getNameAr());
            branch.setCode(branchDetails.getCode());
            branch.setCity(branchDetails.getCity());
            branch.setAddress(branchDetails.getAddress());
            branch.setPhone(branchDetails.getPhone());
            branch.setEmail(branchDetails.getEmail());
            branch.setIsActive(branchDetails.getIsActive());
            return hrBranchRepository.save(branch);
        }
        return null;
    }

    public void deleteBranch(Long id) {
        hrBranchRepository.deleteById(id);
    }
}
