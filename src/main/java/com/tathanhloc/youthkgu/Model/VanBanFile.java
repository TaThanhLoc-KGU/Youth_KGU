package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * File đính kèm của văn bản.
 * Mỗi VanBan chỉ có đúng 1 bản ghi (VB-002 — enforce ở Service).
 * Chỉ được thay thế khi van_ban.trang_thai = DRAFT.
 */
@Entity
@Table(name = "van_ban_file")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VanBanFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "van_ban_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VanBan vanBan;

    @Column(name = "ten_file_goc", nullable = false, length = 500)
    private String tenFileGoc;

    @Column(name = "ten_hien_thi", length = 500)
    private String tenHienThi;

    @Column(name = "duong_dan", nullable = false, length = 1000)
    private String duongDan;    // /uploads/van-ban/2025/03/{uuid}.pdf

    @Column(name = "loai_file", nullable = false, length = 20)
    private String loaiFile;    // pdf | docx | xlsx | pptx

    @Column(name = "kich_thuoc", nullable = false)
    private Long kichThuoc;     // bytes

    @Column(name = "nguoi_upload", nullable = false, length = 50)
    private String nguoiUpload;

    @CreationTimestamp
    @Column(name = "ngay_upload", updatable = false)
    private LocalDateTime ngayUpload;
}
