package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.Exception.ScopeAccessDeniedException;
import com.tathanhloc.youthkgu.Service.KhoaScopeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lớp phân quyền theo TÀI NGUYÊN (ABAC-lite) — kiểm tra tập trung tại 1 chỗ thay vì rải rác.
 * <p>
 * Quy tắc phạm vi:
 * <ul>
 *   <li><b>ADMIN / Đoàn trường</b> (không có scope khoa và CLB) → làm mọi thứ.</li>
 *   <li><b>Tài khoản CLB</b> → chỉ READ/WRITE/APPROVE tài nguyên của đúng CLB mình.</li>
 *   <li><b>Tài khoản khoa</b> → READ: khoa mình + tài nguyên chung (khoa == null).
 *       WRITE/APPROVE: CHỈ tài nguyên đúng khoa mình (không chung, không khoa khác, không CLB).</li>
 * </ul>
 * FAIL-CLOSED: không xác định được → coi như bị scope, chặn (khác controller cũ resolveKhoaScope fail-open).
 * <p>
 * Mở rộng: thêm loại tài nguyên khác = thêm 1 {@link ResourceScopeResolver} bean, KHÔNG sửa file này.
 */
@Service
@Slf4j
public class AccessPolicyService {

    private final KhoaScopeService khoaScopeService;
    private final Map<Class<?>, ResourceScopeResolver> resolvers;

    public AccessPolicyService(KhoaScopeService khoaScopeService, List<ResourceScopeResolver> resolverList) {
        this.khoaScopeService = khoaScopeService;
        this.resolvers = resolverList.stream()
                .collect(Collectors.toMap(ResourceScopeResolver::supports, r -> r));
    }

    /** Phạm vi của người đang gọi. unrestricted = ADMIN hoặc Đoàn trường (không khoa, không CLB). */
    public record CallerScope(boolean unrestricted, String maKhoa, String maClb) {}

    private static final java.util.Set<String> SCOPED_ROLES = java.util.Set.of(
            "ROLE_MANAGER_KHOA", "ROLE_MANAGER_CHI_DOAN", "ROLE_MANAGER_CLB");

    public CallerScope currentScope() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return new CallerScope(true, null, null); // context nội bộ (scheduler) hoặc chưa auth
        }

        java.util.Set<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority()).collect(Collectors.toSet());

        if (roles.contains("ROLE_ADMIN")) return new CallerScope(true, null, null);

        // Chỉ CÁN BỘ có scope khoa/CLB mới bị siết phạm vi. ROLE_USER (đoàn viên, CTV điểm danh) và
        // các role khác → thấy mọi hoạt động (visibility công khai xử lý bằng cờ congKhai / endpoint public).
        boolean scopedRole = roles.stream().anyMatch(SCOPED_ROLES::contains);
        if (!scopedRole) return new CallerScope(true, null, null);

        String maClb = khoaScopeService.getCurrentMaClb();
        String maKhoa = (maClb == null) ? khoaScopeService.getCurrentMaKhoa() : null;
        if (maClb == null && maKhoa == null) {
            // Cán bộ chưa gán khoa/CLB → coi như cấp trường (giữ ngữ nghĩa "không có scope = thấy tất cả").
            return new CallerScope(true, null, null);
        }
        return new CallerScope(false, maKhoa, maClb);
    }

    public boolean callerUnrestricted() {
        return currentScope().unrestricted();
    }

    // ─── Kiểm tra 1 tài nguyên cụ thể ──────────────────────────────────────────

    public void assertCan(ScopeAction action, Object resource) {
        CallerScope scope = currentScope();
        if (scope.unrestricted()) return;

        ResourceScopeResolver resolver = resolvers.get(resource.getClass());
        if (resolver == null) {
            throw new IllegalStateException("Chưa đăng ký ResourceScopeResolver cho " + resource.getClass().getSimpleName());
        }
        String resKhoa = resolver.khoaOf(resource);
        String resClb  = resolver.clbOf(resource);

        if (!isAllowed(action, scope, resKhoa, resClb)) {
            throw new ScopeAccessDeniedException(denyMessage(action, scope));
        }
    }

    /** Kiểm tra target (khoa/CLB) mà DTO create/update muốn gán — chặn khoa dời tài nguyên ra ngoài scope. */
    public void assertTargetInScope(ScopeAction action, String targetMaKhoa, String targetMaClb) {
        CallerScope scope = currentScope();
        if (scope.unrestricted()) return;
        if (!isAllowed(action, scope, targetMaKhoa, targetMaClb)) {
            throw new ScopeAccessDeniedException(
                    "Không thể gán hoạt động ra ngoài phạm vi quản lý của bạn");
        }
    }

    private boolean isAllowed(ScopeAction action, CallerScope scope, String resKhoa, String resClb) {
        // Người gọi thuộc CLB → chỉ đúng CLB của mình, với mọi action
        if (scope.maClb() != null) {
            return scope.maClb().equals(resClb);
        }
        // Người gọi thuộc khoa
        if (scope.maKhoa() != null) {
            if (action == ScopeAction.READ) {
                return resKhoa == null || scope.maKhoa().equals(resKhoa);
            }
            // WRITE / APPROVE: chỉ tài nguyên đúng khoa mình
            return resKhoa != null && scope.maKhoa().equals(resKhoa) && resClb == null;
        }
        return false; // fail-closed
    }

    private String denyMessage(ScopeAction action, CallerScope scope) {
        String owner = scope.maClb() != null ? "CLB" : "khoa";
        return switch (action) {
            case APPROVE -> "Bạn chỉ được duyệt hoạt động của " + owner + " mình";
            case WRITE   -> "Bạn chỉ được thao tác trên hoạt động của " + owner + " mình";
            case READ    -> "Bạn không có quyền xem hoạt động này";
        };
    }

    // ─── Lọc danh sách (nuốt lỗi theo phần tử) ─────────────────────────────────

    public <T> List<T> filterReadable(List<T> list) {
        return filter(list, ScopeAction.READ);
    }

    public <T> List<T> filterApprovable(List<T> list) {
        return filter(list, ScopeAction.APPROVE);
    }

    private <T> List<T> filter(List<T> list, ScopeAction action) {
        if (list == null || list.isEmpty()) return list;
        CallerScope scope = currentScope();
        if (scope.unrestricted()) return list;
        List<T> out = new ArrayList<>(list.size());
        for (T item : list) {
            try {
                assertCan(action, item);
                out.add(item);
            } catch (ScopeAccessDeniedException ignored) {
                // ngoài phạm vi → bỏ khỏi danh sách
            }
        }
        return out;
    }
}
