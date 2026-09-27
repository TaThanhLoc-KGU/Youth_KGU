package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ExcelErrorDTO;
import com.tathanhloc.youthkgu.DTO.NhapKhoaMoiCommitRequest;
import com.tathanhloc.youthkgu.DTO.NhapKhoaMoiPreviewDTO;
import com.tathanhloc.youthkgu.Enum.GioiTinhEnum;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * "Nhập khóa mới" — nạp file export sinh viên tải trực tiếp từ hệ thống nhà trường (không cần
 * chỉnh sửa lại) khi có khóa mới nhập học: tự phát hiện ngành/lớp CHƯA có trong hệ thống (khóa
 * mới thường có ngành mới, mã lớp mới), để admin gán Khoa cho ngành mới, rồi tạo Ngành + Lớp
 * (tên lớp = mã lớp, theo đúng quy ước hiện có) + Sinh viên trong 1 lần xác nhận.
 *
 * Format cột file (cố định, đúng như export từ hệ thống):
 *   Stt | Mã sinh viên | Họ lót sinh viên | Tên sinh viên | Ngày sinh | Giới tính |
 *   Mã lớp | Ghi chú tên lớp | Năm vào | Khóa học | Tình trạng
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NhapKhoaMoiService {

    private final LopRepository lopRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final KhoaRepository khoaRepository;
    private final SinhVienRepository sinhVienRepository;

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
    };
    private static final Pattern TRAILING_NUMBER = Pattern.compile("^(.*\\S)\\s+\\d+$");

    // ==================== PREVIEW ====================

    @Transactional(readOnly = true)
    public NhapKhoaMoiPreviewDTO preview(MultipartFile file) throws Exception {
        List<ParsedRow> rows = parseAll(file);
        return buildPreview(rows);
    }

    private NhapKhoaMoiPreviewDTO buildPreview(List<ParsedRow> rows) {
        List<ExcelErrorDTO> loi = new ArrayList<>();
        List<ParsedRow> hopLe = new ArrayList<>();
        for (ParsedRow r : rows) {
            if (r.errors.isEmpty()) hopLe.add(r);
            else for (String e : r.errors)
                loi.add(ExcelErrorDTO.builder().rowNumber(r.rowNumber).field("Dữ liệu").errorMessage(e).build());
        }

        // Trùng mã SV trong file (mỗi mã chỉ được xuất hiện 1 lần)
        Map<String, Long> countBySv = hopLe.stream()
                .collect(Collectors.groupingBy(r -> r.maSv, Collectors.counting()));
        for (ParsedRow r : new ArrayList<>(hopLe)) {
            if (countBySv.get(r.maSv) > 1) {
                loi.add(ExcelErrorDTO.builder().rowNumber(r.rowNumber).field("Mã sinh viên")
                        .errorMessage("Mã sinh viên lặp lại trong file: " + r.maSv).build());
                hopLe.remove(r);
            }
        }

        Map<String, Nganh> byNormName = nganhRepository.findAllActive().stream()
                .collect(Collectors.toMap(n -> normalize(n.getTenNganh()), n -> n, (a, b) -> a));

        Map<String, List<ParsedRow>> byMaLop = hopLe.stream()
                .collect(Collectors.groupingBy(r -> r.maLop, LinkedHashMap::new, Collectors.toList()));

        Set<String> khoaHocSet = hopLe.stream().map(r -> r.khoaHoc).filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> existingKhoaHoc = khoaHocRepository.findAllById(khoaHocSet).stream()
                .map(KhoaHoc::getMaKhoahoc).collect(Collectors.toSet());
        List<String> khoaHocMoi = khoaHocSet.stream().filter(k -> !existingKhoaHoc.contains(k)).toList();

        List<NhapKhoaMoiPreviewDTO.NhomLop> nhomLopList = new ArrayList<>();
        LinkedHashSet<String> nganhMoi = new LinkedHashSet<>();

        for (var e : byMaLop.entrySet()) {
            String maLop = e.getKey();
            List<ParsedRow> lopRows = e.getValue();
            ParsedRow first = lopRows.get(0);
            NhapKhoaMoiPreviewDTO.NhomLop.NhomLopBuilder b = NhapKhoaMoiPreviewDTO.NhomLop.builder()
                    .maLop(maLop).tenLop(maLop)
                    .ghiChuTenLop(first.ghiChuTenLop)
                    .soLuongSv(lopRows.size())
                    .khoaHoc(first.khoaHoc)
                    .lopDaTonTai(lopRepository.existsById(maLop));

            Nganh hit = matchNganh(first.ghiChuTenLop, byNormName);
            if (hit != null) {
                b.nganhDaTonTai(true).maNganhKhop(hit.getMaNganh()).tenNganhKhop(hit.getTenNganh())
                        .tenKhoaKhop(hit.getKhoa() != null ? hit.getKhoa().getTenKhoa() : null);
            } else {
                String goiY = suggestedName(first.ghiChuTenLop);
                b.nganhDaTonTai(false).tenNganhGoiY(goiY);
                nganhMoi.add(goiY);
            }
            nhomLopList.add(b.build());
        }

        List<Map<String, Object>> mau = hopLe.stream().limit(20).map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maSv", r.maSv);
            m.put("hoTen", r.hoTen);
            m.put("gioiTinh", r.gioiTinh != null ? r.gioiTinh.getValue() : null);
            m.put("ngaySinh", r.ngaySinh);
            m.put("maLop", r.maLop);
            m.put("conHoc", r.conHoc);
            return m;
        }).collect(Collectors.toList());

        return NhapKhoaMoiPreviewDTO.builder()
                .tongSoDong(rows.size())
                .soDongHopLe(hopLe.size())
                .soDongLoi(loi.size())
                .loi(loi)
                .khoaHocTrongFile(new ArrayList<>(khoaHocSet))
                .khoaHocMoi(khoaHocMoi)
                .nhomLop(nhomLopList)
                .nganhMoiCanChonKhoa(new ArrayList<>(nganhMoi))
                .mauSinhVien(mau)
                .build();
    }

    // ==================== COMMIT ====================

    @Transactional
    public Map<String, Object> commit(MultipartFile file, NhapKhoaMoiCommitRequest req, String createdBy) throws Exception {
        List<ParsedRow> rows = parseAll(file);
        List<ParsedRow> hopLe = rows.stream().filter(r -> r.errors.isEmpty()).toList();
        Map<String, Long> countBySv = hopLe.stream().collect(Collectors.groupingBy(r -> r.maSv, Collectors.counting()));
        List<ParsedRow> toImport = hopLe.stream().filter(r -> countBySv.get(r.maSv) == 1).toList();

        Map<String, Nganh> byNormName = nganhRepository.findAllActive().stream()
                .collect(Collectors.toMap(n -> normalize(n.getTenNganh()), n -> n, (a, b) -> a));
        Map<String, List<ParsedRow>> byMaLop = toImport.stream()
                .collect(Collectors.groupingBy(r -> r.maLop, LinkedHashMap::new, Collectors.toList()));

        Map<String, String> khoaChoNganhMoi = req.getKhoaChoNganhMoi() != null ? req.getKhoaChoNganhMoi() : Map.of();
        Map<String, String> maNganhChoNganhMoi = req.getMaNganhChoNganhMoi() != null ? req.getMaNganhChoNganhMoi() : Map.of();

        // Kiểm tra đủ mapping cho MỌI ngành mới phát hiện trước khi ghi bất cứ gì
        List<String> thieuMapping = new ArrayList<>();
        for (List<ParsedRow> lopRows : byMaLop.values()) {
            String ghiChu = lopRows.get(0).ghiChuTenLop;
            if (matchNganh(ghiChu, byNormName) == null) {
                String goiY = suggestedName(ghiChu);
                if (khoaChoNganhMoi.get(goiY) == null || khoaChoNganhMoi.get(goiY).isBlank()) {
                    thieuMapping.add(goiY);
                }
            }
        }
        if (!thieuMapping.isEmpty()) {
            throw new BusinessException("THIEU_KHOA_CHO_NGANH_MOI",
                    "Chưa chọn Khoa cho ngành mới: " + String.join(", ", new LinkedHashSet<>(thieuMapping)));
        }

        // 1) Khóa học mới
        Map<String, KhoaHoc> khoaHocCache = new HashMap<>();
        int khoaHocMoiTao = 0;
        for (ParsedRow r : toImport) {
            if (r.khoaHoc == null || khoaHocCache.containsKey(r.khoaHoc)) continue;
            KhoaHoc kh = khoaHocRepository.findById(r.khoaHoc).orElse(null);
            if (kh == null) {
                kh = taoKhoaHocMoi(r.khoaHoc, r.namVao);
                khoaHocRepository.save(kh);
                khoaHocMoiTao++;
                log.info("Nhập khóa mới: tạo khoahoc {} ({}-{})", kh.getMaKhoahoc(), kh.getNamBatDau(), kh.getNamKetThuc());
            }
            khoaHocCache.put(r.khoaHoc, kh);
        }

        // 2) Ngành mới (mỗi tên gợi ý chỉ tạo 1 lần) + Lớp
        Map<String, Nganh> nganhMoiTaoCache = new HashMap<>(); // key = tenNganhGoiY
        int nganhMoiTao = 0, lopMoiTao = 0, svMoiTaoCount = 0, svCapNhatCount = 0;

        for (var e : byMaLop.entrySet()) {
            String maLop = e.getKey();
            List<ParsedRow> lopRows = e.getValue();
            ParsedRow first = lopRows.get(0);

            Nganh nganh = matchNganh(first.ghiChuTenLop, byNormName);
            if (nganh == null) {
                String goiY = suggestedName(first.ghiChuTenLop);
                nganh = nganhMoiTaoCache.get(goiY);
                if (nganh == null) {
                    String maKhoa = khoaChoNganhMoi.get(goiY);
                    Khoa khoa = khoaRepository.findById(maKhoa)
                            .orElseThrow(() -> new BusinessException("KHOA_KHONG_TON_TAI", "Khoa không tồn tại: " + maKhoa));
                    String maNganhCustom = maNganhChoNganhMoi.get(goiY);
                    String maNganh = (maNganhCustom != null && !maNganhCustom.isBlank())
                            ? maNganhCustom.trim().toUpperCase() : sinhMaNganhMoi(goiY);
                    if (nganhRepository.existsById(maNganh))
                        throw new BusinessException("MA_NGANH_TRUNG", "Mã ngành đã tồn tại: " + maNganh);
                    nganh = Nganh.builder().maNganh(maNganh).tenNganh(goiY).khoa(khoa).isActive(true).build();
                    nganhRepository.save(nganh);
                    nganhMoiTaoCache.put(goiY, nganh);
                    nganhMoiTao++;
                    log.info("Nhập khóa mới: tạo ngành {} ({}) → khoa {}", maNganh, goiY, khoa.getMaKhoa());
                }
            }

            Lop lop = lopRepository.findById(maLop).orElse(null);
            if (lop == null) {
                KhoaHoc kh = khoaHocCache.get(first.khoaHoc);
                lop = Lop.builder()
                        .maLop(maLop).tenLop(maLop)   // Tên lớp = mã lớp, theo yêu cầu
                        .nganh(nganh).khoaHoc(kh).maKhoa(nganh.getKhoa())
                        .isActive(true).loai("LOP")
                        .build();
                lopRepository.save(lop);
                lopMoiTao++;
            }

            // 3) Sinh viên trong lớp này
            for (ParsedRow r : lopRows) {
                SinhVien sv = sinhVienRepository.findById(r.maSv).orElse(null);
                boolean isNew = sv == null;
                if (isNew) sv = SinhVien.builder().maSv(r.maSv).build();
                sv.setHoTen(r.hoTen);
                sv.setGioiTinh(r.gioiTinh);
                sv.setNgaySinh(r.ngaySinh);
                sv.setLop(lop);
                sv.setIsActive(r.conHoc);
                sinhVienRepository.save(sv);
                if (isNew) svMoiTaoCount++; else svCapNhatCount++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("khoaHocMoiTao", khoaHocMoiTao);
        result.put("nganhMoiTao", nganhMoiTao);
        result.put("lopMoiTao", lopMoiTao);
        result.put("sinhVienMoiTao", svMoiTaoCount);
        result.put("sinhVienCapNhat", svCapNhatCount);
        result.put("tongSoDongBoQua", rows.size() - toImport.size());
        log.info("Nhập khóa mới hoàn tất bởi {}: {}", createdBy, result);
        return result;
    }

    // ==================== Helpers ====================

    private KhoaHoc taoKhoaHocMoi(String maKhoahoc, Integer namVao) {
        int namBatDau = namVao != null ? namVao : LocalDate.now().getYear();
        Matcher m = Pattern.compile("K(\\d+)").matcher(maKhoahoc == null ? "" : maKhoahoc);
        String ten = m.matches() ? "Khóa " + m.group(1) : maKhoahoc;
        return KhoaHoc.builder()
                .maKhoahoc(maKhoahoc).tenKhoahoc(ten)
                .namBatDau(namBatDau).namKetThuc(namBatDau + 4)
                .isActive(true).build();
    }

    private Nganh matchNganh(String ghiChuRaw, Map<String, Nganh> byNormName) {
        if (ghiChuRaw == null) return null;
        Nganh hit = byNormName.get(normalize(ghiChuRaw));
        if (hit != null) return hit;
        String stripped = stripTrailingNumber(ghiChuRaw);
        return stripped != null ? byNormName.get(normalize(stripped)) : null;
    }

    private String suggestedName(String ghiChuRaw) {
        if (ghiChuRaw == null) return "";
        String stripped = stripTrailingNumber(ghiChuRaw);
        return (stripped != null ? stripped : ghiChuRaw).trim();
    }

    private static String normalize(String s) {
        if (s == null) return "";
        String x = s.trim().toLowerCase();
        x = x.replaceAll("\\s+", " ");
        x = x.replaceAll("\\s*-\\s*", "-");
        return x;
    }

    private static String stripTrailingNumber(String raw) {
        if (raw == null) return null;
        Matcher m = TRAILING_NUMBER.matcher(raw.trim());
        return m.matches() ? m.group(1).trim() : null;
    }

    private String sinhMaNganhMoi(String tenNganh) {
        String base = java.text.Normalizer.normalize(tenNganh, java.text.Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toUpperCase();
        String[] words = base.split("[^A-Z]+");
        StringBuilder sb = new StringBuilder("TN");
        for (String w : words) if (!w.isBlank()) sb.append(w.charAt(0));
        String candidate = sb.toString();
        String result = candidate;
        int suffix = 1;
        while (nganhRepository.existsById(result)) result = candidate + (++suffix);
        return result;
    }

    // ==================== Parse Excel ====================

    private record ParsedRow(int rowNumber, String maSv, String hoTen, GioiTinhEnum gioiTinh,
                              LocalDate ngaySinh, String maLop, String ghiChuTenLop,
                              Integer namVao, String khoaHoc, boolean conHoc, List<String> errors) {}

    private List<ParsedRow> parseAll(MultipartFile file) throws Exception {
        List<ParsedRow> out = new ArrayList<>();
        try (var is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                out.add(parseRow(row, i + 1));
            }
        }
        return out;
    }

    private ParsedRow parseRow(Row row, int rowNumber) {
        List<String> errors = new ArrayList<>();

        String maSv = str(row, 1);
        String hoLot = str(row, 2);
        String ten = str(row, 3);
        String hoTen = ((hoLot != null ? hoLot : "") + " " + (ten != null ? ten : ""))
                .trim().replaceAll("\\s+", " ");
        LocalDate ngaySinh = parseDate(row.getCell(4));
        String gioiTinhRaw = str(row, 5);
        String maLop = str(row, 6);
        String ghiChuTenLop = str(row, 7);
        Integer namVao = parseInt(str(row, 8));
        String khoaHoc = str(row, 9);
        String tinhTrang = str(row, 10);

        if (maSv == null || maSv.isBlank()) errors.add("Thiếu mã sinh viên");
        else if (maSv.length() > 20) errors.add("Mã sinh viên quá dài (>20 ký tự): " + maSv);
        if (hoTen.isBlank()) errors.add("Thiếu họ tên");
        if (ngaySinh == null) errors.add("Ngày sinh không hợp lệ: " + str(row, 4));
        GioiTinhEnum gioiTinh = null;
        try { if (gioiTinhRaw != null) gioiTinh = GioiTinhEnum.fromValue(gioiTinhRaw.trim()); }
        catch (Exception e) { errors.add("Giới tính không hợp lệ: " + gioiTinhRaw); }
        if (maLop == null || maLop.isBlank()) errors.add("Thiếu mã lớp");
        else if (maLop.length() > 20) errors.add("Mã lớp quá dài (>20 ký tự): " + maLop);
        if (ghiChuTenLop == null || ghiChuTenLop.isBlank()) errors.add("Thiếu tên ngành/ghi chú lớp");
        if (khoaHoc == null || khoaHoc.isBlank()) errors.add("Thiếu khóa học");

        boolean conHoc = tinhTrang == null || tinhTrang.isBlank()
                || tinhTrang.trim().equalsIgnoreCase("Còn học");

        return new ParsedRow(rowNumber, maSv, hoTen, gioiTinh, ngaySinh, maLop, ghiChuTenLop,
                namVao, khoaHoc, conHoc, errors);
    }

    private LocalDate parseDate(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String s = strCell(cell);
        if (s == null || s.isBlank()) return null;
        for (DateTimeFormatter f : DATE_FORMATS) {
            try { return LocalDate.parse(s.trim(), f); } catch (Exception ignored) { }
        }
        return null;
    }

    private Integer parseInt(String s) {
        if (s == null || s.isBlank()) return null;
        try { return (int) Double.parseDouble(s.trim()); } catch (Exception e) { return null; }
    }

    private String str(Row row, int col) { return strCell(row.getCell(col)); }

    private String strCell(Cell cell) {
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
        for (int i = 1; i <= 7; i++) {
            String v = str(row, i);
            if (v != null && !v.isBlank()) return false;
        }
        return true;
    }
}
