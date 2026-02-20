package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.SystemLogDTO;
import com.tathanhloc.faceattendance.Service.SystemLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Nhật ký hệ thống", description = "API xem nhật ký thao tác người dùng")
public class SystemLogController {

    private final SystemLogService logService;

    /**
     * Lấy danh sách nhật ký (mặc định 100 bản ghi mới nhất).
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách nhật ký thao tác")
    public ResponseEntity<ApiResponse<List<SystemLogDTO>>> getAllLogs(
            @RequestParam(defaultValue = "0")          int    page,
            @RequestParam(defaultValue = "100")        int    size,
            @RequestParam(defaultValue = "createdAt")  String sortBy,
            @RequestParam(defaultValue = "desc")       String sortDir) {

        log.info("GET /api/logs");
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SystemLogDTO> result = logService.getAllLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * Lấy chi tiết một nhật ký.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết nhật ký")
    public ResponseEntity<ApiResponse<SystemLogDTO>> getLogById(@PathVariable Long id) {
        log.info("GET /api/logs/{}", id);
        SystemLogDTO dto = logService.getLogById(id);
        if (dto != null) return ResponseEntity.ok(ApiResponse.success(dto));
        return ResponseEntity.ok(ApiResponse.error("Không tìm thấy nhật ký"));
    }

    /**
     * Tìm kiếm / lọc nhật ký theo module, loại thao tác, người dùng, thời gian, từ khóa.
     */
    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm nhật ký")
    public ResponseEntity<ApiResponse<List<SystemLogDTO>>> searchLogs(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")         int    page,
            @RequestParam(defaultValue = "100")       int    size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir) {

        log.info("GET /api/logs/search - module={}, action={}, keyword={}", module, action, keyword);
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SystemLogDTO> result = logService.searchLogs(module, action, userId,
                startTime, endTime, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * Thống kê nhật ký: tổng số, hôm nay, tuần này, top module, top người dùng.
     */
    @GetMapping("/statistics")
    @Operation(summary = "Thống kê nhật ký")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLogStatistics() {
        log.info("GET /api/logs/statistics");
        return ResponseEntity.ok(ApiResponse.success(logService.getLogStatistics()));
    }

    /**
     * Xóa nhật ký cũ.
     */
    @DeleteMapping("/cleanup")
    @Operation(summary = "Xóa nhật ký cũ")
    public ResponseEntity<ApiResponse<Void>> cleanupOldLogs(
            @RequestParam(defaultValue = "30") int daysToKeep) {
        log.info("DELETE /api/logs/cleanup - daysToKeep={}", daysToKeep);
        logService.cleanupOldLogs(daysToKeep);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã xóa nhật ký cũ hơn " + daysToKeep + " ngày", null));
    }

    /**
     * Danh sách modules hệ thống.
     */
    @GetMapping("/modules")
    @Operation(summary = "Danh sách modules")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableModules() {
        List<String> modules = List.of(
                "AUTHENTICATION", "HOAT_DONG", "SINH_VIEN", "TAI_KHOAN",
                "GIANG_VIEN", "DIEM_DANH", "CHUC_VU", "BCH", "BAN",
                "KHOA", "LOP", "NGANH", "KHOA_HOC", "CHUYEN_VIEN",
                "PHAN_CONG", "DANG_KY", "CHUNG_NHAN", "SETTINGS", "SYSTEM"
        );
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    /**
     * Danh sách loại thao tác.
     */
    @GetMapping("/actions")
    @Operation(summary = "Danh sách loại thao tác")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableActions() {
        List<String> actions = List.of(
                "CREATE", "UPDATE", "DELETE", "LOGIN_SUCCESS", "LOGIN_FAILED"
        );
        return ResponseEntity.ok(ApiResponse.success(actions));
    }
}
