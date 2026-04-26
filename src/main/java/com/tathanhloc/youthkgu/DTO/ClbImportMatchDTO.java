package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Model.SinhVien;
import lombok.*;

/**
 * Kết quả dò khớp một dòng Excel với sinh viên trong hệ thống.
 * status:
 *   MATCHED_MSSV  — tìm thấy bằng MSSV (chắc chắn)
 *   MATCHED_NAME  — tìm thấy bằng tên chuẩn hóa, duy nhất (khá chắc)
 *   AMBIGUOUS     — tên khớp nhiều sinh viên, cần người dùng xác nhận
 *   NOT_FOUND     — không tìm thấy
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClbImportMatchDTO {

    private int    rowIndex;
    private String status;        // MATCHED_MSSV | MATCHED_NAME | AMBIGUOUS | NOT_FOUND

    // Kết quả tìm được (null nếu NOT_FOUND)
    private String maSv;
    private String hoTen;
    private String maLop;
    private String tenLop;
    private String tenKhoa;

    // Dữ liệu gốc từ Excel (để hiển thị khi không tìm được)
    private String inputMaSv;
    private String inputHoTen;
    private String inputTenLop;

    // Số sinh viên trùng tên (khi AMBIGUOUS)
    private Integer candidateCount;

    // ── Static factories ────────────────────────────────────────────────────

    public static ClbImportMatchDTO matchedByMaSv(int idx, SinhVien sv) {
        return builder()
                .rowIndex(idx)
                .status("MATCHED_MSSV")
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .maLop(sv.getLop() != null ? sv.getLop().getMaLop() : null)
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .tenKhoa(sv.getLop() != null && sv.getLop().getNganh() != null
                        && sv.getLop().getNganh().getKhoa() != null
                        ? sv.getLop().getNganh().getKhoa().getTenKhoa() : null)
                .inputMaSv(sv.getMaSv())
                .build();
    }

    public static ClbImportMatchDTO matchedByName(int idx, SinhVien sv, ClbImportRowDTO row) {
        return builder()
                .rowIndex(idx)
                .status("MATCHED_NAME")
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .maLop(sv.getLop() != null ? sv.getLop().getMaLop() : null)
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .tenKhoa(sv.getLop() != null && sv.getLop().getNganh() != null
                        && sv.getLop().getNganh().getKhoa() != null
                        ? sv.getLop().getNganh().getKhoa().getTenKhoa() : null)
                .inputMaSv(row.getMaSv())
                .inputHoTen(row.getHoTen())
                .inputTenLop(row.getTenLop())
                .build();
    }

    public static ClbImportMatchDTO ambiguous(int idx, ClbImportRowDTO row, int count) {
        return builder()
                .rowIndex(idx)
                .status("AMBIGUOUS")
                .inputMaSv(row.getMaSv())
                .inputHoTen(row.getHoTen())
                .inputTenLop(row.getTenLop())
                .candidateCount(count)
                .build();
    }

    public static ClbImportMatchDTO notFound(int idx, ClbImportRowDTO row) {
        return builder()
                .rowIndex(idx)
                .status("NOT_FOUND")
                .inputMaSv(row.getMaSv())
                .inputHoTen(row.getHoTen())
                .inputTenLop(row.getTenLop())
                .build();
    }
}
