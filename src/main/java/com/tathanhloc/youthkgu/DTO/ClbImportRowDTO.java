package com.tathanhloc.youthkgu.DTO;

import lombok.*;

/**
 * Một dòng từ file Excel khi nhập danh sách thành viên CLB.
 * Người dùng có thể điền MSSV, họ tên (có/không dấu), lớp — hoặc chỉ một vài trường.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClbImportRowDTO {
    private int rowIndex;   // Vị trí dòng trong Excel (bắt đầu từ 0)
    private String maSv;    // Mã sinh viên (có thể null/blank)
    private String hoTen;   // Họ tên (có thể có dấu hoặc không)
    private String tenLop;  // Tên lớp / mã lớp (tùy chọn, dùng để thu hẹp khi tìm tên)
}
