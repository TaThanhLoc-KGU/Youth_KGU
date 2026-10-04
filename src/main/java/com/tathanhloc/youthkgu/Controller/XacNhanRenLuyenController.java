package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TaoXacNhanRenLuyenRequest;
import com.tathanhloc.youthkgu.Model.XacNhanHoatDongRenLuyen;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Service.XacNhanRenLuyenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Xuất danh sách xác nhận hoạt động đã tham gia" trong chức năng Điểm rèn luyện.
 *  POST /api/diem-ren-luyen/xac-nhan/tao        — (Đoàn trường) tạo cho cả trường, 1 học kỳ
 *  GET  /api/diem-ren-luyen/xac-nhan/cua-toi    — (SV) danh sách bản xác nhận của chính mình
 *  GET  /api/diem-ren-luyen/xac-nhan/{id}/file  — tải file PDF (chỉ chủ sở hữu hoặc người có quyền)
 *  GET  /api/diem-ren-luyen/xac-nhan            — (Đoàn trường) xem theo học kỳ, để đối soát
 */
@RestController
@RequestMapping("/api/diem-ren-luyen/xac-nhan")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Xác nhận hoạt động đã tham gia")
@PreAuthorize("isAuthenticated()")
public class XacNhanRenLuyenController {

    private static final String QUYEN = "QUAN_LY_DIEM_REN_LUYEN";

    private final XacNhanRenLuyenService service;
    private final TaiKhoanRepository taiKhoanRepo;
    private final PermissionEvaluator permissionEvaluator;

    @PostMapping("/tao")
    @Operation(summary = "Tạo xác nhận hoạt động cho toàn bộ sinh viên đã tham gia trong 1 học kỳ")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DIEM_REN_LUYEN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> tao(
            @RequestBody TaoXacNhanRenLuyenRequest req, Authentication auth) {
        var cfg = new XacNhanRenLuyenService.TaoXacNhanConfig(
                req.getSoHocKy(), req.getMaNamHoc(),
                req.getChuKyNguoiLapId(), req.getTenNguoiLap(), req.getChucVuNguoiLap(),
                req.getConDauId(), req.getApDungGiapLai(), req.getKhoaFilePdf());
        Map<String, Object> result = service.taoXacNhanChoHocKy(cfg, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã tạo xác nhận hoạt động", result));
    }

    @GetMapping("/cua-toi")
    @Operation(summary = "Danh sách bản xác nhận hoạt động của chính tôi")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> cuaToi(Authentication auth) {
        String maSv = maSv(auth);
        List<Map<String, Object>> ds = service.getDanhSachCuaToi(maSv).stream()
                .map(this::toRow).toList();
        return ResponseEntity.ok(ApiResponse.success(ds));
    }

    @GetMapping
    @Operation(summary = "Xem toàn bộ bản xác nhận theo học kỳ (đối soát)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DIEM_REN_LUYEN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> theoHocKy(
            @RequestParam Integer soHocKy, @RequestParam String maNamHoc) {
        List<Map<String, Object>> ds = service.getAllByHocKy(soHocKy, maNamHoc).stream()
                .map(this::toRow).toList();
        return ResponseEntity.ok(ApiResponse.success(ds));
    }

    @GetMapping("/{id}/file")
    @Operation(summary = "Tải file PDF xác nhận — chỉ chủ sở hữu hoặc người có quyền QUAN_LY_DIEM_REN_LUYEN")
    public ResponseEntity<ByteArrayResource> taiFile(@PathVariable Long id, Authentication auth) throws IOException {
        String myMaSv = taiKhoanRepo.findMaSvByUsername(auth.getName()).orElse(null);
        boolean coQuyenXemTatCa = permissionEvaluator.hasPermission(auth, null, QUYEN);
        byte[] bytes = service.getFile(id, myMaSv, coQuyenXemTatCa);
        var meta = service.getMeta(id);
        String tenFile = "xac_nhan_hoat_dong_" + meta.getMaSv() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(tenFile).build().toString())
                .body(new ByteArrayResource(bytes));
    }

    private String maSv(Authentication auth) {
        return taiKhoanRepo.findMaSvByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException(
                        "Tài khoản chưa gắn hồ sơ đoàn viên — không có dữ liệu xác nhận hoạt động"));
    }

    private Map<String, Object> toRow(XacNhanHoatDongRenLuyen x) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", x.getId());
        m.put("maSv", x.getMaSv());
        m.put("soHocKy", x.getSoHocKy());
        m.put("maNamHoc", x.getMaNamHoc());
        m.put("soHoatDong", x.getSoHoatDong());
        m.put("tongDiem", x.getTongDiem());
        m.put("createdAt", x.getCreatedAt());
        return m;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.warn("XacNhanRenLuyenController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }
}
