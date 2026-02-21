package com.tathanhloc.faceattendance.Enum;

/**
 * Enum để quản lý các ban chuyên môn của Đoàn và Hội
 * Gồm 11 ban: 6 ban Đoàn + 5 ban Hội
 */
public enum BanChuyenMonEnum {
    // ========== BAN CHUYÊN MÔN ĐOÀN (6 bans) ==========

    BAN_TUYEN_TRUYEN_DOAN("Ban Tuyên truyền", "DOAN"),
    BAN_THANH_NIEN_XUNG_PHONG_DOAN("Ban Thanh niên xung phong", "DOAN"),
    BAN_HOC_TAP_NGHE_NGHIEP_DOAN("Ban Học tập - Nghề nghiệp", "DOAN"),
    BAN_THE_THAO_DOAN("Ban Thể thao", "DOAN"),
    BAN_VAN_HOA_DOAN("Ban Văn hóa", "DOAN"),
    BAN_GIAO_LUU_HOP_TAC_DOAN("Ban Giao lưu - Hợp tác", "DOAN"),

    // ========== BAN CHUYÊN MÔN HỘI (5 bans) ==========

    BAN_TU_VAN_HOI("Ban Tư vấn", "HOI"),
    BAN_DAO_TAO_HO_TRO_HOI("Ban Đào tạo - Hỗ trợ", "HOI"),
    BAN_CHUONG_TRINH_HOI("Ban Chương trình", "HOI"),
    BAN_DIEN_TRA_GIAI_QUYET_HOI("Ban Điều tra - Giải quyết", "HOI"),
    BAN_TU_THUONG_HOI("Ban Tư tưởng", "HOI");

    private final String tenBan;      // Tên ban chuyên môn
    private final String thuocToChuc;  // Tổ chức: DOAN hoặc HOI

    BanChuyenMonEnum(String tenBan, String thuocToChuc) {
        this.tenBan = tenBan;
        this.thuocToChuc = thuocToChuc;
    }

    // Getters
    public String getTenBan() {
        return tenBan;
    }

    public String getThuocToChuc() {
        return thuocToChuc;
    }

    /**
     * Kiểm tra xem ban có thuộc Đoàn không
     */
    public boolean isBanDoan() {
        return "DOAN".equals(thuocToChuc);
    }

    /**
     * Kiểm tra xem ban có thuộc Hội không
     */
    public boolean isBanHoi() {
        return "HOI".equals(thuocToChuc);
    }

    /**
     * Lấy ban từ tên
     */
    public static BanChuyenMonEnum fromName(String name) {
        try {
            return BanChuyenMonEnum.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Lấy ban từ tên hiển thị
     */
    public static BanChuyenMonEnum fromTenBan(String tenBan) {
        for (BanChuyenMonEnum ban : BanChuyenMonEnum.values()) {
            if (ban.getTenBan().equalsIgnoreCase(tenBan)) {
                return ban;
            }
        }
        throw new IllegalArgumentException("Ban chuyên môn không tồn tại: " + tenBan);
    }
}
