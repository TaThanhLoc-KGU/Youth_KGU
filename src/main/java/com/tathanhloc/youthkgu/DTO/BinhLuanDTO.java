package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

/** Bình luận hiển thị công khai — không lộ sđt/email/username. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BinhLuanDTO {
    private Long id;
    private String hoTen;
    private String noiDung;
    private boolean coTaiKhoan;
    private LocalDateTime createdAt;
}
