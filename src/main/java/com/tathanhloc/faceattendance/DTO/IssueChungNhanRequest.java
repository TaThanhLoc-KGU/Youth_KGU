package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO cho cấp chứng nhận
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueChungNhanRequest {
    private String maSv;
    private String maHoatDong;
    private String noiDung;
    private String filePath;
}