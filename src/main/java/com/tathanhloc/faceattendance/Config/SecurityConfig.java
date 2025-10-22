package com.tathanhloc.faceattendance.Config;

import com.tathanhloc.faceattendance.Security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security Configuration cho Activity Attendance System
 * Roles: ADMIN, BCH, SINHVIEN
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Hoạt động - Public read, Admin write
                        .requestMatchers(HttpMethod.GET, "/api/hoat-dong/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/hoat-dong/**").hasAnyRole("ADMIN", "BCH")
                        .requestMatchers(HttpMethod.PUT, "/api/hoat-dong/**").hasAnyRole("ADMIN", "BCH")
                        .requestMatchers(HttpMethod.DELETE, "/api/hoat-dong/**").hasRole("ADMIN")

                        // Đăng ký - Sinh viên có thể đăng ký
                        .requestMatchers(HttpMethod.POST, "/api/dang-ky").hasRole("SINHVIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/dang-ky").hasRole("SINHVIEN")
                        .requestMatchers(HttpMethod.GET, "/api/dang-ky/student/**").hasRole("SINHVIEN")
                        .requestMatchers("/api/dang-ky/**").hasAnyRole("ADMIN", "BCH")

                        // Điểm danh - BCH quét QR
                        .requestMatchers(HttpMethod.POST, "/api/diem-danh/scan").hasRole("BCH")
                        .requestMatchers(HttpMethod.POST, "/api/diem-danh/check-out").hasRole("BCH")
                        .requestMatchers("/api/diem-danh/**").hasAnyRole("ADMIN", "BCH")

                        // BCH Management - Admin only
                        .requestMatchers("/api/bch/**").hasRole("ADMIN")

                        // Chứng nhận
                        .requestMatchers(HttpMethod.GET, "/api/chung-nhan/student/**").hasRole("SINHVIEN")
                        .requestMatchers("/api/chung-nhan/**").hasAnyRole("ADMIN", "BCH")

                        // Thống kê
                        .requestMatchers(HttpMethod.GET, "/api/thong-ke/sinh-vien/**").hasRole("SINHVIEN")
                        .requestMatchers("/api/thong-ke/**").hasAnyRole("ADMIN", "BCH")

                        // QR Code utilities - BCH và Sinh viên
                        .requestMatchers("/api/qrcode/**").authenticated()

                        // Tất cả requests khác cần authenticated
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
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
