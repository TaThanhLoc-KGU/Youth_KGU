package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

/** Góp ý — self-view (chủ tài khoản xem lại lịch sử gửi của chính mình). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GopYDTO {
    private Long id;
    private String tieuDe;
    private String noiDung;
    private String loai;
    private String trangThai;
    private String phanHoi;
    private LocalDateTime ngayPhanHoi;
    private LocalDateTime createdAt;
}
