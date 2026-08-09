package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Body cho xem trước chứng nhận trước khi cấp — không có maSv/maHoatDong thì dùng dữ liệu mẫu. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanPreviewRequest {
    private Long templateId;
    private String maSv;
    private String maHoatDong;
}
