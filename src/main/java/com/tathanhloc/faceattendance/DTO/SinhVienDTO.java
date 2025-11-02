package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Enum.GioiTinhEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SinhVienDTO {
    private String maSv;
    private String hoTen;
    private GioiTinhEnum gioiTinh;
    private LocalDate ngaySinh;
    private String email;
    private String sdt;
    private String maLop;
    private String tenLop; // Để hiển thị
    private Boolean isActive;
    private String errorMessage; // Để báo lỗi khi import
}