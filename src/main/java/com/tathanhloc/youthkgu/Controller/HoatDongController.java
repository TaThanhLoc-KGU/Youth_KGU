package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Service.HoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getAll() {
        log.info("GET /api/hoat-dong - Get all activities");
        List<HoatDongDTO> activities = hoatDongService.getAll();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/page")
    @Operation(summary = "Lấy hoạt động có phân trang")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
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

    @GetMapping("/detail")
    @Operation(summary = "Lấy chi tiết hoạt động theo mã (dùng ?ma= để tránh lỗi %2F trong path)")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> getById(@RequestParam String ma) {
        log.info("GET /api/hoat-dong/detail?ma={}", ma);
        HoatDongDTO activity = hoatDongService.getById(ma);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @PostMapping
    @Operation(summary = "Tạo hoạt động mới")
    @PreAuthorize("hasPermission(null, 'TAO_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> create(@Valid @RequestBody HoatDongDTO dto) {
        // Validate logic nghiệp vụ: Thời gian kết thúc phải sau thời gian bắt đầu
        if (dto.getThoiGianBatDau() != null && dto.getThoiGianKetThuc() != null) {
            if (dto.getThoiGianKetThuc().isBefore(dto.getThoiGianBatDau())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Thời gian kết thúc không được trước thời gian bắt đầu"));
            }
        }

        log.info("POST /api/hoat-dong - Create new activity: {}", dto.getMaHoatDong());
        HoatDongDTO created = hoatDongService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hoạt động thành công", created));
    }

    @PutMapping("/update")
    @Operation(summary = "Cập nhật hoạt động (dùng ?ma= để tránh lỗi %2F trong path)")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> update(
            @RequestParam String ma,
            @Valid @RequestBody HoatDongDTO dto) {
        String maHoatDong = ma;
        
        // Validate logic nghiệp vụ
        if (dto.getThoiGianBatDau() != null && dto.getThoiGianKetThuc() != null) {
            if (dto.getThoiGianKetThuc().isBefore(dto.getThoiGianBatDau())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Thời gian kết thúc không được trước thời gian bắt đầu"));
            }
        }

        log.info("PUT /api/hoat-dong/{} - Update activity", maHoatDong);
        HoatDongDTO updated = hoatDongService.update(maHoatDong, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/delete")
    @Operation(summary = "Xóa hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XOA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> delete(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("DELETE /api/hoat-dong/delete?ma={}", maHoatDong);
        hoatDongService.delete(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Xóa hoạt động thành công", null));
    }

    // ========== FILTER ENDPOINTS ==========

    @GetMapping("/trang-thai/{trangThai}")
    @Operation(summary = "Lọc theo trạng thái")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByTrangThai(
            @PathVariable String trangThai) {
        log.info("GET /api/hoat-dong/trang-thai/{}", trangThai);
        TrangThaiHoatDongEnum status = TrangThaiHoatDongEnum.valueOf(trangThai);
        List<HoatDongDTO> activities = hoatDongService.getByTrangThai(status);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/loai/{loaiHoatDong}")
    @Operation(summary = "Lọc theo loại hoạt động")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByLoai(
            @PathVariable String loaiHoatDong) {
        log.info("GET /api/hoat-dong/loai/{}", loaiHoatDong);
        LoaiHoatDongEnum type = LoaiHoatDongEnum.valueOf(loaiHoatDong);
        List<HoatDongDTO> activities = hoatDongService.getByLoaiHoatDong(type);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/cap-do/{capDo}")
    @Operation(summary = "Lọc theo cấp độ")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByCapDo(
            @PathVariable String capDo) {
        log.info("GET /api/hoat-dong/cap-do/{}", capDo);
        CapDoEnum level = CapDoEnum.valueOf(capDo);
        List<HoatDongDTO> activities = hoatDongService.getByCapDo(level);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Lấy hoạt động sắp diễn ra")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getUpcoming() {
        log.info("GET /api/hoat-dong/upcoming");
        List<HoatDongDTO> activities = hoatDongService.getUpcomingActivities();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/ongoing")
    @Operation(summary = "Lấy hoạt động đang diễn ra")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getOngoing() {
        log.info("GET /api/hoat-dong/ongoing");
        List<HoatDongDTO> activities = hoatDongService.getOngoingActivities();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm hoạt động")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/hoat-dong/search?keyword={}", keyword);
        List<HoatDongDTO> activities = hoatDongService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Lọc theo khoảng thời gian")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/hoat-dong/date-range?start={}&end={}", startDate, endDate);
        List<HoatDongDTO> activities = hoatDongService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    // ========== ACTION ENDPOINTS ==========

    @PostMapping("/open-registration")
    @Operation(summary = "Mở đăng ký hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> openRegistration(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/open-registration?ma={}", maHoatDong);
        hoatDongService.openRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã mở đăng ký", null));
    }

    @PostMapping("/close-registration")
    @Operation(summary = "Đóng đăng ký hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> closeRegistration(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/close-registration?ma={}", maHoatDong);
        hoatDongService.closeRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã đóng đăng ký", null));
    }

    @PostMapping("/start")
    @Operation(summary = "Bắt đầu hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> startActivity(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/start?ma={}", maHoatDong);
        hoatDongService.startActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã bắt đầu hoạt động", null));
    }

    @PostMapping("/revert-start")
    @Operation(summary = "Hoàn tác lệnh Bắt đầu (chỉ khi chưa có ai check-in) — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> revertActivityStart(@RequestParam String ma) {
        log.info("POST /api/hoat-dong/revert-start?ma={}", ma);
        hoatDongService.revertActivityStart(ma);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn tác — hoạt động quay lại trạng thái trước", null));
    }

    @PostMapping("/complete")
    @Operation(summary = "Hoàn thành hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> completeActivity(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/complete?ma={}", maHoatDong);
        hoatDongService.completeActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành hoạt động", null));
    }

    @PostMapping("/ket-thuc-som")
    @Operation(summary = "Kết thúc sớm hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> earlyTerminate(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/ket-thuc-som?ma={}", maHoatDong);
        HoatDongDTO updated = hoatDongService.earlyTerminate(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã kết thúc sớm hoạt động", updated));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Hủy hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XOA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> cancelActivity(
            @RequestParam String ma,
            @RequestParam String lyDo) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/cancel?ma={} - Reason: {}", maHoatDong, lyDo);
        hoatDongService.cancelActivity(maHoatDong, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy hoạt động", null));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/detail")
    @Operation(summary = "Thống kê hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @RequestParam String ma) {
        String maHoatDong = ma;
        log.info("GET /api/hoat-dong/statistics/detail?ma={}", maHoatDong);
        Map<String, Object> stats = hoatDongService.getActivityStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/by-status")
    @Operation(summary = "Thống kê theo trạng thái")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatisticsByStatus() {
        log.info("GET /api/hoat-dong/statistics/by-status");
        Map<String, Long> stats = hoatDongService.getStatisticsByStatus();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/attendance-status")
    @Operation(summary = "Lấy danh sách trạng thái điểm danh — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<DiemDanhStatusDTO>>> getAttendanceStatusList(
            @RequestParam String ma) {
        String maHoatDong = ma;
        log.info("GET /api/hoat-dong/attendance-status?ma={}", maHoatDong);
        List<DiemDanhStatusDTO> list = hoatDongService.getAttendanceStatusList(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/academic-info")
    @Operation(summary = "Lấy thông tin học kỳ và năm học hiện tại")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentAcademicInfo() {
        log.info("GET /api/hoat-dong/academic-info");
        Map<String, Object> info = hoatDongService.getCurrentAcademicInfo();
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    // ========== ERROR HANDLING ==========

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public void rethrowAccessDenied(org.springframework.security.access.AccessDeniedException e)
            throws org.springframework.security.access.AccessDeniedException {
        throw e;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in HoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
