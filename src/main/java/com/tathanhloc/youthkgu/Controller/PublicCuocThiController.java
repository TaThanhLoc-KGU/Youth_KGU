package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.CuocThiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/cuoc-thi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public - Cuộc Thi", description = "API public cho trang bình chọn")
public class PublicCuocThiController {

    private final CuocThiService cuocThiService;

    @GetMapping
    @Operation(summary = "Danh sách cuộc thi đang mở")
    public ResponseEntity<ApiResponse<List<CuocThiDTO>>> getDangMo() {
        log.info("Public get active competitions");
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getDangMo()));
    }

    @GetMapping("/tat-ca")
    @Operation(summary = "Tất cả cuộc thi công khai (trừ đã hủy)")
    public ResponseEntity<ApiResponse<List<CuocThiDTO>>> getTatCa() {
        log.info("Public get all competitions");
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getTatCaPublic()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết cuộc thi theo ID")
    public ResponseEntity<ApiResponse<CuocThiDTO>> getById(@PathVariable Long id) {
        log.info("Public get competition id={}", id);
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getById(id, false)));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Chi tiết cuộc thi theo slug")
    public ResponseEntity<ApiResponse<CuocThiDTO>> getBySlug(@PathVariable String slug) {
        log.info("Public get competition slug={}", slug);
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getBySlug(slug, false)));
    }

    @GetMapping("/hoat-dong")
    @Operation(summary = "Cuộc thi gắn với hoạt động")
    public ResponseEntity<ApiResponse<List<CuocThiDTO>>> getByHoatDong(@RequestParam String ma) {
        log.info("Public get competition for hoatDong={}", ma);
        return ResponseEntity.ok(ApiResponse.success(cuocThiService.getByHoatDong(ma)));
    }
}
