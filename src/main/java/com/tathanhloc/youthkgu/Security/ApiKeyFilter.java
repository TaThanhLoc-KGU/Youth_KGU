package com.tathanhloc.youthkgu.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * API Key filter cho các webhook endpoint gọi từ bên ngoài
 * (Zalo, PayOS, Casso...) để đảm bảo chỉ partner được phép gọi.
 *
 * Header: X-Api-Key: <secret>
 * Bật/tắt qua: app.api-key.enabled=true
 */
@Component
@Slf4j
public class ApiKeyFilter extends OncePerRequestFilter {

    @Value("${app.api-key.secret:#{null}}")
    private String apiKeySecret;

    @Value("${app.api-key.enabled:false}")
    private boolean enabled;

    // Các path cần API key (webhook từ bên ngoài)
    private static final Set<String> PROTECTED_PATHS = Set.of(
            "/api/clb/webhook",
            "/api/zalo/webhook",
            "/api/zalo/events"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        if (!enabled || apiKeySecret == null) {
            chain.doFilter(req, res);
            return;
        }

        String clientKey = req.getHeader("X-Api-Key");
        if (clientKey == null || !apiKeySecret.equals(clientKey)) {
            log.warn("Invalid API key from IP={} path={}", req.getRemoteAddr(), req.getRequestURI());
            res.setStatus(403);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(res.getWriter(), Map.of(
                    "success", false,
                    "message", "API key không hợp lệ"
            ));
            return;
        }

        chain.doFilter(req, res);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String path = req.getRequestURI();
        return PROTECTED_PATHS.stream().noneMatch(path::startsWith);
    }
}
