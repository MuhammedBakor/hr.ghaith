package com.ghaith.erp.config;

import com.ghaith.erp.model.Role;
import com.ghaith.erp.model.User;
import com.ghaith.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin")
                    .password(passwordEncoder.encode("Admin@2026"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created: admin / Admin@2026");
        }

        if (userRepository.findByEmail("admin2").isEmpty()) {
            User admin2 = User.builder()
                    .username("admin2")
                    .email("admin2")
                    .password(passwordEncoder.encode("Admin2@2026"))
                    .role(Role.USER)
                    .build();
            userRepository.save(admin2);
            System.out.println("Default admin2 user created: admin2 / Admin2@2026");
        }
    }
}
