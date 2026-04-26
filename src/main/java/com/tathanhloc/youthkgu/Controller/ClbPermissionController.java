package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BanDTO;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Repository.BanRepository;
import com.tathanhloc.youthkgu.Service.BanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * ClbPermissionController — Quản lý phân quyền CLB
 * API này cho phép Admin gán quyền quản lý CLB cho các BCH/tài khoản khác.
 */
@RestController
@RequestMapping("/api/clb-permissions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CLB Phân Quyền", description = "API quản lý phân quyền CLB cho BCH")
public class ClbPermissionController {

    private final TaiKhoanRepository taiKhoanRepository;
    private final BanRepository banRepository;
    private final BanService banService;

    /**
     * Lấy danh sách CLB mà một tài khoản được phép quản lý
     * (dùng custom field trong TaiKhoan: managedClbIds)
     */
    @GetMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    @Operation(summary = "Lấy danh sách CLB được quản lý bởi một tài khoản")
    public ResponseEntity<ApiResponse<List<BanDTO>>> getManagedClbs(
            @PathVariable Long taiKhoanId) {
        log.info("GET /api/clb-permissions/account/{}", taiKhoanId);
        
        TaiKhoan tk = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        
        // Lấy danh sách mã CLB từ trường managedClbIds (lưu dạng JSON array string)
        List<String> managedClbIds = parseManagedClbIds(tk.getManagedClbIds());
        
        List<BanDTO> clbs = new ArrayList<>();
        for (String maBan : managedClbIds) {
            try {
                clbs.add(banService.getById(maBan));
            } catch (Exception e) {
                log.warn("CLB {} không tồn tại", maBan);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(clbs));
    }

    /**
     * Cập nhật danh sách CLB được quản lý bởi một tài khoản
     * Body: { "clbIds": ["CLB001", "CLB002", ...] }
     */
    @PutMapping("/account/{taiKhoanId}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    @Operation(summary = "Gán/cập nhật danh sách CLB cho một tài khoản")
    public ResponseEntity<ApiResponse<Void>> assignClbsToAccount(
            @PathVariable Long taiKhoanId,
            @RequestBody Map<String, List<String>> body) {
        log.info("PUT /api/clb-permissions/account/{}", taiKhoanId);
        
        List<String> clbIds = body.getOrDefault("clbIds", new ArrayList<>());
        
        TaiKhoan tk = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        
        // Chuyển đổi danh sách thành JSON string
        String managedClbIds = clbIds.isEmpty() ? "[]" : String.format("[%s]", 
                String.join(",", clbIds.stream().map(id -> "\"" + id + "\"").toList()));
        
        tk.setManagedClbIds(managedClbIds);
        taiKhoanRepository.save(tk);
        
        log.info("Gán {} CLB cho tài khoản {}", clbIds.size(), taiKhoanId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phân quyền CLB thành công", null));
    }

    /**
     * Lấy danh sách tất cả tài khoản và CLB được gán cho mỗi cái
     * (Dùng cho UI bảng phân quyền)
     */
    @GetMapping("/matrix")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    @Operation(summary = "Lấy ma trận phân quyền CLB-Account")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPermissionMatrix() {
        log.info("GET /api/clb-permissions/matrix");
        
        List<TaiKhoan> allAccounts = taiKhoanRepository.findAll();
        List<BanDTO> allClbs = banService.getAll();
        
        Map<String, Object> matrix = new LinkedHashMap<>();
        matrix.put("accounts", allAccounts.stream()
                .filter(tk -> tk.getVaiTro() != null && tk.getVaiTro().toString().contains("QUAN_LY"))
                .map(tk -> Map.of(
                        "id", tk.getId(),
                        "username", tk.getUsername(),
                        "hoTen", tk.getHoTen(),
                        "managedClbIds", parseManagedClbIds(tk.getManagedClbIds())
                ))
                .toList());
        matrix.put("clbs", allClbs);
        
        return ResponseEntity.ok(ApiResponse.success(matrix));
    }

    /**
     * Thêm CLB vào danh sách quản lý của account
     */
    @PostMapping("/account/{taiKhoanId}/clb/{maBan}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    @Operation(summary = "Thêm CLB vào danh sách quản lý")
    public ResponseEntity<ApiResponse<Void>> addClbToAccount(
            @PathVariable Long taiKhoanId,
            @PathVariable String maBan) {
        log.info("POST /api/clb-permissions/account/{}/clb/{}", taiKhoanId, maBan);
        
        TaiKhoan tk = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        
        // Kiểm tra CLB có tồn tại
        if (!banRepository.existsById(maBan)) {
            throw new RuntimeException("Không tìm thấy CLB: " + maBan);
        }
        
        List<String> managedClbs = parseManagedClbIds(tk.getManagedClbIds());
        if (!managedClbs.contains(maBan)) {
            managedClbs.add(maBan);
            String json = "[" + String.join(",", managedClbs.stream().map(id -> "\"" + id + "\"").toList()) + "]";
            tk.setManagedClbIds(json);
            taiKhoanRepository.save(tk);
            log.info("Thêm CLB {} cho tài khoản {}", maBan, taiKhoanId);
        }
        
        return ResponseEntity.ok(ApiResponse.success("Thêm CLB thành công", null));
    }

    /**
     * Xóa CLB khỏi danh sách quản lý của account
     */
    @DeleteMapping("/account/{taiKhoanId}/clb/{maBan}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_PHAN_QUYEN_TAI_KHOAN')")
    @Operation(summary = "Xóa CLB khỏi danh sách quản lý")
    public ResponseEntity<ApiResponse<Void>> removeClbFromAccount(
            @PathVariable Long taiKhoanId,
            @PathVariable String maBan) {
        log.info("DELETE /api/clb-permissions/account/{}/clb/{}", taiKhoanId, maBan);
        
        TaiKhoan tk = taiKhoanRepository.findById(taiKhoanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        
        List<String> managedClbs = parseManagedClbIds(tk.getManagedClbIds());
        if (managedClbs.remove(maBan)) {
            String json = managedClbs.isEmpty() ? "[]" : "[" + String.join(",", 
                    managedClbs.stream().map(id -> "\"" + id + "\"").toList()) + "]";
            tk.setManagedClbIds(json);
            taiKhoanRepository.save(tk);
            log.info("Xóa CLB {} khỏi tài khoản {}", maBan, taiKhoanId);
        }
        
        return ResponseEntity.ok(ApiResponse.success("Xóa CLB thành công", null));
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    /**
     * Parse managedClbIds từ JSON string thành List
     */
    private List<String> parseManagedClbIds(String json) {
        if (json == null || json.isEmpty() || json.equals("[]")) {
            return new ArrayList<>();
        }
        try {
            // Đơn giản: loại bỏ [], quotes và split
            String cleaned = json.replace("[", "").replace("]", "").replace("\"", "");
            if (cleaned.isEmpty()) return new ArrayList<>();
            return Arrays.asList(cleaned.split(","));
        } catch (Exception e) {
            log.warn("Lỗi parse managedClbIds: {}", json);
            return new ArrayList<>();
        }
    }
}
