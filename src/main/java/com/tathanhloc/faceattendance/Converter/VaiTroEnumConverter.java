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
        
        String normalized = dbData.toUpperCase();

        if (normalized.contains("ADMIN")) return VaiTroEnum.ADMIN;
        if (normalized.contains("GIANG_VIEN") || normalized.contains("GV")) return VaiTroEnum.GIANG_VIEN;
        if (normalized.contains("CHUYEN_VIEN") || normalized.contains("CV")) return VaiTroEnum.CHUYEN_VIEN;
        if (normalized.equals("MANAGER")) return VaiTroEnum.MANAGER;
        if (normalized.equals("STAFF")) return VaiTroEnum.STAFF;

        // Mặc định tất cả các chức vụ cũ (Bí thư, Chủ tịch, Trưởng ban...) map về SINH_VIEN
        // Vì đây là vai trò gốc của tài khoản.
        return VaiTroEnum.SINH_VIEN;
    }
}
