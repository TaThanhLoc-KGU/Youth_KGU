package com.tathanhloc.faceattendance.Enum;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Map;

/**
 * Enum để quản lý vai trò của người dùng trong hệ thống
 * Đã được tái cấu trúc: Chỉ giữ lại các vai trò định danh (Identity Roles) và vai trò hệ thống.
 * Các chức vụ cụ thể (Bí thư, Chủ tịch...) đã được chuyển sang quản lý bằng bảng ChucVu.
 */
public enum VaiTroEnum {
    // ========== VAI TRÒ HỆ THỐNG (System Roles) ==========
    ADMIN("Quản trị viên", "QUAN_LY", "HE_THONG", "CAP_0"),

    // ========== VAI TRÒ ĐỊNH DANH (Identity Roles) ==========
    // Dùng để xác định loại tài khoản cơ bản
    GIANG_VIEN("Giảng viên", "PHU_VU", "HE_THONG", "CAP_3"),
    SINH_VIEN("Sinh viên", "THAM_GIA", "HE_THONG", "CAP_4"),
    BCH("Ban Chấp hành Đoàn - Hội", "QUAN_LY", "DOAN_HOI", "CAP_2"), // Cán bộ BCH Đoàn - Hội
    CHUYEN_VIEN("Chuyên viên", "PHUC_VU", "HE_THONG", "CAP_3"), // Thêm mới cho đối tượng Chuyên viên

    // ========== VAI TRÒ HIỆU LỰC (Effective Roles - Dynamic) ==========
    // Dùng cho logic phân quyền động, không gán trực tiếp vào tài khoản gốc
    MANAGER("Quản lý", "QUAN_LY", "HE_THONG", "CAP_2"),
    STAFF("Nhân viên hỗ trợ", "PHU_VU", "HE_THONG", "CAP_3");

    private final String tenHienThi;  // Tên hiển thị
    private final String nhomVaiTro;  // Nhóm: QUAN_LY, PHU_VU, THAM_GIA
    private final String toChuc;      // Tổ chức: DOAN, HOI, HE_THONG
    private final String capBac;      // Cấp bậc: CAP_0 (Admin), CAP_1, CAP_2, CAP_3, CAP_4

    VaiTroEnum(String tenHienThi, String nhomVaiTro, String toChuc, String capBac) {
        this.tenHienThi = tenHienThi;
        this.nhomVaiTro = nhomVaiTro;
        this.toChuc = toChuc;
        this.capBac = capBac;
    }

    // Getters
    public String getTenHienThi() {
        return tenHienThi;
    }

    public String getNhomVaiTro() {
        return nhomVaiTro;
    }

    public String getToChuc() {
        return toChuc;
    }

    public String getCapBac() {
        return capBac;
    }

    public boolean isQuanLy() {
        return "QUAN_LY".equals(nhomVaiTro);
    }

    public boolean isPhucVu() {
        return "PHU_VU".equals(nhomVaiTro);
    }

    public boolean isThanhVien() {
        return "THAM_GIA".equals(nhomVaiTro);
    }

    public boolean isAdmin() {
        return this == ADMIN;
    }

    /**
     * Backward compatibility - lấy vai trò từ giá trị cũ hoặc từ Jackson deserialization
     */
    @JsonCreator
    public static VaiTroEnum fromValue(String value) {
        if (value == null) return null;
        
        String normalized = value.replace(" ", "_").toUpperCase();
        
        // Mapping các giá trị sang Identity Roles
        if (normalized.equals("ADMIN") || normalized.equals("QUAN_TRI")) {
            return ADMIN;
        }
        if (normalized.equals("BCH")) {
            return BCH;
        }
        if (normalized.contains("GIANG_VIEN") || normalized.equals("GV")) {
            return GIANG_VIEN;
        }
        if (normalized.contains("CHUYEN_VIEN") || normalized.equals("CV")) {
            return CHUYEN_VIEN;
        }
        if (normalized.equals("SINH_VIEN") || normalized.equals("SV")) {
            return SINH_VIEN;
        }
        if (normalized.equals("MANAGER")) return MANAGER;
        if (normalized.equals("STAFF")) return STAFF;

        // Mặc định: Bí thư, Chủ tịch, Trưởng ban... → BCH (cán bộ đoàn)
        // Sinh viên thường không có tiền tố đặc biệt → SINH_VIEN
        return SINH_VIEN;
    }

    /**
     * @deprecated Dùng fromValue thay vào
     */
    @Deprecated
    public static VaiTroEnum fromName(String name) {
        return fromValue(name);
    }
}
