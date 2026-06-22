package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPermissionDTO {
    private Long accountId;
    private String username;
    private String hoTen;

    /** VaiTroEnum.name() */
    private String vaiTro;
    /** VaiTroEnum.getLabel() — tên hiển thị tiếng Việt */
    private String tenVaiTro;

    /** true nếu role == ADMIN */
    private boolean laAdmin;

    /** Scope cấp khoa — null nếu không giới hạn */
    private String maKhoa;
    private String tenKhoa;

    /** Scope cấp CLB */
    private String maClb;
    private String tenClb;

    /** Scope cấp chi đoàn (Lop) */
    private String maLop;
    private String tenLop;

    /** Tất cả quyền hiệu lực: role defaults UNION overrides cá nhân */
    private Set<String> quyenTongHop;

    /** Tất cả ID quyền hiệu lực (role defaults + custom) */
    private Set<Long> quyenIds;

    /** ID quyền mặc định theo role (role_default_permissions) — không thể bỏ chọn */
    private Set<Long> defaultQuyenIds;

    /** ID quyền tùy chỉnh thêm bên ngoài role defaults (tai_khoan_quyen) */
    private Set<Long> customQuyenIds;
}
