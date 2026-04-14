package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiemDanhStatusDTO {
    private String maSv;
    private String hoTen;
    private String lop;
    private String maQR;
    private LocalDateTime ngayDangKy;
    
    // Trạng thái điểm danh
    private boolean daDiemDanh;
    private LocalDateTime thoiGianCheckIn;
    private LocalDateTime thoiGianCheckOut;
    private String trangThaiCheckIn; // DUNG_GIO, DI_TRE
    private String trangThaiCheckOut; // DUNG_GIO, VE_SOM
    private String trangThaiThamGia; // DA_THAM_GIA, VANG_CO_PHEP, VANG_KHONG_PHEP
    
    // Thông tin thêm
    private Integer soPhutTre;
    private Integer soPhutVeSom;
    private String ghiChu;

    // Vị trí GPS của sinh viên khi mở QR (để phát hiện gian lận)
    private Double studentLatitude;
    private Double studentLongitude;
}