package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho điểm danh thủ công (admin/BCH đánh dấu danh sách sinh viên)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualCheckInRequest {
    private String maHoatDong;
    private List<String> maSvList;
    private String ghiChu;
    private String maBchXacNhan;
}
