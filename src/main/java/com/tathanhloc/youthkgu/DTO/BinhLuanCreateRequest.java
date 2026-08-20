package com.tathanhloc.youthkgu.DTO;

import lombok.*;

/**
 * Body gửi bình luận mới. hoTen/soDienThoai/email chỉ bắt buộc khi chưa đăng nhập
 * (validate ở TinTucBinhLuanService — khi đã đăng nhập thì hoTen tự lấy từ tài khoản).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BinhLuanCreateRequest {
    private String noiDung;
    private String hoTen;
    private String soDienThoai;
    private String email;
}
