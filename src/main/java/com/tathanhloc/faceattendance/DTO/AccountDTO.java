package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Enum.BanChuyenMonEnum;
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

    private BanChuyenMonEnum banChuyenMon;

    private String trangThaiPheDuyet; // CHO_PHE_DUYET, DA_PHE_DUYET, TU_CHOI

    private LocalDateTime ngayPheDuyet;

    private String ghiChu;

    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
