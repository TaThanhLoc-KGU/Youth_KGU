package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CauLacBoDTO {

    private String maClb;
    private String tenClb;
    private String loai;          // CLB | DOI | NHOM
    private String moTa;
    private String linhVuc;

    // Khoa
    private String maKhoa;
    private String tenKhoa;

    // Ban quản lý
    private String maBan;
    private String tenBan;

    // Trưởng CLB
    private String truongClbMaSv;
    private String truongClbHoTen;

    // Tài khoản quản lý (dùng cho giảng viên / chuyên viên làm chủ nhiệm)
    private String maQuanLy;

    private LocalDate ngayThanhLap;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thống kê (không load mặc định)
    private Integer soThanhVien;
    private Integer soHoatDongHocKy; // số hoạt động trong HK hiện tại

    // Cấu hình đăng ký & cơ chế thành viên (từ clb_cau_hinh)
    private String cocheThanHVien;      // TU_DO | YEU_CAU_DONG_PHI | YEU_CAU_HOAT_DONG | YEU_CAU_CA_HAI
    private BigDecimal soTienPhiKy;
    private String donViPhi;            // KY | NAM | THANG
    private Integer soHoatDongToiThieu;
    private Boolean choPhepDangKyTuDo;
    private String moTaYeuCau;

    // Chi tiết thành viên (chỉ load khi xem detail)
    private List<ThanhVienCLBDTO> thanhViens;
}
