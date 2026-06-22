package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ClbCauHinhDTO;
import com.tathanhloc.youthkgu.DTO.DangKyThanhVienCLBDTO;
import com.tathanhloc.youthkgu.Service.ClbCauHinhService;
import com.tathanhloc.youthkgu.Service.ClbExportService;
import com.tathanhloc.youthkgu.Service.DangKyThanhVienCLBService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clb")
@RequiredArgsConstructor
@Slf4j
public class ClbCauHinhController {

    private final ClbCauHinhService        cauHinhService;
    private final DangKyThanhVienCLBService dangKyService;
    private final ClbExportService          exportService;

    // ════════════════════════════════════════════════════════════
    // CẤU HÌNH CLB
    // ════════════════════════════════════════════════════════════

    @GetMapping("/{maClb}/cau-hinh")
    @PreAuthorize("hasPermission(null,'CAU_HINH_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<ClbCauHinhDTO>> getCauHinh(@PathVariable String maClb) {
        return ResponseEntity.ok(ApiResponse.success(cauHinhService.getByCLB(maClb)));
    }

    @PutMapping("/{maClb}/cau-hinh")
    @PreAuthorize("hasPermission(null,'CAU_HINH_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<ClbCauHinhDTO>> saveCauHinh(
            @PathVariable String maClb,
            @RequestBody ClbCauHinhDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã lưu cấu hình",
                cauHinhService.save(maClb, dto, auth.getName())));
    }

    // ════════════════════════════════════════════════════════════
    // ĐĂNG KÝ THÀNH VIÊN — BCN quản lý
    // ════════════════════════════════════════════════════════════

    @GetMapping("/{maClb}/dang-ky")
    @PreAuthorize("hasPermission(null,'DUYET_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<DangKyThanhVienCLBDTO>>> getDonDangKy(
            @PathVariable String maClb,
            @RequestParam(required = false) String trangThai) {
        return ResponseEntity.ok(ApiResponse.success(
                dangKyService.getDonByClb(maClb, trangThai)));
    }

    @PutMapping("/{maClb}/dang-ky/{id}/duyet")
    @PreAuthorize("hasPermission(null,'DUYET_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<DangKyThanhVienCLBDTO>> duyet(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestParam(required = false) String lyDo,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã duyệt đơn",
                dangKyService.duyet(id, lyDo, auth.getName())));
    }

    @PutMapping("/{maClb}/dang-ky/{id}/tu-choi")
    @PreAuthorize("hasPermission(null,'DUYET_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<DangKyThanhVienCLBDTO>> tuChoi(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestParam(required = false) String lyDo,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối đơn",
                dangKyService.tuChoi(id, lyDo, auth.getName())));
    }

    @GetMapping("/{maClb}/dang-ky/count")
    @PreAuthorize("hasPermission(null,'DUYET_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<Long>> countCHO_DUYET(@PathVariable String maClb) {
        return ResponseEntity.ok(ApiResponse.success(dangKyService.countCHO_DUYET(maClb)));
    }

    // ════════════════════════════════════════════════════════════
    // ĐĂNG KÝ THÀNH VIÊN — Sinh viên tự đăng ký
    // ════════════════════════════════════════════════════════════

    /** Sinh viên nộp đơn đăng ký vào CLB */
    @PostMapping("/{maClb}/dang-ky")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DangKyThanhVienCLBDTO>> submitDangKy(
            @PathVariable String maClb,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String maSv  = auth.getName(); // username = maSv với tài khoản sinh viên
        String lyDo  = body != null ? body.get("lyDo") : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi đơn đăng ký",
                dangKyService.submitDangKy(maClb, maSv, lyDo)));
    }

    /** Sinh viên hủy đơn */
    @PutMapping("/{maClb}/dang-ky/{id}/huy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DangKyThanhVienCLBDTO>> huyDon(
            @PathVariable String maClb,
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã hủy đơn",
                dangKyService.huyDon(id, auth.getName())));
    }

    /** Sinh viên xem đơn đăng ký của mình */
    @GetMapping("/my-dang-ky")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DangKyThanhVienCLBDTO>>> myDangKy(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                dangKyService.getDonBySinhVien(auth.getName())));
    }

    // ════════════════════════════════════════════════════════════
    // EXPORT EXCEL
    // ════════════════════════════════════════════════════════════

    @GetMapping("/{maClb}/export-members")
    @PreAuthorize("hasPermission(null,'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null,'QUAN_LY_CLB')")
    public ResponseEntity<byte[]> exportMembers(
            @PathVariable String maClb,
            @RequestParam(required = false) String maHocKy) throws IOException {

        byte[] data = exportService.exportMembers(maClb, maHocKy);

        String filename = "thanh-vien-" + maClb
                + (maHocKy != null ? "-" + maHocKy : "") + ".xlsx";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
