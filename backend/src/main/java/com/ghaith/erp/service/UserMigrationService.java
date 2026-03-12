package com.ghaith.erp.service;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.User;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserMigrationService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public String unifyDuplicateUsers() {
        List<User> allUsers = userRepository.findAll();

        // Group by lowercase email
        Map<String, List<User>> groupedByEmail = allUsers.stream()
                .filter(u -> u.getEmail() != null)
                .collect(Collectors.groupingBy(u -> u.getEmail().toLowerCase()));

        int unifiedCount = 0;
        int employeeMovedCount = 0;

        for (Map.Entry<String, List<User>> entry : groupedByEmail.entrySet()) {
            List<User> duplicates = entry.getValue();
            if (duplicates.size() > 1) {
                // Keep the first one (usually the oldest or the one with a password)
                User primaryUser = duplicates.get(0);

                for (int i = 1; i < duplicates.size(); i++) {
                    User duplicateUser = duplicates.get(i);

                    // Move all employees from duplicate to primary
                    List<Employee> employees = employeeRepository.findByUserId(duplicateUser.getId());
                    for (Employee emp : employees) {
                        emp.setUser(primaryUser);
                        employeeRepository.save(emp);
                        employeeMovedCount++;
                    }

                    // Delete the duplicate user
                    userRepository.delete(duplicateUser);
                    unifiedCount++;
                }
            }
        }

        return String.format("Unified %d duplicate users and moved %d employee records.", unifiedCount,
                employeeMovedCount);
    }
}
