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

    /** Loại tài khoản: SINH_VIEN hoặc QUAN_LY */
    private String vaiTro;
    private String tenVaiTro;

    /** true = QUAN_LY có toàn quyền (admin) */
    private boolean laAdmin;

    /** Khoa scope — null = không giới hạn (Đoàn trường), non-null = chỉ khoa này */
    private String maKhoa;
    private String tenKhoa;

    /** Tập hợp tên quyền hiệu lực (dùng cho kiểm tra phía FE và BE) */
    private Set<String> quyenTongHop;

    /** Tập hợp ID quyền (dùng cho UI checkbox) */
    private Set<Long> quyenIds;
}
