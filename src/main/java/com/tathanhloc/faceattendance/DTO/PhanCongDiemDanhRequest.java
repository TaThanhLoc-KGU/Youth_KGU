package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO để phân công người điểm danh cho hoạt động
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhanCongDiemDanhRequest {

    /**
     * Mã hoạt động cần phân công
     */
    private String maHoatDong;

    /**
     * Danh sách mã BCH được phân công
     */
    private List<String> danhSachMaBch;

    /**
     * Vai trò: CHINH hoặc PHU
     */
    private String vaiTro;

    /**
     * Ghi chú về phân công
     */
    private String ghiChu;
}
