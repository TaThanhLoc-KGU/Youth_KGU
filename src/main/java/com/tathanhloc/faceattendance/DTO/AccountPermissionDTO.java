package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPermissionDTO {
    private Long accountId;
    private String username;
    private String hoTen;
    private String vaiTro;          // VaiTroEnum name
    private String tenVaiTro;       // Display name
    private String nhomVaiTro;      // QUAN_LY / PHU_VU / THAM_GIA
    private String toChuc;          // DOAN / HOI / HE_THONG

    // Thông tin chức vụ BCH (nếu có)
    private boolean laBCH;
    private List<ChucVuInfoDTO> danhSachChucVu;
    
    // Quyền tổng hợp (Names) - để hiển thị nếu cần
    private Set<String> quyenCoban;          
    private Set<String> quyenTuChucVu;       
    private Set<String> quyenTongHop;        
    
    // Override cá nhân (Map<PermissionID, Boolean>) - để logic toggle
    private Map<Long, Boolean> overrideMap;
}
