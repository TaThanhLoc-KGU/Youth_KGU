package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
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
    private final DiemDanhHoatDongRepository ddRepo;
    private final DongPhiCLBRepository       dongPhiRepo;
    private final CauLacBoRepository         clbRepo;
    private final BanChuNhiemCLBRepository   bcnRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String> CHUC_VU_LABELS = Map.of(
            "CHU_NHIEM",    "Chủ nhiệm",
            "PHO_CHU_NHIEM","Phó chủ nhiệm",
            "BAN_QUAN_LY",  "Ban quản lý",
            "CO_VAN",       "Cố vấn",
            "THANH_VIEN",   "Thành viên"
    );

    @Transactional(readOnly = true)
    public byte[] exportMembers(String maClb, String maHocKy) throws IOException {

        // ── 1. BCN đương nhiệm ────────────────────────────────────────────────
        List<BanChuNhiemCLB> bcnList =
                bcnRepo.findByCauLacBoMaClbAndTrangThaiOrderByChucVuAsc(maClb, "DUONG_NHIEM");

        // maSv của những người trong BCN (SV) → dùng để loại khỏi section 2
        Set<String> bcnMaSvSet = bcnList.stream()
                .filter(b -> "SV".equals(b.getLoaiNguoi()) && b.getSinhVien() != null)
                .map(b -> b.getSinhVien().getMaSv())
                .collect(Collectors.toSet());

        // ── 2. ThanhVienCLB (thành viên chính thức) ───────────────────────────
        List<ThanhVienCLB> tvAll = maHocKy != null
                ? tvRepo.findByCauLacBoMaClbAndHocKyMaHocKyAndIsActiveTrueOrderByChucVuAsc(maClb, maHocKy)
                : tvRepo.findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb);

        Set<String> tvMaSvSet = tvAll.stream()
                .map(tv -> tv.getSinhVien().getMaSv())
                .collect(Collectors.toSet());

        // Section 2 = ThanhVienCLB trừ người đã có trong BCN
        List<ThanhVienCLB> tvSection = tvAll.stream()
                .filter(tv -> !bcnMaSvSet.contains(tv.getSinhVien().getMaSv()))
                .collect(Collectors.toList());

        // ── 3. Hoạt động CLB ──────────────────────────────────────────────────
        List<HoatDong> hoatDongs = hdRepo.findByCauLacBoMaClbOrderByNgayToChucDesc(maClb);
        hoatDongs.sort(Comparator.comparing(hd ->
                hd.getNgayToChuc() != null ? hd.getNgayToChuc() : LocalDate.MIN));

        // ── 4. Build bảng điểm danh: maSv → Set<maHoatDong> ──────────────────
        // Nguồn 1: DangKyHoatDong (QR check-in → trangThai = DA_CHECK_IN / DA_CHECK_OUT)
        // Nguồn 2: DiemDanhHoatDong (điểm danh thủ công → manualCheckInBulk chỉ ghi vào bảng này,
        //          KHÔNG cập nhật DangKyHoatDong, nên phải đọc trực tiếp)
        Map<String, Set<String>> svThamGiaMap = new HashMap<>();

        for (HoatDong hd : hoatDongs) {
            String maHd = hd.getMaHoatDong();

            // Nguồn 1: DangKyHoatDong
            dkhdRepo.findByHoatDongMaHoatDongAndIsActiveNotFalse(maHd).forEach(dk -> {
                if (dk.getSinhVien() == null) return;
                String tt = dk.getTrangThai();
                if (tt != null && (tt.contains("CHECK") || tt.contains("THAM_GIA")
                        || "DA_DIEM_DANH".equals(tt) || "DA_DANG_KY".equals(tt))) {
                    svThamGiaMap.computeIfAbsent(dk.getSinhVien().getMaSv(), k -> new HashSet<>()).add(maHd);
                }
            });

            // Nguồn 2: DiemDanhHoatDong (bắt điểm danh thủ công)
            ddRepo.findByHoatDongMaHoatDong(maHd).forEach(dd -> {
                if (dd.getSinhVien() == null) return;
                if (dd.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA) {
                    svThamGiaMap.computeIfAbsent(dd.getSinhVien().getMaSv(), k -> new HashSet<>()).add(maHd);
                }
            });
        }

        // ── 5. Phí ────────────────────────────────────────────────────────────
        Map<String, String> svPhi = new HashMap<>();
        if (maHocKy != null) {
            dongPhiRepo.findByCauLacBoMaClbAndHocKyMaHocKy(maClb, maHocKy)
                    .forEach(p -> svPhi.put(p.getSinhVien().getMaSv(), p.getTrangThai()));
        }

        // ── 6. Tên CLB ────────────────────────────────────────────────────────
        String tenClb = clbRepo.findById(maClb).map(CauLacBo::getTenClb).orElse(maClb);

        // ── 7. Build Excel ────────────────────────────────────────────────────
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Danh sách thành viên");

            // Styles
            CellStyle titleStyle      = createTitleStyle(wb);
            CellStyle sectionStyle    = createSectionStyle(wb);
            CellStyle sectionStyle2   = createSectionStyle2(wb);
            CellStyle headerStyle     = createHeaderStyle(wb);
            CellStyle dataStyle       = createDataStyle(wb);
            CellStyle dataAltStyle    = createDataAltStyle(wb);
            CellStyle checkStyle      = createCheckStyle(wb);
            CellStyle paidStyle       = createPaidStyle(wb);
            CellStyle subHeaderStyle  = createSubHeaderStyle(wb);

            int totalCols = 7 + hoatDongs.size();
            int rowIdx = 0;

            // ── Tiêu đề chính ─────────────────────────────────────
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH THÀNH VIÊN – " + tenClb.toUpperCase()
                    + (maHocKy != null ? " – " + maHocKy : ""));
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, totalCols - 1));
            rowIdx++; // blank

            // ══════════════════════════════════════════════════════
            // SECTION 1: BAN CHỦ NHIỆM
            // ══════════════════════════════════════════════════════
            Row sec1Row = sheet.createRow(rowIdx++);
            Cell sec1Cell = sec1Row.createCell(0);
            sec1Cell.setCellValue("I. BAN CHỦ NHIỆM (" + bcnList.size() + " người)");
            sec1Cell.setCellStyle(sectionStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, totalCols - 1));

            // Header BCN
            Row hRowBcn = sheet.createRow(rowIdx++);
            String[] bcnHeaders = {"STT", "Mã số", "Họ và tên", "Đơn vị/Lớp",
                    "Chức vụ BCN", "Nhiệm kỳ", "Liên hệ"};
            for (int i = 0; i < bcnHeaders.length; i++) {
                createCell(hRowBcn, i, bcnHeaders[i], headerStyle);
            }
            for (int i = 0; i < hoatDongs.size(); i++) {
                HoatDong hd = hoatDongs.get(i);
                String label = (hd.getNgayToChuc() != null ? hd.getNgayToChuc().format(DATE_FMT) + "\n" : "")
                        + hd.getTenHoatDong();
                createCell(hRowBcn, bcnHeaders.length + i, label, subHeaderStyle);
            }
            hRowBcn.setHeight((short) 900);

            // Rows BCN
            int stt = 1;
            for (BanChuNhiemCLB bcn : bcnList) {
                CellStyle rowStyle = (stt % 2 == 0) ? dataAltStyle : dataStyle;
                Row row = sheet.createRow(rowIdx++);
                createCell(row, 0, String.valueOf(stt++), rowStyle);

                String ma, ten, donVi, lienHe;
                if ("GV".equals(bcn.getLoaiNguoi()) && bcn.getGiangVien() != null) {
                    GiangVien gv = bcn.getGiangVien();
                    ma     = gv.getMaGv();
                    ten    = gv.getHoTen();
                    donVi  = gv.getKhoa() != null ? gv.getKhoa().getTenKhoa() : "Giảng viên";
                    lienHe = bcn.getEmailLienHe() != null ? bcn.getEmailLienHe() : gv.getEmail();
                } else if ("CV".equals(bcn.getLoaiNguoi()) && bcn.getChuyenVien() != null) {
                    ChuyenVien cv = bcn.getChuyenVien();
                    ma     = cv.getMaChuyenVien();
                    ten    = cv.getHoTen();
                    donVi  = cv.getChucDanh() != null ? cv.getChucDanh() : "Chuyên viên";
                    lienHe = bcn.getEmailLienHe() != null ? bcn.getEmailLienHe() : cv.getEmail();
                } else {
                    SinhVien sv = bcn.getSinhVien();
                    ma     = sv != null ? sv.getMaSv() : "";
                    ten    = sv != null ? sv.getHoTen() : "";
                    donVi  = sv != null && sv.getLop() != null ? sv.getLop().getTenLop() : "";
                    lienHe = bcn.getEmailLienHe() != null ? bcn.getEmailLienHe()
                            : (sv != null ? sv.getEmail() : "");
                }

                createCell(row, 1, ma,                     rowStyle);
                createCell(row, 2, ten,                    rowStyle);
                createCell(row, 3, donVi,                  rowStyle);
                createCell(row, 4, bcn.getChucVu(),        rowStyle);
                createCell(row, 5, bcn.getNhiemKy(),       rowStyle);
                createCell(row, 6, lienHe != null ? lienHe : "", rowStyle);

                // Điểm danh (chỉ áp dụng cho SV)
                Set<String> attended = "SV".equals(bcn.getLoaiNguoi()) && bcn.getSinhVien() != null
                        ? svThamGiaMap.getOrDefault(bcn.getSinhVien().getMaSv(), Collections.emptySet())
                        : Collections.emptySet();
                for (int i = 0; i < hoatDongs.size(); i++) {
                    boolean ok = attended.contains(hoatDongs.get(i).getMaHoatDong());
                    createCell(row, 7 + i, ok ? "✓" : "", ok ? checkStyle : rowStyle);
                }
            }

            rowIdx++; // blank giữa 2 section

            // ══════════════════════════════════════════════════════
            // SECTION 2: THÀNH VIÊN CLB
            // ══════════════════════════════════════════════════════
            int section2Total = tvSection.size();
            Row sec2Row = sheet.createRow(rowIdx++);
            Cell sec2Cell = sec2Row.createCell(0);
            sec2Cell.setCellValue("II. THÀNH VIÊN CLB (" + section2Total + " người)");
            sec2Cell.setCellStyle(sectionStyle2);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, totalCols - 1));

            // Header TV
            Row hRowTv = sheet.createRow(rowIdx++);
            String[] tvHeaders = {"STT", "MSSV", "Họ và tên", "Lớp", "Chức vụ",
                    "Ngày tham gia", "Phí (" + (maHocKy != null ? maHocKy : "tất cả") + ")"};
            for (int i = 0; i < tvHeaders.length; i++) {
                createCell(hRowTv, i, tvHeaders[i], headerStyle);
            }
            for (int i = 0; i < hoatDongs.size(); i++) {
                HoatDong hd = hoatDongs.get(i);
                String label = (hd.getNgayToChuc() != null ? hd.getNgayToChuc().format(DATE_FMT) + "\n" : "")
                        + hd.getTenHoatDong();
                createCell(hRowTv, tvHeaders.length + i, label, subHeaderStyle);
            }
            hRowTv.setHeight((short) 900);

            // Rows ThanhVienCLB
            stt = 1;
            for (ThanhVienCLB tv : tvSection) {
                CellStyle rowStyle = (stt % 2 == 0) ? dataAltStyle : dataStyle;
                SinhVien sv = tv.getSinhVien();
                Row row = sheet.createRow(rowIdx++);

                createCell(row, 0, String.valueOf(stt++), rowStyle);
                createCell(row, 1, sv.getMaSv(),                                  rowStyle);
                createCell(row, 2, sv.getHoTen(),                                 rowStyle);
                createCell(row, 3, sv.getLop() != null ? sv.getLop().getTenLop() : "", rowStyle);
                createCell(row, 4, CHUC_VU_LABELS.getOrDefault(tv.getChucVu(), tv.getChucVu()), rowStyle);
                createCell(row, 5, tv.getNgayThamGia() != null ? tv.getNgayThamGia().format(DATE_FMT) : "", rowStyle);

                String phi = phiLabel(svPhi.getOrDefault(sv.getMaSv(), maHocKy != null ? "CHUA_DONG" : null));
                boolean paid = "Đã đóng".equals(phi) || "Miễn giảm".equals(phi);
                createCell(row, 6, phi, paid ? paidStyle : rowStyle);

                Set<String> attended = svThamGiaMap.getOrDefault(sv.getMaSv(), Collections.emptySet());
                for (int i = 0; i < hoatDongs.size(); i++) {
                    boolean ok = attended.contains(hoatDongs.get(i).getMaHoatDong());
                    createCell(row, 7 + i, ok ? "✓" : "", ok ? checkStyle : rowStyle);
                }
            }

            // ── Summary ───────────────────────────────────────────
            rowIdx++;
            Row sumRow = sheet.createRow(rowIdx);
            int grandTotal = bcnList.size() + section2Total;
            createCell(sumRow, 0,
                    "Tổng: BCN=" + bcnList.size() + " | Thành viên=" + section2Total + " | Tổng cộng=" + grandTotal,
                    createBoldStyle(wb));
            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, Math.min(6, totalCols - 1)));

            // ── Column widths ──────────────────────────────────────
            sheet.setColumnWidth(0, 1800);   // STT
            sheet.setColumnWidth(1, 3500);   // Mã
            sheet.setColumnWidth(2, 7000);   // Họ tên
            sheet.setColumnWidth(3, 4500);   // Lớp/Đơn vị
            sheet.setColumnWidth(4, 4000);   // Chức vụ
            sheet.setColumnWidth(5, 3500);   // Ngày/Nhiệm kỳ
            sheet.setColumnWidth(6, 3500);   // Phí/Liên hệ
            for (int i = 0; i < hoatDongs.size(); i++) {
                sheet.setColumnWidth(7 + i, 4000);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String phiLabel(String trangThai) {
        if (trangThai == null) return "—";
        return switch (trangThai) {
            case "DA_DONG"   -> "Đã đóng";
            case "MIEN_GIAM" -> "Miễn giảm";
            case "CHUA_DONG" -> "Chưa đóng";
            default          -> trangThai;
        };
    }

    // ── Style factories ──────────────────────────────────────────────────────

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 14);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        return s;
    }

    private CellStyle createSectionStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 12);
        f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.VIOLET.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle createSectionStyle2(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 12);
        f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private CellStyle createSubHeaderStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
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

    private CellStyle createDataAltStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private CellStyle createCheckStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setColor(IndexedColors.GREEN.getIndex()); f.setBold(true);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        setBorder(s);
        return s;
    }

    private CellStyle createPaidStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setColor(IndexedColors.DARK_GREEN.getIndex());
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        setBorder(s);
        return s;
    }

    private CellStyle createItalicStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setItalic(true); f.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        return s;
    }

    private CellStyle createBoldStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont(); f.setBold(true);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.LEFT);
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
