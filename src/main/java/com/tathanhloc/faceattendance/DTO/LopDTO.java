package com.tathanhloc.faceattendance.DTO;

import com.tathanhloc.faceattendance.Model.Khoa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LopDTO {
    private String maLop;
    private String tenLop;
    private String maNganh;
    private String tenNganh;
    private String maKhoahoc;
    private String tenKhoahoc;
    private String maKhoa;
    private String tenKhoa;
    private Boolean isActive;
}
