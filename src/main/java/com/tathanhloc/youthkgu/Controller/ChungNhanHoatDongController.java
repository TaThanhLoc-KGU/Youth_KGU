package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Security.CustomPermissionEvaluator;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.Service.ChungNhanHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * REST API Controller cho quản lý chứng nhận
 */
@RestController
@RequestMapping("/api/chung-nhan")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chứng Nhận", description = "API quản lý chứng nhận hoạt động")
public class ChungNhanHoatDongController {

    private final ChungNhanHoatDongService chungNhanService;
    private final CustomPermissionEvaluator permissionEvaluator;

    /** Xem chứng nhận của chính mình luôn được phép; xem của SV khác cần quyền XEM_LICH_SU_THAM_GIA. */
    private boolean canViewCertificatesOf(Authentication authentication, String maSv) {
        if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails cud
                && cud.getTaiKhoan().getSinhVien() != null
                && cud.getTaiKhoan().getSinhVien().getMaSv().equals(maSv)) {
            return true;
        }
        return permissionEvaluator.hasPermission(authentication, null, "XEM_LICH_SU_THAM_GIA");
    }

    // ========== CRUD ENDPOINTS ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả chứng nhận")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getAll() {
        log.info("GET /api/chung-nhan - Get all certificates");
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getAll();
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết chứng nhận")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> getById(@PathVariable Long id) {
        log.info("GET /api/chung-nhan/{}", id);
        ChungNhanHoatDongDTO certificate = chungNhanService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    @GetMapping("/code/{maChungNhan}")
    @Operation(summary = "Tìm chứng nhận theo mã")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> getByCode(
            @PathVariable String maChungNhan) {
        log.info("GET /api/chung-nhan/code/{}", maChungNhan);
        ChungNhanHoatDongDTO certificate = chungNhanService.getByMaChungNhan(maChungNhan);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    // ========== ISSUE ENDPOINTS ==========

    @PostMapping("/issue/auto")
    @Operation(summary = "Cấp chứng nhận tự động")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> issueAuto(
            @RequestParam String maSv,
            @RequestParam String maHoatDong,
            @RequestParam(required = false) Long templateId) {
        log.info("POST /api/chung-nhan/issue/auto?maSv={}&maHoatDong={}&templateId={}", maSv, maHoatDong, templateId);
        ChungNhanHoatDongDTO certificate = chungNhanService.issueAutomatic(maSv, maHoatDong, templateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấp chứng nhận thành công", certificate));
    }

    @PostMapping("/issue/manual")
    @Operation(summary = "Cấp chứng nhận thủ công (Admin)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> issueManual(
            @RequestBody ChungNhanHoatDongDTO dto) {
        log.info("POST /api/chung-nhan/issue/manual");
        ChungNhanHoatDongDTO certificate = chungNhanService.issueManual(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấp chứng nhận thành công", certificate));
    }

    @PostMapping("/issue/bulk/{maHoatDong}")
    @Operation(summary = "Cấp hàng loạt chứng nhận")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> issueBulk(
            @PathVariable String maHoatDong,
            @RequestParam Long templateId) {
        log.info("POST /api/chung-nhan/issue/bulk/{}?templateId={}", maHoatDong, templateId);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.issueBulk(maHoatDong, templateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        String.format("Đã cấp %d chứng nhận", certificates.size()),
                        certificates));
    }

    @PostMapping("/preview")
    @Operation(summary = "Xem trước chứng nhận (PNG base64) trước khi cấp")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<String>> preview(@RequestBody ChungNhanPreviewRequest req) {
        log.info("POST /api/chung-nhan/preview - template={}, maSv={}, maHoatDong={}",
                req.getTemplateId(), req.getMaSv(), req.getMaHoatDong());
        String base64 = chungNhanService.previewBase64(req.getTemplateId(), req.getMaSv(), req.getMaHoatDong());
        return ResponseEntity.ok(ApiResponse.success(base64));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Thu hồi chứng nhận")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DANG_KY')")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @PathVariable Long id,
            @RequestParam String lyDo) {
        log.info("POST /api/chung-nhan/{}/revoke - Reason: {}", id, lyDo);
        chungNhanService.revoke(id, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi chứng nhận thành công", null));
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Danh sách chứng nhận của sinh viên (tự xem của mình luôn được phép)")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByStudent(
            @PathVariable String maSv, Authentication authentication) {
        log.info("GET /api/chung-nhan/student/{}", maSv);
        if (!canViewCertificatesOf(authentication, maSv)) {
            throw new AccessDeniedException("Không có quyền xem chứng nhận của sinh viên khác");
        }
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/activity/{maHoatDong}")
    @Operation(summary = "Danh sách chứng nhận theo hoạt động")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/chung-nhan/activity/{}", maHoatDong);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Lọc theo khoảng thời gian")
    @PreAuthorize("hasPermission(null, 'XEM_LICH_SU_THAM_GIA')")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("GET /api/chung-nhan/date-range?start={}&end={}", startDate, endDate);
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public void rethrowAccessDenied(org.springframework.security.access.AccessDeniedException e)
            throws org.springframework.security.access.AccessDeniedException {
        throw e;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in ChungNhanHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
