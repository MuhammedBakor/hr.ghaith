package com.ghaith.erp.config;

import com.ghaith.erp.model.Department;
import com.ghaith.erp.model.Role;
import com.ghaith.erp.model.User;
import com.ghaith.erp.repository.DepartmentRepository;
import com.ghaith.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Fix employees_status_check constraint to include 'incomplete' (ddl-auto:update never updates existing constraints)
        try {
            jdbcTemplate.execute("ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check");
            jdbcTemplate.execute(
                "ALTER TABLE employees ADD CONSTRAINT employees_status_check " +
                "CHECK (status IN ('active','inactive','terminated','on_leave','suspended','incomplete'))"
            );
        } catch (Exception e) {
            System.out.println("Note: Could not update employees_status_check constraint: " + e.getMessage());
        }
        // Seed default users
        if (userRepository.findByEmail("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin")
                    .password(passwordEncoder.encode("Admin@2026"))
                    .role(Role.OWNER)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created: admin / Admin@2026");
        }

        if (userRepository.findByEmail("admin2").isEmpty()) {
            User admin2 = User.builder()
                    .username("admin2")
                    .email("admin2")
                    .password(passwordEncoder.encode("Admin2@2026"))
                    .role(Role.EMPLOYEE)
                    .enabled(true)
                    .build();
            userRepository.save(admin2);
            System.out.println("Default admin2 user created: admin2 / Admin2@2026");
        }

        // Seed default departments
        seedDepartment("HR", "الموارد البشرية", "Human Resources");
        seedDepartment("FIN", "المالية", "Finance");
        seedDepartment("FLEET", "الأسطول", "Fleet");
        seedDepartment("PROP", "إدارة الأملاك", "Properties");
        seedDepartment("LEGAL", "الشؤون القانونية", "Legal");
        seedDepartment("PROJ", "العمليات", "Operations");
        seedDepartment("WH", "المخازن", "Warehouses");
        seedDepartment("UMRAH", "العمرة", "Umrah");
    }

    private void seedDepartment(String code, String nameAr, String name) {
        if (departmentRepository.findByCode(code).isEmpty()) {
            Department dept = Department.builder()
                    .code(code)
                    .name(name)
                    .nameAr(nameAr)
                    .status("active")
                    .build();
            departmentRepository.save(dept);
            System.out.println("Default department created: " + nameAr + " (" + code + ")");
        }
    }
}
