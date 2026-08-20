package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Góp ý — admin/BCH view. CỐ TÌNH không có field định danh người gửi nào
 * (không username, không hoTen) — đảm bảo ẩn danh ở tầng dữ liệu, không chỉ ở UI,
 * để phản ánh giữ được tính minh bạch/dân chủ theo đúng yêu cầu nghiệp vụ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GopYAdminDTO {
    private Long id;
    private String tieuDe;
    private String noiDung;
    private String loai;
    private String trangThai;
    private String phanHoi;
    private String nguoiPhanHoi;
    private LocalDateTime ngayPhanHoi;
    private LocalDateTime createdAt;
}
