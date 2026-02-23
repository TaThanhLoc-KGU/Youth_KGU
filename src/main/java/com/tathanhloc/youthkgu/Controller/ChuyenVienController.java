package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ChuyenVienDTO;
import com.tathanhloc.youthkgu.Service.ChuyenVienService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chuyenvien")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chuyên viên", description = "API quản lý chuyên viên")
public class ChuyenVienController {

    private final ChuyenVienService chuyenVienService;

    @GetMapping
    @Operation(summary = "Lấy tất cả chuyên viên")
    @PreAuthorize("hasPermission(null, 'XEM_CHUYEN_VIEN') or hasPermission(null, 'XEM_BCH')")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> getAll() {
        log.info("GET /api/chuyenvien");
        List<ChuyenVienDTO> list = chuyenVienService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

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
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> create(@RequestBody ChuyenVienDTO dto) {
        log.info("POST /api/chuyenvien: {}", dto.getMaChuyenVien());
        ChuyenVienDTO created = chuyenVienService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyên viên thành công", created));
    }

    @PutMapping("/{maChuyenVien}")
    @Operation(summary = "Cập nhật chuyên viên")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_VIEN')")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> update(
            @PathVariable String maChuyenVien,
            @RequestBody ChuyenVienDTO dto) {
        log.info("PUT /api/chuyenvien/{}", maChuyenVien);
        ChuyenVienDTO updated = chuyenVienService.update(maChuyenVien, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maChuyenVien}")
    @Operation(summary = "Xóa chuyên viên (soft delete)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_CHUYEN_VIEN')")
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
