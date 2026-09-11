package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.KieuSettingEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Cấu hình / feature-flag chung của hệ thống — 1 dòng = 1 khoá cài đặt (key-value).
 * <p>
 * Nạp toàn bộ vào cache RAM lúc khởi động (xem {@code SystemSettingService}); mọi service khác đọc
 * qua getter của service (không chạm DB). Chỉ admin có quyền {@code CAI_DAT_HE_THONG} sửa được;
 * các dòng {@code congKhai = true} được phục vụ qua {@code GET /api/system-settings/public} cho
 * frontend đọc trước khi đăng nhập (vd chế độ bảo trì, bật/tắt bình luận).
 */
@Entity
@Table(name = "system_setting")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting {

    @Id
    @Column(name = "khoa_setting", length = 120)
    private String khoaSetting;

    @Column(name = "gia_tri", length = 1000)
    private String giaTri;

    @Enumerated(EnumType.STRING)
    @Column(name = "kieu", length = 16, nullable = false)
    @Builder.Default
    private KieuSettingEnum kieu = KieuSettingEnum.STRING;

    @Column(name = "nhom", length = 60)
    private String nhom;

    @Column(name = "mo_ta", length = 255)
    private String moTa;

    @Column(name = "cong_khai")
    @Builder.Default
    private Boolean congKhai = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 60)
    private String updatedBy;
}
