package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * API quản lý đoàn viên theo scope phân cấp.
 *
 * QUAN_LY_KHOA / PHO_QUAN_LY_KHOA → xem toàn bộ chi đoàn + SV trong khoa mình.
 * QUAN_LY_CHI_DOAN / PHO_CHI_DOAN  → xem SV trong chi đoàn (lớp) mình.
 * ADMIN                              → xem tất cả.
 */
@RestController
@RequestMapping("/api/doan-vien")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                   RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class DoanVienController {

    private final TaiKhoanRepository taiKhoanRepository;
    private final LopRepository lopRepository;
    private final SinhVienRepository sinhVienRepository;
    private final KhoaRepository khoaRepository;

    /**
     * Lấy danh sách chi đoàn (lớp) mà người đang đăng nhập có quyền quản lý.
     * ADMIN → tất cả
     * QUAN_LY_KHOA → lớp trong khoa mình
     * QUAN_LY_CHI_DOAN → chỉ lớp của mình
     */
    @GetMapping("/chi-doan")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getChiDoan(Authentication auth) {
        TaiKhoan tk = resolveAccount(auth);
        if (tk == null) return unauthorized();

        List<Lop> result;
        VaiTroEnum role = tk.getVaiTro();

        if (role == VaiTroEnum.ADMIN) {
            result = lopRepository.findByIsActiveTrue();
        } else if (role.isScopedToKhoa()) {
            if (tk.getKhoa() == null) {
                result = lopRepository.findByIsActiveTrue();
            } else {
                result = lopRepository.findByMaKhoa_MaKhoaAndLoai(tk.getKhoa().getMaKhoa(), "LOP")
                        .stream().filter(Lop::isActive).collect(Collectors.toList());
                // Thêm chi đoàn riêng nếu có
                result.addAll(lopRepository.findByMaKhoa_MaKhoaAndLoai(tk.getKhoa().getMaKhoa(), "CHI_DOAN")
                        .stream().filter(Lop::isActive).collect(Collectors.toList()));
            }
        } else if (role.isScopedToChiDoan()) {
            if (tk.getLop() != null) {
                result = List.of(tk.getLop());
            } else {
                result = List.of();
            }
        } else {
            return forbidden();
        }

        List<Object> data = result.stream().map(lop -> {
            return new java.util.LinkedHashMap<String, Object>() {{
                put("maLop", lop.getMaLop());
                put("tenLop", lop.getTenLop());
                put("loai", lop.getLoai());
                put("maKhoa", lop.getMaKhoa() != null ? lop.getMaKhoa().getMaKhoa() : null);
                put("tenKhoa", lop.getMaKhoa() != null ? lop.getMaKhoa().getTenKhoa() : null);
                put("soLuongSV", sinhVienRepository.countByLopMaLopAndIsActiveTrue(lop.getMaLop()));
            }};
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.builder().success(true).data(data).build());
    }

    /**
     * Lấy danh sách sinh viên (đoàn viên) mà người đang đăng nhập có quyền quản lý.
     * Có thể filter theo maLop.
     */
    @GetMapping("/sinh-vien")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSinhVien(
            @RequestParam(required = false) String maLop,
            @RequestParam(required = false) String maKhoa,
            Authentication auth) {
        TaiKhoan tk = resolveAccount(auth);
        if (tk == null) return unauthorized();

        VaiTroEnum role = tk.getVaiTro();
        List<SinhVien> result;

        if (role == VaiTroEnum.ADMIN) {
            // Admin: nếu có filter thì dùng, không thì lấy tất cả
            if (maLop != null && !maLop.isBlank()) {
                result = sinhVienRepository.findByLopMaLop(maLop);
            } else if (maKhoa != null && !maKhoa.isBlank()) {
                result = getByKhoa(maKhoa);
            } else {
                result = sinhVienRepository.findByIsActive(true);
            }
        } else if (role.isScopedToKhoa()) {
            String scopeKhoa = tk.getKhoa() != null ? tk.getKhoa().getMaKhoa() : null;
            if (maLop != null && !maLop.isBlank()) {
                // Verify lớp thuộc khoa của mình
                Lop lop = lopRepository.findById(maLop).orElse(null);
                if (lop == null || (scopeKhoa != null &&
                        (lop.getMaKhoa() == null || !lop.getMaKhoa().getMaKhoa().equals(scopeKhoa)))) {
                    return forbidden();
                }
                result = sinhVienRepository.findByLopMaLop(maLop);
            } else {
                result = scopeKhoa != null ? getByKhoa(scopeKhoa) : sinhVienRepository.findByIsActive(true);
            }
        } else if (role.isScopedToChiDoan()) {
            String scopeLop = tk.getLop() != null ? tk.getLop().getMaLop() : null;
            if (scopeLop == null) return noScope();
            // Chi đoàn chỉ được xem lớp của mình
            if (maLop != null && !maLop.isBlank() && !maLop.equals(scopeLop)) {
                return forbidden();
            }
            result = sinhVienRepository.findByLopMaLop(scopeLop);
        } else {
            return forbidden();
        }

        return ResponseEntity.ok(ApiResponse.builder().success(true).data(result).build());
    }

    /**
     * Lấy danh sách tài khoản có thể được giao điểm danh trong phạm vi của caller.
     * Dùng khi phân công người điểm danh cho một hoạt động.
     */
    @GetMapping("/diem-danh/candidates")
    @PreAuthorize("hasPermission(null, 'GIAO_DIEM_DANH') or hasRole('ADMIN')")
    public ResponseEntity<?> getDiemDanhCandidates(
            @RequestParam(required = false) String maLop,
            Authentication auth) {
        TaiKhoan caller = resolveAccount(auth);
        if (caller == null) return unauthorized();

        VaiTroEnum role = caller.getVaiTro();
        List<TaiKhoan> candidates;

        if (role == VaiTroEnum.ADMIN) {
            candidates = taiKhoanRepository.findByVaiTroAndIsActiveTrue(VaiTroEnum.QUAN_LY_CHI_DOAN);
            candidates.addAll(taiKhoanRepository.findByVaiTroAndIsActiveTrue(VaiTroEnum.PHO_CHI_DOAN));
            candidates.addAll(taiKhoanRepository.findByVaiTroAndIsActiveTrue(VaiTroEnum.DOAN_VIEN));
        } else if (role.isScopedToKhoa()) {
            String scopeKhoa = caller.getKhoa() != null ? caller.getKhoa().getMaKhoa() : null;
            candidates = taiKhoanRepository.findByKhoa_MaKhoaAndIsActiveTrue(scopeKhoa);
        } else if (role.isScopedToChiDoan()) {
            String scopeLop = caller.getLop() != null ? caller.getLop().getMaLop() : null;
            candidates = scopeLop != null
                    ? taiKhoanRepository.findByLop_MaLopAndIsActiveTrue(scopeLop)
                    : List.of();
        } else {
            return forbidden();
        }

        List<Object> data = candidates.stream().map(c -> {
            return new java.util.LinkedHashMap<String, Object>() {{
                put("id", c.getId());
                put("username", c.getUsername());
                put("hoTen", c.getHoTen());
                put("vaiTro", c.getVaiTro() != null ? c.getVaiTro().name() : null);
                put("tenVaiTro", c.getVaiTro() != null ? c.getVaiTro().getLabel() : null);
                put("maLop", c.getLop() != null ? c.getLop().getMaLop() : null);
                put("tenLop", c.getLop() != null ? c.getLop().getTenLop() : null);
                put("maKhoa", c.getKhoa() != null ? c.getKhoa().getMaKhoa() : null);
                put("tenKhoa", c.getKhoa() != null ? c.getKhoa().getTenKhoa() : null);
            }};
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.builder().success(true).data(data).build());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private TaiKhoan resolveAccount(Authentication auth) {
        if (auth == null) return null;
        if (auth.getPrincipal() instanceof CustomUserDetails ud) {
            return ud.getTaiKhoan();
        }
        return taiKhoanRepository.findByUsername(auth.getName()).orElse(null);
    }

    private List<SinhVien> getByKhoa(String maKhoa) {
        List<Lop> lops = lopRepository.findByMaKhoa_MaKhoaAndLoai(maKhoa, "LOP");
        lops.addAll(lopRepository.findByMaKhoa_MaKhoaAndLoai(maKhoa, "CHI_DOAN"));
        return lops.stream()
                .filter(Lop::isActive)
                .flatMap(lop -> sinhVienRepository.findByLopMaLop(lop.getMaLop()).stream())
                .filter(sv -> Boolean.TRUE.equals(sv.getIsActive()))
                .collect(Collectors.toList());
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.builder().success(false).message("Không có quyền truy cập").build());
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.builder().success(false).message("Chưa đăng nhập").build());
    }

    private ResponseEntity<?> noScope() {
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder().success(false).message("Tài khoản chưa được gán chi đoàn").build());
    }
}
