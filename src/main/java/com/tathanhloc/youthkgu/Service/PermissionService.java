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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;

    // Bảng quy đổi chức vụ BCH → quyền chức năng (fallback khi DB chưa cấu hình)
    // Tên quyền khớp với bảng permissions trong DB sau migration V_permissions_cleanup.sql
    private static final Map<String, Set<String>> CHUC_VU_PERMISSION_MAP = new HashMap<>();
    static {
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_1", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "SUA_HOAT_DONG", "XOA_HOAT_DONG", "DUYET_HOAT_DONG",
            "QUET_QR", "PHAN_CONG_DIEM_DANH", "QUAN_LY_DANG_KY",
            "XEM_BAO_CAO", "XUAT_BAO_CAO", "THEM_BCH", "SUA_BCH"
        )));
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_2", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "SUA_HOAT_DONG", "QUET_QR", "PHAN_CONG_DIEM_DANH",
            "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_3", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "QUET_QR", "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("PHU_VU_CAP_2", new HashSet<>(java.util.Arrays.asList(
            "TAO_HOAT_DONG", "QUET_QR", "PHAN_CONG_DIEM_DANH",
            "QUAN_LY_DANG_KY", "XEM_BAO_CAO"
        )));
        CHUC_VU_PERMISSION_MAP.put("PHU_VU_CAP_3", new HashSet<>(java.util.Arrays.asList(
            "QUET_QR", "XEM_DIEM_DANH"
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
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("XEM_THONG_TIN_CA_NHAN");
                    permissions.add("SUA_THONG_TIN_CA_NHAN");
                    permissions.add("DANG_KY_HOAT_DONG");
                    permissions.add("HUY_DANG_KY_HOAT_DONG");
                    permissions.add("XEM_HOAT_DONG");
                    permissions.add("XEM_LICH_SU_THAM_GIA");
                    break;
                case "PHU_VU":
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("XEM_THONG_TIN_CA_NHAN");
                    permissions.add("SUA_THONG_TIN_CA_NHAN");
                    permissions.add("XEM_HOAT_DONG");
                    permissions.add("QUET_QR");
                    permissions.add("QUAN_LY_DANG_KY");
                    break;
                case "QUAN_LY":
                    permissions.add("DOI_MAT_KHAU");
                    permissions.add("XEM_THONG_TIN_CA_NHAN");
                    permissions.add("SUA_THONG_TIN_CA_NHAN");
                    permissions.add("TAO_HOAT_DONG");
                    permissions.add("SUA_HOAT_DONG");
                    permissions.add("XOA_HOAT_DONG");
                    permissions.add("DUYET_HOAT_DONG");
                    permissions.add("QUET_QR");
                    permissions.add("QUAN_LY_DANG_KY");
                    permissions.add("PHAN_CONG_DIEM_DANH");
                    permissions.add("XEM_BAO_CAO");
                    permissions.add("XUAT_BAO_CAO");
                    break;
            }
        }
        return permissions;
    }

    private String getNhomVaiTro(VaiTroEnum vaiTro) {
        String roleName = vaiTro.name();
        if (roleName.contains("ADMIN") || roleName.equals("MANAGER")) {
            return "QUAN_LY";
        } else if (roleName.equals("STAFF") || roleName.equals("GIANG_VIEN") || roleName.equals("CHUYEN_VIEN")) {
            return "PHU_VU";
        } else {
            return "THAM_GIA";
        }
    }

    // Helper để lấy ID quyền của chức vụ (có fallback sang VaiTroEnum)
    private List<Long> getPermissionIdsForChucVu(ChucVu chucVu) {
        List<Long> ids = rolePermissionRepository.findPermissionIdsByRole(chucVu.getMaChucVu());
        // Không còn fallback sang VaiTroEnum nữa vì đã xóa các enum cụ thể
        return ids;
    }

    // Quyền bổ sung theo ChucVu cụ thể
    public Set<String> getPermissionsByChucVu(ChucVu chucVu) {
        if (chucVu == null) return new HashSet<>();

        // Ưu tiên: lấy quyền từ DB (theo maChucVu)
        List<Long> permissionIds = getPermissionIdsForChucVu(chucVu);
        if (!permissionIds.isEmpty()) {
            return permissionRepository.findAllById(permissionIds)
                    .stream().map(Permission::getName).collect(Collectors.toSet());
        }

        // Fallback: dùng CHUC_VU_PERMISSION_MAP nếu chức vụ chưa được cấu hình trong DB
        String thuocBan = chucVu.getThuocBan() != null ? chucVu.getThuocBan().toUpperCase() : "";
        Integer thuTu = chucVu.getThuTu();
        String exactKey = thuocBan + "_" + thuTu;
        if (CHUC_VU_PERMISSION_MAP.containsKey(exactKey)) {
            return new HashSet<>(CHUC_VU_PERMISSION_MAP.get(exactKey));
        }
        boolean isQuanLy = "DOAN".equals(thuocBan) || "HOI".equals(thuocBan);
        int cap = (thuTu != null && thuTu <= 2) ? (thuTu == 1 ? 1 : 2) : 3;
        String fallbackKey = (isQuanLy ? "QUAN_LY" : "PHU_VU") + "_CAP_" + cap;
        return new HashSet<>(CHUC_VU_PERMISSION_MAP.getOrDefault(fallbackKey, new HashSet<>()));
    }

    // Lấy quyền của chính mình (dùng username từ JWT, không cần ID)
    public AccountPermissionDTO getMyPermissions(String username) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        return getAccountPermissions(taiKhoan.getId());
    }

    // Lấy toàn bộ quyền của account (merge)
    public AccountPermissionDTO getAccountPermissions(Long accountId) {
        TaiKhoan taiKhoan = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // 1. Lấy thông tin BCH trước để xác định vai trò hiệu lực
        List<ChucVuInfoDTO> danhSachChucVu = new ArrayList<>();
        boolean laBCH = false;
        Set<String> quyenTuChucVu = new HashSet<>();
        Set<Long> quyenTuChucVuIds = new HashSet<>();

        // Check BCH với cả 3 loại: SinhVien, GiangVien, ChuyenVien
        List<BCHDoanHoi> bchList = new ArrayList<>();
        try {
            if (taiKhoan.getSinhVien() != null) {
                bchList.addAll(bchDoanHoiRepository
                    .findBySinhVienMaSvAndIsActiveTrue(taiKhoan.getSinhVien().getMaSv()));
            }
            if (taiKhoan.getGiangVien() != null) {
                bchList.addAll(bchDoanHoiRepository
                    .findByGiangVienMaGvAndIsActiveTrue(taiKhoan.getGiangVien().getMaGv()));
            }
            if (taiKhoan.getChuyenVien() != null) {
                bchList.addAll(bchDoanHoiRepository
                    .findByChuyenVienMaChuyenVienAndIsActiveTrue(taiKhoan.getChuyenVien().getMaChuyenVien()));
            }
            // Fallback: nếu chưa liên kết người dùng, thử tìm BCH theo username
            // (username == mã người dùng khi tạo từ danh sách)
            if (bchList.isEmpty() && taiKhoan.getUsername() != null) {
                String username = taiKhoan.getUsername();
                VaiTroEnum vaiTro = taiKhoan.getVaiTro();
                if (vaiTro == VaiTroEnum.GIANG_VIEN) {
                    bchList.addAll(bchDoanHoiRepository.findByGiangVienMaGvAndIsActiveTrue(username));
                } else if (vaiTro == VaiTroEnum.SINH_VIEN) {
                    bchList.addAll(bchDoanHoiRepository.findBySinhVienMaSvAndIsActiveTrue(username));
                } else if (vaiTro == VaiTroEnum.CHUYEN_VIEN) {
                    bchList.addAll(bchDoanHoiRepository.findByChuyenVienMaChuyenVienAndIsActiveTrue(username));
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi kiểm tra BCH của tài khoản {}: {}", accountId, e.getMessage());
        }

        // Xác định vai trò hiệu lực (Effective Role)
        // Mặc định là vai trò trong DB
        VaiTroEnum originalRole = taiKhoan.getVaiTro();
        VaiTroEnum effectiveRole = originalRole;

        if (!bchList.isEmpty()) {
            laBCH = true;
            for (BCHDoanHoi bch : bchList) {
                List<BCHChucVu> chucVuList = bchChucVuRepository
                    .findByBchMaBchAndIsActiveTrueOrderByIdAsc(bch.getMaBch());

                for (BCHChucVu bcv : chucVuList) {
                    ChucVu cv = bcv.getChucVu();
                    
                    // Logic thăng cấp vai trò: Nếu chức vụ tương ứng với một VaiTroEnum cao hơn, dùng nó
                    if (!effectiveRole.isAdmin()) { // Admin là cao nhất, không cần check
                         // Logic mới: Dựa vào nhóm chức vụ để thăng cấp
                         // Nếu chức vụ thuộc nhóm Lãnh đạo (Bí thư, Chủ tịch...) -> MANAGER
                         // Nếu chức vụ thuộc nhóm Hỗ trợ (Trưởng ban, CTV...) -> STAFF
                         
                         boolean isLanhDao = false;
                         boolean isHoTro = false;
                         
                         // Check theo từ khóa vì đã xóa Enum cụ thể
                         String tenCV = cv.getTenChucVu().toLowerCase();
                         if (tenCV.contains("bí thư") || tenCV.contains("chủ tịch") || tenCV.contains("thường vụ") || tenCV.contains("chấp hành")) {
                             isLanhDao = true;
                         } else if (tenCV.contains("trưởng ban") || tenCV.contains("phó ban") || tenCV.contains("ủy viên")) {
                             isHoTro = true;
                         }

                         if (isLanhDao) {
                             // Nếu đang là STAFF hoặc THAM_GIA -> lên MANAGER
                             // Nếu đang là MANAGER -> giữ nguyên
                             if (!effectiveRole.isQuanLy()) {
                                 effectiveRole = VaiTroEnum.MANAGER;
                             }
                         } else if (isHoTro) {
                             // Nếu đang là THAM_GIA -> lên STAFF
                             // Nếu đang là MANAGER -> giữ nguyên (không hạ cấp)
                             if (effectiveRole.isThanhVien()) {
                                 effectiveRole = VaiTroEnum.STAFF;
                             }
                         }
                    }

                    quyenTuChucVu.addAll(getPermissionsByChucVu(cv));
                    quyenTuChucVuIds.addAll(getPermissionIdsForChucVu(cv));
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

        // 2. Quyền cơ bản từ Vai trò (Sử dụng effectiveRole thay vì taiKhoan.getVaiTro())
        Set<String> quyenCoban = getBasePermissions(effectiveRole);
        
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

        // 5. Lấy danh sách ID quyền cơ bản và quyền từ chức vụ để trả về FE
        Set<Long> quyenCobanIds = new HashSet<>();
        if (effectiveRole != null) {
            quyenCobanIds.addAll(rolePermissionRepository.findPermissionIdsByRole(effectiveRole.name()));
        }

        // Trả về DTO với effectiveRole để FE hiển thị đúng
        return AccountPermissionDTO.builder()
                .accountId(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .hoTen(taiKhoan.getHoTen())
                .vaiTro(effectiveRole.name()) // Dùng effectiveRole
                .tenVaiTro(effectiveRole.getTenHienThi()) // Dùng effectiveRole
                .nhomVaiTro(effectiveRole.getNhomVaiTro()) // Dùng effectiveRole
                .toChuc(effectiveRole.getToChuc()) // Dùng effectiveRole
                .vaiTroGoc(originalRole.name()) // Vai trò gốc
                .tenVaiTroGoc(originalRole.getTenHienThi()) // Tên vai trò gốc
                .laBCH(laBCH)
                .danhSachChucVu(danhSachChucVu)
                .quyenCoban(quyenCoban)
                .quyenTuChucVu(quyenTuChucVu)
                .quyenTongHop(quyenTongHop)
                .overrideMap(overrideMap)
                .quyenCobanIds(quyenCobanIds)
                .quyenTuChucVuIds(quyenTuChucVuIds)
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
        systemLogService.log("PHAN_QUYEN", "UPDATE_ROLE_PERMISSIONS",
            roleName, roleName, "RolePermission", roleName,
            "Cập nhật " + permissionIds.size() + " quyền cho nhóm: " + roleName,
            SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
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
        log.info("Phân quyền tài khoản {} (grant={}, revoke={}) bởi {}", target.getUsername(), grantIds.size(), revokeIds.size(), adminUsername);
        systemLogService.log("PHAN_QUYEN", "UPDATE_ACCOUNT_PERMISSIONS",
            String.valueOf(taiKhoanId), target.getUsername(), "AccountPermission", String.valueOf(taiKhoanId),
            "Cấp " + grantIds.size() + " quyền, thu hồi " + revokeIds.size() + " quyền cho tài khoản: " + target.getUsername()
                + (ghiChu != null && !ghiChu.isEmpty() ? " | Ghi chú: " + ghiChu : ""),
            SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    // Xóa override của tài khoản
    @Transactional
    public void resetAccountPermissions(Long taiKhoanId, String adminUsername, String adminPassword) {
        TaiKhoan admin = taiKhoanRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu xác nhận không đúng");
        }
        List<AccountPermission> existing = accountPermissionRepository.findByTaiKhoanId(taiKhoanId);
        int count = existing.size();
        existing.forEach(accountPermissionRepository::delete);
        TaiKhoan target = taiKhoanRepository.findById(taiKhoanId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đích"));
        log.info("Reset quyền đặc biệt tài khoản {} ({} bản ghi) bởi {}", target.getUsername(), count, adminUsername);
        systemLogService.log("PHAN_QUYEN", "RESET_ACCOUNT_PERMISSIONS",
            String.valueOf(taiKhoanId), target.getUsername(), "AccountPermission", String.valueOf(taiKhoanId),
            "Xóa " + count + " quyền đặc biệt của tài khoản: " + target.getUsername(),
            SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }
}
