package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.ChucVuDTO;
import com.tathanhloc.faceattendance.Service.ChucVuService;
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
@RequestMapping("/api/chuc-vu")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chức vụ", description = "API quản lý chức vụ BCH")
public class ChucVuController {

    private final ChucVuService chucVuService;

    @GetMapping
    @Operation(summary = "Lấy tất cả chức vụ")
    public ResponseEntity<ApiResponse<List<ChucVuDTO>>> getAll() {
        log.info("GET /api/chuc-vu");
        List<ChucVuDTO> list = chucVuService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{maChucVu}")
    @Operation(summary = "Lấy chi tiết chức vụ")
    public ResponseEntity<ApiResponse<ChucVuDTO>> getById(@PathVariable String maChucVu) {
        log.info("GET /api/chuc-vu/{}", maChucVu);
        ChucVuDTO dto = chucVuService.getById(maChucVu);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo chức vụ mới")
    public ResponseEntity<ApiResponse<ChucVuDTO>> create(@RequestBody ChucVuDTO dto) {
        log.info("POST /api/chuc-vu: {}", dto.getMaChucVu());
        ChucVuDTO created = chucVuService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chức vụ thành công", created));
    }

    @PutMapping("/{maChucVu}")
    @Operation(summary = "Cập nhật chức vụ")
    public ResponseEntity<ApiResponse<ChucVuDTO>> update(
            @PathVariable String maChucVu,
            @RequestBody ChucVuDTO dto) {
        log.info("PUT /api/chuc-vu/{}", maChucVu);
        ChucVuDTO updated = chucVuService.update(maChucVu, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maChucVu}")
    @Operation(summary = "Xóa chức vụ (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maChucVu) {
        log.info("DELETE /api/chuc-vu/{}", maChucVu);
        chucVuService.delete(maChucVu);
        return ResponseEntity.ok(ApiResponse.success("Xóa chức vụ thành công", null));
    }

    @GetMapping("/thuoc-ban/{thuocBan}")
    @Operation(summary = "Lọc chức vụ theo thuộc ban")
    public ResponseEntity<ApiResponse<List<ChucVuDTO>>> getByThuocBan(
            @PathVariable String thuocBan) {
        log.info("GET /api/chuc-vu/thuoc-ban/{}", thuocBan);
        List<ChucVuDTO> list = chucVuService.getByThuocBan(thuocBan);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê chức vụ")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatistics() {
        log.info("GET /api/chuc-vu/statistics");
        Map<String, Long> stats = chucVuService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}