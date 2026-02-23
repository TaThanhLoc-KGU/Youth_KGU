package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.DTO.AccountPermissionDTO;
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

        // ADMIN role always has permission
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return true;
        }

        String username = authentication.getName();
        if (username == null) {
            return false;
        }

        String permissionName = (String) permission;

        // Cache permissions in request attribute to avoid multiple DB calls per request
        @SuppressWarnings("unchecked")
        Set<String> permissions = (Set<String>) request.getAttribute("USER_PERMISSIONS");

        if (permissions == null) {
            try {
                AccountPermissionDTO dto = permissionService.getMyPermissions(username);
                permissions = dto.getQuyenTongHop();
                request.setAttribute("USER_PERMISSIONS", permissions);
            } catch (Exception e) {
                log.error("Error loading permissions for user {}: {}", username, e.getMessage());
                return false;
            }
        }

        return permissions.contains(permissionName);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
}
