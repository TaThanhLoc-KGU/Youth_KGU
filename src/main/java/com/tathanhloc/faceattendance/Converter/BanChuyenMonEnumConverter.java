package com.tathanhloc.faceattendance.Converter;

import com.tathanhloc.faceattendance.Enum.BanChuyenMonEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter để xử lý các giá trị enum BanChuyenMon cũ (backward compatibility)
 * Mapping các giá trị cũ sang giá trị mới
 */
@Converter(autoApply = true)
public class BanChuyenMonEnumConverter implements AttributeConverter<BanChuyenMonEnum, String> {

    /**
     * Mapping các giá trị cũ sang giá trị mới
     */
    private static final java.util.Map<String, String> OLD_TO_NEW_MAPPING = java.util.Map.ofEntries(
        // Ban cũ -> Ban mới (Đoàn)
        java.util.Map.entry("BAN_TUYEN_GIAO_DOAN", "BAN_GIAO_LUU_HOP_TAC_DOAN"),
        java.util.Map.entry("BAN_TUYEN_TRUYEN", "BAN_TUYEN_TRUYEN_DOAN"),

        // Ban cũ -> Ban mới (Hội)
        java.util.Map.entry("BAN_TUYEN_GIAO_HOI", "BAN_TU_VAN_HOI"),

        // Keep current values as-is (Đoàn)
        java.util.Map.entry("BAN_TUYEN_TRUYEN_DOAN", "BAN_TUYEN_TRUYEN_DOAN"),
        java.util.Map.entry("BAN_THANH_NIEN_XUNG_PHONG_DOAN", "BAN_THANH_NIEN_XUNG_PHONG_DOAN"),
        java.util.Map.entry("BAN_HOC_TAP_NGHE_NGHIEP_DOAN", "BAN_HOC_TAP_NGHE_NGHIEP_DOAN"),
        java.util.Map.entry("BAN_THE_THAO_DOAN", "BAN_THE_THAO_DOAN"),
        java.util.Map.entry("BAN_VAN_HOA_DOAN", "BAN_VAN_HOA_DOAN"),
        java.util.Map.entry("BAN_GIAO_LUU_HOP_TAC_DOAN", "BAN_GIAO_LUU_HOP_TAC_DOAN"),

        // Keep current values as-is (Hội)
        java.util.Map.entry("BAN_TU_VAN_HOI", "BAN_TU_VAN_HOI"),
        java.util.Map.entry("BAN_DAO_TAO_HO_TRO_HOI", "BAN_DAO_TAO_HO_TRO_HOI"),
        java.util.Map.entry("BAN_CHUONG_TRINH_HOI", "BAN_CHUONG_TRINH_HOI"),
        java.util.Map.entry("BAN_DIEN_TRA_GIAI_QUYET_HOI", "BAN_DIEN_TRA_GIAI_QUYET_HOI"),
        java.util.Map.entry("BAN_TU_THUONG_HOI", "BAN_TU_THUONG_HOI")
    );

    @Override
    public String convertToDatabaseColumn(BanChuyenMonEnum attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public BanChuyenMonEnum convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Kiểm tra xem có trong mapping cũ không
        String mappedValue = OLD_TO_NEW_MAPPING.getOrDefault(dbData, dbData);

        try {
            return BanChuyenMonEnum.valueOf(mappedValue);
        } catch (IllegalArgumentException e) {
            // Nếu vẫn không tìm thấy, sử dụng ban đầu tiên làm default (BAN_TUYEN_TRUYEN_DOAN)
            System.err.println("Không tìm thấy enum value: " + dbData + ", mapping: " + mappedValue + ", sử dụng BAN_TUYEN_TRUYEN_DOAN làm default");
            return BanChuyenMonEnum.BAN_TUYEN_TRUYEN_DOAN;
        }
    }
}
