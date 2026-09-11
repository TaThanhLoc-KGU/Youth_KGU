package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.KieuSettingEnum;

import java.time.LocalDateTime;

/** DTO 1 dòng cài đặt hệ thống — trả về cho trang admin và endpoint /public. */
public record SystemSettingDTO(
        String key,
        String giaTri,
        KieuSettingEnum kieu,
        String nhom,
        String moTa,
        boolean congKhai,
        LocalDateTime updatedAt,
        String updatedBy
) {}
