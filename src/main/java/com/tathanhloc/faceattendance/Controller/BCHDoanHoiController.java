package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.BCHChucVuDTO;
import com.tathanhloc.faceattendance.DTO.BCHDoanHoiDTO;
import com.tathanhloc.faceattendance.Service.BCHDoanHoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bch")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "BCH Đoàn - Hội", description = "API quản lý Ban Chấp Hành")
public class BCHDoanHoiController {

    private final BCHDoanHoiService bchService;

    // ========== CRUD BCH ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả BCH")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getAll() {
        log.info("GET /api/bch");
        List<BCHDoanHoiDTO> list = bchService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{maBch}")
    @Operation(summary = "Lấy chi tiết BCH")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> getById(@PathVariable String maBch) {
        log.info("GET /api/bch/{}", maBch);
        BCHDoanHoiDTO dto = bchService.getById(maBch);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo BCH mới (mã tự động: BCHKGU0001)")
    public ResponseEntity<ApiResponse<BCHDoanHoiDTO>> create(@RequestBody BCHDoanHoiDTO dto) {
        log.info("POST /api/bch - Student: {}", dto.getMaSv());
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

    // ========== QUẢN LÝ CHỨC VỤ ==========

    @PostMapping("/{maBch}/chuc-vu")
    @Operation(summary = "Thêm chức vụ cho BCH")
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
    public ResponseEntity<ApiResponse<Void>> removeChucVu(@PathVariable Long id) {
        log.info("DELETE /api/bch/chuc-vu/{}", id);
        bchService.removeChucVu(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chức vụ thành công", null));
    }

    @GetMapping("/{maBch}/chuc-vu")
    @Operation(summary = "Lấy danh sách chức vụ của BCH")
    public ResponseEntity<ApiResponse<List<BCHChucVuDTO>>> getChucVuByBCH(
            @PathVariable String maBch) {
        log.info("GET /api/bch/{}/chuc-vu", maBch);
        List<BCHChucVuDTO> list = bchService.getChucVuByBCH(maBch);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ========== TÌM KIẾM & LỌC ==========

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm BCH theo từ khóa")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/bch/search?keyword={}", keyword);
        List<BCHDoanHoiDTO> list = bchService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/nhiem-ky/{nhiemKy}")
    @Operation(summary = "Lọc BCH theo nhiệm kỳ")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getByNhiemKy(
            @PathVariable String nhiemKy) {
        log.info("GET /api/bch/nhiem-ky/{}", nhiemKy);
        List<BCHDoanHoiDTO> list = bchService.getByNhiemKy(nhiemKy);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/chuc-vu/{maChucVu}/bch")
    @Operation(summary = "Lấy BCH theo chức vụ")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getBCHByChucVu(
            @PathVariable String maChucVu) {
        log.info("GET /api/bch/chuc-vu/{}/bch", maChucVu);
        List<BCHDoanHoiDTO> list = bchService.getBCHByChucVu(maChucVu);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/ban/{maBan}/bch")
    @Operation(summary = "Lấy BCH theo ban")
    public ResponseEntity<ApiResponse<List<BCHDoanHoiDTO>>> getBCHByBan(
            @PathVariable String maBan) {
        log.info("GET /api/bch/ban/{}/bch", maBan);
        List<BCHDoanHoiDTO> list = bchService.getBCHByBan(maBan);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ========== THỐNG KÊ ==========

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê BCH")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        log.info("GET /api/bch/statistics");
        Map<String, Object> stats = bchService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}