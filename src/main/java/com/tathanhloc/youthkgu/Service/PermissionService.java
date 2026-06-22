package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.AccountPermissionDTO;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hệ thống phân quyền đa cấp.
 *
 * Logic quyền hiệu lực:
 *   ADMIN                    → toàn quyền (null = bypass all)
 *   DOAN_VIEN                → quyền mặc định của role (role_default_permissions)
 *   QUAN_LY_* / PHO_*        → role defaults UNION tai_khoan_quyen (gán thêm/bớt)
 *
 * tai_khoan_quyen dùng để TÙYCHỈNH so với default:
 *   - Thêm quyền ngoài bộ mặc định của role
 *   - (Hoặc admin có thể xóa bớt quyền mặc định bằng cơ chế blacklist nếu cần)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final PermissionRepository permissionRepository;
    private final TaiKhoanQuyenRepository taiKhoanQuyenRepository;
    private final RoleDefaultPermissionRepository roleDefaultPermissionRepository;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;

    // ─── Lấy quyền của chính mình ────────────────────────────────────────────

    public AccountPermissionDTO getMyPermissions(String username) {
        TaiKhoan tk = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        return buildPermissionDTO(tk);
    }

    // ─── Lấy quyền của một tài khoản cụ thể ─────────────────────────────────

    public AccountPermissionDTO getAccountPermissions(Long accountId) {
        TaiKhoan tk = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        return buildPermissionDTO(tk);
    }

    private AccountPermissionDTO buildPermissionDTO(TaiKhoan tk) {
        VaiTroEnum role = tk.getVaiTro();
        Set<String> quyenTongHop;
        List<Long> quyenIds;

        Set<Long> defaultIds;
        Set<Long> customIds;

        if (role == VaiTroEnum.ADMIN) {
            List<Permission> all = permissionRepository.findAll();
            quyenTongHop = all.stream().map(Permission::getName).collect(Collectors.toSet());
            quyenIds = all.stream().map(Permission::getId).collect(Collectors.toList());
            defaultIds = new HashSet<>(quyenIds);
            customIds = new HashSet<>();
        } else {
            Set<String> defaultNames = roleDefaultPermissionRepository.findPermissionNamesByVaiTro(role.name());
            List<Long> roleDefaultIds = roleDefaultPermissionRepository.findPermissionIdsByVaiTro(role.name());
            List<Long> overrideIds = taiKhoanQuyenRepository.findQuyenIdsByTaiKhoanId(tk.getId());
            List<String> overrideNames = taiKhoanQuyenRepository.findPermissionNamesByTaiKhoanId(tk.getId());

            defaultIds = new HashSet<>(roleDefaultIds);
            customIds = new HashSet<>(overrideIds);
            customIds.removeAll(defaultIds); // chỉ phần extra

            quyenTongHop = new HashSet<>(defaultNames);
            quyenTongHop.addAll(overrideNames);

            Set<Long> allIds = new HashSet<>(roleDefaultIds);
            allIds.addAll(overrideIds);
            quyenIds = new ArrayList<>(allIds);
        }

        return AccountPermissionDTO.builder()
                .accountId(tk.getId())
                .username(tk.getUsername())
                .hoTen(tk.getHoTen())
                .vaiTro(role.name())
                .tenVaiTro(role.getLabel())
                .laAdmin(role == VaiTroEnum.ADMIN)
                .maKhoa(tk.getKhoa() != null ? tk.getKhoa().getMaKhoa() : null)
                .tenKhoa(tk.getKhoa() != null ? tk.getKhoa().getTenKhoa() : null)
                .maClb(tk.getClb() != null ? tk.getClb().getMaClb() : null)
                .tenClb(tk.getClb() != null ? tk.getClb().getTenClb() : null)
                .maLop(tk.getLop() != null ? tk.getLop().getMaLop() : null)
                .tenLop(tk.getLop() != null ? tk.getLop().getTenLop() : null)
                .quyenTongHop(quyenTongHop)
                .quyenIds(new HashSet<>(quyenIds))
                .defaultQuyenIds(defaultIds)
                .customQuyenIds(customIds)
                .build();
    }

    // ─── Lấy catalog quyền ───────────────────────────────────────────────────

    public Map<String, List<Permission>> getAllPermissionsGrouped() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.groupingBy(Permission::getCategory));
    }

    // ─── Lấy bộ quyền mặc định theo role (trả ID để frontend dùng) ───────────

    public Map<String, List<Long>> getRoleDefaultPermissions() {
        Map<String, List<Long>> result = new LinkedHashMap<>();
        for (VaiTroEnum role : VaiTroEnum.values()) {
            if (role == VaiTroEnum.ADMIN) {
                // ADMIN bypass toàn bộ nên không cần danh sách cụ thể
                result.put(role.name(), List.of());
            } else {
                result.put(role.name(), roleDefaultPermissionRepository.findPermissionIdsByVaiTro(role.name()));
            }
        }
        return result;
    }

    // ─── Cập nhật quyền mặc định của một role (Admin only) ───────────────────

    @Transactional
    public void setRoleDefaultPermissions(String vaiTro, List<Long> permissionIds, Long adminId) {
        roleDefaultPermissionRepository.deleteByVaiTro(vaiTro);
        List<RoleDefaultPermission> newEntries = permissionIds.stream()
                .map(pid -> RoleDefaultPermission.builder()
                        .vaiTro(vaiTro)
                        .permission(permissionRepository.findById(pid)
                                .orElseThrow(() -> new RuntimeException("Permission không tồn tại: " + pid)))
                        .createdAt(LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());
        roleDefaultPermissionRepository.saveAll(newEntries);
        log.info("Cập nhật {} quyền mặc định cho role {} bởi adminId={}", permissionIds.size(), vaiTro, adminId);
    }

    // ─── Gán quyền tùy chỉnh cho tài khoản (atomic replace) ─────────────────

    @Transactional
    public void setAccountPermissions(Long taiKhoanId, List<Long> permissionIds, Long adminId) {
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        taiKhoanQuyenRepository.deleteByTaiKhoanId(taiKhoanId);

        List<TaiKhoanQuyen> newEntries = permissionIds.stream()
                .map(pid -> TaiKhoanQuyen.builder()
                        .taiKhoanId(taiKhoanId)
                        .quyenId(pid)
                        .createdAt(LocalDateTime.now())
                        .createdBy(adminId)
                        .build())
                .collect(Collectors.toList());
        taiKhoanQuyenRepository.saveAll(newEntries);

        log.info("Gán {} quyền tùy chỉnh cho tài khoản {} bởi adminId={}", permissionIds.size(), target.getUsername(), adminId);
        systemLogService.log("PHAN_QUYEN", "SET_ACCOUNT_PERMISSIONS",
                String.valueOf(taiKhoanId), target.getUsername(), "TaiKhoanQuyen", String.valueOf(taiKhoanId),
                "Gán " + permissionIds.size() + " quyền cho: " + target.getUsername(),
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    // ─── Lấy quyền hiệu lực (dùng cho CustomPermissionEvaluator) ────────────

    public Set<String> getEffectivePermissions(String username) {
        TaiKhoan tk = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        if (tk.getVaiTro() == VaiTroEnum.ADMIN) {
            return null; // null = toàn quyền (caller bypass check)
        }

        // Role defaults + override cá nhân
        Set<String> perms = new HashSet<>(
                roleDefaultPermissionRepository.findPermissionNamesByVaiTro(tk.getVaiTro().name())
        );
        perms.addAll(taiKhoanQuyenRepository.findPermissionNamesByTaiKhoanId(tk.getId()));
        return perms;
    }

    // ─── Deprecated: setLaAdmin → dùng changeVaiTro thay thế ────────────────

    @Deprecated
    @Transactional
    public void setLaAdmin(Long taiKhoanId, boolean laAdmin, Long adminId) {
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        // Backward compat: set laAdmin flag + cập nhật role tương ứng
        target.setLaAdmin(laAdmin);
        if (laAdmin) {
            target.setVaiTro(VaiTroEnum.ADMIN);
            taiKhoanQuyenRepository.deleteByTaiKhoanId(taiKhoanId);
        } else if (target.getVaiTro() == VaiTroEnum.ADMIN) {
            target.setVaiTro(VaiTroEnum.QUAN_LY_KHOA);
        }
        taiKhoanRepository.save(target);
        log.info("setLaAdmin={} cho {} (deprecated, hãy dùng changeVaiTro)", laAdmin, target.getUsername());
    }
}
