package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

// ManualAttendanceRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualAttendanceRequest {
    private String maSv;
    private TrangThaiThamGiaEnum trangThai;
    private LocalTime thoiGianVao;
    private LocalTime thoiGianRa;
}