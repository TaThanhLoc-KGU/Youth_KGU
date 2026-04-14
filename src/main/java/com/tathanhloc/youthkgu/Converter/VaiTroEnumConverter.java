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
        return VaiTroEnum.fromValue(dbData);
    }
}
