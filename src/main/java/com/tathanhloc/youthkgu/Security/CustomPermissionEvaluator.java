package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.Service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final PermissionService permissionService;
    private final HttpServletRequest request;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // ROLE_ADMIN (VaiTro.ADMIN) → toàn quyền
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }

        String username = authentication.getName();
        if (username == null) return false;

        String permissionName = (String) permission;

        // Cache permissions trong request scope để tránh N+1 query
        @SuppressWarnings("unchecked")
        Set<String> cachedPerms = (Set<String>) request.getAttribute("USER_PERMISSIONS");

        if (cachedPerms == null) {
            try {
                Set<String> loaded = permissionService.getEffectivePermissions(username);
                // null = admin (không nên xảy ra ở đây vì đã check ROLE_ADMIN ở trên)
                cachedPerms = (loaded != null) ? loaded : new java.util.HashSet<>();
                request.setAttribute("USER_PERMISSIONS", cachedPerms);
            } catch (Exception e) {
                log.error("Lỗi load permissions cho user {}: {}", username, e.getMessage());
                return false;
            }
        }

        return cachedPerms.contains(permissionName);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
}
