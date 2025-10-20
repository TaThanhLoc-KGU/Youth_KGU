package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.ChungNhanHoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * REST API Controller cho quản lý chứng nhận
 */
@RestController
@RequestMapping("/api/chung-nhan")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chứng Nhận", description = "API quản lý chứng nhận hoạt động")
public class ChungNhanHoatDongController {

    private final ChungNhanHoatDongService chungNhanService;

    // ========== CRUD ENDPOINTS ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả chứng nhận")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getAll() {
        log.info("GET /api/chung-nhan - Get all certificates");
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getAll();
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết chứng nhận")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> getById(@PathVariable Long id) {
        log.info("GET /api/chung-nhan/{}", id);
        ChungNhanHoatDongDTO certificate = chungNhanService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    @GetMapping("/code/{maChungNhan}")
    @Operation(summary = "Tìm chứng nhận theo mã")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> getByCode(
            @PathVariable String maChungNhan) {
        log.info("GET /api/chung-nhan/code/{}", maChungNhan);
        ChungNhanHoatDongDTO certificate = chungNhanService.getByMaChungNhan(maChungNhan);
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    // ========== ISSUE ENDPOINTS ==========

    @PostMapping("/issue/auto")
    @Operation(summary = "Cấp chứng nhận tự động")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> issueAuto(
            @RequestParam String maSv,
            @RequestParam String maHoatDong) {
        log.info("POST /api/chung-nhan/issue/auto?maSv={}&maHoatDong={}", maSv, maHoatDong);
        ChungNhanHoatDongDTO certificate = chungNhanService.issueAutomatic(maSv, maHoatDong);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấp chứng nhận thành công", certificate));
    }

    @PostMapping("/issue/manual")
    @Operation(summary = "Cấp chứng nhận thủ công (Admin)")
    public ResponseEntity<ApiResponse<ChungNhanHoatDongDTO>> issueManual(
            @RequestBody ChungNhanHoatDongDTO dto) {
        log.info("POST /api/chung-nhan/issue/manual");
        ChungNhanHoatDongDTO certificate = chungNhanService.issueManual(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấp chứng nhận thành công", certificate));
    }

    @PostMapping("/issue/bulk/{maHoatDong}")
    @Operation(summary = "Cấp hàng loạt chứng nhận")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> issueBulk(
            @PathVariable String maHoatDong) {
        log.info("POST /api/chung-nhan/issue/bulk/{}", maHoatDong);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.issueBulk(maHoatDong);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        String.format("Đã cấp %d chứng nhận", certificates.size()),
                        certificates));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Thu hồi chứng nhận")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @PathVariable Long id,
            @RequestParam String lyDo) {
        log.info("POST /api/chung-nhan/{}/revoke - Reason: {}", id, lyDo);
        chungNhanService.revoke(id, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi chứng nhận thành công", null));
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping("/student/{maSv}")
    @Operation(summary = "Danh sách chứng nhận của sinh viên")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByStudent(
            @PathVariable String maSv) {
        log.info("GET /api/chung-nhan/student/{}", maSv);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByStudent(maSv);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/activity/{maHoatDong}")
    @Operation(summary = "Danh sách chứng nhận theo hoạt động")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByActivity(
            @PathVariable String maHoatDong) {
        log.info("GET /api/chung-nhan/activity/{}", maHoatDong);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Lọc theo khoảng thời gian")
    public ResponseEntity<ApiResponse<List<ChungNhanHoatDongDTO>>> getByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("GET /api/chung-nhan/date-range?start={}&end={}", startDate, endDate);
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<ChungNhanHoatDongDTO> certificates = chungNhanService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in ChungNhanHoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
