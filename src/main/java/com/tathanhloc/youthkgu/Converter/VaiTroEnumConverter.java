package com.tathanhloc.youthkgu.Converter;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter để xử lý các giá trị enum VaiTro cũ (backward compatibility)
 * Mapping các giá trị cũ sang giá trị mới
 */
@Converter(autoApply = true)
public class VaiTroEnumConverter implements AttributeConverter<VaiTroEnum, String> {

    @Override
    public String convertToDatabaseColumn(VaiTroEnum attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public VaiTroEnum convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Logic mapping cũ -> mới
        // Các chức vụ cụ thể (Bí thư, Chủ tịch...) sẽ được map về vai trò gốc (SINH_VIEN/GIANG_VIEN)
        // Quyền hạn sẽ được tính toán lại dựa trên bảng ChucVu
        
        String normalized = dbData.toUpperCase().trim();

        if (normalized.equals("ADMIN") || normalized.equals("QUAN_TRI")) return VaiTroEnum.ADMIN;
        if (normalized.equals("BCH")) return VaiTroEnum.BCH;
        if (normalized.equals("SINH_VIEN")) return VaiTroEnum.SINH_VIEN;
        if (normalized.contains("GIANG_VIEN") || normalized.equals("GV")) return VaiTroEnum.GIANG_VIEN;
        if (normalized.contains("CHUYEN_VIEN") || normalized.equals("CV")) return VaiTroEnum.CHUYEN_VIEN;
        if (normalized.equals("MANAGER")) return VaiTroEnum.MANAGER;
        if (normalized.equals("STAFF")) return VaiTroEnum.STAFF;

        // Mặc định: các giá trị không xác định → SINH_VIEN
        return VaiTroEnum.SINH_VIEN;
    }
}
