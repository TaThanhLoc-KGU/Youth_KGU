package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về thông tin user sau khi login
 * Bao gồm thông tin từ TaiKhoan và linked entity (SinhVien/GiangVien)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    // Thông tin tài khoản
    private Long id;
    private String username;
    private VaiTroEnum vaiTro;
    private Boolean isActive;

    // Thông tin người dùng (từ linked entity)
    private String hoTen;
    private String email;
    private String linkedEntityId;  // maSv hoặc maGv
    private String linkedEntityType; // "SINH_VIEN" hoặc "GIANG_VIEN"

    // Thông tin bổ sung cho sinh viên
    private String maLop;
    private String tenLop;

    // Thông tin bổ sung cho giảng viên
    private String maKhoa;
    private String tenKhoa;
}