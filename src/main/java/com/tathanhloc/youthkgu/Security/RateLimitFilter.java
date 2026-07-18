package com.tathanhloc.youthkgu.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Sliding-window rate limiter dùng Caffeine cache.
 *
 * Buckets (per IP):
 *   auth_strict  → 10 req / 60 s  (login, zalo-login, forgot-password)
 *   auth_normal  → 30 req / 60 s  (register, refresh)
 *   default      → 300 req / 60 s (mọi endpoint còn lại)
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // Key = "IP:bucket", value = số request trong cửa sổ 60s
    private final Cache<String, AtomicInteger> cache = Caffeine.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .maximumSize(50_000)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String ip = resolveClientIp(req);
        String path = req.getRequestURI();

        String bucket = resolveBucket(path);
        int limit = resolveLimit(bucket);

        String key = ip + ":" + bucket;
        AtomicInteger counter = cache.get(key, k -> new AtomicInteger(0));

        int current = counter.incrementAndGet();

        // Thêm header thông báo
        res.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        res.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - current)));

        if (current > limit) {
            log.warn("Rate limit exceeded: ip={} path={} count={}/{}", ip, path, current, limit);
            res.setStatus(429);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(res.getWriter(), Map.of(
                    "success", false,
                    "message", "Quá nhiều yêu cầu. Vui lòng thử lại sau."
            ));
            return;
        }

        chain.doFilter(req, res);
    }

    private String resolveBucket(String path) {
        if (path.matches(".*/api/auth/(login|zalo-login|forgot-password)$")) return "auth_strict";
        if (path.matches(".*/api/auth/(register|refresh)$")) return "auth_normal";
        return "default";
    }

    private int resolveLimit(String bucket) {
        return switch (bucket) {
            case "auth_strict"  -> 10;
            case "auth_normal"  -> 30;
            default             -> 300;
        };
    }

    /** Lấy IP thật khi đứng sau Nginx reverse proxy */
    private String resolveClientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Real-IP");
        if (ip == null || ip.isBlank()) ip = req.getHeader("X-Forwarded-For");
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        if (ip == null || ip.isBlank()) ip = req.getRemoteAddr();
        return ip;
    }

    /** Bỏ qua các request không cần rate-limit (static files, actuator...) */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String path = req.getRequestURI();
        return path.startsWith("/uploads/")
                || path.startsWith("/actuator/health")
                || path.equals("/api/health");
    }
}
