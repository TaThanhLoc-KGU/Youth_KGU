package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.BanDTO;
import com.tathanhloc.faceattendance.Service.BanService;
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
@RequestMapping("/api/ban")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Ban/Đội/CLB", description = "API quản lý ban, đội, CLB")
public class BanController {

    private final BanService banService;

    @GetMapping
    @Operation(summary = "Lấy tất cả ban")
    public ResponseEntity<ApiResponse<List<BanDTO>>> getAll() {
        log.info("GET /api/ban");
        List<BanDTO> list = banService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{maBan}")
    @Operation(summary = "Lấy chi tiết ban")
    public ResponseEntity<ApiResponse<BanDTO>> getById(@PathVariable String maBan) {
        log.info("GET /api/ban/{}", maBan);
        BanDTO dto = banService.getById(maBan);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @Operation(summary = "Tạo ban mới")
    public ResponseEntity<ApiResponse<BanDTO>> create(@RequestBody BanDTO dto) {
        log.info("POST /api/ban: {}", dto.getMaBan());
        BanDTO created = banService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo ban thành công", created));
    }

    @PutMapping("/{maBan}")
    @Operation(summary = "Cập nhật ban")
    public ResponseEntity<ApiResponse<BanDTO>> update(
            @PathVariable String maBan,
            @RequestBody BanDTO dto) {
        log.info("PUT /api/ban/{}", maBan);
        BanDTO updated = banService.update(maBan, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maBan}")
    @Operation(summary = "Xóa ban (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maBan) {
        log.info("DELETE /api/ban/{}", maBan);
        banService.delete(maBan);
        return ResponseEntity.ok(ApiResponse.success("Xóa ban thành công", null));
    }

    @GetMapping("/loai-ban/{loaiBan}")
    @Operation(summary = "Lọc ban theo loại ban")
    public ResponseEntity<ApiResponse<List<BanDTO>>> getByLoaiBan(
            @PathVariable String loaiBan) {
        log.info("GET /api/ban/loai-ban/{}", loaiBan);
        List<BanDTO> list = banService.getByLoaiBan(loaiBan);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/khoa/{maKhoa}")
    @Operation(summary = "Lọc ban theo khoa")
    public ResponseEntity<ApiResponse<List<BanDTO>>> getByKhoa(
            @PathVariable String maKhoa) {
        log.info("GET /api/ban/khoa/{}", maKhoa);
        List<BanDTO> list = banService.getByKhoa(maKhoa);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê ban")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatistics() {
        log.info("GET /api/ban/statistics");
        Map<String, Long> stats = banService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}