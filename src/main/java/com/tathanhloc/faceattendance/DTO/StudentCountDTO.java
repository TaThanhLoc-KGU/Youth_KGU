// StudentCountDTO.java
package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCountDTO {
    private Long tongSinhVien;
    private Long sinhVienHoatDong;
    private Long sinhVienKhongHoatDong;

    // Theo khoa
    private Map<String, Long> thongKeTheoKhoa;

    // Theo ngành
    private Map<String, Long> thongKeTheoNganh;

    // Theo lớp
    private Map<String, Long> thongKeTheoLop;
}