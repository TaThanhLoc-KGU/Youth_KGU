package com.tathanhloc.youthkgu.DTO;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/** View đầy đủ cho ADMIN — CÓ cờ đúng/sai. Không bao giờ trả cho thí sinh. */
@Data @Builder
public class TnCauHoiDTO {
    private Long id;
    private String noiDung;
    private String loai;
    private String doKho;
    private Long danhMucId;
    private String danhMucTen;
    private BigDecimal diem;
    private String giaiThich;
    private String hinhAnh;
    private Boolean isActive;
    private List<DapAn> dapAns;

    @Data @Builder
    public static class DapAn {
        private Long id;
        private String noiDung;
        private Boolean dung;
        private Integer thuTu;
        private String hinhAnh;
    }
}
