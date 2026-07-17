package com.tathanhloc.youthkgu.DTO;

import java.time.LocalDateTime;

public record DanhSachBanHanhDTO(
        Long          id,
        String        maHoatDong,
        String        tenHoatDong,
        String        maKhoa,
        String        loaiKy,
        String        tenNguoiKy,
        String        tenNguoiLap,
        String        chucVuNguoiLap,
        boolean       coConDau,
        int           tongSv,
        String        tenFile,
        String        downloadUrl,    // /api/public/ban-hanh/{id}/download
        String        nguoiBanHanh,
        LocalDateTime createdAt,
        // Soft-delete fields
        String        trangThai,      // HIEU_LUC | DA_HUY
        LocalDateTime ngayHuy,
        String        nguoiHuy
) {}
