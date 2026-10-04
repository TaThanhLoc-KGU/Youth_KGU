package com.tathanhloc.youthkgu.DTO;

import lombok.Data;

@Data
public class TaoXacNhanRenLuyenRequest {
    private Integer soHocKy;
    private String maNamHoc;
    private Long chuKyNguoiLapId;
    private String tenNguoiLap;
    private String chucVuNguoiLap;
    private Long conDauId;
    private Boolean apDungGiapLai;
    private Boolean khoaFilePdf;
}
