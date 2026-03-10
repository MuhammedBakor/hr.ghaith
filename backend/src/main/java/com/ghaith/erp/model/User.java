package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "_users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Comma-separated additional roles (e.g. "SUPERVISOR,EMPLOYEE")
    @Column(name = "roles")
    private String roles;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = false;

    private String verificationCode;

    /** Returns all roles as a list (primary + additional) */
    public List<String> getAllRoles() {
        java.util.ArrayList<String> result = new java.util.ArrayList<>();
        if (role != null) result.add(role.name());
        if (roles != null && !roles.isBlank()) {
            for (String r : roles.split(",")) {
                String trimmed = r.trim();
                if (!trimmed.isEmpty() && !result.contains(trimmed)) {
                    result.add(trimmed);
                }
            }
        }
        return result;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        java.util.ArrayList<GrantedAuthority> authorities = new java.util.ArrayList<>();
        for (String r : getAllRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + r));
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
