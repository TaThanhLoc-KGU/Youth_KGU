package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.Service.DiemRenLuyenCriteriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API trả về cấu trúc tiêu chí điểm rèn luyện (cố định theo quy chế trường).
 */
@RestController
@RequestMapping("/api/diem-ren-luyen-criteria")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Điểm Rèn Luyện", description = "API tiêu chí điểm rèn luyện theo quy chế trường")
public class DiemRenLuyenCriteriaController {

    private final DiemRenLuyenCriteriaService criteriaService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách tiêu chí điểm rèn luyện")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        log.info("GET /api/diem-ren-luyen-criteria");
        return ResponseEntity.ok(ApiResponse.success(criteriaService.getAllCriteria()));
    }

    @GetMapping("/{danhMucId}")
    @Operation(summary = "Lấy tiêu chí theo mã danh mục (I, II, III...)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getByDanhMuc(
            @PathVariable String danhMucId) {
        log.info("GET /api/diem-ren-luyen-criteria/{}", danhMucId);
        return criteriaService.findDanhMuc(danhMucId)
                .map(dm -> ResponseEntity.ok(ApiResponse.success(dm)))
                .orElse(ResponseEntity.notFound().build());
    }
}
