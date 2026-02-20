package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.AccountPermissionDTO;
import com.tathanhloc.faceattendance.DTO.ChucVuInfoDTO;
import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Bảng quy đổi chức vụ BCH → quyền chức năng
    private static final Map<String, Set<String>> CHUC_VU_PERMISSION_MAP = new HashMap<>();
    static {
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_1", new HashSet<>(java.util.Arrays.asList(
            "QUAN_LY_HOAT_DONG", "DUYET_HOAT_DONG", "DIEM_DANH",
            "PHAN_CONG_DIEM_DANH", "QUAN_LY_DANG_KY", "XEM_BAO_CAO",
            "XUAT_BAO_CAO", "QUAN_LY_THANH_VIEN"
        )));
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_2", new HashSet<>(java.util.Arrays.asList(
            "QUAN_LY_HOAT_DONG", "DIEM_DANH", "PHAN_CONG_DIEM_DANH",
            "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_3", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "DIEM_DANH", "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("PHU_VU_CAP_2", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "DIEM_DANH", "PHAN_CONG_DIEM_DANH",
            "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("PHU_VU_CAP_3", new HashSet<>(java.util.Arrays.asList(
            "DIEM_DANH", "XEM_DANH_SACH_DANG_KY"
        )));
    }

    // Quyền cơ bản theo nhóm vai trò
    public Set<String> getBasePermissions(VaiTroEnum vaiTro) {
        Set<String> permissions = new HashSet<>();
        if (vaiTro == null) return permissions;

        // Lấy quyền từ bảng role_permissions
        List<Long> permissionIds = rolePermissionRepository.findPermissionIdsByRole(vaiTro.name());
        List<Permission> rolePerms = permissionRepository.findAllById(permissionIds);
        permissions.addAll(rolePerms.stream().map(Permission::getName).collect(Collectors.toSet()));

        // Fallback logic nếu DB chưa có dữ liệu
        if (permissions.isEmpty()) {
            String nhomVaiTro = getNhomVaiTro(vaiTro);
            switch (nhomVaiTro) {
                case "THAM_GIA":
                    permissions.add("DANG_NHAP");
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("DANG_KY_HOAT_DONG");
                    permissions.add("XEM_HOAT_DONG");
                    break;
                case "PHU_VU":
                    permissions.add("DANG_NHAP");
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("DANG_KY_HOAT_DONG");
                    permissions.add("XEM_HOAT_DONG");
                    permissions.add("DIEM_DANH");
                    permissions.add("XEM_DANH_SACH_DANG_KY");
                    break;
                case "QUAN_LY":
                    permissions.add("DANG_NHAP");
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("TAO_HOAT_DONG");
                    permissions.add("SUA_HOAT_DONG");
                    permissions.add("XOA_HOAT_DONG");
                    permissions.add("DIEM_DANH");
                    permissions.add("QUAN_LY_DANG_KY");
                    permissions.add("XEM_BAO_CAO");
                    permissions.add("PHAN_CONG_DIEM_DANH");
                    break;
            }
        }
        return permissions;
    }

    private String getNhomVaiTro(VaiTroEnum vaiTro) {
        String roleName = vaiTro.name();
        if (roleName.contains("ADMIN") || roleName.contains("BI_THU") || roleName.contains("CHU_TICH") || roleName.contains("TRUONG_BAN")) {
            return "QUAN_LY";
        } else if (roleName.contains("UV_") || roleName.contains("PHO_")) {
            return "PHU_VU";
        } else {
            return "THAM_GIA";
        }
    }

    // Quyền bổ sung theo ChucVu cụ thể
    public Set<String> getPermissionsByChucVu(ChucVu chucVu) {
        if (chucVu == null) return new HashSet<>();
        String thuocBan = chucVu.getThuocBan() != null ? chucVu.getThuocBan().toUpperCase() : "";
        Integer thuTu = chucVu.getThuTu();

        // Thử exact match: thuocBan_thuTu (ví dụ DOAN_1, HOI_2)
        String exactKey = thuocBan + "_" + thuTu;
        if (CHUC_VU_PERMISSION_MAP.containsKey(exactKey)) {
            return new HashSet<>(CHUC_VU_PERMISSION_MAP.get(exactKey));
        }

        // Fallback: nhóm QUAN_LY (DOAN/HOI) hoặc PHU_VU, cấp theo thuTu
        boolean isQuanLy = "DOAN".equals(thuocBan) || "HOI".equals(thuocBan);
        int cap = (thuTu != null && thuTu <= 2) ? (thuTu == 1 ? 1 : 2) : 3;
        String fallbackKey = (isQuanLy ? "QUAN_LY" : "PHU_VU") + "_CAP_" + cap;
        return new HashSet<>(CHUC_VU_PERMISSION_MAP.getOrDefault(fallbackKey, new HashSet<>()));
    }

    // Lấy toàn bộ quyền của account (merge)
    public AccountPermissionDTO getAccountPermissions(Long accountId) {
        TaiKhoan taiKhoan = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // 1. Quyền cơ bản từ Vai trò
        Set<String> quyenCoban = getBasePermissions(taiKhoan.getVaiTro());
        Set<String> quyenTuChucVu = new HashSet<>();
        List<ChucVuInfoDTO> danhSachChucVu = new ArrayList<>();
        boolean laBCH = false;

        // 2. Check BCH & lấy quyền từ chức vụ
        String maSv = null;
        try {
            if (taiKhoan.getSinhVien() != null) {
                maSv = taiKhoan.getSinhVien().getMaSv();
            }
        } catch (Exception e) {
            log.warn("Lỗi truy cập sinh viên của tài khoản {}", accountId);
        }

        if (maSv != null) {
            Optional<BCHDoanHoi> bchOpt = bchDoanHoiRepository.findBySinhVienMaSvAndIsActiveTrue(maSv);
            if (bchOpt.isPresent()) {
                laBCH = true;
                BCHDoanHoi bch = bchOpt.get();
                List<BCHChucVu> chucVus = bchChucVuRepository.findByBchMaBchAndIsActiveTrue(bch.getMaBch());
                
                for (BCHChucVu bcv : chucVus) {
                    ChucVu cv = bcv.getChucVu();
                    quyenTuChucVu.addAll(getPermissionsByChucVu(cv));
                    
                    danhSachChucVu.add(ChucVuInfoDTO.builder()
                            .maChucVu(cv.getMaChucVu())
                            .tenChucVu(cv.getTenChucVu())
                            .thuocBan(cv.getThuocBan())
                            .maBan(bcv.getBan() != null ? bcv.getBan().getMaBan() : null)
                            .tenBan(bcv.getBan() != null ? bcv.getBan().getTenBan() : null)
                            .build());
                }
            }
        }

        // 3. Override cá nhân (Map ID -> Boolean)
        Map<Long, Boolean> overrideMap = new HashMap<>();
        List<AccountPermission> overrides = accountPermissionRepository.findByTaiKhoanId(accountId);
        for (AccountPermission ap : overrides) {
            overrideMap.put(ap.getPermission().getId(), ap.getIsGranted());
        }

        // 4. Merge quyền (Names)
        Set<String> quyenTongHop = new HashSet<>(quyenCoban);
        quyenTongHop.addAll(quyenTuChucVu);
        
        // Apply overrides to quyenTongHop (using names)
        for (AccountPermission ap : overrides) {
            if (ap.getIsGranted()) {
                quyenTongHop.add(ap.getPermission().getName());
            } else {
                quyenTongHop.remove(ap.getPermission().getName());
            }
        }

        VaiTroEnum vaiTro = taiKhoan.getVaiTro();
        return AccountPermissionDTO.builder()
                .accountId(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .hoTen(taiKhoan.getHoTen())
                .vaiTro(vaiTro.name())
                .tenVaiTro(vaiTro.getTenHienThi())
                .nhomVaiTro(vaiTro.getNhomVaiTro())
                .toChuc(vaiTro.getToChuc())
                .laBCH(laBCH)
                .danhSachChucVu(danhSachChucVu)
                .quyenCoban(quyenCoban)
                .quyenTuChucVu(quyenTuChucVu)
                .quyenTongHop(quyenTongHop)
                .overrideMap(overrideMap)
                .build();
    }
    
    // Lấy tất cả permissions nhóm theo category (cho UI)
    public Map<String, List<Permission>> getAllPermissionsGrouped() {
        return permissionRepository.findAll().stream()
            .collect(Collectors.groupingBy(Permission::getCategory));
    }

    // Lấy permissions của một role (cho UI)
    public List<Long> getRolePermissionIds(String roleName) {
        return rolePermissionRepository.findPermissionIdsByRole(roleName);
    }

    // Cập nhật permissions cho role
    @Transactional
    public void updateRolePermissions(String roleName, List<Long> permissionIds,
                                      String adminUsername, String adminPassword) {
        TaiKhoan admin = taiKhoanRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }
        rolePermissionRepository.deleteByRoleName(roleName);
        for (Long pid : permissionIds) {
            rolePermissionRepository.insertRolePermission(roleName, pid);
        }
        log.info("Cập nhật quyền role {} bởi {}", roleName, adminUsername);
    }

    // Cập nhật permissions riêng cho tài khoản
    @Transactional
    public void updateAccountPermissions(Long taiKhoanId, List<Long> grantIds, List<Long> revokeIds,
                                         String ghiChu, String adminUsername, String adminPassword,
                                         Long grantedBy) {
        TaiKhoan admin = taiKhoanRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đích"));

        // Xử lý cấp thêm
        for (Long pid : grantIds) {
            accountPermissionRepository.findByTaiKhoanIdAndPermissionId(taiKhoanId, pid)
                .ifPresentOrElse(ap -> { ap.setIsGranted(true); accountPermissionRepository.save(ap); },
                    () -> accountPermissionRepository.save(AccountPermission.builder()
                        .taiKhoan(target)
                        .permission(permissionRepository.findById(pid).orElseThrow())
                        .isGranted(true).grantedBy(grantedBy).ghiChu(ghiChu)
                        .createdAt(java.time.LocalDateTime.now()).build()));
        }

        // Xử lý thu hồi
        for (Long pid : revokeIds) {
            accountPermissionRepository.findByTaiKhoanIdAndPermissionId(taiKhoanId, pid)
                .ifPresentOrElse(ap -> { ap.setIsGranted(false); accountPermissionRepository.save(ap); },
                    () -> accountPermissionRepository.save(AccountPermission.builder()
                        .taiKhoan(target)
                        .permission(permissionRepository.findById(pid).orElseThrow())
                        .isGranted(false).grantedBy(grantedBy).ghiChu(ghiChu)
                        .createdAt(java.time.LocalDateTime.now()).build()));
        }
    }

    // Xóa override của tài khoản
    @Transactional
    public void resetAccountPermissions(Long taiKhoanId, String adminUsername, String adminPassword) {
        TaiKhoan admin = taiKhoanRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }
        accountPermissionRepository.findByTaiKhoanId(taiKhoanId).forEach(accountPermissionRepository::delete);
    }
}
