package com.tathanhloc.youthkgu.DTO;

import java.time.LocalDateTime;

public record DanhSachBanHanhDTO(
        Long          id,
        String        maHoatDong,
        String        tenHoatDong,
        String        loaiKy,
        String        tenNguoiKy,
        String        tenNguoiLap,
        String        chucVuNguoiLap,
        boolean       coConDau,
        int           tongSv,
        String        tenFile,
        String        downloadUrl,   // /api/public/ban-hanh/{id}/download
        String        nguoiBanHanh,
        LocalDateTime createdAt
) {}
