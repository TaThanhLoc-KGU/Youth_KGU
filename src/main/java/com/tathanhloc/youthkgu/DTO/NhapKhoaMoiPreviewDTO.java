package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/** Preview cho tính năng "Nhập khóa mới" — parse file export sinh viên từ hệ thống nhà trường. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhapKhoaMoiPreviewDTO {

    private int tongSoDong;
    private int soDongHopLe;
    private int soDongLoi;
    private List<ExcelErrorDTO> loi;

    /** Các mã khóa học (VD "K12") xuất hiện trong file. */
    private List<String> khoaHocTrongFile;
    /** Mã khóa học CHƯA có trong hệ thống — sẽ được tạo mới lúc xác nhận. */
    private List<String> khoaHocMoi;

    /** Mỗi nhóm = 1 mã lớp trong file. */
    private List<NhomLop> nhomLop;

    /** Tên ngành gợi ý (đã chuẩn hoá số thứ tự) CHƯA khớp ngành nào có sẵn — bắt buộc chọn Khoa trước khi xác nhận. */
    private List<String> nganhMoiCanChonKhoa;

    /** 20 dòng đầu để xem nhanh. */
    private List<Map<String, Object>> mauSinhVien;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NhomLop {
        private String maLop;
        private String tenLop;          // luôn = maLop
        private String ghiChuTenLop;    // nguyên văn cột "Ghi chú tên lớp" trong file
        private int soLuongSv;
        private String khoaHoc;
        private boolean lopDaTonTai;

        private boolean nganhDaTonTai;
        private String maNganhKhop;     // set nếu nganhDaTonTai
        private String tenNganhKhop;
        private String tenKhoaKhop;

        private String tenNganhGoiY;    // set nếu !nganhDaTonTai — dùng làm key trong khoaAssignments lúc confirm
    }
}
