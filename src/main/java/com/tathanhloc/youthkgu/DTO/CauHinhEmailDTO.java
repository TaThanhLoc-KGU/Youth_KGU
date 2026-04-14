package com.tathanhloc.youthkgu.DTO;

import java.time.LocalDateTime;

/**
 * DTO cấu hình email — password trả về là "••••••••" (không trả về thật)
 */
public record CauHinhEmailDTO(
        Long    id,
        String  smtpHost,
        Integer smtpPort,
        String  username,
        String  matKhau,      // mask "••••••••" khi GET, ghi thật khi PUT
        String  fromAddress,
        String  fromName,
        boolean tlsEnabled,
        boolean sslEnabled,
        boolean kichHoat,
        String  ghiChu,
        LocalDateTime updatedAt,
        String  updatedBy
) {}
