package com.tathanhloc.faceattendance.Enum;

/**
 * Enum để quản lý vai trò của người dùng trong hệ thống
 * Gồm 3 nhóm chính: Quản Lý, Phục Vụ, Tham Gia
 */
public enum VaiTroEnum {
    // ========== NHÓM QUẢN LÝ (Management Group) ==========
// NHÓM LÃNH ĐẠO ĐOÀN (CHỨC VỤ BẦU CỬ)

    // Cấp 1: Thường trực (Lãnh đạo cao nhất)
    BI_THU_DOAN("Bí thư Đoàn", "QUAN_LY", "DOAN", "CAP_1"),
    PHO_BI_THU_DOAN("Phó Bí thư Đoàn", "QUAN_LY", "DOAN", "CAP_1"),

    // Cấp 2: Ban Thường vụ (Lãnh đạo thường xuyên)
    UY_VIEN_THUONG_VU_DOAN("Ủy viên Ban Thường vụ", "QUAN_LY", "DOAN", "CAP_2"),

    // Cấp 3: Ban Chấp hành (Cơ quan lãnh đạo)
    UY_VIEN_CHAP_HANH_DOAN("Ủy viên Ban Chấp hành", "QUAN_LY", "DOAN", "CAP_3"),

    // NHÓM HỖ TRỢ, CHUYÊN MÔN (VAI TRÒ CÔNG VIỆC)

    // Có thể hiểu là Cán bộ chuyên trách làm công tác văn phòng, tổng hợp
    CAN_BO_VAN_PHONG_DOAN("Cán bộ Văn phòng Đoàn", "CHUYEN_MON", "DOAN", "CAP_4"),

    // Nếu bạn vẫn muốn dùng từ "Thư ký" để chỉ người làm công tác giấy tờ
    THU_KY_HANH_CHINH_DOAN("Thư ký hành chính Đoàn", "CHUYEN_MON", "DOAN", "CAP_4"),

    // NHÓM LÃNH ĐẠO HỘI (CHỨC VỤ BẦU CỬ)

    // CAP_1: Thường trực Hội (Lãnh đạo cao nhất)
    CHU_TICH_HOI("Chủ tịch Hội", "QUAN_LY", "HOI", "CAP_1"),
    PHO_CHU_TICH_HOI("Phó chủ tịch Hội", "QUAN_LY", "HOI", "CAP_1"),

    // CAP_2: Ban Thư ký (Cơ quan điều hành thường xuyên)
// Thay vì "Tổng Thư ký", Hội có "Ban Thư ký" và các thành viên gọi là "Ủy viên"
    UY_VIEN_THU_KY_HOI("Ủy viên Ban Thư ký", "QUAN_LY", "HOI", "CAP_2"),

    // CAP_3: Ban Chấp hành (Cơ quan lãnh đạo)
    UY_VIEN_CHAP_HANH_HOI("Ủy viên Ban Chấp hành", "QUAN_LY", "HOI", "CAP_3"),

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
    GIANG_VIEN("Giảng viên", "PHU_VU", "HE_THONG", "CAP_3"),
    SINH_VIEN("Sinh viên", "THAM_GIA", "HE_THONG", "CAP_4");

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
