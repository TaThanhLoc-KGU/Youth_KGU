package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Metadata 1 lần "Tạo xác nhận hoạt động đã tham gia" cho 1 sinh viên trong 1 học kỳ — file PDF
 * thật (đã ký số + khoá) được lưu trên đĩa, đây chỉ là bản ghi để tra cứu/tải lại + audit.
 * Sinh viên chỉ thấy được bản ghi của chính mình (lọc theo maSv ở service).
 */
@Entity
@Table(name = "xac_nhan_hoat_dong_ren_luyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class XacNhanHoatDongRenLuyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_sv", nullable = false, length = 20)
    private String maSv;

    @Column(name = "so_hoc_ky", nullable = false)
    private Integer soHocKy;

    @Column(name = "ma_nam_hoc", nullable = false, length = 20)
    private String maNamHoc;

    @Column(name = "so_hoat_dong", nullable = false)
    private Integer soHoatDong;

    @Column(name = "tong_diem", nullable = false)
    private Integer tongDiem;

    @Column(name = "ten_file", length = 255)
    private String tenFile;

    @Column(name = "duong_dan_file", length = 500)
    private String duongDanFile;

    /** HIEU_LUC | DA_HUY — tạo lại cho cùng (maSv, soHocKy, maNamHoc) sẽ huỷ bản cũ. */
    @Builder.Default
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai = "HIEU_LUC";

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
