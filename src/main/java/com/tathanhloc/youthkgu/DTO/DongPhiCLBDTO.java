package com.tathanhloc.youthkgu.DTO;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DongPhiCLBDTO {
    private Long   id;
    private String maClb;
    private String tenClb;
    private String maSv;
    private String hoTen;
    private String tenLop;
    private String maHocKy;
    private String tenHocKy;
    private BigDecimal soTien;
    private String trangThai;
    private String trangThaiLabel;
    private String hinhThuc;
    private LocalDate ngayDong;
    private String ghiChu;
    private String maReference;
    // webhook
    private String transactionId;
    private String noiDungCk;
    private BigDecimal soTienCk;
    private String nguon;
    // PayOS
    private Long payosOrderCode;
    private String payosPaymentUrl;

    // Ngân hàng & Chuyển khoản (để SV thấy thông tin CK)
    private String bankAccountNo;
    private String bankName;
    private String accountName;
    private String maXacThucCk;

    private LocalDateTime createdAt;
}
