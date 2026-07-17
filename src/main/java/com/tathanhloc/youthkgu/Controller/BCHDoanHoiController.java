package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BCHChucVuDTO;
import com.tathanhloc.youthkgu.DTO.BCHDoanHoiDTO;
import com.tathanhloc.youthkgu.Enum.LoaiThanhVienEnum;
import com.tathanhloc.youthkgu.Service.BCHDoanHoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bch")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "BCH Đoàn - Hội", description = "API quản lý Ban Chấp Hành (Sinh viên, Giảng viên, Chuyên viên)")
public class BCHDoanHoiController {

    private final BCHDoanHoiService bchService;

    // ========== CRUD BCH ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả BCH")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getAll() {
        log.info("GET /api/bch");
        List<BCHDoanHoiDTO> list = bchService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{maBch}")
    @Operation(summary = "Lấy chi tiết BCH")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> getById(@PathVariable String maBch) {
        log.info("GET /api/bch/{}", maBch);
        BCHDoanHoiDTO dto = bchService.getById(maBch);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo BCH mới (mã tự động: BCHKGU0001)")
    @PreAuthorize("hasPermission(null, 'THEM_BCH')")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> create(@RequestBody BCHDoanHoiDTO dto) {
        log.info("POST /api/bch - Type: {}, Member: {}", dto.getLoaiThanhVien(), dto.getMaThanhVien());
        BCHDoanHoiDTO created = bchService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo BCH thành công", created));
    }

    @PutMapping("/{maBch}")
    @Operation(summary = "Cập nhật BCH")
    @PreAuthorize("hasPermission(null, 'SUA_BCH')")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> update(
            @PathVariable String maBch,
            @RequestBody BCHDoanHoiDTO dto) {
        log.info("PUT /api/bch/{}", maBch);
        BCHDoanHoiDTO updated = bchService.update(maBch, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maBch}")
    @Operation(summary = "Xóa BCH (soft delete)")
    @PreAuthorize("hasPermission(null, 'XOA_BCH')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maBch) {
        log.info("DELETE /api/bch/{}", maBch);
        bchService.delete(maBch);
        return ResponseEntity.ok(ApiResponse.success("Xóa BCH thành công", null));
    }

    // ========== QUẢN LÝ CHỨC VỤ ==========

    @PostMapping("/{maBch}/chuc-vu")
    @Operation(summary = "Thêm chức vụ cho BCH")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUC_VU')")
    public ResponseEntity<ApiResponse<BCHChucVuDTO>> addChucVu(
            @PathVariable String maBch,
            @RequestBody BCHChucVuDTO dto) {
        log.info("POST /api/bch/{}/chuc-vu", maBch);
        BCHChucVuDTO created = bchService.addChucVu(maBch, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm chức vụ thành công", created));
    }

    @DeleteMapping("/chuc-vu/{id}")
    @Operation(summary = "Xóa chức vụ của BCH")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUC_VU')")
    public ResponseEntity<ApiResponse<Void>> removeChucVu(@PathVariable Long id) {
        log.info("DELETE /api/bch/chuc-vu/{}", id);
        bchService.removeChucVu(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chức vụ thành công", null));
    }

    @GetMapping("/{maBch}/chuc-vu")
    @Operation(summary = "Lấy danh sách chức vụ của BCH")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHChucVuDTO>>> getChucVuByBCH(
            @PathVariable String maBch) {
        log.info("GET /api/bch/{}/chuc-vu", maBch);
        List<BCHChucVuDTO> list = bchService.getChucVuByBCH(maBch);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ========== TÌM KIẾM & LỌC ==========

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm BCH theo từ khóa")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/bch/search?keyword={}", keyword);
        List<BCHDoanHoiDTO> list = bchService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/loai/{loaiThanhVien}")
    @Operation(summary = "Lọc BCH theo loại thành viên")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getByLoaiThanhVien(
            @PathVariable LoaiThanhVienEnum loaiThanhVien) {
        log.info("GET /api/bch/loai/{}", loaiThanhVien);
        List<BCHDoanHoiDTO> list = bchService.getByLoaiThanhVien(loaiThanhVien);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/nhiem-ky/{nhiemKy}")
    @Operation(summary = "Lọc BCH theo nhiệm kỳ")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getByNhiemKy(
            @PathVariable String nhiemKy) {
        log.info("GET /api/bch/nhiem-ky/{}", nhiemKy);
        List<BCHDoanHoiDTO> list = bchService.getByNhiemKy(nhiemKy);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/chuc-vu/{maChucVu}/bch")
    @Operation(summary = "Lấy BCH theo chức vụ")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getBCHByChucVu(
            @PathVariable String maChucVu) {
        log.info("GET /api/bch/chuc-vu/{}/bch", maChucVu);
        List<BCHDoanHoiDTO> list = bchService.getBCHByChucVu(maChucVu);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/ban/{maBan}/bch")
    @Operation(summary = "Lấy BCH theo ban")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getBCHByBan(
            @PathVariable String maBan) {
        log.info("GET /api/bch/ban/{}/bch", maBan);
        List<BCHDoanHoiDTO> list = bchService.getBCHByBan(maBan);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ========== THỐNG KÊ ==========

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê BCH")
    @PreAuthorize("hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        log.info("GET /api/bch/statistics");
        Map<String, Object> stats = bchService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ========== IMPORT EXCEL ==========

    @PostMapping(value = "/import-excel/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Xem trước danh sách BCH từ file Excel trước khi import")
    @PreAuthorize("hasPermission(null, 'THEM_BCH')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> previewImport(
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("POST /api/bch/import-excel/preview - file: {}", file.getOriginalFilename());
        List<Map<String, Object>> preview = bchService.previewImportExcel(file);
        return ResponseEntity.ok(ApiResponse.success("Đọc file thành công", preview));
    }

    @PostMapping("/import-excel/confirm")
    @Operation(summary = "Xác nhận import danh sách BCH từ preview")
    @PreAuthorize("hasPermission(null, 'THEM_BCH')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmImport(
            @RequestBody List<Map<String, Object>> rows) {
        log.info("POST /api/bch/import-excel/confirm - {} rows", rows.size());
        Map<String, Object> result = bchService.confirmImport(rows);
        return ResponseEntity.ok(ApiResponse.success("Import hoàn tất", result));
    }
}
