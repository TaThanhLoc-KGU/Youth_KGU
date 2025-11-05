package com.tathanhloc.faceattendance.Converter;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter để xử lý các giá trị enum VaiTro cũ (backward compatibility)
 * Mapping các giá trị cũ sang giá trị mới
 */
@Converter(autoApply = true)
public class VaiTroEnumConverter implements AttributeConverter<VaiTroEnum, String> {

    /**
     * Mapping các giá trị cũ sang giá trị mới
     */
    private static final java.util.Map<String, String> OLD_TO_NEW_MAPPING = java.util.Map.ofEntries(
        // Cấp bậc cũ -> Cấp bậc mới (Đoàn)
        java.util.Map.entry("BI_THU", "BI_THU_DOAN"),
        java.util.Map.entry("PHO_BI_THU", "PHO_BI_THU_DOAN"),
        java.util.Map.entry("TONG_THU_KY", "UY_VIEN_THUONG_VU_DOAN"),
        java.util.Map.entry("THU_KY", "CAN_BO_VAN_PHONG_DOAN"),

        // Cấp bậc cũ -> Cấp bậc mới (Hội)
        java.util.Map.entry("CHU_TICH", "CHU_TICH_HOI"),
        java.util.Map.entry("BI_THU_HOI", "CHU_TICH_HOI"), // BI_THU_HOI -> CHU_TICH_HOI
        java.util.Map.entry("PHO_CHU_TICH", "PHO_CHU_TICH_HOI"),
        java.util.Map.entry("TONG_THU_KY_HOI", "UY_VIEN_THU_KY_HOI"),
        java.util.Map.entry("THU_KY_HOI", "UY_VIEN_THU_KY_HOI"),

        // Keep current values as-is
        java.util.Map.entry("BI_THU_DOAN", "BI_THU_DOAN"),
        java.util.Map.entry("PHO_BI_THU_DOAN", "PHO_BI_THU_DOAN"),
        java.util.Map.entry("UY_VIEN_THUONG_VU_DOAN", "UY_VIEN_THUONG_VU_DOAN"),
        java.util.Map.entry("UY_VIEN_CHAP_HANH_DOAN", "UY_VIEN_CHAP_HANH_DOAN"),
        java.util.Map.entry("CAN_BO_VAN_PHONG_DOAN", "CAN_BO_VAN_PHONG_DOAN"),
        java.util.Map.entry("THU_KY_HANH_CHINH_DOAN", "THU_KY_HANH_CHINH_DOAN"),
        java.util.Map.entry("CHU_TICH_HOI", "CHU_TICH_HOI"),
        java.util.Map.entry("PHO_CHU_TICH_HOI", "PHO_CHU_TICH_HOI"),
        java.util.Map.entry("UY_VIEN_THU_KY_HOI", "UY_VIEN_THU_KY_HOI"),
        java.util.Map.entry("UY_VIEN_CHAP_HANH_HOI", "UY_VIEN_CHAP_HANH_HOI"),
        java.util.Map.entry("TRUONG_BAN_DOAN", "TRUONG_BAN_DOAN"),
        java.util.Map.entry("PHO_TRUONG_BAN_DOAN", "PHO_TRUONG_BAN_DOAN"),
        java.util.Map.entry("UV_BAN_DOAN", "UV_BAN_DOAN"),
        java.util.Map.entry("TRUONG_BAN_HOI", "TRUONG_BAN_HOI"),
        java.util.Map.entry("PHO_TRUONG_BAN_HOI", "PHO_TRUONG_BAN_HOI"),
        java.util.Map.entry("UV_BAN_HOI", "UV_BAN_HOI"),
        java.util.Map.entry("THANH_VIEN_DOAN", "THANH_VIEN_DOAN"),
        java.util.Map.entry("THANH_VIEN_HOI", "THANH_VIEN_HOI"),
        java.util.Map.entry("ADMIN", "ADMIN"),
        java.util.Map.entry("GIANG_VIEN_HUONG_DAN", "GIANG_VIEN_HUONG_DAN"),
        java.util.Map.entry("GIANGVIEN", "GIANGVIEN"),
        java.util.Map.entry("SINHVIEN", "SINHVIEN")
    );

    @Override
    public String convertToDatabaseColumn(VaiTroEnum attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public VaiTroEnum convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Kiểm tra xem có trong mapping cũ không
        String mappedValue = OLD_TO_NEW_MAPPING.getOrDefault(dbData, dbData);

        try {
            return VaiTroEnum.valueOf(mappedValue);
        } catch (IllegalArgumentException e) {
            // Nếu vẫn không tìm thấy, trả về ADMIN làm default
            System.err.println("Không tìm thấy enum value: " + dbData + ", mapping: " + mappedValue + ", sử dụng ADMIN làm default");
            return VaiTroEnum.ADMIN;
        }
    }
}
