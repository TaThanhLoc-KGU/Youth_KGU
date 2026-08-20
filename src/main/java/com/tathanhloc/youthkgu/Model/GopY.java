package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.LoaiGopY;
import com.tathanhloc.youthkgu.Enum.TrangThaiGopY;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Thùng thư góp ý — sinh viên phản ánh/góp ý về hoạt động Đoàn-Hội.
 * Danh tính người gửi (nguoiGuiUsername) chỉ dùng nội bộ (chống lạm dụng, để người
 * gửi xem lại lịch sử của chính mình) — KHÔNG BAO GIỜ trả về trong DTO admin
 * (xem GopYAdminDTO / GopYService.toAdminDTO) để đảm bảo tính minh bạch/dân chủ.
 */
@Entity
@Table(name = "gop_y")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GopY {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tieu_de", nullable = false, length = 300)
    private String tieuDe;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai", nullable = false, length = 20)
    @Builder.Default
    private LoaiGopY loai = LoaiGopY.GOP_Y;

    /** FK mềm -> tai_khoan.username. Chỉ dùng nội bộ, KHÔNG lộ ra DTO admin. */
    @Column(name = "nguoi_gui_username", nullable = false, length = 50)
    private String nguoiGuiUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private TrangThaiGopY trangThai = TrangThaiGopY.MOI;

    @Column(name = "phan_hoi", columnDefinition = "TEXT")
    private String phanHoi;

    /** FK mềm -> tai_khoan.username — người phản hồi (admin/BCH, không cần ẩn). */
    @Column(name = "nguoi_phan_hoi", length = 50)
    private String nguoiPhanHoi;

    @Column(name = "ngay_phan_hoi")
    private LocalDateTime ngayPhanHoi;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
