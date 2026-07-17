package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.CuocThiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuoc-thi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cuộc Thi", description = "Admin quản lý cuộc thi")
public class CuocThiController {

    private final CuocThiService cuocThiService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CuocThiDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getById(id, true)));
    }

    @GetMapping("/hoat-dong")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CuocThiDTO>>> getByHoatDong(@RequestParam String ma) {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getByHoatDong(ma)));
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'TAO_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> create(
            @Valid @RequestBody CuocThiCreateRequest req,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        CuocThiDTO created = cuocThiService.create(req, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo cuộc thi thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody CuocThiCreateRequest req,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", cuocThiService.update(id, req, username)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XOA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cuocThiService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa cuộc thi", null));
    }

    // ─── Thí sinh ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/thi-sinh")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThiSinhDTO>> addThiSinh(@PathVariable Long id, @RequestBody ThiSinhDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm thành công", cuocThiService.addThiSinh(id, dto)));
    }

    @PutMapping("/{id}/thi-sinh/{thiSinhId}")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThiSinhDTO>> updateThiSinh(@PathVariable Long id, @PathVariable Long thiSinhId, @RequestBody ThiSinhDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", cuocThiService.updateThiSinh(id, thiSinhId, dto)));
    }

    @DeleteMapping("/{id}/thi-sinh/{thiSinhId}")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteThiSinh(@PathVariable Long id, @PathVariable Long thiSinhId) {
        cuocThiService.deleteThiSinh(id, thiSinhId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thí sinh", null));
    }

    // ─── Sinh viên tự đăng ký nộp bài ──────────────────────────────────────────

    @PostMapping("/{id}/dang-ky-nop-bai")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ThiSinhDTO>> dangKyNopBai(
            @PathVariable Long id,
            @RequestBody ThiSinhDTO dto,
            Authentication auth) {
        String username = auth.getName();
        ThiSinhDTO result = cuocThiService.dangKyNopBai(id, dto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đăng ký nộp bài thành công", result));
    }

    @GetMapping("/{id}/cho-duyet")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ThiSinhDTO>>> getDanhSachChoDuyet(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getDanhSachChoDuyet(id)));
    }

    @PostMapping("/{id}/thi-sinh/{thiSinhId}/duyet")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThiSinhDTO>> duyetThiSinh(
            @PathVariable Long id, @PathVariable Long thiSinhId) {
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt", cuocThiService.duyetThiSinh(id, thiSinhId)));
    }

    @PostMapping("/{id}/thi-sinh/{thiSinhId}/tu-choi")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThiSinhDTO>> tuChoiThiSinh(
            @PathVariable Long id, @PathVariable Long thiSinhId) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối", cuocThiService.tuChoiThiSinh(id, thiSinhId)));
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    @PostMapping("/{id}/mo-vote")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> moVote(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã mở bình chọn", cuocThiService.moVote(id)));
    }

    @PostMapping("/{id}/dong-vote")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> dongVote(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã đóng bình chọn", cuocThiService.dongVote(id)));
    }

    @PostMapping("/{id}/cong-bo")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CuocThiDTO>> congBo(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã công bố kết quả", cuocThiService.congBoKetQua(id)));
    }

    @GetMapping("/{id}/thong-ke")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getThongKe(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getThongKe(id)));
    }

    // ─── Vote management ──────────────────────────────────────────────────────

    @GetMapping("/{id}/danh-sach-vote")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDanhSachVote(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getDanhSachVote(id, page, size)));
    }

    @GetMapping(value = "/{id}/export-vote", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportVote(@PathVariable Long id) throws Exception {
        Map<String, Object> thongKe = cuocThiService.getThongKe(id);
        List<Map<String, Object>> danhSachVote = cuocThiService.getAllVoteForExport(id);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> ketQua = (List<Map<String, Object>>) thongKe.get("ketQua");

        String cuocThiTen = (String) thongKe.get("tieuDe");
        long tongVote = ketQua == null ? 0 : ketQua.stream()
                .mapToLong(m -> ((Number) m.get("soVote")).longValue()).sum();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {

            // ──────────────── BẢNG MÀU THƯƠNG HIỆU ────────────────
            XSSFColor cGold    = new XSSFColor(new byte[]{(byte)255,(byte)193,(byte)7},   null); // #FFC107
            XSSFColor cSilver  = new XSSFColor(new byte[]{(byte)176,(byte)190,(byte)197}, null); // #B0BEC5
            XSSFColor cBronze  = new XSSFColor(new byte[]{(byte)188,(byte)143,(byte)143}, null); // #BC8F8F
            XSSFColor cHeader  = new XSSFColor(new byte[]{(byte)30, (byte)58, (byte)138}, null); // #1E3A8A
            XSSFColor cWhite   = new XSSFColor(new byte[]{(byte)255,(byte)255,(byte)255}, null);
            XSSFColor cOrange  = new XSSFColor(new byte[]{(byte)234,(byte)88, (byte)12},  null); // #EA580C
            XSSFColor cLightYellow = new XSSFColor(new byte[]{(byte)254,(byte)252,(byte)232}, null); // #FEFCE8
            XSSFColor cLightBlue  = new XSSFColor(new byte[]{(byte)239,(byte)246,(byte)255}, null); // #EFF6FF
            XSSFColor cRow2    = new XSSFColor(new byte[]{(byte)248,(byte)250,(byte)252}, null); // #F8FAFC
            XSSFColor cBorder  = new XSSFColor(new byte[]{(byte)203,(byte)213,(byte)225}, null); // #CBD5E1

            // ─── Helper lambdas ───
            java.util.function.BiConsumer<XSSFCellStyle, XSSFColor> setFg = (cs, c) ->
                    cs.setFillForegroundColor(c);
            java.util.function.Consumer<XSSFCellStyle> solidFill = cs ->
                    cs.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            java.util.function.Consumer<XSSFCellStyle> allBorder = cs -> {
                cs.setBorderTop(BorderStyle.THIN);    cs.setTopBorderColor(cBorder);
                cs.setBorderBottom(BorderStyle.THIN); cs.setBottomBorderColor(cBorder);
                cs.setBorderLeft(BorderStyle.THIN);   cs.setLeftBorderColor(cBorder);
                cs.setBorderRight(BorderStyle.THIN);  cs.setRightBorderColor(cBorder);
            };

            // ═══════════════════════════════════════════════════════
            //  SHEET 1: TỔNG QUAN & XẾP HẠNG
            // ═══════════════════════════════════════════════════════
            Sheet s1 = wb.createSheet("📊 Kết quả");

            // --- Title block ---
            // Row 0: Big title
            Row r0 = s1.createRow(0); r0.setHeightInPoints(42);
            XSSFCellStyle titleStyle = wb.createCellStyle();
            XSSFFont titleFont = wb.createFont();
            titleFont.setBold(true); titleFont.setFontHeightInPoints((short)22);
            titleFont.setColor(cWhite);
            titleStyle.setFont(titleFont);
            setFg.accept(titleStyle, cOrange); solidFill.accept(titleStyle);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Cell titleCell = r0.createCell(0);
            titleCell.setCellValue("🏆  KẾT QUẢ BÌNH CHỌN");
            titleCell.setCellStyle(titleStyle);
            s1.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Row 1: Competition name
            Row r1 = s1.createRow(1); r1.setHeightInPoints(30);
            XSSFCellStyle subStyle = wb.createCellStyle();
            XSSFFont subFont = wb.createFont();
            subFont.setBold(true); subFont.setFontHeightInPoints((short)14);
            subFont.setColor(cWhite);
            subStyle.setFont(subFont);
            setFg.accept(subStyle, cOrange); solidFill.accept(subStyle);
            subStyle.setAlignment(HorizontalAlignment.CENTER);
            subStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Cell nameCell = r1.createCell(0);
            nameCell.setCellValue(cuocThiTen != null ? cuocThiTen : "");
            nameCell.setCellStyle(subStyle);
            s1.addMergedRegion(new CellRangeAddress(1, 1, 0, 5));

            // Row 2: Info row
            Row r2 = s1.createRow(2); r2.setHeightInPoints(20);
            XSSFCellStyle infoStyle = wb.createCellStyle();
            XSSFFont infoFont = wb.createFont(); infoFont.setFontHeightInPoints((short)10);
            infoFont.setColor(new XSSFColor(new byte[]{(byte)100,(byte)116,(byte)139}, null));
            infoStyle.setFont(infoFont);
            setFg.accept(infoStyle, cLightYellow); solidFill.accept(infoStyle);
            infoStyle.setAlignment(HorizontalAlignment.CENTER);
            Cell infoCell = r2.createCell(0);
            String exportTime = java.time.LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
            infoCell.setCellValue("Ngày xuất: " + exportTime + "   |   Tổng lượt bình chọn: " + tongVote);
            infoCell.setCellStyle(infoStyle);
            s1.addMergedRegion(new CellRangeAddress(2, 2, 0, 5));

            // Row 3: blank
            s1.createRow(3).setHeightInPoints(8);

            // Row 4: Table header
            Row r4 = s1.createRow(4); r4.setHeightInPoints(24);
            String[] cols1 = {"", "Hạng", "Thí sinh", "Số lượt bình chọn", "Tỉ lệ (%)", "Ghi chú"};
            int[] widths1 = {800, 2500, 8000, 5000, 4000, 4000};
            XSSFCellStyle colHdrStyle = wb.createCellStyle();
            XSSFFont colHdrFont = wb.createFont();
            colHdrFont.setBold(true); colHdrFont.setFontHeightInPoints((short)11);
            colHdrFont.setColor(cWhite);
            colHdrStyle.setFont(colHdrFont);
            setFg.accept(colHdrStyle, cHeader); solidFill.accept(colHdrStyle);
            colHdrStyle.setAlignment(HorizontalAlignment.CENTER);
            colHdrStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            allBorder.accept(colHdrStyle);
            for (int i = 0; i < cols1.length; i++) {
                Cell c = r4.createCell(i); c.setCellValue(cols1[i]); c.setCellStyle(colHdrStyle);
                s1.setColumnWidth(i, widths1[i]);
            }

            // Data rows
            XSSFColor[] medalColors = {cGold, cSilver, cBronze};
            String[] medals = {"🥇", "🥈", "🥉"};
            if (ketQua != null) {
                for (int i = 0; i < ketQua.size(); i++) {
                    Map<String, Object> item = ketQua.get(i);
                    Row dataRow = s1.createRow(5 + i); dataRow.setHeightInPoints(22);

                    // Choose row style
                    XSSFCellStyle rowStyle = wb.createCellStyle();
                    XSSFFont rowFont = wb.createFont(); rowFont.setFontHeightInPoints((short)11);
                    if (i < 3) {
                        rowFont.setBold(true); rowFont.setFontHeightInPoints((short)12);
                        setFg.accept(rowStyle, medalColors[i]); solidFill.accept(rowStyle);
                    } else {
                        setFg.accept(rowStyle, i % 2 == 0 ? cLightBlue : cRow2);
                        solidFill.accept(rowStyle);
                    }
                    rowStyle.setFont(rowFont);
                    rowStyle.setVerticalAlignment(VerticalAlignment.CENTER);
                    allBorder.accept(rowStyle);

                    XSSFCellStyle centerStyle = wb.createCellStyle(); centerStyle.cloneStyleFrom(rowStyle);
                    centerStyle.setAlignment(HorizontalAlignment.CENTER);
                    XSSFCellStyle numStyle = wb.createCellStyle(); numStyle.cloneStyleFrom(centerStyle);
                    DataFormat fmt = wb.createDataFormat();
                    numStyle.setDataFormat(fmt.getFormat("#,##0"));

                    long soVote = ((Number) item.get("soVote")).longValue();
                    double phanTram = tongVote > 0 ? (double) soVote / tongVote * 100 : 0;

                    dataRow.createCell(0).setCellStyle(centerStyle); // empty
                    Cell rankCell = dataRow.createCell(1);
                    rankCell.setCellValue(i < 3 ? medals[i] + " Hạng " + (i+1) : String.valueOf(i+1));
                    rankCell.setCellStyle(centerStyle);
                    Cell nameC = dataRow.createCell(2);
                    nameC.setCellValue((String) item.get("ten")); nameC.setCellStyle(rowStyle);
                    Cell voteC = dataRow.createCell(3);
                    voteC.setCellValue(soVote); voteC.setCellStyle(numStyle);
                    Cell pctC = dataRow.createCell(4);
                    pctC.setCellValue(String.format("%.2f%%", phanTram)); pctC.setCellStyle(centerStyle);
                    Cell noteC = dataRow.createCell(5);
                    noteC.setCellValue(i == 0 ? "🏆 Quán quân" : i == 1 ? "🥈 Á quân" : i == 2 ? "🥉 Hạng ba" : "");
                    noteC.setCellStyle(centerStyle);
                }
            }

            // ═══════════════════════════════════════════════════════
            //  SHEET 2: CHI TIẾT BÌNH CHỌN
            // ═══════════════════════════════════════════════════════
            Sheet s2 = wb.createSheet("📋 Chi tiết bình chọn");

            // Title
            Row s2r0 = s2.createRow(0); s2r0.setHeightInPoints(36);
            XSSFCellStyle s2TitleStyle = wb.createCellStyle();
            XSSFFont s2TitleFont = wb.createFont();
            s2TitleFont.setBold(true); s2TitleFont.setFontHeightInPoints((short)16);
            s2TitleFont.setColor(cWhite);
            s2TitleStyle.setFont(s2TitleFont);
            setFg.accept(s2TitleStyle, cHeader); solidFill.accept(s2TitleStyle);
            s2TitleStyle.setAlignment(HorizontalAlignment.CENTER);
            s2TitleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Cell s2t = s2r0.createCell(0);
            s2t.setCellValue("📋  CHI TIẾT LƯỢT BÌNH CHỌN  —  " + (cuocThiTen != null ? cuocThiTen.toUpperCase() : ""));
            s2t.setCellStyle(s2TitleStyle);
            s2.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Subtitle
            Row s2r1 = s2.createRow(1); s2r1.setHeightInPoints(18);
            XSSFCellStyle s2SubStyle = wb.createCellStyle();
            XSSFFont s2SubFont = wb.createFont(); s2SubFont.setFontHeightInPoints((short)9);
            s2SubFont.setColor(new XSSFColor(new byte[]{(byte)100,(byte)116,(byte)139}, null));
            s2SubStyle.setFont(s2SubFont);
            setFg.accept(s2SubStyle, cLightBlue); solidFill.accept(s2SubStyle);
            s2SubStyle.setAlignment(HorizontalAlignment.CENTER);
            Cell s2sub = s2r1.createCell(0);
            s2sub.setCellValue("Tổng: " + danhSachVote.size() + " lượt  |  Xuất lúc: " + exportTime);
            s2sub.setCellStyle(s2SubStyle);
            s2.addMergedRegion(new CellRangeAddress(1, 1, 0, 5));

            s2.createRow(2).setHeightInPoints(6);

            // Header row
            Row s2h = s2.createRow(3); s2h.setHeightInPoints(22);
            String[] cols2 = {"STT", "Tài khoản / Ẩn danh", "Địa chỉ IP", "Bình chọn cho thí sinh", "Ngày vote", "Thời gian"};
            int[] widths2 = {2000, 6000, 4500, 7000, 3500, 4000};
            XSSFCellStyle s2Hdr = wb.createCellStyle();
            XSSFFont s2HdrFont = wb.createFont();
            s2HdrFont.setBold(true); s2HdrFont.setFontHeightInPoints((short)10); s2HdrFont.setColor(cWhite);
            s2Hdr.setFont(s2HdrFont);
            setFg.accept(s2Hdr, cHeader); solidFill.accept(s2Hdr);
            s2Hdr.setAlignment(HorizontalAlignment.CENTER);
            s2Hdr.setVerticalAlignment(VerticalAlignment.CENTER);
            allBorder.accept(s2Hdr);
            for (int i = 0; i < cols2.length; i++) {
                Cell c = s2h.createCell(i); c.setCellValue(cols2[i]); c.setCellStyle(s2Hdr);
                s2.setColumnWidth(i, widths2[i]);
            }

            // Data
            for (int i = 0; i < danhSachVote.size(); i++) {
                Map<String, Object> item = danhSachVote.get(i);
                Row dr = s2.createRow(4 + i); dr.setHeightInPoints(18);

                XSSFCellStyle ds = wb.createCellStyle();
                XSSFFont df = wb.createFont(); df.setFontHeightInPoints((short)10);
                ds.setFont(df);
                setFg.accept(ds, i % 2 == 0 ? cWhite : cRow2); solidFill.accept(ds);
                ds.setVerticalAlignment(VerticalAlignment.CENTER);
                allBorder.accept(ds);
                XSSFCellStyle dsc = wb.createCellStyle(); dsc.cloneStyleFrom(ds);
                dsc.setAlignment(HorizontalAlignment.CENTER);

                String nguoiVote = item.get("nguoiVoteMa") != null ? (String) item.get("nguoiVoteMa") : "Ẩn danh";
                String ip = item.get("nguoiVoteIp") != null ? (String) item.get("nguoiVoteIp") : "";

                Cell c0 = dr.createCell(0); c0.setCellValue(((Number) item.get("stt")).intValue()); c0.setCellStyle(dsc);
                Cell c1 = dr.createCell(1); c1.setCellValue(nguoiVote); c1.setCellStyle(ds);
                Cell c2 = dr.createCell(2); c2.setCellValue(ip); c2.setCellStyle(dsc);
                Cell c3 = dr.createCell(3); c3.setCellValue((String) item.get("tenThiSinh")); c3.setCellStyle(ds);
                Cell c4 = dr.createCell(4); c4.setCellValue((String) item.get("ngayVote")); c4.setCellStyle(dsc);
                Cell c5 = dr.createCell(5); c5.setCellValue((String) item.get("thoiGian")); c5.setCellStyle(dsc);
            }

            // Freeze panes on both sheets
            s1.createFreezePane(0, 5);
            s2.createFreezePane(0, 4);

            // Write
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            byte[] bytes = out.toByteArray();

            String safeFilename = (cuocThiTen != null ? cuocThiTen : "cuoc_thi")
                    .replaceAll("[^a-zA-Z0-9_\\-]", "_");
            String filename = "KetQua_" + safeFilename + "_" +
                    java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename*=UTF-8''" +
                            java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8))
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(bytes);
        }
    }

    @PostMapping("/{id}/checkout-winners")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkoutWinners(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> thiSinhIds = body.get("thiSinhIds");
        return ResponseEntity.ok(ApiResponse.success("Checkout thành công", cuocThiService.checkoutWinners(id, thiSinhIds)));
    }

    /**
     * POST /{id}/checkout-voters
     * Checkout tất cả người ĐÃ VOTE (nguoiVoteMa) → cập nhật DangKyHoatDong.trangThai = DA_THAM_GIA
     */
    @PostMapping("/{id}/checkout-voters")
    @PreAuthorize("hasPermission(null, 'SUA_CUOC_THI') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkoutVoters(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Checkout voter thành công",
                cuocThiService.checkoutVoters(id)));
    }
}
