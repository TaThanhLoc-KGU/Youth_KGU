package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.ThongKeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Thống kê nâng cao — 4 cụm số liệu, tự động scope theo khoa của người dùng.
 */
@RestController
@RequestMapping("/api/thong-ke")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Thống Kê Nâng Cao", description = "Cụm thống kê Hoạt động / Điểm danh / Điểm rèn luyện / CLB & Tài khoản")
public class ThongKeNangCaoController {

    private final ThongKeService thongKeService;

    @GetMapping("/tong-hop")
    @Operation(summary = "Thống kê tổng hợp 4 cụm")
    @PreAuthorize("hasPermission(null, 'XEM_THONG_KE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTongHop() {
        log.info("GET /api/thong-ke/tong-hop");
        return ResponseEntity.ok(ApiResponse.success(thongKeService.getTongHop()));
    }
}
