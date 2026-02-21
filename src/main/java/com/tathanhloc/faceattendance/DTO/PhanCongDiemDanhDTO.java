package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO để trả về thông tin phân công điểm danh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhanCongDiemDanhDTO {

    private Long id;

    private String maHoatDong;

    private String tenHoatDong;

    private String maBch;

    private String tenBch;

    private String hoTenSinhVien;

    private String vaiTro;

    private String ghiChu;

    private LocalDateTime ngayPhanCong;

    private Boolean isActive;
}
