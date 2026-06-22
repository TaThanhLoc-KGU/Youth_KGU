package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ChuyenVienDTO;
import com.tathanhloc.youthkgu.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.youthkgu.Service.ChuyenVienExcelService;
import com.tathanhloc.youthkgu.Service.ChuyenVienService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chuyenvien")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chuyên viên", description = "API quản lý chuyên viên")
public class ChuyenVienController {

    private final ChuyenVienService chuyenVienService;
    private final ChuyenVienExcelService excelService;

    @GetMapping
    @Operation(summary = "Lấy tất cả chuyên viên")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN') or hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> getAll() {
        log.info("GET /api/chuyenvien");
        List<ChuyenVienDTO> list = chuyenVienService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ========== EXCEL ENDPOINTS ==========

    @GetMapping("/excel/template")
    @Operation(summary = "Tải file template Excel")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<byte[]> getTemplate() throws Exception {
        byte[] excelContent = excelService.createTemplate();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=template-chuyen-vien.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelContent);
    }

    @PostMapping("/excel/preview")
    @Operation(summary = "Xem trước dữ liệu từ file Excel")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ExcelImportPreviewDTO>> previewExcel(
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(ApiResponse.success(excelService.previewExcel(file)));
    }

    @PostMapping("/excel/import")
    @Operation(summary = "Nhập dữ liệu từ Excel")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<Void>> importExcel(@RequestBody List<ChuyenVienDTO> dtos) {
        chuyenVienService.importFromExcel(dtos);
        return ResponseEntity.ok(ApiResponse.success("Nhập dữ liệu thành công", null));
    }

    @GetMapping("/excel/export")
    @Operation(summary = "Xuất danh sách chuyên viên ra Excel")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<byte[]> exportExcel() throws Exception {
        List<ChuyenVienDTO> list = chuyenVienService.getAll();
        byte[] excelContent = excelService.exportToExcel(list);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=danh-sach-chuyen-vien.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelContent);
    }

    // ========== STANDARD CRUD ==========
    @GetMapping("/statistics")
    @Operation(summary = "Lấy thống kê chuyên viên")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        log.info("GET /api/chuyenvien/statistics");
        Map<String, Object> stats = chuyenVienService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{maChuyenVien}")
    @Operation(summary = "Lấy chi tiết chuyên viên")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> getById(@PathVariable String maChuyenVien) {
        log.info("GET /api/chuyenvien/{}", maChuyenVien);
        ChuyenVienDTO dto = chuyenVienService.getById(maChuyenVien);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo chuyên viên mới")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> create(@RequestBody ChuyenVienDTO dto) {
        log.info("POST /api/chuyenvien: {}", dto.getMaChuyenVien());
        ChuyenVienDTO created = chuyenVienService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyên viên thành công", created));
    }

    @PutMapping("/{maChuyenVien}")
    @Operation(summary = "Cập nhật chuyên viên")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> update(
            @PathVariable String maChuyenVien,
            @RequestBody ChuyenVienDTO dto) {
        log.info("PUT /api/chuyenvien/{}", maChuyenVien);
        ChuyenVienDTO updated = chuyenVienService.update(maChuyenVien, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maChuyenVien}")
    @Operation(summary = "Xóa chuyên viên (soft delete)")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maChuyenVien) {
        log.info("DELETE /api/chuyenvien/{}", maChuyenVien);
        chuyenVienService.delete(maChuyenVien);
        return ResponseEntity.ok(ApiResponse.success("Xóa chuyên viên thành công", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm chuyên viên")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> search(@RequestParam String keyword) {
        log.info("GET /api/chuyenvien/search?keyword={}", keyword);
        List<ChuyenVienDTO> list = chuyenVienService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/khoa/{maKhoa}")
    @Operation(summary = "Lọc chuyên viên theo khoa")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> getByKhoa(@PathVariable String maKhoa) {
        log.info("GET /api/chuyenvien/khoa/{}", maKhoa);
        List<ChuyenVienDTO> list = chuyenVienService.getByKhoa(maKhoa);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/count")
    @Operation(summary = "Đếm số chuyên viên active")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<Long>> getCount() {
        log.info("GET /api/chuyenvien/count");
        long count = chuyenVienService.getTotalActive();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

}
