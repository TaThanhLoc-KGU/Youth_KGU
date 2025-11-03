package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.LoaiThanhVienEnum;
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
    private String maBch; // Auto: BCHKGU0001

    // Loại thành viên
    private LoaiThanhVienEnum loaiThanhVien; // SINH_VIEN, GIANG_VIEN, CHUYEN_VIEN
    private String loaiThanhVienDisplay; // For display: "Sinh viên", "Giảng viên"...

    // Mã thành viên (dựa vào loại)
    private String maThanhVien; // maSv HOẶC maGv HOẶC maChuyenVien

    // Thông tin chung (lấy từ bảng tương ứng)
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String donVi; // Lớp (SV) hoặc Khoa (GV/CV)

    // Thông tin BCH
    private String nhiemKy;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private String hinhAnh;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Danh sách chức vụ
    private List<BCHChucVuDTO> danhSachChucVu;
}