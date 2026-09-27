package com.tathanhloc.youthkgu.DTO;

import lombok.Data;

import java.util.Map;

/** Gửi kèm khi xác nhận "Nhập khóa mới" — quyết định của admin cho các ngành mới phát hiện. */
@Data
public class NhapKhoaMoiCommitRequest {
    /** key = tenNganhGoiY (từ bước preview) -> maKhoa được chọn. */
    private Map<String, String> khoaChoNganhMoi;
    /** key = tenNganhGoiY -> mã ngành muốn dùng (tùy chọn; bỏ trống sẽ tự sinh mã). */
    private Map<String, String> maNganhChoNganhMoi;
}
