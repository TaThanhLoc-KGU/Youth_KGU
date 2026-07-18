package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.DiemRenLuyenDTO;
import com.tathanhloc.youthkgu.DTO.DiemRenLuyenLichSuDTO;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Service.DiemRenLuyenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diem-ren-luyen")
@RequiredArgsConstructor
@Slf4j
public class DiemRenLuyenController {

    private final DiemRenLuyenService service;
    private final TaiKhoanRepository taiKhoanRepo;

    // ── Sinh viên xem điểm của chính mình ───────────────────────────────────

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DiemRenLuyenDTO>>> getMy(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Chưa đăng nhập"));
        }
        TaiKhoan tk = taiKhoanRepo.findByUsername(auth.getName()).orElse(null);
        if (tk == null || tk.getSinhVien() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(service.getByMaSv(tk.getSinhVien().getMaSv())));
    }

    // ── Lấy điểm của 1 sinh viên trong 1 học kỳ ─────────────────────────────

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<DiemRenLuyenDTO>> get(
            @RequestParam String maSv,
            @RequestParam String maHocKy) {
        return service.get(maSv, maHocKy)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Lấy toàn bộ điểm của 1 sinh viên (tất cả học kỳ) ────────────────────

    @GetMapping("/sinh-vien/{maSv}")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<List<DiemRenLuyenDTO>>> getBySinhVien(
            @PathVariable String maSv) {
        return ResponseEntity.ok(ApiResponse.success(service.getByMaSv(maSv)));
    }

    // ── Danh sách điểm theo học kỳ (phân trang) ──────────────────────────────

    @GetMapping("/hoc-ky/{maHocKy}")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<Page<DiemRenLuyenDTO>>> getByHocKy(
            @PathVariable String maHocKy,
            @RequestParam(required = false) String trangThai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getByHocKy(maHocKy, trangThai, page, size)));
    }

    // ── Nhập / cập nhật điểm ─────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DIEM_REN_LUYEN')")
    public ResponseEntity<ApiResponse<DiemRenLuyenDTO>> upsert(
            @RequestBody UpsertRequest req,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "system";
        DiemRenLuyenDTO result = service.upsert(
                req.getMaSv(), req.getMaHocKy(),
                req.getMauId(),
                req.getScores(), req.getGhiChu(),
                req.getLyDoThayDoi(), actor);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Phê duyệt ────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/duyet")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DIEM_REN_LUYEN')")
    public ResponseEntity<ApiResponse<DiemRenLuyenDTO>> duyet(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.duyet(id, auth != null ? auth.getName() : "system")));
    }

    // ── Khóa ─────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/khoa")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_DIEM_REN_LUYEN')")
    public ResponseEntity<ApiResponse<DiemRenLuyenDTO>> khoa(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.khoa(id, auth != null ? auth.getName() : "system")));
    }

    // ── Lịch sử phiên bản ────────────────────────────────────────────────────

    @GetMapping("/lich-su")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<List<DiemRenLuyenLichSuDTO>>> lichSu(
            @RequestParam String maSv,
            @RequestParam String maHocKy) {
        return ResponseEntity.ok(ApiResponse.success(service.getLichSu(maSv, maHocKy)));
    }

    // ── Request DTO (inline) ─────────────────────────────────────────────────

    @lombok.Data
    public static class UpsertRequest {
        private String maSv;
        private String maHocKy;
        private Long mauId;
        private Map<String, Integer> scores;
        private String ghiChu;
        private String lyDoThayDoi;
    }
}
