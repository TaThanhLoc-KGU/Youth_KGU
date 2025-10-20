package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.BCHDoanHoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API Controller cho quản lý Ban Chấp Hành
 */
@RestController
@RequestMapping("/api/bch")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "BCH Đoàn - Hội", description = "API quản lý Ban Chấp Hành")
public class BCHDoanHoiController {

    private final BCHDoanHoiService bchService;

    // ========== CRUD ENDPOINTS ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả BCH")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getAll() {
        log.info("GET /api/bch - Get all BCH members");
        List<BCHDoanHoiDTO> members = bchService.getAll();
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @GetMapping("/{maBch}")
    @Operation(summary = "Lấy chi tiết BCH")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> getById(@PathVariable String maBch) {
        log.info("GET /api/bch/{}", maBch);
        BCHDoanHoiDTO member = bchService.getById(maBch);
        return ResponseEntity.ok(ApiResponse.success(member));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Tìm BCH theo email")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> getByEmail(@PathVariable String email) {
        log.info("GET /api/bch/email/{}", email);
        BCHDoanHoiDTO member = bchService.getByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(member));
    }

    @PostMapping
    @Operation(summary = "Tạo BCH mới")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> create(@RequestBody BCHDoanHoiDTO dto) {
        log.info("POST /api/bch - Create new BCH: {}", dto.getMaBch());
        BCHDoanHoiDTO created = bchService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo BCH thành công", created));
    }

    @PutMapping("/{maBch}")
    @Operation(summary = "Cập nhật BCH")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> update(
            @PathVariable String maBch,
            @RequestBody BCHDoanHoiDTO dto) {
        log.info("PUT /api/bch/{}", maBch);
        BCHDoanHoiDTO updated = bchService.update(maBch, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maBch}")
    @Operation(summary = "Xóa BCH (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maBch) {
        log.info("DELETE /api/bch/{}", maBch);
        bchService.delete(maBch);
        return ResponseEntity.ok(ApiResponse.success("Xóa BCH thành công", null));
    }

    // ========== FILTER ENDPOINTS ==========

    @GetMapping("/chuc-vu/{chucVu}")
    @Operation(summary = "Lọc theo chức vụ")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getByChucVu(
            @PathVariable String chucVu) {
        log.info("GET /api/bch/chuc-vu/{}", chucVu);
        List<BCHDoanHoiDTO> members = bchService.getByChucVu(chucVu);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @GetMapping("/khoa/{maKhoa}")
    @Operation(summary = "Lọc theo khoa")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getByKhoa(
            @PathVariable String maKhoa) {
        log.info("GET /api/bch/khoa/{}", maKhoa);
        List<BCHDoanHoiDTO> members = bchService.getByKhoa(maKhoa);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm BCH")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/bch/search?keyword={}", keyword);
        List<BCHDoanHoiDTO> members = bchService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @GetMapping("/search/advanced")
    @Operation(summary = "Tìm kiếm nâng cao")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> searchAdvanced(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String chucVu,
            @RequestParam(required = false) String maKhoa) {
        log.info("GET /api/bch/search/advanced?keyword={}&chucVu={}&khoa={}",
                keyword, chucVu, maKhoa);
        List<BCHDoanHoiDTO> members = bchService.searchAdvanced(keyword, chucVu, maKhoa);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/by-position")
    @Operation(summary = "Thống kê theo chức vụ")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countByPosition() {
        log.info("GET /api/bch/statistics/by-position");
        Map<String, Long> stats = bchService.countByChucVu();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/by-department")
    @Operation(summary = "Thống kê theo khoa")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> countByDepartment() {
        log.info("GET /api/bch/statistics/by-department");
        List<Map<String, Object>> stats = bchService.countByKhoa();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/total")
    @Operation(summary = "Tổng số BCH hoạt động")
    public ResponseEntity<ApiResponse<Long>> getTotalActive() {
        log.info("GET /api/bch/statistics/total");
        long total = bchService.getTotalActive();
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in BCHDoanHoiController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}