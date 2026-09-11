package com.tathanhloc.youthkgu.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.Service.SystemSettingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Chế độ bảo trì — khi feature-flag {@code hethong.bao_tri} = true, mọi request {@code /api/**} của
 * tài khoản KHÔNG phải {@code ROLE_ADMIN} bị trả 503 kèm thông báo {@code hethong.bao_tri_thong_bao}.
 * <p>
 * ĐƯỜNG THOÁT KHOÁ ADMIN — luôn cho qua (xem {@link #shouldNotFilter}):
 * <ul>
 *   <li>{@code /api/auth/**} — admin đăng nhập lại lấy token mới trong lúc bảo trì</li>
 *   <li>{@code /api/system-settings/public} + {@code /api/permissions/me} — SPA hydrate được</li>
 *   <li>static asset do Vite/nginx phục vụ, nằm ngoài Spring</li>
 * </ul>
 * Kill-switch cuối cùng khi hỏng hẳn: sửa DB {@code UPDATE system_setting SET gia_tri='false' WHERE
 * khoa_setting='hethong.bao_tri'} rồi RESTART backend (xem V62__system_setting.sql).
 * <p>
 * Chạy SAU {@link JwtAuthenticationFilter} (đăng ký bằng {@code addFilterAfter} trong SecurityConfig)
 * để {@code SecurityContextHolder} đã có authentication.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemSettingService systemSettingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/")) return true;
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        return uri.startsWith("/api/auth/")
                || uri.equals("/api/system-settings/public")
                || uri.equals("/api/permissions/me")
                || uri.equals("/api/health")
                || uri.startsWith("/api/uploads/")
                || uri.startsWith("/uploads/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (!systemSettingService.getBoolean("hethong.bao_tri", false)) {
            chain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (isAdmin) {
            chain.doFilter(request, response);
            return;
        }

        String message = systemSettingService.getString("hethong.bao_tri_thong_bao",
                "Hệ thống đang bảo trì, vui lòng quay lại sau.");
        response.setStatus(503);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", "3600");
        objectMapper.writeValue(response.getWriter(),
                Map.of("success", false, "message", message, "code", 503));
    }
}
