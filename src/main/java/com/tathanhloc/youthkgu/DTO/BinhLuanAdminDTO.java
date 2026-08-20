package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

/** Bình luận cho màn kiểm duyệt — đầy đủ thông tin để admin/BCH xử lý. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BinhLuanAdminDTO {
    private Long id;
    private String hoTen;
    private String noiDung;
    private String trangThai;
    private String username;
    private String soDienThoai;
    private String email;
    private String ipAddress;
    private String nguoiXuLy;
    private LocalDateTime ngayXuLy;
    private LocalDateTime createdAt;
}
