package com.tathanhloc.youthkgu.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 1 trường nội dung được đặt lên ảnh nền mẫu chứng nhận (toạ độ theo pixel ảnh gốc).
 *
 * type = "text" (mặc định, kể cả khi null — tương thích ngược với mẫu tạo trước khi có field
 * chữ ký): key = null → text tĩnh tuỳ chỉnh (dùng label); key khác null → lấy giá trị thật từ
 * sinh viên/hoạt động khi render (xem ChungNhanRenderService).
 * Các key hợp lệ: hoTenSinhVien, maSv, tenLop, tenKhoa, tenHoatDong, ngayCap, maChungNhan
 *
 * type = "signature": vẽ ảnh chữ ký (lấy từ thư viện Ký số đã có, xem ChuKy) thay vì text — vừa
 * khít khung theo tỉ lệ ảnh gốc (giữ nguyên aspect ratio, canh giữa khung).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChungNhanTemplateFieldDTO {
    private String type;       // text | signature — null coi như "text"
    private String key;
    private String label;
    private Long chuKyId;      // dùng khi type = signature
    private float x;
    private float y;
    private float width;
    private float height;
    private float fontSizePt;
    private String fontName;   // times | arial | calibri | montserrat
    private String color;      // hex, ví dụ "#1a1a1a"
    private boolean bold;
    private String align;      // left | center | right
}
