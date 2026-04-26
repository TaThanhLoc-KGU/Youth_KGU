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
 * Hệ thống phân quyền đơn giản hoá.
 * - QUAN_LY + laAdmin=true → toàn quyền (không cần tra DB)
 * - QUAN_LY + laAdmin=false → chỉ quyền trong tai_khoan_quyen
 * - SINH_VIEN → không có quyền quản trị
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final PermissionRepository permissionRepository;
    private final TaiKhoanQuyenRepository taiKhoanQuyenRepository;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;

    // ─── Lấy quyền của chính mình ────────────────────────────────────────────

    public AccountPermissionDTO getMyPermissions(String username) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        return buildPermissionDTO(taiKhoan);
    }

    // ─── Lấy quyền của một tài khoản cụ thể ─────────────────────────────────

    public AccountPermissionDTO getAccountPermissions(Long accountId) {
        TaiKhoan taiKhoan = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        return buildPermissionDTO(taiKhoan);
    }

    private AccountPermissionDTO buildPermissionDTO(TaiKhoan taiKhoan) {
        boolean laAdmin = Boolean.TRUE.equals(taiKhoan.getLaAdmin());
        boolean laSinhVien = (taiKhoan.getVaiTro() == VaiTroEnum.SINH_VIEN);

        Set<String> quyenTongHop;
        List<Long> quyenIds;

        if (laAdmin) {
            // Admin toàn quyền — lấy tất cả permissions từ DB cho hiển thị
            quyenTongHop = permissionRepository.findAll()
                    .stream().map(Permission::getName).collect(Collectors.toSet());
            quyenIds = permissionRepository.findAll()
                    .stream().map(Permission::getId).collect(Collectors.toList());
        } else if (laSinhVien) {
            quyenTongHop = new HashSet<>();
            quyenIds = new ArrayList<>();
        } else {
            // QUAN_LY thường — chỉ quyền trong tai_khoan_quyen
            List<String> names = taiKhoanQuyenRepository.findPermissionNamesByTaiKhoanId(taiKhoan.getId());
            quyenTongHop = new HashSet<>(names);
            quyenIds = taiKhoanQuyenRepository.findQuyenIdsByTaiKhoanId(taiKhoan.getId());
        }

        return AccountPermissionDTO.builder()
                .accountId(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .hoTen(taiKhoan.getHoTen())
                .vaiTro(taiKhoan.getVaiTro().name())
                .tenVaiTro(taiKhoan.getVaiTro().getTenHienThi())
                .laAdmin(laAdmin)
                .maKhoa(taiKhoan.getKhoa() != null ? taiKhoan.getKhoa().getMaKhoa() : null)
                .tenKhoa(taiKhoan.getKhoa() != null ? taiKhoan.getKhoa().getTenKhoa() : null)
                .maClb(taiKhoan.getClb() != null ? taiKhoan.getClb().getMaClb() : null)
                .tenClb(taiKhoan.getClb() != null ? taiKhoan.getClb().getTenClb() : null)
                .quyenTongHop(quyenTongHop)
                .quyenIds(new HashSet<>(quyenIds))
                .build();
    }

    // ─── Lấy catalog quyền ───────────────────────────────────────────────────

    public Map<String, List<Permission>> getAllPermissionsGrouped() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.groupingBy(Permission::getCategory));
    }

    // ─── Gán quyền cho tài khoản (atomic replace) ────────────────────────────

    @Transactional
    public void setAccountPermissions(Long taiKhoanId, List<Long> permissionIds, Long adminId) {
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Xóa tất cả quyền cũ
        taiKhoanQuyenRepository.deleteByTaiKhoanId(taiKhoanId);

        // Insert quyền mới
        List<TaiKhoanQuyen> newEntries = permissionIds.stream()
                .map(pid -> TaiKhoanQuyen.builder()
                        .taiKhoanId(taiKhoanId)
                        .quyenId(pid)
                        .createdAt(LocalDateTime.now())
                        .createdBy(adminId)
                        .build())
                .collect(Collectors.toList());
        taiKhoanQuyenRepository.saveAll(newEntries);

        log.info("Gán {} quyền cho tài khoản {} bởi adminId={}", permissionIds.size(), target.getUsername(), adminId);
        systemLogService.log("PHAN_QUYEN", "SET_ACCOUNT_PERMISSIONS",
                String.valueOf(taiKhoanId), target.getUsername(), "TaiKhoanQuyen", String.valueOf(taiKhoanId),
                "Gán " + permissionIds.size() + " quyền cho: " + target.getUsername(),
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    // ─── Cập nhật cờ laAdmin ─────────────────────────────────────────────────

    @Transactional
    public void setLaAdmin(Long taiKhoanId, boolean laAdmin, Long adminId) {
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        target.setLaAdmin(laAdmin);
        taiKhoanRepository.save(target);

        if (laAdmin) {
            // Admin không cần entries trong tai_khoan_quyen
            taiKhoanQuyenRepository.deleteByTaiKhoanId(taiKhoanId);
        }

        log.info("Cập nhật laAdmin={} cho tài khoản {} bởi adminId={}", laAdmin, target.getUsername(), adminId);
        systemLogService.log("PHAN_QUYEN", laAdmin ? "GRANT_ADMIN" : "REVOKE_ADMIN",
                String.valueOf(taiKhoanId), target.getUsername(), "TaiKhoan", String.valueOf(taiKhoanId),
                (laAdmin ? "Cấp" : "Thu hồi") + " quyền Admin cho: " + target.getUsername(),
                SystemLog.LogLevel.WARN, "SUCCESS", null, null, request);
    }

    // ─── Lấy quyền hiệu lực (dùng cho CustomPermissionEvaluator - performance) ─

    public Set<String> getEffectivePermissions(String username) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        if (Boolean.TRUE.equals(taiKhoan.getLaAdmin())) {
            return null; // null = toàn quyền (caller handles this case)
        }
        if (taiKhoan.getVaiTro() == VaiTroEnum.SINH_VIEN) {
            return new HashSet<>();
        }
        return new HashSet<>(taiKhoanQuyenRepository.findPermissionNamesByTaiKhoanId(taiKhoan.getId()));
    }
}
