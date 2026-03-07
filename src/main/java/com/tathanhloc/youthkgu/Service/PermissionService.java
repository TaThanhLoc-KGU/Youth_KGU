package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.AccountPermissionDTO;
import com.tathanhloc.youthkgu.DTO.ChucVuInfoDTO;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final BCHDoanHoiRepository bchDoanHoiRepository;
    private final BCHChucVuRepository bchChucVuRepository;
    private final AccountPermissionRepository accountPermissionRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Tính tên role dùng cho tra cứu role_permissions.
     * BCH → "BCH_LEVEL_1/2/3" (mặc định 3 nếu chưa gán level)
     * Các vai trò khác → tên enum (ADMIN, SINH_VIEN, GIANG_VIEN, ...)
     */
    private String resolveRoleName(TaiKhoan taiKhoan) {
        if (taiKhoan.getVaiTro() == VaiTroEnum.BCH) {
            Integer level = taiKhoan.getBchLevel();
            return "BCH_LEVEL_" + (level != null ? level : 3);
        }
        return taiKhoan.getVaiTro().name();
    }

    /** Lấy tên permissions từ bảng role_permissions theo roleName (String). */
    private Set<String> getBasePermissionsByRoleName(String roleName) {
        List<Long> ids = rolePermissionRepository.findPermissionIdsByRole(roleName);
        if (ids.isEmpty()) return new HashSet<>();
        return permissionRepository.findAllById(ids)
                .stream().map(Permission::getName).collect(Collectors.toSet());
    }

    // ─── Public: lấy quyền cơ bản theo VaiTroEnum (dùng cho BCH_LEVEL nếu cần) ───

    public Set<String> getBasePermissions(VaiTroEnum vaiTro) {
        return getBasePermissionsByRoleName(vaiTro.name());
    }

    // ─── Lấy quyền của chính mình ────────────────────────────────────────────

    public AccountPermissionDTO getMyPermissions(String username) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        return getAccountPermissions(taiKhoan.getId());
    }

    // ─── Lấy toàn bộ quyền của account (merge) ───────────────────────────────

    public AccountPermissionDTO getAccountPermissions(Long accountId) {
        TaiKhoan taiKhoan = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        VaiTroEnum vaiTro = taiKhoan.getVaiTro();
        String roleName = resolveRoleName(taiKhoan);

        // 1. Quyền cơ bản từ role/level
        Set<String> quyenCoban = getBasePermissionsByRoleName(roleName);
        Set<Long> quyenCobanIds = new HashSet<>(rolePermissionRepository.findPermissionIdsByRole(roleName));

        // 2. Thông tin BCH / chức vụ (chỉ dùng để hiển thị, không ảnh hưởng quyền nữa)
        boolean laBCH = (vaiTro == VaiTroEnum.BCH);
        List<ChucVuInfoDTO> danhSachChucVu = new ArrayList<>();
        if (laBCH) {
            danhSachChucVu = loadChucVuList(taiKhoan);
        }

        // 3. Override cá nhân (per-user grant / revoke)
        Map<Long, Boolean> overrideMap = new HashMap<>();
        List<AccountPermission> overrides = accountPermissionRepository.findByTaiKhoanId(accountId);
        for (AccountPermission ap : overrides) {
            overrideMap.put(ap.getPermission().getId(), ap.getIsGranted());
        }

        // 4. Merge quyền
        Set<String> quyenTongHop = new HashSet<>(quyenCoban);
        for (AccountPermission ap : overrides) {
            if (ap.getIsGranted()) {
                quyenTongHop.add(ap.getPermission().getName());
            } else {
                quyenTongHop.remove(ap.getPermission().getName());
            }
        }

        return AccountPermissionDTO.builder()
                .accountId(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .hoTen(taiKhoan.getHoTen())
                .vaiTro(vaiTro.name())
                .tenVaiTro(vaiTro.getTenHienThi())
                .nhomVaiTro(vaiTro.getNhomVaiTro())
                .toChuc(vaiTro.getToChuc())
                .vaiTroGoc(vaiTro.name())
                .tenVaiTroGoc(vaiTro.getTenHienThi())
                .laBCH(laBCH)
                .bchLevel(taiKhoan.getBchLevel())
                .danhSachChucVu(danhSachChucVu)
                .quyenCoban(quyenCoban)
                .quyenTuChucVu(new HashSet<>())  // không còn quyền riêng theo chức vụ
                .quyenTongHop(quyenTongHop)
                .overrideMap(overrideMap)
                .quyenCobanIds(quyenCobanIds)
                .quyenTuChucVuIds(new HashSet<>())
                .build();
    }

    /** Load danh sách chức vụ BCH (chỉ phục vụ hiển thị). */
    private List<ChucVuInfoDTO> loadChucVuList(TaiKhoan taiKhoan) {
        List<ChucVuInfoDTO> result = new ArrayList<>();
        List<BCHDoanHoi> bchList = new ArrayList<>();
        try {
            if (taiKhoan.getSinhVien() != null)
                bchList.addAll(bchDoanHoiRepository.findBySinhVienMaSvAndIsActiveTrue(taiKhoan.getSinhVien().getMaSv()));
            if (taiKhoan.getGiangVien() != null)
                bchList.addAll(bchDoanHoiRepository.findByGiangVienMaGvAndIsActiveTrue(taiKhoan.getGiangVien().getMaGv()));
            if (taiKhoan.getChuyenVien() != null)
                bchList.addAll(bchDoanHoiRepository.findByChuyenVienMaChuyenVienAndIsActiveTrue(taiKhoan.getChuyenVien().getMaChuyenVien()));
            // Fallback theo username
            if (bchList.isEmpty()) {
                String u = taiKhoan.getUsername();
                switch (taiKhoan.getVaiTro()) {
                    case SINH_VIEN  -> bchList.addAll(bchDoanHoiRepository.findBySinhVienMaSvAndIsActiveTrue(u));
                    case GIANG_VIEN -> bchList.addAll(bchDoanHoiRepository.findByGiangVienMaGvAndIsActiveTrue(u));
                    case CHUYEN_VIEN -> bchList.addAll(bchDoanHoiRepository.findByChuyenVienMaChuyenVienAndIsActiveTrue(u));
                    default -> {}
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi tải chức vụ BCH cho tài khoản {}: {}", taiKhoan.getId(), e.getMessage());
        }
        for (BCHDoanHoi bch : bchList) {
            bchChucVuRepository.findByBchMaBchAndIsActiveTrueOrderByIdAsc(bch.getMaBch())
                    .forEach(bcv -> {
                        ChucVu cv = bcv.getChucVu();
                        result.add(ChucVuInfoDTO.builder()
                                .maChucVu(cv.getMaChucVu())
                                .tenChucVu(cv.getTenChucVu())
                                .thuocBan(cv.getThuocBan())
                                .maBan(bcv.getBan() != null ? bcv.getBan().getMaBan() : null)
                                .tenBan(bcv.getBan() != null ? bcv.getBan().getTenBan() : null)
                                .build());
                    });
        }
        return result;
    }

    // ─── Quản lý permissions nhóm (role/level) ───────────────────────────────

    /** Lấy tất cả permissions nhóm theo category (cho UI). */
    public Map<String, List<Permission>> getAllPermissionsGrouped() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.groupingBy(Permission::getCategory));
    }

    /** Lấy permission IDs của một roleName. */
    public List<Long> getRolePermissionIds(String roleName) {
        return rolePermissionRepository.findPermissionIdsByRole(roleName);
    }

    /**
     * Lấy permission matrix cho tất cả 3 BCH levels.
     * Trả về Map: "BCH_LEVEL_1" → List<Long permissionIds>, ...
     */
    public Map<String, List<Long>> getBchLevelMatrix() {
        Map<String, List<Long>> matrix = new LinkedHashMap<>();
        matrix.put("BCH_LEVEL_1", rolePermissionRepository.findPermissionIdsByRole("BCH_LEVEL_1"));
        matrix.put("BCH_LEVEL_2", rolePermissionRepository.findPermissionIdsByRole("BCH_LEVEL_2"));
        matrix.put("BCH_LEVEL_3", rolePermissionRepository.findPermissionIdsByRole("BCH_LEVEL_3"));
        matrix.put("BCH_LEVEL_4", rolePermissionRepository.findPermissionIdsByRole("BCH_LEVEL_4"));
        return matrix;
    }

    /** Cập nhật permissions cho một role/level (không cần admin password — bảo vệ bởi @PreAuthorize). */
    @Transactional
    public void updateRolePermissions(String roleName, List<Long> permissionIds, String updatedByUsername) {
        rolePermissionRepository.deleteByRoleName(roleName);
        for (Long pid : permissionIds) {
            rolePermissionRepository.insertRolePermission(roleName, pid);
        }
        log.info("Cập nhật quyền role [{}] ({} quyền) bởi {}", roleName, permissionIds.size(), updatedByUsername);
        systemLogService.log("PHAN_QUYEN", "UPDATE_ROLE_PERMISSIONS",
                roleName, roleName, "RolePermission", roleName,
                "Cập nhật " + permissionIds.size() + " quyền cho nhóm: " + roleName,
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    // ─── Quản lý permissions cá nhân ─────────────────────────────────────────

    /** Cấp / thu hồi quyền cho tài khoản cụ thể (không cần admin password). */
    @Transactional
    public void updateAccountPermissions(Long taiKhoanId, List<Long> grantIds, List<Long> revokeIds,
                                         String ghiChu, Long grantedBy) {
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        for (Long pid : grantIds) {
            accountPermissionRepository.findByTaiKhoanIdAndPermissionId(taiKhoanId, pid)
                    .ifPresentOrElse(
                            ap -> { ap.setIsGranted(true); accountPermissionRepository.save(ap); },
                            () -> accountPermissionRepository.save(AccountPermission.builder()
                                    .taiKhoan(target)
                                    .permission(permissionRepository.findById(pid).orElseThrow())
                                    .isGranted(true).grantedBy(grantedBy).ghiChu(ghiChu)
                                    .createdAt(java.time.LocalDateTime.now()).build()));
        }
        for (Long pid : revokeIds) {
            accountPermissionRepository.findByTaiKhoanIdAndPermissionId(taiKhoanId, pid)
                    .ifPresentOrElse(
                            ap -> { ap.setIsGranted(false); accountPermissionRepository.save(ap); },
                            () -> accountPermissionRepository.save(AccountPermission.builder()
                                    .taiKhoan(target)
                                    .permission(permissionRepository.findById(pid).orElseThrow())
                                    .isGranted(false).grantedBy(grantedBy).ghiChu(ghiChu)
                                    .createdAt(java.time.LocalDateTime.now()).build()));
        }
        log.info("Phân quyền tài khoản {} (grant={}, revoke={}) bởi grantedBy={}",
                target.getUsername(), grantIds.size(), revokeIds.size(), grantedBy);
        systemLogService.log("PHAN_QUYEN", "UPDATE_ACCOUNT_PERMISSIONS",
                String.valueOf(taiKhoanId), target.getUsername(), "AccountPermission", String.valueOf(taiKhoanId),
                "Cấp " + grantIds.size() + " quyền, thu hồi " + revokeIds.size() + " quyền cho: " + target.getUsername()
                        + (ghiChu != null && !ghiChu.isBlank() ? " | Ghi chú: " + ghiChu : ""),
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    /** Xóa toàn bộ override cá nhân của tài khoản (không cần admin password). */
    @Transactional
    public void resetAccountPermissions(Long taiKhoanId) {
        List<AccountPermission> existing = accountPermissionRepository.findByTaiKhoanId(taiKhoanId);
        int count = existing.size();
        existing.forEach(accountPermissionRepository::delete);
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        log.info("Reset quyền đặc biệt tài khoản {} ({} bản ghi)", target.getUsername(), count);
        systemLogService.log("PHAN_QUYEN", "RESET_ACCOUNT_PERMISSIONS",
                String.valueOf(taiKhoanId), target.getUsername(), "AccountPermission", String.valueOf(taiKhoanId),
                "Xóa " + count + " quyền đặc biệt của tài khoản: " + target.getUsername(),
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }
}
