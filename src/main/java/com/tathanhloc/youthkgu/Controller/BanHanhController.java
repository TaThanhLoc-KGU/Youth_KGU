package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DanhSachBanHanhDTO;
import com.tathanhloc.youthkgu.Model.DanhSachBanHanh;
import com.tathanhloc.youthkgu.Repository.DanhSachBanHanhRepository;
import com.tathanhloc.youthkgu.Service.KySoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/**
 * API ban hành danh sách chính thức.
 * - POST /api/ky-so/ban-hanh/{maHoatDong}  → tạo bản ban hành mới (cần quyền KY_SO_PDF)
 * - GET  /api/ky-so/ban-hanh/{maHoatDong}  → danh sách các bản ban hành của hoạt động
 * - GET  /api/public/ban-hanh/{id}/download → tải PDF (public, không cần đăng nhập)
 * - GET  /api/public/ban-hanh/{maHoatDong}/latest → thông tin bản ban hành mới nhất (public)
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Ban Hành", description = "API ban hành danh sách điểm danh chính thức")
public class BanHanhController {

    private final KySoService              kySoService;
    private final DanhSachBanHanhRepository banHanhRepository;

    // ── Cần quyền ──────────────────────────────────────────────────────────────

    @PostMapping("/api/ky-so/ban-hanh/{maHoatDong}")
    @Operation(summary = "Ban hành chính thức danh sách (lưu PDF + ghi DB)")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<DanhSachBanHanhDTO>> banHanh(
            @PathVariable String maHoatDong,
            @RequestBody KySoController.XuatPDFBody body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) throws IOException {

        String nguoiThucHien = userDetails != null ? userDetails.getUsername() : "anonymous";
        String ip = resolveClientIp(httpRequest);
        log.info("POST /api/ky-so/ban-hanh/{} by {}", maHoatDong, nguoiThucHien);

        KySoService.XuatPDFRequest req = new KySoService.XuatPDFRequest(
                maHoatDong, body.loaiKy(),
                body.chuKyBiThuId(), body.tenNguoiKy(),
                body.chuKyNguoiLapId(), body.tenNguoiLap(), body.chucVuNguoiLap(),
                body.conDauId(),
                body.posBiThu()    != null ? toElementPos(body.posBiThu())    : null,
                body.posNguoiLap() != null ? toElementPos(body.posNguoiLap()) : null,
                body.posConDau()   != null ? toElementPos(body.posConDau())   : null,
                body.customMaSvList(),
                body.overrideRows(), body.overrideTieuDe(), body.overrideNgayStr(),
                nguoiThucHien, ip,
                body.colConfig(),
                body.orgLabel(),
                body.formatConfig(),
                body.apDungGiapLai(),
                body.chuKyNhayId(),
                // Ban hành chính thức mặc định khóa PDF nếu body không chỉ định rõ (null → true)
                body.khoaFilePdf() != null ? body.khoaFilePdf() : Boolean.TRUE
        );

        DanhSachBanHanh entity = kySoService.banHanhDanhSach(req);
        return ResponseEntity.ok(ApiResponse.success("Ban hành thành công", toDTO(entity)));
    }

    @GetMapping("/api/ky-so/ban-hanh/{maHoatDong}")
    @Operation(summary = "Danh sách các bản ban hành của một hoạt động")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<List<DanhSachBanHanhDTO>>> getDanhSach(
            @PathVariable String maHoatDong) {
        List<DanhSachBanHanhDTO> list = kySoService.getBanHanhByHoatDong(maHoatDong)
                .stream().map(this::toDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ── Public (không cần đăng nhập) ────────────────────────────────────────

    @GetMapping("/api/public/ban-hanh/{maHoatDong}/latest")
    @Operation(summary = "Thông tin bản ban hành mới nhất (public)")
    public ResponseEntity<ApiResponse<DanhSachBanHanhDTO>> getLatest(
            @PathVariable String maHoatDong) {
        return kySoService.getLatestBanHanh(maHoatDong)
                .map(e -> ResponseEntity.ok(ApiResponse.success(toDTO(e))))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @GetMapping("/api/public/ban-hanh/{id}/download")
    @Operation(summary = "Tải PDF ban hành (public)")
    public ResponseEntity<?> download(@PathVariable Long id) throws IOException {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành"));
        // Bản đã hủy không cho download
        if ("DA_HUY".equals(entity.getTrangThai())) {
            return ResponseEntity.status(410)
                    .body(ApiResponse.error("Bản ban hành này đã bị hủy và không còn hiệu lực."));
        }
        byte[] pdfBytes = kySoService.readBanHanhFile(id);
        banHanhRepository.incrementSoLuotTai(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + entity.getTenFile() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new ByteArrayResource(pdfBytes));
    }

    @GetMapping("/api/public/ban-hanh/all/{maHoatDong}")
    @Operation(summary = "Tất cả bản ban hành của hoạt động (public, kể cả đã hủy)")
    public ResponseEntity<ApiResponse<List<DanhSachBanHanhDTO>>> getAllPublic(
            @PathVariable String maHoatDong) {
        List<DanhSachBanHanhDTO> list = kySoService.getBanHanhByHoatDong(maHoatDong)
                .stream().map(this::toDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/public/ban-hanh/tat-ca")
    @Operation(summary = "Tất cả bản ban hành còn hiệu lực (public, phân trang) — dùng cho trang listing eNews")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DanhSachBanHanhDTO>>> getTatCa(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = banHanhRepository.findByTrangThai("HIEU_LUC", pageable).map(this::toDTO);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/api/ky-so/ban-hanh/{id}")
    @Operation(summary = "Hủy ban hành (soft-delete, file vẫn còn)")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Void>> huyBanHanh(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String user = userDetails != null ? userDetails.getUsername() : "anonymous";
        log.info("DELETE (soft) /api/ky-so/ban-hanh/{} by {}", id, user);
        kySoService.huyBanHanh(id, user);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy ban hành. File vẫn được lưu trữ.", null));
    }

    @DeleteMapping("/api/ky-so/ban-hanh/{id}/xoa-han")
    @Operation(summary = "Xóa hẳn bản ban hành đã hủy (xóa cả file)")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Void>> xoaHanBanHanh(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("DELETE (hard) /api/ky-so/ban-hanh/{}/xoa-han by {}", id,
                userDetails != null ? userDetails.getUsername() : "anonymous");
        kySoService.xoaHanBanHanh(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa hoàn toàn bản ban hành.", null));
    }

    @GetMapping("/api/ky-so/ban-hanh-all")
    @Operation(summary = "Tất cả bản ban hành (admin, phân trang, tìm kiếm)")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DanhSachBanHanhDTO>>> getAllBanHanh(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean includeRevoked) {
        org.springframework.data.domain.Page<DanhSachBanHanhDTO> result =
                kySoService.getAllBanHanh(page, size, search, includeRevoked).map(this::toDTO);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private DanhSachBanHanhDTO toDTO(DanhSachBanHanh e) {
        return new DanhSachBanHanhDTO(
                e.getId(), e.getMaHoatDong(), e.getTenHoatDong(), e.getMaKhoa(),
                e.getLoaiKy(), e.getTenNguoiKy(), e.getTenNguoiLap(), e.getChucVuNguoiLap(),
                Boolean.TRUE.equals(e.getCoConDau()),
                e.getTongSv() != null ? e.getTongSv() : 0,
                e.getTenFile(),
                "/api/public/ban-hanh/" + e.getId() + "/download",
                e.getNguoiBanHanh(),
                e.getCreatedAt(),
                e.getTrangThai() != null ? e.getTrangThai() : "HIEU_LUC",
                e.getNgayHuy(),
                e.getNguoiHuy(),
                e.getSoLuotTai() != null ? e.getSoLuotTai() : 0
        );
    }

    private KySoService.ElementPos toElementPos(KySoController.PosBody p) {
        return new KySoService.ElementPos(p.x(), p.y(), p.width(), p.height());
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return (xf != null && !xf.isBlank()) ? xf.split(",")[0].trim() : req.getRemoteAddr();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in BanHanhController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
