package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountDTO {

    private Long id;
    private String username;
    private String email;
    private String hoTen;
    private String soDienThoai;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private String avatar;

    private VaiTroEnum vaiTro;
    /** Tên hiển thị vai trò tiếng Việt */
    private String tenVaiTro;

    private String banChuyenMon;
    private String tenBanChuyenMon;

    private String trangThaiPheDuyet;
    private LocalDateTime ngayPheDuyet;
    private String ghiChu;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Scope cấp khoa */
    private String maKhoa;
    private String tenKhoa;

    /** Scope cấp CLB */
    private String maClb;
    private String tenClb;

    /** Scope cấp chi đoàn (Lop) */
    private String maLop;
    private String tenLop;

    /** Mã sinh viên liên kết (nếu có) */
    private String maSv;
    /** Mã giảng viên liên kết (nếu có) */
    private String maGv;

    @Deprecated
    private Boolean laAdmin;
}
