package com.tathanhloc.faceattendance.Enum;

/**
 * Enum để quản lý vai trò của người dùng trong hệ thống
 * Gồm 3 nhóm chính: Quản Lý, Phục Vụ, Tham Gia
 */
public enum VaiTroEnum {
    // ========== NHÓM QUẢN LÝ (Management Group) ==========

    // Quản lý Đoàn (Union Management)
    CHU_TICH_DOAN("Chủ tịch Đoàn", "QUAN_LY", "DOAN", "CAP_1"),
    PHO_CHU_TICH_DOAN("Phó chủ tịch Đoàn", "QUAN_LY", "DOAN", "CAP_1"),
    TONG_THU_KY_DOAN("Tổng thư ký Đoàn", "QUAN_LY", "DOAN", "CAP_2"),
    THU_KY_DOAN("Thư ký Đoàn", "QUAN_LY", "DOAN", "CAP_2"),
    TONG_THAM_MUU_DOAN("Tổng tham mưu Đoàn", "QUAN_LY", "DOAN", "CAP_2"),
    THAM_MUU_DOAN("Tham mưu Đoàn", "QUAN_LY", "DOAN", "CAP_3"),

    // Quản lý Hội (Association Management)
    CHU_TICH_HOI("Chủ tịch Hội", "QUAN_LY", "HOI", "CAP_1"),
    PHO_CHU_TICH_HOI("Phó chủ tịch Hội", "QUAN_LY", "HOI", "CAP_1"),
    TONG_THU_KY_HOI("Tổng thư ký Hội", "QUAN_LY", "HOI", "CAP_2"),
    THU_KY_HOI("Thư ký Hội", "QUAN_LY", "HOI", "CAP_2"),
    TONG_THAM_MUU_HOI("Tổng tham mưu Hội", "QUAN_LY", "HOI", "CAP_2"),
    THAM_MUU_HOI("Tham mưu Hội", "QUAN_LY", "HOI", "CAP_3"),

    // ========== NHÓM PHỤC VỤ (Service Group) ==========

    // Phục vụ Đoàn (Union Service)
    TRUONG_BAN_DOAN("Trưởng Ban Đoàn", "PHU_VU", "DOAN", "CAP_2"),
    PHO_TRUONG_BAN_DOAN("Phó Trưởng Ban Đoàn", "PHU_VU", "DOAN", "CAP_2"),
    UV_BAN_DOAN("Ủy viên Ban Đoàn", "PHU_VU", "DOAN", "CAP_3"),

    // Phục vụ Hội (Association Service)
    TRUONG_BAN_HOI("Trưởng Ban Hội", "PHU_VU", "HOI", "CAP_2"),
    PHO_TRUONG_BAN_HOI("Phó Trưởng Ban Hội", "PHU_VU", "HOI", "CAP_2"),
    UV_BAN_HOI("Ủy viên Ban Hội", "PHU_VU", "HOI", "CAP_3"),

    // ========== NHÓM THAM GIA (Participation Group) ==========

    // Tham gia Đoàn (Union Members)
    THANH_VIEN_DOAN("Thành viên Đoàn", "THAM_GIA", "DOAN", "CAP_4"),

    // Tham gia Hội (Association Members)
    THANH_VIEN_HOI("Thành viên Hội", "THAM_GIA", "HOI", "CAP_4"),

    // ========== VAI TRÒ ĐẶC BIỆT ==========
    ADMIN("Admin", "QUAN_LY", "HE_THONG", "CAP_0"),
    GIANG_VIEN_HUONG_DAN("Giảng viên hướng dẫn", "PHU_VU", "HE_THONG", "CAP_3"),

    // Vai trò cũ (backward compatibility)
    GIANGVIEN("Giảng viên", "PHU_VU", "HE_THONG", "CAP_3"),
    SINHVIEN("Sinh viên", "THAM_GIA", "HE_THONG", "CAP_4");

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

    /**
     * Kiểm tra xem vai trò có phải là quản lý không
     */
    public boolean isQuanLy() {
        return "QUAN_LY".equals(nhomVaiTro);
    }

    /**
     * Kiểm tra xem vai trò có phải là phục vụ không
     */
    public boolean isPhucVu() {
        return "PHU_VU".equals(nhomVaiTro);
    }

    /**
     * Kiểm tra xem vai trò có phải là thành viên không
     */
    public boolean isThanhVien() {
        return "THAM_GIA".equals(nhomVaiTro);
    }

    /**
     * Kiểm tra xem vai trò có phải là admin không
     */
    public boolean isAdmin() {
        return this == ADMIN;
    }

    /**
     * Lấy vai trò từ tên
     */
    public static VaiTroEnum fromName(String name) {
        try {
            return VaiTroEnum.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Backward compatibility - lấy vai trò từ giá trị cũ
     */
    public static VaiTroEnum fromValue(String value) {
        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            if (vaiTro.getTenHienThi().equalsIgnoreCase(value)) {
                return vaiTro;
            }
        }
        throw new IllegalArgumentException("Giá trị không hợp lệ: " + value);
    }
}
