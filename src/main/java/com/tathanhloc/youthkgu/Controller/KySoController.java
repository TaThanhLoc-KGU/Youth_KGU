package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ChuKyDTO;
import com.tathanhloc.youthkgu.DTO.ConDauDTO;
import com.tathanhloc.youthkgu.Model.KySoLichSu;
import com.tathanhloc.youthkgu.Repository.KySoLichSuRepository;
import com.tathanhloc.youthkgu.Service.KySoService;
import com.tathanhloc.youthkgu.Service.KySoService.PreviewResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * REST API cho chức năng Ký số:
 * - Quản lý chữ ký (upload/list/delete)
 * - Quản lý con dấu (upload/list/delete)
 * - Preview danh sách (base64 PNG, trước khi ký)
 * - Xuất danh sách PDF có ký số, bảo mật AES-256
 * - Lịch sử ký số (audit log)
 */
@RestController
@RequestMapping("/api/ky-so")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Ký Số", description = "API quản lý chữ ký, con dấu và xuất PDF")
public class KySoController {

    private final KySoService          kySoService;
    private final KySoLichSuRepository lichSuRepository;

    // ══════════════════════════════════════════════════════════════════════
    // CHỮ KÝ
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/chu-ky")
    @Operation(summary = "Lấy danh sách chữ ký")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<List<ChuKyDTO>>> getAllChuKy() {
        return ResponseEntity.ok(ApiResponse.success(kySoService.getAllChuKy()));
    }

    @PostMapping(value = "/chu-ky", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload chữ ký mới")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<ChuKyDTO>> uploadChuKy(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tenNguoiKy") String tenNguoiKy,
            @RequestParam(value = "chucVu", required = false) String chucVu,
            @RequestParam(value = "laMacDinh", defaultValue = "false") boolean laMacDinh) {
        log.info("POST /api/ky-so/chu-ky - tenNguoiKy={}", tenNguoiKy);
        ChuKyDTO dto = kySoService.uploadChuKy(file, tenNguoiKy, chucVu, laMacDinh);
        return ResponseEntity.ok(ApiResponse.success("Tải chữ ký thành công", dto));
    }

    @DeleteMapping("/chu-ky/{id}")
    @Operation(summary = "Xóa chữ ký")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Void>> deleteChuKy(@PathVariable Long id) {
        log.info("DELETE /api/ky-so/chu-ky/{}", id);
        kySoService.deleteChuKy(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chữ ký thành công", null));
    }

    // ══════════════════════════════════════════════════════════════════════
    // CON DẤU
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/con-dau")
    @Operation(summary = "Lấy danh sách con dấu")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<List<ConDauDTO>>> getAllConDau() {
        return ResponseEntity.ok(ApiResponse.success(kySoService.getAllConDau()));
    }

    @PostMapping(value = "/con-dau", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload con dấu mới")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<ConDauDTO>> uploadConDau(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ten") String ten,
            @RequestParam(value = "laMacDinh", defaultValue = "false") boolean laMacDinh) {
        log.info("POST /api/ky-so/con-dau - ten={}", ten);
        ConDauDTO dto = kySoService.uploadConDau(file, ten, laMacDinh);
        return ResponseEntity.ok(ApiResponse.success("Tải con dấu thành công", dto));
    }

    @DeleteMapping("/con-dau/{id}")
    @Operation(summary = "Xóa con dấu")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Void>> deleteConDau(@PathVariable Long id) {
        log.info("DELETE /api/ky-so/con-dau/{}", id);
        kySoService.deleteConDau(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa con dấu thành công", null));
    }

    // ══════════════════════════════════════════════════════════════════════
    // PREVIEW
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Sinh ảnh preview (base64 PNG) cho từng trang PDF của danh sách tham gia.
     * Frontend hiển thị ảnh, cho phép drag-and-drop vị trí chữ ký / con dấu.
     */
    @GetMapping("/preview/{maHoatDong}")
    @Operation(summary = "Xem trước danh sách (trả về base64 PNG từng trang)")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<PreviewResult>> preview(
            @PathVariable String maHoatDong) throws IOException {
        log.info("GET /api/ky-so/preview/{}", maHoatDong);
        PreviewResult result = kySoService.generatePreview(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Body cho preview có override nội dung (admin chỉnh sửa trực tiếp). */
    record PreviewBody(
            List<KySoService.OverrideRow> overrideRows,
            String overrideTieuDe,
            String overrideNgayStr
    ) {}

    /**
     * Preview có override nội dung — dùng khi admin đã chỉnh sửa tiêu đề/danh sách SV.
     */
    @PostMapping("/preview/{maHoatDong}")
    @Operation(summary = "Xem trước danh sách với nội dung đã chỉnh sửa")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<PreviewResult>> previewWithOverride(
            @PathVariable String maHoatDong,
            @RequestBody PreviewBody body) throws IOException {
        log.info("POST /api/ky-so/preview/{} - overrideRows={}", maHoatDong,
                body.overrideRows() != null ? body.overrideRows().size() : "null");
        PreviewResult result = kySoService.generatePreview(
                maHoatDong, body.overrideRows(), body.overrideTieuDe(), body.overrideNgayStr());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ══════════════════════════════════════════════════════════════════════
    // XUẤT PDF
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Xuất PDF có ký số, bảo mật AES-256, và ghi audit log.
     * Body JSON gồm: loaiKy, chuKyBiThuId, tenNguoiKy, chuKyNguoiLapId,
     *                tenNguoiLap, chucVuNguoiLap, conDauId,
     *                posBiThu, posNguoiLap, posConDau (vị trí từ drag-and-drop)
     */
    @PostMapping("/xuat-pdf/{maHoatDong}")
    @Operation(summary = "Xuất danh sách ra PDF có ký số và bảo mật")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<InputStreamResource> xuatDanhSachPDF(
            @PathVariable String maHoatDong,
            @RequestBody XuatPDFBody body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) throws IOException {

        String nguoiThucHien = userDetails != null ? userDetails.getUsername() : "anonymous";
        String ip = resolveClientIp(httpRequest);
        log.info("POST /api/ky-so/xuat-pdf/{} - loaiKy={}, nguoiThucHien={}, ip={}",
                maHoatDong, body.loaiKy(), nguoiThucHien, ip);

        KySoService.XuatPDFRequest req = new KySoService.XuatPDFRequest(
                maHoatDong,
                body.loaiKy(),
                body.chuKyBiThuId(),
                body.tenNguoiKy(),
                body.chuKyNguoiLapId(),
                body.tenNguoiLap(),
                body.chucVuNguoiLap(),
                body.conDauId(),
                body.posBiThu()    != null ? toElementPos(body.posBiThu())    : null,
                body.posNguoiLap() != null ? toElementPos(body.posNguoiLap()) : null,
                body.posConDau()   != null ? toElementPos(body.posConDau())   : null,
                body.customMaSvList(),
                body.overrideRows(),
                body.overrideTieuDe(),
                body.overrideNgayStr(),
                nguoiThucHien,
                ip
        );

        byte[] pdfBytes = kySoService.xuatDanhSachPDF(req);

        String filename = "danh_sach_tham_gia_" + maHoatDong + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(new ByteArrayInputStream(pdfBytes)));
    }

    // ══════════════════════════════════════════════════════════════════════
    // LỊCH SỬ KÝ SỐ (AUDIT LOG)
    // ══════════════════════════════════════════════════════════════════════

    @GetMapping("/lich-su")
    @Operation(summary = "Lấy lịch sử ký số (audit log)")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Page<KySoLichSu>>> getLichSu(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<KySoLichSu> result = lichSuRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/lich-su/{maHoatDong}")
    @Operation(summary = "Lấy lịch sử ký số theo hoạt động")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<List<KySoLichSu>>> getLichSuByHoatDong(
            @PathVariable String maHoatDong) {
        List<KySoLichSu> result = lichSuRepository.findByMaHoatDongOrderByCreatedAtDesc(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ══════════════════════════════════════════════════════════════════════
    // INTERNAL DTOs / HELPERS
    // ══════════════════════════════════════════════════════════════════════

    /** Body JSON cho request xuất PDF. */
    public record XuatPDFBody(
            String loaiKy,
            Long   chuKyBiThuId,
            String tenNguoiKy,
            Long   chuKyNguoiLapId,
            String tenNguoiLap,
            String chucVuNguoiLap,
            Long   conDauId,
            PosBody posBiThu,
            PosBody posNguoiLap,
            PosBody posConDau,
            // Danh sách MSSV tuỳ chỉnh (null = lấy toàn bộ checked-in)
            List<String> customMaSvList,
            // Nội dung đã chỉnh sửa trực tiếp trên giao diện
            List<KySoService.OverrideRow> overrideRows,
            String overrideTieuDe,
            String overrideNgayStr
    ) {}

    /** Vị trí phần tử từ frontend (pixel, gốc trên-trái). */
    public record PosBody(float x, float y, float width, float height) {}

    private KySoService.ElementPos toElementPos(PosBody p) {
        return new KySoService.ElementPos(p.x(), p.y(), p.width(), p.height());
    }

    /** Lấy IP thực của client (hỗ trợ proxy / load balancer). */
    private String resolveClientIp(HttpServletRequest req) {
        String xfHeader = req.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in KySoController", e);
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error(e.getMessage()));
    }
}
