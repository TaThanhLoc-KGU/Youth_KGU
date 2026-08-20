package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DanhSachBanHanhDTO;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
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

/**
 * API ban hành danh sách thành viên CLB.
 * POST /api/clb/{maClb}/ban-hanh/preview  → xem trước PDF
 * POST /api/clb/{maClb}/ban-hanh          → ban hành chính thức
 * GET  /api/clb/{maClb}/ban-hanh          → danh sách phiên bản
 * DELETE /api/clb/{maClb}/ban-hanh/{id}   → hủy ban hành
 */
@RestController
@RequestMapping("/api/clb/{maClb}/ban-hanh")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CLB Ban Hành", description = "API ban hành danh sách thành viên câu lạc bộ")
public class ClbBanHanhController {

    private final KySoService                kySoService;
    private final DanhSachBanHanhRepository  banHanhRepository;
    private final BanChuNhiemCLBRepository   bcnRepository;
    private final ThanhVienCLBRepository     thanhVienCLBRepository;

    /** Body JSON cho preview và ban hành CLB (không cần truyền members — lấy từ DB). */
    public record ClbBanHanhBody(
            String tenClb,
            String coQuanChuQuan,
            String tenChuNhiem,
            Long   chuKyChuNhiemId,
            Long   conDauId,
            KySoController.PosBody posChuNhiem,
            KySoController.PosBody posConDau,
            String overrideTieuDe,
            String overrideNgayStr,
            List<KySoService.ColConfig> colConfig,
            KySoService.FormatConfig formatConfig,
            Boolean apDungGiapLai,
            Long    chuKyNhayId,
            Boolean khoaFilePdf
    ) {}

    @PostMapping("/preview")
    @Operation(summary = "Xem trước PDF danh sách thành viên CLB")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'QUAN_LY_CLB') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<KySoService.PreviewResult>> preview(
            @PathVariable String maClb,
            @RequestBody ClbBanHanhBody body,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        log.info("POST /api/clb/{}/ban-hanh/preview by {}", maClb, userDetails.getUsername());
        KySoService.ClbBanHanhRequest req = toRequest(maClb, body, userDetails.getUsername(), "");
        KySoService.PreviewResult result = kySoService.generatePreviewClb(req);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "Ban hành chính thức danh sách thành viên CLB")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'QUAN_LY_CLB') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<DanhSachBanHanhDTO>> banHanh(
            @PathVariable String maClb,
            @RequestBody ClbBanHanhBody body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) throws IOException {

        String nguoiThucHien = userDetails.getUsername();
        String ip = resolveClientIp(httpRequest);
        log.info("POST /api/clb/{}/ban-hanh by {} ip={}", maClb, nguoiThucHien, ip);

        KySoService.ClbBanHanhRequest req = toRequest(maClb, body, nguoiThucHien, ip);
        DanhSachBanHanh entity = kySoService.banHanhDanhSachClb(req);
        return ResponseEntity.ok(ApiResponse.success("Ban hành thành công", toDTO(entity)));
    }

    @GetMapping
    @Operation(summary = "Danh sách các phiên bản ban hành của CLB")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'QUAN_LY_CLB') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<List<DanhSachBanHanhDTO>>> getDanhSach(
            @PathVariable String maClb) {
        String maHoatDong = "CLB_" + maClb;
        List<DanhSachBanHanhDTO> list = kySoService.getBanHanhByHoatDong(maHoatDong)
                .stream().map(this::toDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hủy bản ban hành CLB (soft-delete)")
    @PreAuthorize("hasPermission(null, 'KY_SO_PDF') or hasPermission(null, 'QUAN_LY_CLB') or hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Void>> huyBanHanh(
            @PathVariable String maClb,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("DELETE /api/clb/{}/ban-hanh/{} by {}", maClb, id, userDetails.getUsername());
        kySoService.huyBanHanh(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã hủy ban hành.", null));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Tải PDF ban hành CLB")
    public ResponseEntity<?> download(
            @PathVariable String maClb,
            @PathVariable Long id) throws IOException {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành"));
        if ("DA_HUY".equals(entity.getTrangThai())) {
            return ResponseEntity.status(410).body(ApiResponse.error("Bản ban hành này đã bị hủy."));
        }
        byte[] pdfBytes = kySoService.readBanHanhFile(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + entity.getTenFile() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new ByteArrayResource(pdfBytes));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** Lấy dữ liệu BCN (DUONG_NHIEM) và ThanhVienCLB từ DB và tạo request. */
    private KySoService.ClbBanHanhRequest toRequest(String maClb, ClbBanHanhBody b,
                                                     String nguoiThucHien, String ip) {
        List<KySoService.ClbBcnRow> bcnMembers = bcnRepository
                .findByCauLacBoMaClbAndTrangThaiOrderByChucVuAsc(maClb, "DUONG_NHIEM")
                .stream()
                .map(this::toBcnRow)
                .toList();

        List<KySoService.ClbMemberRow> members = thanhVienCLBRepository
                .findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb)
                .stream()
                .map(this::toMemberRow)
                .toList();

        return new KySoService.ClbBanHanhRequest(
                maClb, b.tenClb(),
                b.coQuanChuQuan(), b.tenChuNhiem(),
                b.chuKyChuNhiemId(), b.conDauId(),
                b.posChuNhiem() != null ? toElementPos(b.posChuNhiem()) : null,
                b.posConDau()   != null ? toElementPos(b.posConDau())   : null,
                bcnMembers,
                members,
                b.overrideTieuDe(), b.overrideNgayStr(),
                b.colConfig(), b.formatConfig(),
                nguoiThucHien, ip,
                b.apDungGiapLai(),
                b.chuKyNhayId(),
                // Ban hành chính thức CLB mặc định khóa PDF nếu body không chỉ định rõ (null → true)
                b.khoaFilePdf() != null ? b.khoaFilePdf() : Boolean.TRUE
        );
    }

    private KySoService.ClbBcnRow toBcnRow(BanChuNhiemCLB bcn) {
        String hoTen, donVi;
        if ("GV".equals(bcn.getLoaiNguoi()) && bcn.getGiangVien() != null) {
            hoTen = bcn.getGiangVien().getHoTen();
            donVi = "Giảng viên";
        } else if ("CV".equals(bcn.getLoaiNguoi()) && bcn.getChuyenVien() != null) {
            hoTen = bcn.getChuyenVien().getHoTen();
            donVi = "Chuyên viên";
        } else {
            SinhVien sv = bcn.getSinhVien();
            hoTen = sv != null ? sv.getHoTen() : "";
            donVi = (sv != null && sv.getLop() != null) ? sv.getLop().getMaLop() : "";
        }
        return new KySoService.ClbBcnRow(
                hoTen, donVi,
                bcn.getChucVu() != null ? bcn.getChucVu() : "",
                bcn.getLoaiNguoi()
        );
    }

    private KySoService.ClbMemberRow toMemberRow(ThanhVienCLB tv) {
        SinhVien sv = tv.getSinhVien();
        String maLop  = (sv != null && sv.getLop() != null) ? sv.getLop().getMaLop() : "";
        String tenKhoa = (sv != null && sv.getLop() != null && sv.getLop().getMaKhoa() != null)
                ? sv.getLop().getMaKhoa().getTenKhoa() : "";
        return new KySoService.ClbMemberRow(
                sv != null ? sv.getHoTen() : "",
                maLop,
                sv != null ? sv.getMaSv() : "",
                tv.getChucVu() != null ? tv.getChucVu() : "",
                tenKhoa
        );
    }

    private DanhSachBanHanhDTO toDTO(DanhSachBanHanh e) {
        return new DanhSachBanHanhDTO(
                e.getId(), e.getMaHoatDong(), e.getTenHoatDong(), e.getMaKhoa(),
                e.getLoaiKy(), e.getTenNguoiKy(), e.getTenNguoiLap(), e.getChucVuNguoiLap(),
                Boolean.TRUE.equals(e.getCoConDau()),
                e.getTongSv() != null ? e.getTongSv() : 0,
                e.getTenFile(),
                "/api/clb/" + e.getMaHoatDong().replace("CLB_", "") + "/ban-hanh/" + e.getId() + "/download",
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
        log.error("Error in ClbBanHanhController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
