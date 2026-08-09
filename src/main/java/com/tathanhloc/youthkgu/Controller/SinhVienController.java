package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.youthkgu.DTO.SinhVienDTO;
import com.tathanhloc.youthkgu.DTO.StudentCountDTO;
import com.tathanhloc.youthkgu.DTO.ClbImportRowDTO;
import com.tathanhloc.youthkgu.DTO.ClbImportMatchDTO;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Service.SinhVienExcelService;
import com.tathanhloc.youthkgu.Service.SinhVienService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinhvien")
@RequiredArgsConstructor
@Slf4j
public class SinhVienController {

    private final SinhVienService sinhVienService;
    private final TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private SinhVienExcelService excelService;

    private record ScopeFilter(String maKhoa, String maLop) {}

    /** Đọc scope từ SecurityContext — hoạt động kể cả khi gọi nội bộ giữa các method. */
    private ScopeFilter resolveScope() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return new ScopeFilter(null, null);
        TaiKhoan tk = taiKhoanRepository.findByUsername(auth.getName()).orElse(null);
        if (tk == null) return new ScopeFilter(null, null);
        VaiTroEnum role = tk.getVaiTro();
        if (role == VaiTroEnum.ADMIN) return new ScopeFilter(null, null);
        if (role.isScopedToKhoa() && tk.getKhoa() != null)
            return new ScopeFilter(tk.getKhoa().getMaKhoa(), null);
        if (role.isScopedToChiDoan() && tk.getLop() != null)
            return new ScopeFilter(null, tk.getLop().getMaLop());
        return new ScopeFilter(null, null);
    }

    /** Kiểm tra một sinh viên có nằm trong scope (khoa/lớp) của người gọi hay không. */
    private boolean inScope(ScopeFilter scope, SinhVienDTO dto) {
        if (dto == null) return true;
        if (scope.maKhoa() != null && !scope.maKhoa().equals(dto.getMaKhoa())) return false;
        if (scope.maLop() != null && !scope.maLop().equals(dto.getMaLop())) return false;
        return true;
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<Page<SinhVienDTO>> getAll(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(defaultValue = "maSv") String sortBy,
                                                    @RequestParam(defaultValue = "asc") String direction,
                                                    @RequestParam(required = false) String search,
                                                    @RequestParam(required = false) String maLop,
                                                    @RequestParam(required = false) String maKhoa,
                                                    @RequestParam(required = false) String maNganh,
                                                    @RequestParam(required = false) Boolean isActive) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending()
        );

        // Ép scope theo khoa/chi đoàn (ghi đè filter người dùng truyền vào)
        ScopeFilter scope = resolveScope();
        String effectiveMaKhoa = scope.maKhoa() != null ? scope.maKhoa() : maKhoa;
        String effectiveMaLop  = scope.maLop()  != null ? scope.maLop()  : maLop;

        // isActive mặc định true — sinh viên tốt nghiệp không xuất hiện trừ khi chủ động lọc
        boolean showActive = isActive == null || isActive;
        List<SinhVienDTO> allStudents = showActive
                ? sinhVienService.getAll()
                : sinhVienService.getAllIncludingGraduated();

        // Apply filters
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            allStudents = allStudents.stream()
                    .filter(s -> s.getMaSv().toLowerCase().contains(searchLower) ||
                               s.getHoTen().toLowerCase().contains(searchLower) ||
                               (s.getEmail() != null && s.getEmail().toLowerCase().contains(searchLower)))
                    .toList();
        }

        if (effectiveMaLop != null && !effectiveMaLop.isEmpty()) {
            allStudents = allStudents.stream()
                    .filter(s -> s.getMaLop() != null && s.getMaLop().equals(effectiveMaLop))
                    .toList();
        }

        if (effectiveMaKhoa != null && !effectiveMaKhoa.isEmpty()) {
            allStudents = allStudents.stream()
                    .filter(s -> s.getMaKhoa() != null && s.getMaKhoa().equals(effectiveMaKhoa))
                    .toList();
        }

        if (maNganh != null && !maNganh.isEmpty()) {
            allStudents = allStudents.stream()
                    .filter(s -> s.getMaNganh() != null && s.getMaNganh().equals(maNganh))
                    .toList();
        }

        // Nếu isActive=false được truyền rõ ràng, lọc lấy chỉ sinh viên đã tốt nghiệp
        if (isActive != null && !isActive) {
            allStudents = allStudents.stream()
                    .filter(s -> s.getIsActive() == null || !s.getIsActive())
                    .toList();
        }

        // Convert to page
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allStudents.size());
        List<SinhVienDTO> pageContent = allStudents.subList(start, end);

        return ResponseEntity.ok(new org.springframework.data.domain.PageImpl<>(
                pageContent,
                pageable,
                allStudents.size()
        ));
    }


    @GetMapping("/active/all")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN') or hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<List<SinhVienDTO>> getAllActive() {
        log.info("Lấy danh sách sinh viên đang hoạt động");
        ScopeFilter scope = resolveScope();
        List<SinhVienDTO> list = sinhVienService.getAllActive();
        if (scope.maKhoa() != null)
            list = list.stream().filter(s -> scope.maKhoa().equals(s.getMaKhoa())).toList();
        else if (scope.maLop() != null)
            list = list.stream().filter(s -> scope.maLop().equals(s.getMaLop())).toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<SinhVienDTO> getById(@PathVariable String id) {
        log.info("Lấy thông tin sinh viên với ID: {}", id);
        SinhVienDTO dto = sinhVienService.getById(id);
        if (!inScope(resolveScope(), dto)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'THEM_SINH_VIEN')")
    public ResponseEntity<SinhVienDTO> create(@Valid @RequestBody SinhVienDTO dto) {
        log.info("Tạo sinh viên mới: {}", dto);
        return ResponseEntity.ok(sinhVienService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SUA_SINH_VIEN')")
    public ResponseEntity<SinhVienDTO> update(@PathVariable String id, @Valid @RequestBody SinhVienDTO dto) {
        log.info("Cập nhật sinh viên với ID {}: {}", id, dto);
        if (!inScope(resolveScope(), sinhVienService.getById(id))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(sinhVienService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XOA_SINH_VIEN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("Xóa sinh viên với ID: {}", id);
        if (!inScope(resolveScope(), sinhVienService.getById(id))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        sinhVienService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasPermission(null, 'SUA_SINH_VIEN')")
    public ResponseEntity<Void> restore(@PathVariable String id) {
        log.info("Khôi phục sinh viên với ID: {}", id);
        if (!inScope(resolveScope(), sinhVienService.getById(id))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        sinhVienService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-masv/{maSv}")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<SinhVienDTO> getByMaSv(@PathVariable String maSv) {
        log.info("Tìm sinh viên theo mã: {}", maSv);
        SinhVienDTO dto = sinhVienService.getByMaSv(maSv);
        if (!inScope(resolveScope(), dto)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * API lấy tất cả embedding
     * @return Danh sách embedding
     */
    @GetMapping("/embeddings")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<List<Map<String, Object>>> getAllEmbeddings() {
        return ResponseEntity.ok(sinhVienService.getAllEmbeddings());
    }


    @GetMapping("/all")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<List<SinhVienDTO>> getAllStudentsNoPagination() {
        log.info("Lấy tất cả sinh viên (không phân trang)");
        ScopeFilter scope = resolveScope();
        List<SinhVienDTO> list = sinhVienService.getAll();
        if (scope.maKhoa() != null)
            list = list.stream().filter(s -> scope.maKhoa().equals(s.getMaKhoa())).toList();
        else if (scope.maLop() != null)
            list = list.stream().filter(s -> scope.maLop().equals(s.getMaLop())).toList();
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy thống kê sinh viên
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            log.info("Getting student statistics");

            List<SinhVienDTO> allStudents = sinhVienService.getAll();

            long totalStudents = allStudents.size();
            long activeStudents = allStudents.stream()
                    .filter(s -> s.getIsActive() != null && s.getIsActive())
                    .count();
            long studentsWithPhoto = allStudents.stream()
                    .count();
            long studentsWithEmbedding = allStudents.stream()
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalStudents", totalStudents);
            stats.put("activeStudents", activeStudents);
            stats.put("studentsWithPhoto", studentsWithPhoto);
            stats.put("studentsWithEmbedding", studentsWithEmbedding);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error getting statistics: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Tìm kiếm sinh viên với filter nâng cao
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")
    public ResponseEntity<Page<SinhVienDTO>> searchWithFilters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String classFilter,
            @RequestParam(required = false) String maKhoa,
            @RequestParam(required = false) String maNganh,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "maSv") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        try {
            log.info("Searching students with filters - search: {}, class: {}, faculty: {}, major: {}, status: {}",
                    search, classFilter, maKhoa, maNganh, status);

            // Convert status string to isActive boolean
            Boolean isActive = null;
            if (status != null && !status.isEmpty()) {
                isActive = status.equalsIgnoreCase("active") ? true :
                          status.equalsIgnoreCase("inactive") ? false : null;
            }

            return getAll(page, size, sortBy, direction, search, classFilter, maKhoa, maNganh, isActive);

        } catch (Exception e) {
            log.error("Error searching students: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Bulk operations - Cập nhật trạng thái nhiều sinh viên
     */
    @PostMapping("/bulk-update-status")
    @PreAuthorize("hasPermission(null, 'SUA_SINH_VIEN')")
    public ResponseEntity<Map<String, Object>> bulkUpdateStatus(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> studentIds = (List<String>) request.get("studentIds");
            Boolean isActive = (Boolean) request.get("isActive");

            log.info("Bulk updating status for students: {} to {}", studentIds, isActive);

            int updatedCount = 0;
            List<String> errors = new ArrayList<>();

            // Cập nhật: Gọi method updateBatch trong service (cần implement trong Service)
            updatedCount = sinhVienService.updateStatusBatch(studentIds, isActive);

            return ResponseEntity.ok(Map.of(
                    "updatedCount", updatedCount,
                    "errors", errors,
                    "message", "Đã cập nhật " + updatedCount + "/" + studentIds.size() + " sinh viên"
            ));

        } catch (Exception e) {
            log.error("Error bulk updating status: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Không thể thực hiện cập nhật hàng loạt: " + e.getMessage()));
        }


    }

    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StudentCountDTO> getStudentCount() {
        try {
            log.info("Lấy thống kê số lượng sinh viên");
            return ResponseEntity.ok(sinhVienService.getStudentCountStatistics());
        } catch (Exception e) {
            log.error("Error getting student count statistics: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    // Thêm vào class SinhVienController
    @GetMapping("/count/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> countActiveSinhVien() {
        log.info("Đếm tổng số sinh viên đang hoạt động");
        long count = sinhVienService.countActive();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> countAllSinhVien() {
        log.info("Đếm tổng số sinh viên");
        long count = sinhVienService.countAll();
        return ResponseEntity.ok(count);
    }

    /**
     * Download template Excel
     */
    @GetMapping("/template-excel")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            log.info("Download template Excel");
            byte[] excelFile = excelService.createTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "template-sinh-vien.xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);
        } catch (Exception e) {
            log.error("Error creating template", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Preview dữ liệu từ Excel
     */
    @PostMapping("/import-excel/preview")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<ExcelImportPreviewDTO> previewExcelImport(
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Preview Excel import: {}", file.getOriginalFilename());

            if (file.isEmpty()) {
                throw new RuntimeException("File không được để trống");
            }

            ExcelImportPreviewDTO preview = excelService.previewExcel(file);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            log.error("Error previewing Excel", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Confirm và lưu dữ liệu từ Excel
     */
    @PostMapping("/import-excel/confirm")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<Map<String, Object>> confirmExcelImport(
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Confirm Excel import: {}", file.getOriginalFilename());

            if (file.isEmpty()) {
                throw new RuntimeException("File không được để trống");
            }

            ExcelImportPreviewDTO preview = excelService.previewExcel(file);
            @SuppressWarnings("unchecked")
            List<SinhVienDTO> validData = (List<SinhVienDTO>) (List<?>) preview.getValidData();
            List<SinhVienDTO> savedList = sinhVienService.importFromExcel(validData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("successCount", savedList.size());
            response.put("failureCount", preview.getErrorRows());
            response.put("data", savedList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error confirming Excel import", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Export sinh viên ra Excel
     */
    @GetMapping("/export-excel")
    @PreAuthorize("hasPermission(null, 'EXPORT_SINH_VIEN')")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String maLop,
            @RequestParam(required = false) String maKhoa,
            @RequestParam(required = false) Boolean isActive) {
        try {
            log.info("Export to Excel - maLop: {}, maKhoa: {}, isActive: {}", maLop, maKhoa, isActive);

            ScopeFilter scope = resolveScope();
            String effectiveMaKhoa = scope.maKhoa() != null ? scope.maKhoa() : maKhoa;
            String effectiveMaLop  = scope.maLop()  != null ? scope.maLop()  : maLop;

            // Export mặc định chỉ active; isActive=false → export tốt nghiệp
            boolean exportActive = isActive == null || isActive;
            List<SinhVienDTO> sinhVienList = exportActive
                    ? sinhVienService.getAll()
                    : sinhVienService.getAllIncludingGraduated().stream()
                        .filter(sv -> sv.getIsActive() == null || !sv.getIsActive()).toList();

            if (effectiveMaLop != null) {
                sinhVienList = sinhVienList.stream()
                        .filter(sv -> effectiveMaLop.equals(sv.getMaLop()))
                        .toList();
            } else if (effectiveMaKhoa != null) {
                sinhVienList = sinhVienList.stream()
                        .filter(sv -> effectiveMaKhoa.equals(sv.getMaKhoa()))
                        .toList();
            }

            byte[] excelFile = excelService.exportToExcel(sinhVienList);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "danh-sach-sinh-vien.xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);
        } catch (Exception e) {
            log.error("Error exporting to Excel", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ══════════════════════════════════════════════════════════════
    // XỬ LÝ SINH VIÊN TỐT NGHIỆP HÀNG LOẠT
    // ══════════════════════════════════════════════════════════════

    @GetMapping("/template-tot-nghiep")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<byte[]> downloadTotNghiepTemplate() {
        try {
            byte[] file = excelService.createTotNghiepTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "template-tot-nghiep.xlsx");
            return ResponseEntity.ok().headers(headers).body(file);
        } catch (Exception e) {
            log.error("Error creating tot-nghiep template", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/bulk-deactivate/preview")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<Map<String, Object>> previewBulkDeactivate(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File trống"));
            Map<String, Object> preview = excelService.previewTotNghiep(file);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            log.error("Error previewing bulk deactivate", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk-deactivate/confirm")
    @PreAuthorize("hasPermission(null, 'IMPORT_SINH_VIEN')")
    public ResponseEntity<Map<String, Object>> confirmBulkDeactivate(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File trống"));
            Map<String, Object> preview = excelService.previewTotNghiep(file);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> found = (List<Map<String, Object>>) preview.get("found");
            List<String> maSvList = found.stream()
                    .map(m -> (String) m.get("maSv"))
                    .toList();
            Map<String, Object> result = sinhVienService.bulkDeactivate(maSvList);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error confirming bulk deactivate", e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════
    // BATCH MATCH — Dùng cho import thành viên CLB từ Excel
    // ══════════════════════════════════════════════════════════════

    /**
     * Dò khớp danh sách hàng Excel (MSSV / Họ tên / Lớp) với sinh viên trong DB.
     * Trả về kết quả match cho từng dòng để frontend hiển thị preview.
     */
    @PostMapping("/batch-match")
    @PreAuthorize("hasPermission(null, 'XEM_CLB') or hasPermission(null, 'QUAN_LY_THANH_VIEN_CLB') or hasPermission(null, 'QUAN_LY_CLB')")
    public ResponseEntity<ApiResponse<List<ClbImportMatchDTO>>> batchMatch(
            @RequestBody List<ClbImportRowDTO> rows) {
        log.info("POST /api/sinhvien/batch-match - {} dòng", rows.size());
        if (rows.size() > 500) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Tối đa 500 dòng mỗi lần nhập"));
        }
        List<ClbImportMatchDTO> results = sinhVienService.batchMatchForClb(rows);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
