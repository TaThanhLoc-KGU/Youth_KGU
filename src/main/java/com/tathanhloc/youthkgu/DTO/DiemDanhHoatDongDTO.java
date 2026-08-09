package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho Điểm danh hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhHoatDongDTO {
    private Long id;

    private String maHoatDong;
    private String tenHoatDong; // Thêm để hiển thị

    private String maSv;
    private String hoTenSinhVien; // Thêm để hiển thị
    private String emailSinhVien; // Thêm để hiển thị
    private String maLop;         // Mã lớp (dùng trong Excel)
    private String tenLop;        // Tên lớp
    private String tenKhoa;       // Tên khoa (dùng trong Excel)

    /**
     * Mã QR đã được quét
     */
    private String maQRDaQuet;

    private TrangThaiThamGiaEnum trangThai;

    /**
     * Thời gian quét QR code (check-in)
     */
    private LocalDateTime thoiGianCheckIn;

    /**
     * Thời gian check-out (nếu có)
     */
    private LocalDateTime thoiGianCheckOut;

    private String maBchXacNhan;
    private String tenNguoiXacNhan; // Thêm để hiển thị
    private String tenNguoiCheckOut; // Người xác nhận check-out (null nếu tự check-out/chưa check-out)

    private String ghiChu;

    // Chi tiết check-in/out
    private String trangThaiCheckIn;
    private Integer soPhutTre;
    private String trangThaiCheckOut;
    private Integer soPhutVeSom;
    private Integer tongThoiGianThamGia;
    private Boolean datThoiGianToiThieu;

    // Metadata
    private String thietBiQuet;
    private Double latitude;
    private Double longitude;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}