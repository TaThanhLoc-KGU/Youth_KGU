package com.tathanhloc.youthkgu.DTO;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClbCauHinhDTO {
    private String maClb;
    private String tenClb;

    // Cơ chế thành viên
    private String cocheThanHVien;          // TU_DO | YEU_CAU_HOAT_DONG | YEU_CAU_DONG_PHI | YEU_CAU_CA_HAI
    private Integer soHoatDongToiThieu;

    // Phí
    private BigDecimal soTienPhiKy;
    private String donViPhi;                // KY | NAM | THANG

    // Đăng ký
    private Boolean choPhepDangKyTuDo;
    private Boolean canDuyetDangKy;
    private Integer soThanhVienToiDa;

    // Ngân hàng
    private String bankAccountNo;
    private String bankName;
    private String accountName;
    private String maXacThucCk;
    private String webhookSecret;
    private String webhookProvider;

    // Mô tả
    private String moTaYeuCau;
}
