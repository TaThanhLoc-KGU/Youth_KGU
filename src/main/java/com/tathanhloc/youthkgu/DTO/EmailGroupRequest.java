package com.tathanhloc.youthkgu.DTO;

import lombok.*;

/** Request tạo/sửa 1 nhóm mail. maKhoa để trống = nhóm chung (không gắn khoa nào). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailGroupRequest {
    private String tenNhom;
    private String diaChiEmail;
    private String maKhoa;
}
