package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.Service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/baocao")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Báo Cáo", description = "API báo cáo thống kê")
public class BaoCaoController {

    private final StatisticsService statisticsService;

    @GetMapping("/thongke")
    @Operation(summary = "Xem thống kê tổng quan")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGeneralStatistics() {
        log.info("GET /api/baocao/thongke");
        Map<String, Object> stats = statisticsService.getGeneralStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{type}")
    @Operation(summary = "Xem báo cáo chi tiết theo loại")
    @PreAuthorize("hasPermission(null, 'XEM_BAO_CAO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportByType(
            @PathVariable String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        log.info("GET /api/baocao/{}?from={}&to={}", type, from, to);
        Map<String, Object> report = statisticsService.getReportByType(type, from, to);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/xuat/{type}")
    @Operation(summary = "Xuất báo cáo ra file")
    @PreAuthorize("hasPermission(null, 'XUAT_BAO_CAO')")
    public ResponseEntity<ApiResponse<String>> exportReport(
            @PathVariable String type,
            @RequestParam(defaultValue = "excel") String format) {
        log.info("POST /api/baocao/xuat/{}?format={}", type, format);
        // TODO: Implement export logic
        return ResponseEntity.ok(ApiResponse.success("Chức năng xuất báo cáo đang phát triển", null));
    }
}
