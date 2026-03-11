package com.ghaith.erp.config;

import com.ghaith.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserRepository repository;

    // كاش بسيط لتفاصيل المستخدم لتقليل استعلامات قاعدة البيانات (TTL: 5 دقائق)
    private static final Map<String, CachedUserDetails> userDetailsCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;

    private static class CachedUserDetails {
        final UserDetails userDetails;
        final long expiresAt;
        CachedUserDetails(UserDetails userDetails) {
            this.userDetails = userDetails;
            this.expiresAt = System.currentTimeMillis() + CACHE_TTL_MS;
        }
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    public static void evictUserCache(String email) {
        userDetailsCache.remove(email);
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            CachedUserDetails cached = userDetailsCache.get(username);
            if (cached != null && !cached.isExpired()) {
                return cached.userDetails;
            }
            UserDetails userDetails = repository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            userDetailsCache.put(username, new CachedUserDetails(userDetails));
            return userDetails;
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
