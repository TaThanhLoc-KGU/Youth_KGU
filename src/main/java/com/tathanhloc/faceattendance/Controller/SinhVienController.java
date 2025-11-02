package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ImportExcelResponse;
import com.tathanhloc.faceattendance.DTO.SinhVienDTO;
import com.tathanhloc.faceattendance.Service.SinhVienService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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


    @GetMapping
    public ResponseEntity<Page<SinhVienDTO>> getAll(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(defaultValue = "maSv") String sortBy,
                                                    @RequestParam(defaultValue = "asc") String direction) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending()
        );
        return ResponseEntity.ok(sinhVienService.getAllWithPagination(pageable));
    }


    @GetMapping("/active")
    public ResponseEntity<List<SinhVienDTO>> getAllActive() {
        log.info("Lấy danh sách sinh viên đang hoạt động");
        return ResponseEntity.ok(sinhVienService.getAllActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SinhVienDTO> getById(@PathVariable String id) {
        log.info("Lấy thông tin sinh viên với ID: {}", id);
        return ResponseEntity.ok(sinhVienService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SinhVienDTO> create(@Valid @RequestBody SinhVienDTO dto) {
        log.info("Tạo sinh viên mới: {}", dto);
        return ResponseEntity.ok(sinhVienService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SinhVienDTO> update(@PathVariable String id, @Valid @RequestBody SinhVienDTO dto) {
        log.info("Cập nhật sinh viên với ID {}: {}", id, dto);
        return ResponseEntity.ok(sinhVienService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("Xóa sinh viên với ID: {}", id);
        sinhVienService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable String id) {
        log.info("Khôi phục sinh viên với ID: {}", id);
        sinhVienService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-masv/{maSv}")
    public ResponseEntity<SinhVienDTO> getByMaSv(@PathVariable String maSv) {
        log.info("Tìm sinh viên theo mã: {}", maSv);
        return ResponseEntity.ok(sinhVienService.getByMaSv(maSv));
    }


    // Thêm endpoint này vào SinhVienController.java

    @GetMapping("/all")
    public ResponseEntity<List<SinhVienDTO>> getAllStudentsNoPagination() {
        log.info("Lấy tất cả sinh viên (không phân trang)");
        return ResponseEntity.ok(sinhVienService.getAll());
    }

    /**
     * Lấy thống kê sinh viên
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            log.info("Getting student statistics");

            List<SinhVienDTO> allStudents = sinhVienService.getAll();

            long totalStudents = allStudents.size();
            long activeStudents = allStudents.stream()
                    .filter(s -> s.getIsActive() != null && s.getIsActive())
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalStudents", totalStudents);
            stats.put("activeStudents", activeStudents);

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
    public ResponseEntity<Page<SinhVienDTO>> searchWithFilters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String classFilter,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "maSv") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        try {
            log.info("Searching students with filters - search: {}, class: {}, status: {}",
                    search, classFilter, status);

            // TODO: Implement advanced search logic with filters
            // For now, use existing pagination endpoint
            return getAll(page, size, sortBy, direction);

        } catch (Exception e) {
            log.error("Error searching students: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Bulk operations - Cập nhật trạng thái nhiều sinh viên
     */
    @PostMapping("/bulk-update-status")
    public ResponseEntity<Map<String, Object>> bulkUpdateStatus(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> studentIds = (List<String>) request.get("studentIds");
            Boolean isActive = (Boolean) request.get("isActive");

            log.info("Bulk updating status for students: {} to {}", studentIds, isActive);

            int updatedCount = 0;
            List<String> errors = new ArrayList<>();

            for (String maSv : studentIds) {
                try {
                    SinhVienDTO sinhVien = sinhVienService.getByMaSv(maSv);
                    sinhVien.setIsActive(isActive);
                    sinhVienService.update(maSv, sinhVien);
                    updatedCount++;
                } catch (Exception e) {
                    errors.add("Không thể cập nhật sinh viên " + maSv + ": " + e.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                    "updatedCount", updatedCount,
                    "totalRequested", studentIds.size(),
                    "errors", errors,
                    "message", "Đã cập nhật " + updatedCount + "/" + studentIds.size() + " sinh viên"
            ));

        } catch (Exception e) {
            log.error("Error bulk updating status: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Không thể thực hiện cập nhật hàng loạt: " + e.getMessage()));
        }


    }

    /**
     * Lấy tất cả sinh viên đang hoạt động (không phân trang)
     */
    @GetMapping("/active/all")
    public ResponseEntity<List<SinhVienDTO>> getAllActiveStudents() {
        log.info("Lấy tất cả sinh viên đang hoạt động (không phân trang)");
        return ResponseEntity.ok(sinhVienService.getAllActive());
    }
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getStudentCount() {
        try {
            long count = sinhVienService.count();
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("count", 0);
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    // Thêm vào class SinhVienController
    @GetMapping("/count/active")
    public ResponseEntity<Long> countActiveSinhVien() {
        log.info("Đếm tổng số sinh viên đang hoạt động");
        long count = sinhVienService.countActive();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/all")
    public ResponseEntity<Long> countAllSinhVien() {
        log.info("Đếm tổng số sinh viên");
        long count = sinhVienService.countAll();
        return ResponseEntity.ok(count);
    }
    // Import Excel
    @PostMapping("/import-excel")
    public ResponseEntity<ImportExcelResponse> importFromExcel(
            @RequestParam("file") MultipartFile file) {
        log.info("Import sinh viên từ file Excel: {}", file.getOriginalFilename());
        try {
            ImportExcelResponse response = sinhVienService.importFromExcel(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi import Excel", e);
            return ResponseEntity.badRequest()
                    .body(ImportExcelResponse.builder()
                            .successCount(0)
                            .failureCount(0)
                            .errors(List.of(e.getMessage()))
                            .build());
        }
    }

    // Export Excel
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportToExcel() {
        log.info("Export danh sách sinh viên ra Excel");
        try {
            byte[] excelData = sinhVienService.exportToExcel();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    "danh-sach-sinh-vien-" + LocalDate.now() + ".xlsx");
            return ResponseEntity.ok().headers(headers).body(excelData);
        } catch (Exception e) {
            log.error("Lỗi export Excel", e);
            return ResponseEntity.status(500).build();
        }
    }

    // Download Template
    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadTemplate() {
        log.info("Tải template Excel sinh viên");
        try {
            byte[] templateData = sinhVienService.createExcelTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "template-sinh-vien.xlsx");
            return ResponseEntity.ok().headers(headers).body(templateData);
        } catch (Exception e) {
            log.error("Lỗi tạo template", e);
            return ResponseEntity.status(500).build();
        }
    }
}

