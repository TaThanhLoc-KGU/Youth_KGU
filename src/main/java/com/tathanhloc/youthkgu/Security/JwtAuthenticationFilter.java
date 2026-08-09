package com.tathanhloc.youthkgu.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * JWT Authentication Filter - FIXED VERSION
 * Thêm validation để tránh parse JWT token không hợp lệ
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        } else if (request.getRequestURI().endsWith("/api/notifications/stream") && request.getParameter("token") != null) {
            // EventSource (SSE) không set được header Authorization — chỉ endpoint này mới nhận token qua query param
            jwt = request.getParameter("token");
        }

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // ✅ FIX 2: Kiểm tra JWT token không rỗng và có đúng format
            if (jwt.trim().isEmpty() || !isValidJwtFormat(jwt)) {
                log.warn("Invalid JWT token format received");
                filterChain.doFilter(request, response);
                return;
            }

            final String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("User {} authenticated successfully", username);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
            // ✅ FIX 3: Không throw exception, chỉ log và cho request tiếp tục
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Kiểm tra JWT token có đúng format không (phải có 2 dấu chấm: header.payload.signature)
     */
    private boolean isValidJwtFormat(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        // JWT hợp lệ phải có đúng 2 dấu chấm (3 phần: header.payload.signature)
        long periodCount = token.chars().filter(ch -> ch == '.').count();
        return periodCount == 2;
    }
}