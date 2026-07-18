package com.tathanhloc.youthkgu.Config;

import com.tathanhloc.youthkgu.Security.ApiKeyFilter;
import com.tathanhloc.youthkgu.Security.CustomPermissionEvaluator;
import com.tathanhloc.youthkgu.Security.JwtAuthenticationFilter;
import com.tathanhloc.youthkgu.Security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.security.web.firewall.StrictHttpFirewall;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security Configuration cho Activity Attendance System.
 *
 * PasswordEncoder được định nghĩa ở PasswordEncoderConfig để tránh circular dependency:
 *   SecurityConfig → CustomPermissionEvaluator → PermissionService → PasswordEncoder
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;
    private final ApiKeyFilter apiKeyFilter;
    private final UserDetailsService userDetailsService;
    private final CustomPermissionEvaluator customPermissionEvaluator;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // ── Security headers ─────────────────────────────────────────
                .headers(headers -> {
                    headers.frameOptions(f -> f.sameOrigin());
                    headers.contentTypeOptions(c -> {});
                    headers.httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31_536_000));
                    headers.referrerPolicy(r -> r.policy(
                            org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                    headers.permissionsPolicy(p -> p.policy(
                            "camera=(), microphone=(), geolocation=(), payment=()"));
                    headers.addHeaderWriter((req, res) -> res.setHeader(
                            "Content-Security-Policy",
                            "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                            "font-src 'self' https://fonts.gstatic.com; " +
                            "img-src 'self' data: blob: https:; " +
                            "connect-src 'self' https://graph.zalo.me https://openapi.zalo.me; " +
                            "frame-ancestors 'self'"));
                })
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.web.cors.CorsUtils::isPreFlightRequest).permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/hoat-dong/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tin-tuc/public/**").permitAll()
                        .requestMatchers("/api/binh-chon/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        // Webhook ngân hàng (Casso/SePay/PayOS) — gọi từ ngoài, không có JWT
                        .requestMatchers("/api/clb/webhook/**").permitAll()
                        // Webhook Zalo OA — gọi từ Zalo server, không có JWT
                        .requestMatchers("/api/zalo/webhook").permitAll()
                        .requestMatchers("/api/zalo/events").permitAll()
                        .requestMatchers("/api/zalo/linked-users").authenticated()
                        .requestMatchers("/api/zalo/unlink/**").authenticated()
                        .requestMatchers("/api/zalo/oauth/callback").permitAll()
                        .requestMatchers("/api/zalo/oauth/start").permitAll()
                        .requestMatchers("/api/zalo/exchange-token").permitAll()
                        .requestMatchers("/api/zalo/test-send").authenticated()
                        .requestMatchers("/api/zalo/broadcast").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/permissions/me").authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(customPermissionEvaluator);
        return expressionHandler;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // setAllowedOriginPatterns("*") cho phép tất cả origin kể cả null (Zalo Mini App WebView)
        // Không dùng setAllowedOrigins("*") vì không tương thích với allowCredentials=true
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
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
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Cho phép %2F (encoded slash) trong URL path — cần thiết khi maHoatDong chứa dấu /
    @Bean
    public HttpFirewall allowEncodedSlashFirewall() {
        StrictHttpFirewall firewall = new StrictHttpFirewall();
        firewall.setAllowUrlEncodedSlash(true);
        return firewall;
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.httpFirewall(allowEncodedSlashFirewall());
    }
}
