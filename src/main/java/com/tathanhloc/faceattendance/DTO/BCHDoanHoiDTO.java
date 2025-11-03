package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BCHDoanHoiDTO {
    private String maBch; // BCHKGU0001 - Auto generated

    // Thông tin sinh viên
    private String maSv;
    private String hoTen; // From SinhVien
    private String email; // From SinhVien
    private String soDienThoai; // From SinhVien
    private String tenLop; // From SinhVien
    private String gioiTinh; // From SinhVien
    private LocalDate ngaySinh; // From SinhVien

    // Thông tin BCH
    private String nhiemKy; // 2023-2024
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private String hinhAnh; // Optional
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Danh sách chức vụ
    private List<BCHChucVuDTO> danhSachChucVu;
}