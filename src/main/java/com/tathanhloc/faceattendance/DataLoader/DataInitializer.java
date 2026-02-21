package com.tathanhloc.faceattendance.DataLoader;

import com.tathanhloc.faceattendance.Model.Ban;
import com.tathanhloc.faceattendance.Model.ChucVu;
import com.tathanhloc.faceattendance.Model.Permission;
import com.tathanhloc.faceattendance.Model.RolePermission;
import com.tathanhloc.faceattendance.Repository.BanRepository;
import com.tathanhloc.faceattendance.Repository.ChucVuRepository;
import com.tathanhloc.faceattendance.Repository.PermissionRepository;
import com.tathanhloc.faceattendance.Repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final BanRepository banRepository;
    private final ChucVuRepository chucVuRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Initializing system data...");

        initializeBan();
        initializeChucVu();
        initializePermissions();
        initializeRolePermissions();

        log.info("System data initialization completed!");
    }

    private void initializeBan() {
        if (banRepository.count() > 0) {
            log.info("Ban data already exists, skipping initialization");
            return;
        }

        log.info("Initializing Ban data...");

        // Đoàn bans
        banRepository.save(Ban.builder().maBan("BAN001").tenBan("Ban Chấp hành Đoàn").loaiBan("DOAN").moTa("Ban chấp hành của Đoàn Thanh niên").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN002").tenBan("Ban Truyền thông").loaiBan("DOAN").moTa("Ban truyền thông Đoàn Thanh niên").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN003").tenBan("Ban Tổ chức").loaiBan("DOAN").moTa("Ban tổ chức Đoàn Thanh niên").isActive(true).build());

        // Hội bans
        banRepository.save(Ban.builder().maBan("BAN004").tenBan("Hội Sinh viên").loaiBan("HOI").moTa("Hội Sinh viên trường").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN005").tenBan("Hội Liên hiệp Thanh niên").loaiBan("HOI").moTa("Hội Liên hiệp Thanh niên trường").isActive(true).build());

        // Đội bans
        banRepository.save(Ban.builder().maBan("BAN006").tenBan("Đội Tình nguyện").loaiBan("DOI").moTa("Đội Tình nguyện sinh viên").isActive(true).build());

        // CLB bans
        banRepository.save(Ban.builder().maBan("BAN007").tenBan("CLB Thể thao").loaiBan("CLB").moTa("CLB Thể thao sinh viên").isActive(true).build());

        // Ban
        banRepository.save(Ban.builder().maBan("BAN008").tenBan("Ban Phục vụ").loaiBan("BAN").moTa("Ban Phục vụ sự kiện").isActive(true).build());

        log.info("Ban data initialized successfully");
    }

    private void initializeChucVu() {
        if (chucVuRepository.count() > 0) {
            log.info("ChucVu data already exists, skipping initialization");
            return;
        }

        log.info("Initializing ChucVu data...");

        // Đoàn positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV001").tenChucVu("Bí thư Đoàn").thuocBan("DOAN").moTa("Bí thư Đoàn Thanh niên trường").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV002").tenChucVu("Phó Bí thư Đoàn").thuocBan("DOAN").moTa("Phó Bí thư Đoàn Thanh niên trường").thuTu(2).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV003").tenChucVu("Trưởng Ban Truyền thông").thuocBan("DOAN").moTa("Trưởng Ban Truyền thông Đoàn").thuTu(3).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV004").tenChucVu("Trưởng Ban Tổ chức").thuocBan("DOAN").moTa("Trưởng Ban Tổ chức Đoàn").thuTu(4).isActive(true).build());

        // Hội positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV005").tenChucVu("Chủ tịch Hội Sinh viên").thuocBan("HOI").moTa("Chủ tịch Hội Sinh viên trường").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV006").tenChucVu("Phó Chủ tịch Hội Sinh viên").thuocBan("HOI").moTa("Phó Chủ tịch Hội Sinh viên trường").thuTu(2).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV007").tenChucVu("Tổng thư ký Hội").thuocBan("HOI").moTa("Tổng thư ký Hội Sinh viên").thuTu(3).isActive(true).build());

        // Đội positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV008").tenChucVu("Trưởng Đội").thuocBan("DOI").moTa("Trưởng Đội Tình nguyện").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV009").tenChucVu("Thành viên Đội").thuocBan("DOI").moTa("Thành viên Đội Tình nguyện").thuTu(2).isActive(true).build());

        // CLB positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV010").tenChucVu("Chủ tịch CLB").thuocBan("CLB").moTa("Chủ tịch CLB Thể thao").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV011").tenChucVu("Thành viên CLB").thuocBan("CLB").moTa("Thành viên CLB Thể thao").thuTu(2).isActive(true).build());

        // Ban positions (Ban Phục vụ)
        chucVuRepository.save(ChucVu.builder().maChucVu("CV012").tenChucVu("Trưởng Ban Phục vụ").thuocBan("BAN").moTa("Trưởng Ban Phục vụ").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV013").tenChucVu("Thành viên Ban Phục vụ").thuocBan("BAN").moTa("Thành viên Ban Phục vụ").thuTu(2).isActive(true).build());

        log.info("ChucVu data initialized successfully");
    }

    private void initializePermissions() {
        if (permissionRepository.count() > 0) {
            log.info("Permissions already exist, skipping initialization");
            return;
        }

        log.info("Initializing Permissions...");

        // Authentication
        createPermission("DANG_NHAP", "Đăng nhập hệ thống", "AUTHENTICATION");
        createPermission("DOI_MAT_KHAU", "Đổi mật khẩu", "AUTHENTICATION");

        // Activity Management
        createPermission("XEM_HOAT_DONG", "Xem danh sách hoạt động", "ACTIVITY");
        createPermission("DANG_KY_HOAT_DONG", "Đăng ký tham gia hoạt động", "ACTIVITY");
        createPermission("HUY_DANG_KY_HOAT_DONG", "Hủy đăng ký hoạt động", "ACTIVITY");
        createPermission("XEM_LICH_SU_THAM_GIA", "Xem lịch sử tham gia hoạt động", "ACTIVITY");
        createPermission("TAO_HOAT_DONG", "Tạo hoạt động mới", "ACTIVITY");
        createPermission("SUA_HOAT_DONG", "Chỉnh sửa hoạt động", "ACTIVITY");
        createPermission("XOA_HOAT_DONG", "Xóa hoạt động", "ACTIVITY");
        createPermission("DUYET_HOAT_DONG", "Duyệt hoạt động", "ACTIVITY");
        createPermission("QUAN_LY_HOAT_DONG", "Quản lý toàn bộ hoạt động", "ACTIVITY");

        // Attendance
        createPermission("DIEM_DANH", "Thực hiện điểm danh", "ATTENDANCE");
        createPermission("PHAN_CONG_DIEM_DANH", "Phân công người điểm danh", "ATTENDANCE");
        createPermission("XEM_DANH_SACH_DANG_KY", "Xem danh sách đăng ký", "ATTENDANCE");
        createPermission("QUAN_LY_DANG_KY", "Quản lý đăng ký (Duyệt/Hủy)", "ATTENDANCE");

        // Report
        createPermission("XEM_BAO_CAO", "Xem báo cáo thống kê", "REPORT");
        createPermission("XUAT_BAO_CAO", "Xuất báo cáo ra file", "REPORT");

        // User Management
        createPermission("QUAN_LY_THANH_VIEN", "Quản lý thành viên", "USER_MANAGEMENT");
        createPermission("QUAN_LY_TAI_KHOAN", "Quản lý tài khoản hệ thống", "USER_MANAGEMENT");

        log.info("Permissions initialized successfully");
    }

    private void createPermission(String name, String description, String category) {
        permissionRepository.save(Permission.builder()
                .name(name)
                .description(description)
                .category(category)
                .build());
    }

    private void initializeRolePermissions() {
        if (rolePermissionRepository.count() > 0) {
            log.info("Role Permissions already exist, skipping initialization");
            return;
        }

        log.info("Initializing Role Permissions...");

        // 1. ADMIN (Full Access)
        List<String> adminPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG", "TAO_HOAT_DONG", "SUA_HOAT_DONG", "XOA_HOAT_DONG", "DUYET_HOAT_DONG", "QUAN_LY_HOAT_DONG",
            "DIEM_DANH", "PHAN_CONG_DIEM_DANH", "XEM_DANH_SACH_DANG_KY", "QUAN_LY_DANG_KY",
            "XEM_BAO_CAO", "XUAT_BAO_CAO",
            "QUAN_LY_THANH_VIEN", "QUAN_LY_TAI_KHOAN"
        );
        assignPermissionsToRole("ADMIN", adminPerms);

        // 2. MANAGER (Quản lý - Effective Role)
        // Dành cho Bí thư, Chủ tịch, Thường vụ...
        List<String> managerPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG", "TAO_HOAT_DONG", "SUA_HOAT_DONG", "DUYET_HOAT_DONG", "QUAN_LY_HOAT_DONG",
            "DIEM_DANH", "PHAN_CONG_DIEM_DANH", "XEM_DANH_SACH_DANG_KY", "QUAN_LY_DANG_KY",
            "XEM_BAO_CAO", "XUAT_BAO_CAO",
            "QUAN_LY_THANH_VIEN"
        );
        assignPermissionsToRole("MANAGER", managerPerms);

        // 3. STAFF (Nhân viên hỗ trợ - Effective Role)
        // Dành cho Trưởng ban, Phó ban, CTV...
        List<String> staffPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG", "TAO_HOAT_DONG",
            "DIEM_DANH", "XEM_DANH_SACH_DANG_KY",
            "XEM_BAO_CAO"
        );
        assignPermissionsToRole("STAFF", staffPerms);

        // 4. GIANG_VIEN (Giảng viên - Identity Role)
        List<String> gvPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG",
            "XEM_DANH_SACH_DANG_KY"
        );
        assignPermissionsToRole("GIANG_VIEN", gvPerms);

        // 5. CHUYEN_VIEN (Chuyên viên - Identity Role)
        List<String> cvPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG",
            "XEM_DANH_SACH_DANG_KY"
        );
        assignPermissionsToRole("CHUYEN_VIEN", cvPerms);

        // 6. SINH_VIEN (Sinh viên - Identity Role)
        List<String> svPerms = Arrays.asList(
            "DANG_NHAP", "DOI_MAT_KHAU",
            "XEM_HOAT_DONG", "DANG_KY_HOAT_DONG",
            "HUY_DANG_KY_HOAT_DONG", "XEM_LICH_SU_THAM_GIA"
        );
        assignPermissionsToRole("SINH_VIEN", svPerms);

        log.info("Role Permissions initialized successfully");
    }

    private void assignPermissionsToRole(String roleName, List<String> permissionNames) {
        for (String permName : permissionNames) {
            permissionRepository.findByName(permName).ifPresent(permission -> {
                rolePermissionRepository.insertRolePermission(roleName, permission.getId());
            });
        }
    }
}
