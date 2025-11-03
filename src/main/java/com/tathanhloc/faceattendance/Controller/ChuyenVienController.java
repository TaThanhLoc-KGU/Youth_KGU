package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.ChuyenVienDTO;
import com.tathanhloc.faceattendance.Service.ChuyenVienService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chuyenvien")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chuyên viên", description = "API quản lý chuyên viên")
public class ChuyenVienController {

    private final ChuyenVienService chuyenVienService;

    @GetMapping
    @Operation(summary = "Lấy tất cả chuyên viên")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> getAll() {
        log.info("GET /api/chuyenvien");
        List<ChuyenVienDTO> list = chuyenVienService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{maChuyenVien}")
    @Operation(summary = "Lấy chi tiết chuyên viên")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> getById(@PathVariable String maChuyenVien) {
        log.info("GET /api/chuyenvien/{}", maChuyenVien);
        ChuyenVienDTO dto = chuyenVienService.getById(maChuyenVien);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo chuyên viên mới")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> create(@RequestBody ChuyenVienDTO dto) {
        log.info("POST /api/chuyenvien: {}", dto.getMaChuyenVien());
        ChuyenVienDTO created = chuyenVienService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chuyên viên thành công", created));
    }

    @PutMapping("/{maChuyenVien}")
    @Operation(summary = "Cập nhật chuyên viên")
    public ResponseEntity<ApiResponse<ChuyenVienDTO>> update(
            @PathVariable String maChuyenVien,
            @RequestBody ChuyenVienDTO dto) {
        log.info("PUT /api/chuyenvien/{}", maChuyenVien);
        ChuyenVienDTO updated = chuyenVienService.update(maChuyenVien, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maChuyenVien}")
    @Operation(summary = "Xóa chuyên viên (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maChuyenVien) {
        log.info("DELETE /api/chuyenvien/{}", maChuyenVien);
        chuyenVienService.delete(maChuyenVien);
        return ResponseEntity.ok(ApiResponse.success("Xóa chuyên viên thành công", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm chuyên viên")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> search(@RequestParam String keyword) {
        log.info("GET /api/chuyenvien/search?keyword={}", keyword);
        List<ChuyenVienDTO> list = chuyenVienService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/khoa/{maKhoa}")
    @Operation(summary = "Lọc chuyên viên theo khoa")
    public ResponseEntity<ApiResponse<List<ChuyenVienDTO>>> getByKhoa(@PathVariable String maKhoa) {
        log.info("GET /api/chuyenvien/khoa/{}", maKhoa);
        List<ChuyenVienDTO> list = chuyenVienService.getByKhoa(maKhoa);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/count")
    @Operation(summary = "Đếm số chuyên viên active")
    public ResponseEntity<ApiResponse<Long>> getCount() {
        log.info("GET /api/chuyenvien/count");
        long count = chuyenVienService.getTotalActive();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}