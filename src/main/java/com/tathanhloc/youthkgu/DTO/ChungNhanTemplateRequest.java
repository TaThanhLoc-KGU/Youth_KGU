package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Body JSON của phần "data" khi tạo/sửa mẫu chứng nhận (multipart, ảnh nền gửi riêng). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanTemplateRequest {
    private String ten;
    private List<ChungNhanTemplateFieldDTO> fields;
}
