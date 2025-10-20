package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Enum.*;
import com.tathanhloc.faceattendance.Service.HoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * REST API Controller cho quản lý Hoạt động Đoàn - Hội
 */
@RestController
@RequestMapping("/api/hoat-dong")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Hoạt Động", description = "API quản lý hoạt động Đoàn - Hội")
public class HoatDongController {

    private final HoatDongService hoatDongService;

    // ========== CRUD ENDPOINTS ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả hoạt động")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getAll() {
        log.info("GET /api/hoat-dong - Get all activities");
        List<HoatDongDTO> activities = hoatDongService.getAll();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/page")
    @Operation(summary = "Lấy hoạt động có phân trang")
    public ResponseEntity<PageResponse<HoatDongDTO>> getAllWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ngayToChuc") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("GET /api/hoat-dong/page - page={}, size={}", page, size);
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<HoatDongDTO> result = hoatDongService.getAllWithPagination(pageable);
        return ResponseEntity.ok(PageResponse.of(result));
    }

    @GetMapping("/{maHoatDong}")
    @Operation(summary = "Lấy chi tiết hoạt động")
    public ResponseEntity<ApiResponse<HoatDongDTO>> getById(@PathVariable String maHoatDong) {
        log.info("GET /api/hoat-dong/{} - Get activity details", maHoatDong);
        HoatDongDTO activity = hoatDongService.getById(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @PostMapping
    @Operation(summary = "Tạo hoạt động mới")
    public ResponseEntity<ApiResponse<HoatDongDTO>> create(@RequestBody HoatDongDTO dto) {
        log.info("POST /api/hoat-dong - Create new activity: {}", dto.getMaHoatDong());
        HoatDongDTO created = hoatDongService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hoạt động thành công", created));
    }

    @PutMapping("/{maHoatDong}")
    @Operation(summary = "Cập nhật hoạt động")
    public ResponseEntity<ApiResponse<HoatDongDTO>> update(
            @PathVariable String maHoatDong,
            @RequestBody HoatDongDTO dto) {
        log.info("PUT /api/hoat-dong/{} - Update activity", maHoatDong);
        HoatDongDTO updated = hoatDongService.update(maHoatDong, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/{maHoatDong}")
    @Operation(summary = "Xóa hoạt động (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maHoatDong) {
        log.info("DELETE /api/hoat-dong/{} - Soft delete activity", maHoatDong);
        hoatDongService.delete(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Xóa hoạt động thành công", null));
    }

    // ========== FILTER ENDPOINTS ==========

    @GetMapping("/trang-thai/{trangThai}")
    @Operation(summary = "Lọc theo trạng thái")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByTrangThai(
            @PathVariable String trangThai) {
        log.info("GET /api/hoat-dong/trang-thai/{}", trangThai);
        TrangThaiHoatDongEnum status = TrangThaiHoatDongEnum.valueOf(trangThai);
        List<HoatDongDTO> activities = hoatDongService.getByTrangThai(status);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/loai/{loaiHoatDong}")
    @Operation(summary = "Lọc theo loại hoạt động")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByLoai(
            @PathVariable String loaiHoatDong) {
        log.info("GET /api/hoat-dong/loai/{}", loaiHoatDong);
        LoaiHoatDongEnum type = LoaiHoatDongEnum.valueOf(loaiHoatDong);
        List<HoatDongDTO> activities = hoatDongService.getByLoaiHoatDong(type);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/cap-do/{capDo}")
    @Operation(summary = "Lọc theo cấp độ")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByCapDo(
            @PathVariable String capDo) {
        log.info("GET /api/hoat-dong/cap-do/{}", capDo);
        CapDoEnum level = CapDoEnum.valueOf(capDo);
        List<HoatDongDTO> activities = hoatDongService.getByCapDo(level);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Lấy hoạt động sắp diễn ra")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getUpcoming() {
        log.info("GET /api/hoat-dong/upcoming");
        List<HoatDongDTO> activities = hoatDongService.getUpcomingActivities();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/ongoing")
    @Operation(summary = "Lấy hoạt động đang diễn ra")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getOngoing() {
        log.info("GET /api/hoat-dong/ongoing");
        List<HoatDongDTO> activities = hoatDongService.getOngoingActivities();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm hoạt động")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/hoat-dong/search?keyword={}", keyword);
        List<HoatDongDTO> activities = hoatDongService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Lọc theo khoảng thời gian")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("GET /api/hoat-dong/date-range?start={}&end={}", startDate, endDate);
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<HoatDongDTO> activities = hoatDongService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    // ========== ACTION ENDPOINTS ==========

    @PostMapping("/{maHoatDong}/open-registration")
    @Operation(summary = "Mở đăng ký hoạt động")
    public ResponseEntity<ApiResponse<Void>> openRegistration(@PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/open-registration", maHoatDong);
        hoatDongService.openRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã mở đăng ký", null));
    }

    @PostMapping("/{maHoatDong}/close-registration")
    @Operation(summary = "Đóng đăng ký hoạt động")
    public ResponseEntity<ApiResponse<Void>> closeRegistration(@PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/close-registration", maHoatDong);
        hoatDongService.closeRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã đóng đăng ký", null));
    }

    @PostMapping("/{maHoatDong}/start")
    @Operation(summary = "Bắt đầu hoạt động")
    public ResponseEntity<ApiResponse<Void>> startActivity(@PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/start", maHoatDong);
        hoatDongService.startActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã bắt đầu hoạt động", null));
    }

    @PostMapping("/{maHoatDong}/complete")
    @Operation(summary = "Hoàn thành hoạt động")
    public ResponseEntity<ApiResponse<Void>> completeActivity(@PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/complete", maHoatDong);
        hoatDongService.completeActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành hoạt động", null));
    }

    @PostMapping("/{maHoatDong}/cancel")
    @Operation(summary = "Hủy hoạt động")
    public ResponseEntity<ApiResponse<Void>> cancelActivity(
            @PathVariable String maHoatDong,
            @RequestParam String lyDo) {
        log.info("POST /api/hoat-dong/{}/cancel - Reason: {}", maHoatDong, lyDo);
        hoatDongService.cancelActivity(maHoatDong, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy hoạt động", null));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/{maHoatDong}/statistics")
    @Operation(summary = "Thống kê hoạt động")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @PathVariable String maHoatDong) {
        log.info("GET /api/hoat-dong/{}/statistics", maHoatDong);
        Map<String, Object> stats = hoatDongService.getActivityStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/by-status")
    @Operation(summary = "Thống kê theo trạng thái")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatisticsByStatus() {
        log.info("GET /api/hoat-dong/statistics/by-status");
        Map<String, Long> stats = hoatDongService.getStatisticsByStatus();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ========== ERROR HANDLING ==========

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in HoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}