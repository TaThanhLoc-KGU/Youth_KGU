package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClbExportService {

    private final ThanhVienCLBRepository     tvRepo;
    private final HoatDongRepository         hdRepo;
    private final DangKyHoatDongRepository   dkhdRepo;
    private final DongPhiCLBRepository       dongPhiRepo;
    private final CauLacBoRepository         clbRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Xuất danh sách thành viên CLB + dấu tích hoạt động đã tham gia.
     *
     * @param maClb   mã CLB
     * @param maHocKy nếu có → lọc theo học kỳ; null → tất cả
     * @return bytes của file .xlsx
     */
    @Transactional(readOnly = true)
    public byte[] exportMembers(String maClb, String maHocKy) throws IOException {

        // ── 1. Lấy danh sách thành viên ─────────────────────────
        List<ThanhVienCLB> members = maHocKy != null
                ? tvRepo.findByCauLacBoMaClbAndHocKyMaHocKyAndIsActiveTrueOrderByChucVuAsc(maClb, maHocKy)
                : tvRepo.findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb);

        // ── 2. Lấy danh sách hoạt động của CLB ──────────────────
        List<HoatDong> hoatDongs = hdRepo.findByCauLacBoMaClbOrderByNgayToChucDesc(maClb);

        // Sort hoạt động theo ngày tổ chức tăng dần
        hoatDongs.sort(Comparator.comparing(hd ->
                hd.getNgayToChuc() != null ? hd.getNgayToChuc() : LocalDate.MIN));

        // ── 3. Build index: maSv → set(maHoatDong đã tham gia) ──
        Set<String> allMaSv = members.stream()
                .map(tv -> tv.getSinhVien().getMaSv()).collect(Collectors.toSet());

        Map<String, Set<String>> svThamGia = new HashMap<>();
        for (String maSv : allMaSv) {
            Set<String> set = dkhdRepo.findBySinhVienMaSvAndIsActiveTrue(maSv)
                    .stream()
                    .filter(dk -> dk.getTrangThai() != null
                            && (dk.getTrangThai().contains("CHECK") || "DA_DIEM_DANH".equals(dk.getTrangThai())
                                || "DA_DANG_KY".equals(dk.getTrangThai())))
                    .map(dk -> dk.getHoatDong().getMaHoatDong())
                    .collect(Collectors.toSet());
            svThamGia.put(maSv, set);
        }

        // ── 4. Build index: maSv → trạng thái phí ───────────────
        Map<String, String> svPhi = new HashMap<>();
        if (maHocKy != null) {
            dongPhiRepo.findByCauLacBoMaClbAndHocKyMaHocKy(maClb, maHocKy)
                    .forEach(p -> svPhi.put(p.getSinhVien().getMaSv(), p.getTrangThai()));
        }

        // ── 5. Tạo workbook ──────────────────────────────────────
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Danh sách thành viên");

            // ── Styles ──────────────────────────────────────────
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle subHeaderStyle = createSubHeaderStyle(wb);
            CellStyle dataStyle    = createDataStyle(wb);
            CellStyle checkStyle   = createCheckStyle(wb);   // ✓
            CellStyle paidStyle    = createPaidStyle(wb);

            int rowIdx = 0;

            // ── Tiêu đề ─────────────────────────────────────────
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            String clbName = members.isEmpty() ? maClb
                    : members.get(0).getCauLacBo().getTenClb();
            titleCell.setCellValue("DANH SÁCH THÀNH VIÊN – " + clbName.toUpperCase()
                    + (maHocKy != null ? " – " + maHocKy : ""));
            titleCell.setCellStyle(createTitleStyle(wb));
            int totalCols = 7 + hoatDongs.size();
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, totalCols - 1));

            rowIdx++; // blank

            // ── Header ──────────────────────────────────────────
            Row hRow = sheet.createRow(rowIdx++);
            String[] baseHeaders = {"STT", "MSSV", "Họ và tên", "Lớp", "Chức vụ",
                    "Ngày tham gia", "Phí (" + (maHocKy != null ? maHocKy : "tất cả") + ")"};
            for (int i = 0; i < baseHeaders.length; i++) {
                createCell(hRow, i, baseHeaders[i], headerStyle);
            }
            for (int i = 0; i < hoatDongs.size(); i++) {
                HoatDong hd = hoatDongs.get(i);
                String hdLabel = hd.getTenHoatDong();
                if (hd.getNgayToChuc() != null) {
                    hdLabel = hd.getNgayToChuc().format(DATE_FMT) + "\n" + hdLabel;
                }
                createCell(hRow, baseHeaders.length + i, hdLabel, subHeaderStyle);
            }
            hRow.setHeight((short) 900); // ~45pt

            // ── Data rows ────────────────────────────────────────
            int stt = 1;
            Map<String, String> chucVuLabels = Map.of(
                    "CHU_NHIEM", "Chủ nhiệm", "PHO_CHU_NHIEM", "Phó chủ nhiệm",
                    "BAN_QUAN_LY", "Ban quản lý", "CO_VAN", "Cố vấn", "THANH_VIEN", "Thành viên"
            );
            for (ThanhVienCLB tv : members) {
                SinhVien sv = tv.getSinhVien();
                Row row = sheet.createRow(rowIdx++);

                createCell(row, 0, String.valueOf(stt++), dataStyle);
                createCell(row, 1, sv.getMaSv(), dataStyle);
                createCell(row, 2, sv.getHoTen(), dataStyle);
                createCell(row, 3, sv.getLop() != null ? sv.getLop().getTenLop() : "", dataStyle);
                createCell(row, 4, chucVuLabels.getOrDefault(tv.getChucVu(), tv.getChucVu()), dataStyle);
                createCell(row, 5, tv.getNgayThamGia() != null ? tv.getNgayThamGia().format(DATE_FMT) : "", dataStyle);

                // Phí
                String phiStatus = svPhi.getOrDefault(sv.getMaSv(), maHocKy != null ? "Chưa đóng" : "—");
                if ("DA_DONG".equals(phiStatus))   phiStatus = "Đã đóng";
                else if ("MIEN_GIAM".equals(phiStatus)) phiStatus = "Miễn giảm";
                else if ("CHUA_DONG".equals(phiStatus)) phiStatus = "Chưa đóng";
                CellStyle phiStyleToUse = "Đã đóng".equals(phiStatus) || "Miễn giảm".equals(phiStatus)
                        ? paidStyle : dataStyle;
                createCell(row, 6, phiStatus, phiStyleToUse);

                // Hoạt động
                Set<String> attended = svThamGia.getOrDefault(sv.getMaSv(), Collections.emptySet());
                for (int i = 0; i < hoatDongs.size(); i++) {
                    boolean thamGia = attended.contains(hoatDongs.get(i).getMaHoatDong());
                    createCell(row, 7 + i, thamGia ? "✓" : "", thamGia ? checkStyle : dataStyle);
                }
            }

            // ── Auto-size columns (các cột base) ────────────────
            for (int i = 0; i < 7; i++) sheet.autoSizeColumn(i);
            // Cột hoạt động: cố định 90px
            for (int i = 0; i < hoatDongs.size(); i++) {
                sheet.setColumnWidth(7 + i, 4000);
            }

            // ── Summary row ──────────────────────────────────────
            rowIdx++; // blank
            Row sumRow = sheet.createRow(rowIdx);
            createCell(sumRow, 0, "Tổng cộng: " + members.size() + " thành viên", dataStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 3));

            // ── Write ────────────────────────────────────────────
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── Style helpers ────────────────────────────────────────────

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setBold(true); f.setFontHeightInPoints((short) 14);
        s.setFont(f); s.setAlignment(HorizontalAlignment.CENTER);
        return s;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private CellStyle createSubHeaderStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setWrapText(true);
        setBorder(s);
        return s;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private CellStyle createCheckStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setColor(IndexedColors.GREEN.getIndex()); f.setBold(true);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        setBorder(s);
        return s;
    }

    private CellStyle createPaidStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setColor(IndexedColors.DARK_GREEN.getIndex());
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private void setBorder(CellStyle s) {
        s.setBorderTop(BorderStyle.THIN); s.setBorderBottom(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN); s.setBorderRight(BorderStyle.THIN);
    }

    private Cell createCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        if (style != null) c.setCellStyle(style);
        return c;
    }
}
