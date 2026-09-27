package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ExcelErrorDTO;
import com.tathanhloc.youthkgu.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.youthkgu.DTO.TnCauHoiRequest;
import com.tathanhloc.youthkgu.Model.TnDanhMuc;
import com.tathanhloc.youthkgu.Repository.TnDanhMucRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

/**
 * Nhập câu hỏi trắc nghiệm hàng loạt từ Excel — mỗi dòng 1 câu hỏi, tối đa 6 đáp án
 * (cột Đáp án 1..6 + Đúng 1..6). Danh mục ghi bằng TÊN, tự tạo nếu chưa có (không cần
 * bước xác nhận riêng như "nhập khóa mới" vì danh mục không gắn khoa/ràng buộc gì khác).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TnCauHoiExcelService {

    private static final int MAX_DAP_AN = 6;
    private static final String[] HEADERS = {
            "Nội dung câu hỏi", "Loại (MOT_DAP_AN/NHIEU_DAP_AN/DUNG_SAI)", "Độ khó (DE/TRUNG_BINH/KHO)",
            "Danh mục", "Điểm",
            "Đáp án 1", "Đúng 1", "Đáp án 2", "Đúng 2", "Đáp án 3", "Đúng 3",
            "Đáp án 4", "Đúng 4", "Đáp án 5", "Đúng 5", "Đáp án 6", "Đúng 6",
            "Giải thích",
    };

    private final TnDanhMucRepository danhMucRepo;

    // ==================== Template ====================

    public byte[] createTemplate() throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Câu hỏi");
            CellStyle header = headerStyle(wb);

            Row h = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell c = h.createCell(i);
                c.setCellValue(HEADERS[i]);
                c.setCellStyle(header);
                sheet.setColumnWidth(i, i == 0 ? 12000 : 4500);
            }

            Object[][] mau = {
                    {"Thủ đô của Việt Nam là gì?", "MOT_DAP_AN", "DE", "Kiến thức chung", 1,
                            "Hà Nội", "x", "TP.HCM", "", "Đà Nẵng", "", "Huế", "", "", "", "", "",
                            "Hà Nội là thủ đô của Việt Nam từ năm 1010."},
                    {"Đoàn TNCS Hồ Chí Minh thành lập ngày nào?", "MOT_DAP_AN", "TRUNG_BINH", "Lịch sử Đoàn", 1,
                            "26/3/1931", "x", "3/2/1930", "", "19/5/1941", "", "2/9/1945", "", "", "", "", "", ""},
                    {"Việt Nam là quốc gia thuộc khu vực Đông Nam Á?", "DUNG_SAI", "DE", "Kiến thức chung", 1,
                            "Đúng", "x", "Sai", "", "", "", "", "", "", "", "", "", ""},
                    {"Chọn các tỉnh giáp biển ở ĐBSCL", "NHIEU_DAP_AN", "KHO", "Địa lý", 2,
                            "Kiên Giang", "x", "Cà Mau", "x", "Bạc Liêu", "x", "An Giang", "", "", "", "", "",
                            "An Giang không giáp biển."},
            };
            for (int r = 0; r < mau.length; r++) {
                Row row = sheet.createRow(r + 1);
                Object[] vals = mau[r];
                for (int c = 0; c < vals.length; c++) {
                    Cell cell = row.createCell(c);
                    if (vals[c] instanceof Integer i) cell.setCellValue(i);
                    else cell.setCellValue(String.valueOf(vals[c]));
                }
            }

            Sheet guide = wb.createSheet("Hướng dẫn");
            String[] lines = {
                    "HƯỚNG DẪN NHẬP CÂU HỎI TRẮC NGHIỆM",
                    "",
                    "1. Mỗi dòng (từ dòng 2) là 1 câu hỏi.",
                    "2. Loại: MOT_DAP_AN (1 đáp án đúng) / NHIEU_DAP_AN (nhiều đáp án đúng) / DUNG_SAI (2 đáp án Đúng-Sai).",
                    "   Bỏ trống = mặc định MOT_DAP_AN.",
                    "3. Độ khó: DE / TRUNG_BINH / KHO. Bỏ trống = TRUNG_BINH.",
                    "4. Danh mục: ghi tên (VD: 'Lịch sử Đoàn') — hệ thống TỰ TẠO nếu chưa có, trùng tên (không phân biệt hoa/thường) sẽ dùng lại.",
                    "5. Điểm: số, bỏ trống = 1.",
                    "6. Đáp án 1..6: tối đa 6 đáp án, cần ít nhất 2. Đáp án trống sẽ bị bỏ qua.",
                    "7. Đúng 1..6: đánh 'x' (hoặc 'đúng', '1', 'true') vào ô tương ứng đáp án đúng. Cần ít nhất 1 đáp án đúng.",
                    "   - MOT_DAP_AN: đúng 1 đáp án đúng.  - DUNG_SAI: đúng 2 đáp án (Đúng/Sai), 1 đáp án đúng.",
                    "8. Giải thích: hiển thị cho thí sinh khi xem lại bài (tùy chọn).",
                    "",
                    "- Tải lên để xem trước (preview) và sửa lỗi trước khi xác nhận nhập.",
                    "- Xoá 4 dòng câu hỏi mẫu trước khi nhập dữ liệu thực.",
            };
            for (int i = 0; i < lines.length; i++) {
                Cell c = guide.createRow(i).createCell(0);
                c.setCellValue(lines[i]);
                if (i == 0) c.setCellStyle(header);
            }
            guide.setColumnWidth(0, 16000);

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ==================== Preview ====================

    public ExcelImportPreviewDTO preview(MultipartFile file) throws Exception {
        List<TnCauHoiRequest> valid = new ArrayList<>();
        List<ExcelErrorDTO> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheet("Câu hỏi");
            if (sheet == null) sheet = wb.getSheetAt(0);

            int totalRows = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;
                int rowNumber = i + 1;
                try {
                    TnCauHoiRequest req = parseRow(row);
                    List<String> rowErrors = validate(req);
                    if (rowErrors.isEmpty()) {
                        valid.add(req);
                    } else {
                        for (String msg : rowErrors) {
                            errors.add(ExcelErrorDTO.builder().rowNumber(rowNumber).field("Dữ liệu").errorMessage(msg).build());
                        }
                    }
                } catch (Exception e) {
                    errors.add(ExcelErrorDTO.builder().rowNumber(rowNumber).field("Chung")
                            .errorMessage("Lỗi đọc dòng: " + e.getMessage()).build());
                }
            }

            return ExcelImportPreviewDTO.builder()
                    .validData(valid).errors(errors)
                    .totalRows(totalRows).validRows(valid.size()).errorRows(errors.size())
                    .build();
        }
    }

    // ==================== Confirm (persist) ====================

    /** Tạo câu hỏi cho từng request hợp lệ; danh mục theo tên tự tạo nếu chưa có (cache trong 1 lượt import). */
    public int commit(List<TnCauHoiRequest> requests, TnCauHoiService cauHoiService, String createdBy) {
        Map<String, Long> danhMucCache = new HashMap<>();
        int created = 0;
        for (TnCauHoiRequest req : requests) {
            try {
                req.setDanhMucId(resolveDanhMucId(req.getDanhMucTenNhap(), danhMucCache, createdBy));
                cauHoiService.create(req, createdBy);
                created++;
            } catch (Exception e) {
                log.warn("Bỏ qua 1 câu hỏi khi import do lỗi: {}", e.getMessage());
            }
        }
        return created;
    }

    /** Resolve danh mục theo tên → id, tạo mới nếu chưa có. Gọi trước khi build request để gán danhMucId. */
    private Long resolveDanhMucId(String tenDanhMuc, Map<String, Long> cache, String createdBy) {
        if (tenDanhMuc == null || tenDanhMuc.isBlank()) return null;
        String key = tenDanhMuc.trim().toLowerCase();
        if (cache.containsKey(key)) return cache.get(key);

        Long found = danhMucRepo.findByIsActiveTrueOrderByTenAsc().stream()
                .filter(d -> d.getTen() != null && d.getTen().trim().equalsIgnoreCase(tenDanhMuc.trim()))
                .map(TnDanhMuc::getId).findFirst().orElse(null);
        if (found != null) {
            cache.put(key, found);
            return found;
        }
        TnDanhMuc dm = danhMucRepo.save(TnDanhMuc.builder()
                .ten(tenDanhMuc.trim()).isActive(true).createdBy(createdBy).build());
        cache.put(key, dm.getId());
        return dm.getId();
    }

    // ==================== Parse & validate ====================

    private TnCauHoiRequest parseRow(Row row) {
        TnCauHoiRequest req = new TnCauHoiRequest();
        req.setNoiDung(str(row, 0));
        req.setLoai(normEnumToken(str(row, 1), "MOT_DAP_AN"));
        req.setDoKho(normEnumToken(str(row, 2), "TRUNG_BINH"));
        req.setDanhMucId(null); // resolved riêng ở bước commit (cần danhMucNhapTen)
        req.setGiaiThich(str(row, HEADERS.length - 1));

        String diemStr = str(row, 4);
        req.setDiem(diemStr == null || diemStr.isBlank() ? BigDecimal.ONE : new BigDecimal(diemStr.trim()));

        // lưu tạm tên danh mục vào field hinhAnh? Không — dùng transient riêng qua wrapper.
        // Đơn giản hơn: gắn tên danh mục vào 1 map ngoài (rowIndex -> tenDanhMuc) do preview() không cần
        // resolve ngay; ta resolve tại confirm(). Ở đây tạm lưu vào req thông qua field mở rộng.
        req.setMaKhoa(null);
        req.setDanhMucTenNhap(str(row, 3));

        List<TnCauHoiRequest.DapAnItem> dapAns = new ArrayList<>();
        for (int slot = 0; slot < MAX_DAP_AN; slot++) {
            int noiDungCol = 5 + slot * 2;
            int dungCol = noiDungCol + 1;
            String noiDung = str(row, noiDungCol);
            if (noiDung == null || noiDung.isBlank()) continue;
            String dungRaw = str(row, dungCol);
            boolean dung = dungRaw != null && (dungRaw.trim().equalsIgnoreCase("x")
                    || dungRaw.trim().equalsIgnoreCase("đúng")
                    || dungRaw.trim().equalsIgnoreCase("dung")
                    || dungRaw.trim().equals("1")
                    || dungRaw.trim().equalsIgnoreCase("true"));
            TnCauHoiRequest.DapAnItem item = new TnCauHoiRequest.DapAnItem();
            item.setNoiDung(noiDung.trim());
            item.setDung(dung);
            item.setThuTu(dapAns.size());
            dapAns.add(item);
        }
        req.setDapAns(dapAns);
        return req;
    }

    private List<String> validate(TnCauHoiRequest req) {
        List<String> errs = new ArrayList<>();
        if (req.getNoiDung() == null || req.getNoiDung().isBlank()) errs.add("Thiếu nội dung câu hỏi");
        if (req.getDapAns() == null || req.getDapAns().size() < 2) errs.add("Cần ít nhất 2 đáp án");
        else {
            long soDung = req.getDapAns().stream().filter(TnCauHoiRequest.DapAnItem::getDung).count();
            if (soDung == 0) errs.add("Chưa đánh dấu đáp án đúng nào");
            if ("MOT_DAP_AN".equals(req.getLoai()) && soDung > 1) errs.add("Câu 'một đáp án' chỉ được 1 đáp án đúng");
            if ("DUNG_SAI".equals(req.getLoai()) && req.getDapAns().size() != 2) errs.add("Câu 'Đúng/Sai' phải có đúng 2 đáp án");
        }
        return errs;
    }

    private String normEnumToken(String s, String def) {
        if (s == null || s.isBlank()) return def;
        String v = s.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        return switch (v) {
            case "MOT_DAP_AN", "NHIEU_DAP_AN", "DUNG_SAI" -> v;
            case "DE", "TRUNG_BINH", "KHO" -> v;
            default -> def;
        };
    }

    private String str(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield (d == Math.floor(d)) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < HEADERS.length; i++) {
            String v = str(row, i);
            if (v != null && !v.isBlank()) return false;
        }
        return true;
    }

    private CellStyle headerStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(f);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }
}
