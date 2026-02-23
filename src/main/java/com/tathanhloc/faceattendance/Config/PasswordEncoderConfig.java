package com.tathanhloc.faceattendance.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Tách PasswordEncoder ra config riêng để phá vòng lặp dependency:
 * SecurityConfig → CustomPermissionEvaluator → PermissionService → PasswordEncoder → SecurityConfig
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
