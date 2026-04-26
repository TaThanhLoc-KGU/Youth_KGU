package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.CauLacBoDTO;
import com.tathanhloc.youthkgu.DTO.HoatDongDTO;
import com.tathanhloc.youthkgu.DTO.ThanhVienCLBDTO;
import com.tathanhloc.youthkgu.Service.CauLacBoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clb")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Câu lạc bộ", description = "API quản lý CLB / Đội / Nhóm trực thuộc Đoàn - Hội")
public class CauLacBoController {

    private final CauLacBoService cauLacBoService;

    // ══════════════════════════════════════════════════════════════
    // DANH SÁCH CLB
    // ══════════════════════════════════════════════════════════════

    @GetMapping
    @Operation(summary = "Lấy danh sách CLB/Đội/Nhóm")
    @PreAuthorize("hasPermission(null, 'XEM_CLB') or hasPermission(null, 'QUAN_LY_CLB') or isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CauLacBoDTO>>> getAll(
            @RequestParam(required = false) String loai,
            @RequestParam(required = false) String maKhoa,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean choPhepDangKy,
            Authentication authentication) {
        log.info("GET /api/clb - loai={}, maKhoa={}, keyword={}, choPhepDangKy={}", loai, maKhoa, keyword, choPhepDangKy);

        // CLB Scope: nếu user bị giới hạn theo CLB, chỉ trả về CLB của họ
        if (authentication != null && authentication.getPrincipal() instanceof
                com.tathanhloc.youthkgu.Security.CustomUserDetails ud) {
            String userMaClb = ud.getTaiKhoan().getClb() != null
                    ? ud.getTaiKhoan().getClb().getMaClb() : null;
            if (userMaClb != null) {
                log.info("CLB-scoped user '{}' - chỉ xem CLB: {}", ud.getUsername(), userMaClb);
                List<CauLacBoDTO> scoped = cauLacBoService.getAll(loai, maKhoa, keyword, choPhepDangKy)
                        .stream()
                        .filter(c -> userMaClb.equals(c.getMaClb()))
                        .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(scoped));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getAll(loai, maKhoa, keyword, choPhepDangKy)));
    }


    @GetMapping("/{maClb}")
    @Operation(summary = "Xem chi tiết CLB kèm danh sách thành viên")
    @PreAuthorize("hasPermission(null, 'XEM_CLB') or hasPermission(null, 'QUAN_LY_CLB') or hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB')")
    public ResponseEntity<ApiResponse<CauLacBoDTO>> getDetail(@PathVariable String maClb) {
        log.info("GET /api/clb/{}", maClb);
        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getDetail(maClb)));
    }

    // ══════════════════════════════════════════════════════════════
    // CRUD CLB
    // ══════════════════════════════════════════════════════════════

    @PostMapping
    @Operation(summary = "Tạo CLB/Đội/Nhóm mới")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<CauLacBoDTO>> create(@RequestBody CauLacBoDTO req) {
        log.info("POST /api/clb - maClb={}, tenClb={}", req.getMaClb(), req.getTenClb());
        return ResponseEntity.ok(ApiResponse.success("Tạo CLB thành công", cauLacBoService.create(req)));
    }

    @PutMapping("/{maClb}")
    @Operation(summary = "Cập nhật thông tin CLB")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<CauLacBoDTO>> update(
            @PathVariable String maClb,
            @RequestBody CauLacBoDTO req) {
        log.info("PUT /api/clb/{}", maClb);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật CLB thành công", cauLacBoService.update(maClb, req)));
    }

    @DeleteMapping("/{maClb}")
    @Operation(summary = "Xóa CLB (soft delete)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maClb) {
        log.info("DELETE /api/clb/{}", maClb);
        cauLacBoService.delete(maClb);
        return ResponseEntity.ok(ApiResponse.success("Xóa CLB thành công", null));
    }

    // ══════════════════════════════════════════════════════════════
    // THÀNH VIÊN
    // ══════════════════════════════════════════════════════════════

    @GetMapping("/{maClb}/thanh-vien")
    @Operation(summary = "Lấy danh sách thành viên CLB (có thể lọc theo học kỳ)")
    @PreAuthorize("hasPermission(null, 'XEM_CLB') or hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB')")
    public ResponseEntity<ApiResponse<List<ThanhVienCLBDTO>>> getThanhVien(
            @PathVariable String maClb,
            @RequestParam(required = false) String maHocKy) {
        log.info("GET /api/clb/{}/thanh-vien?maHocKy={}", maClb, maHocKy);
        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getThanhVien(maClb, maHocKy)));
    }

    @PostMapping("/{maClb}/thanh-vien")
    @Operation(summary = "Thêm thành viên vào CLB")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB')")
    public ResponseEntity<ApiResponse<ThanhVienCLBDTO>> addThanhVien(
            @PathVariable String maClb,
            @RequestBody ThanhVienCLBDTO req) {
        log.info("POST /api/clb/{}/thanh-vien - maSv={}", maClb, req.getMaSv());
        return ResponseEntity.ok(ApiResponse.success("Thêm thành viên thành công", cauLacBoService.addThanhVien(maClb, req)));
    }

    @PutMapping("/{maClb}/thanh-vien/{id}")
    @Operation(summary = "Cập nhật thông tin thành viên")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB')")
    public ResponseEntity<ApiResponse<ThanhVienCLBDTO>> updateThanhVien(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestBody ThanhVienCLBDTO req) {
        log.info("PUT /api/clb/{}/thanh-vien/{}", maClb, id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", cauLacBoService.updateThanhVien(id, req)));
    }

    @DeleteMapping("/{maClb}/thanh-vien/{id}")
    @Operation(summary = "Xóa thành viên khỏi CLB")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB')")
    public ResponseEntity<ApiResponse<Void>> removeThanhVien(
            @PathVariable String maClb,
            @PathVariable Long id) {
        log.info("DELETE /api/clb/{}/thanh-vien/{}", maClb, id);
        cauLacBoService.removeThanhVien(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành viên thành công", null));
    }

    // ══════════════════════════════════════════════════════════════
    // HOẠT ĐỘNG CỦA CLB
    // ══════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════════
    // CLB CỦA TÔI (Chủ nhiệm CLB đăng nhập vào)
    // ══════════════════════════════════════════════════════════════

    @GetMapping("/my-membership")
    @Operation(summary = "Lấy danh sách CLB mà sinh viên hiện tại đang là thành viên")
    public ResponseEntity<ApiResponse<List<ThanhVienCLBDTO>>> getMyMembership(Authentication auth) {
        log.info("GET /api/clb/my-membership - user={}", auth.getName());
        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getMyMembership(auth.getName())));
    }

    @GetMapping("/my-clubs")
    @Operation(summary = "Lấy danh sách CLB mà người dùng hiện tại đang quản lý")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<CauLacBoDTO>>> getMyClubs(Authentication auth) {
        log.info("GET /api/clb/my-clubs - user={}", auth.getName());
        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getMyClubs(auth.getName())));
    }

    // ══════════════════════════════════════════════════════════════
    // KHÓA / MỞ KHÓA DANH SÁCH THÀNH VIÊN THEO HỌC KỲ
    // ══════════════════════════════════════════════════════════════

    @PutMapping("/lock-hoc-ky/{maHocKy}")
    @Operation(summary = "Khóa hoặc mở khóa danh sách thành viên CLB theo học kỳ")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<Void>> lockHocKy(
            @PathVariable String maHocKy,
            @RequestParam(defaultValue = "true") boolean locked,
            Authentication auth) {
        log.info("PUT /api/clb/lock-hoc-ky/{} locked={} by={}", maHocKy, locked, auth.getName());
        cauLacBoService.lockHocKy(maHocKy, locked, auth.getName());
        String msg = locked ? "Đã khóa danh sách CLB học kỳ " + maHocKy : "Đã mở khóa danh sách CLB học kỳ " + maHocKy;
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }

    // ══════════════════════════════════════════════════════════════
    // HOẠT ĐỘNG CỦA CLB
    // ══════════════════════════════════════════════════════════════

    @GetMapping("/{maClb}/hoat-dong")
    @Operation(summary = "Lấy danh sách hoạt động của CLB (có thể lọc theo năm học)")
    @PreAuthorize("hasPermission(null, 'XEM_CLB') or hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getHoatDong(
            @PathVariable String maClb,
            @RequestParam(required = false) String maNamHoc) {
        log.info("GET /api/clb/{}/hoat-dong?maNamHoc={}", maClb, maNamHoc);
        return ResponseEntity.ok(ApiResponse.success(cauLacBoService.getHoatDong(maClb, maNamHoc)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in CauLacBoController", e);
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
    }
}
