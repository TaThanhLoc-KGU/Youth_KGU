package com.tathanhloc.youthkgu.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TnCauHoiRequest {
    private String noiDung;
    private String loai;        // MOT_DAP_AN | NHIEU_DAP_AN | DUNG_SAI
    private String doKho;       // DE | TRUNG_BINH | KHO
    private Long danhMucId;
    private BigDecimal diem;
    private String giaiThich;
    private String hinhAnh;
    private String maKhoa;
    private List<DapAnItem> dapAns;

    /** Chỉ dùng khi nhập từ Excel: tên danh mục nhập tay, resolve → danhMucId lúc commit (tự tạo nếu chưa có). */
    private String danhMucTenNhap;

    @Data
    public static class DapAnItem {
        private Long id;         // nullable khi thêm mới
        private String noiDung;
        private Boolean dung;
        private Integer thuTu;
        private String hinhAnh;
    }
}
