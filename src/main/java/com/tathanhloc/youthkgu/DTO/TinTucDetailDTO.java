package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO chi tiết bài viết kèm breadcrumb — dùng cho trang đọc bài.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucDetailDTO {
    private Long id;
    private String tieuDe;
    private String tomTat;
    private String noiDung;
    private String anhDaiDien;
    private String trangThai;
    private LocalDateTime ngayXuatBan;
    private String nguoiTao;
    private String tacGia;   // Tên hiển thị tác giả
    private String donViDang;
    private Integer luotXem;
    private String fullUrlPath;

    // Tương tác: like/comment/share
    private Integer luotThich;
    private Integer luotBinhLuan;
    private Integer luotChiaSe;
    private Boolean khoaBinhLuan;

    // Danh mục + breadcrumb
    private ChuyenMucDTO chuyenMuc;
    private List<ChuyenMucDTO> breadcrumb;  // [root → ... → chuyenMuc hiện tại]

    // Liên kết tùy chọn
    private VanBanDTO vanBan;
    private String hoatDongId;

    // Thông tin hoạt động đính kèm (join từ hoat_dong nếu hoatDongId != null)
    private String tenHoatDong;
    private String trangThaiHoatDong;
    private LocalDateTime hanDangKy;
    private Integer soChoConLai;

    // Gallery ảnh
    private List<TinTucAnhDTO> anhList;
}
