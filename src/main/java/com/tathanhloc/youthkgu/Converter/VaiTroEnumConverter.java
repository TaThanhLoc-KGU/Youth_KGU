package com.tathanhloc.youthkgu.Converter;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter xử lý backward compatibility với giá trị vai trò cũ trong DB.
 * DB lưu tên enum (ADMIN, QUAN_LY_KHOA, ...).
 * Giá trị legacy (QUAN_LY, SINH_VIEN, BCH, ...) được map qua VaiTroEnum.fromValue().
 */
@Converter(autoApply = true)
public class VaiTroEnumConverter implements AttributeConverter<VaiTroEnum, String> {

    @Override
    public String convertToDatabaseColumn(VaiTroEnum attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public VaiTroEnum convertToEntityAttribute(String dbData) {
        return VaiTroEnum.fromValue(dbData);
    }
}
