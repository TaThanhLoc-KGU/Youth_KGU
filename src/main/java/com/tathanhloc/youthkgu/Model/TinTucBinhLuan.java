package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.TrangThaiBinhLuan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Bình luận trên bài viết eNews — hỗ trợ ẩn danh (khách nhập họ tên/sđt/email)
 * và tài khoản đã đăng nhập (tự lấy hoTen).
 */
@Entity
@Table(name = "tin_tuc_binh_luan")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucBinhLuan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tin_tuc_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TinTuc tinTuc;

    /** FK mềm -> tai_khoan.username. NULL = bình luận khách. */
    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "ho_ten", nullable = false, length = 150)
    private String hoTen;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private TrangThaiBinhLuan trangThai = TrangThaiBinhLuan.HIEN;

    /** FK mềm -> tai_khoan.username — admin đã chặn/xóa bình luận này. */
    @Column(name = "nguoi_xu_ly", length = 50)
    private String nguoiXuLy;

    @Column(name = "ngay_xu_ly")
    private LocalDateTime ngayXuLy;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
