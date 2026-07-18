package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "diem_ren_luyen_lich_su")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemRenLuyenLichSu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "drl_id", nullable = false)
    private Long drlId;

    @Column(name = "ma_sv", nullable = false, length = 50)
    private String maSv;

    @Column(name = "ma_hoc_ky", nullable = false, length = 20)
    private String maHocKy;

    /** Snapshot mau_id tại thời điểm chấm */
    @Column(name = "mau_id", nullable = false)
    private Long mauId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "scores", columnDefinition = "TEXT")
    private String scores;

    @Column(name = "tong_diem", nullable = false)
    @Builder.Default
    private Integer tongDiem = 0;

    @Column(name = "xep_loai", length = 20)
    private String xepLoai;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ly_do_thay_doi", columnDefinition = "TEXT")
    private String lyDoThayDoi;

    @Column(name = "nguoi_thuc_hien", length = 100)
    private String nguoiThucHien;

    @Column(name = "thoi_gian", nullable = false)
    @Builder.Default
    private LocalDateTime thoiGian = LocalDateTime.now();
}
