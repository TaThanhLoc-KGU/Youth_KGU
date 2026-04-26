package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO để trả về thông tin tài khoản người dùng
 */
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

    private String gioiTinh; // NAM, NU, KHAC

    private String avatar; // Base64 encoded image

    private VaiTroEnum vaiTro;

    private String banChuyenMon; // Mã ban (String) thay vì Enum

    private String tenBanChuyenMon; // Tên ban để hiển thị

    private String trangThaiPheDuyet; // CHO_PHE_DUYET, DA_PHE_DUYET, TU_CHOI

    private LocalDateTime ngayPheDuyet;

    private String ghiChu;

    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** true = QUAN_LY có toàn quyền (admin bypass) */
    private Boolean laAdmin;

    private String maKhoa;
    private String tenKhoa;

    /** CLB scope — null = không giới hạn, non-null = chỉ quản lý CLB này */
    private String maClb;
    private String tenClb;
}
