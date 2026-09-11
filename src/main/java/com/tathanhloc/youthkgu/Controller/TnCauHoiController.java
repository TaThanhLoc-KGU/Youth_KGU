package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TnCauHoiDTO;
import com.tathanhloc.youthkgu.DTO.TnCauHoiRequest;
import com.tathanhloc.youthkgu.Model.TnDanhMuc;
import com.tathanhloc.youthkgu.Repository.TnDanhMucRepository;
import com.tathanhloc.youthkgu.Service.TnCauHoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Ngân hàng câu hỏi trắc nghiệm (Admin/cán bộ). */
@RestController
@RequestMapping("/api/tn/cau-hoi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TN — Ngân hàng câu hỏi")
@PreAuthorize("hasPermission(null, 'THI_TN_QUAN_LY_CAU_HOI')")
public class TnCauHoiController {

    private final TnCauHoiService service;
    private final TnDanhMucRepository danhMucRepo;

    @GetMapping
    @Operation(summary = "Tìm/lọc câu hỏi")
    public ResponseEntity<ApiResponse<Page<TnCauHoiDTO>>> search(
            @RequestParam(required = false) Long danhMucId,
            @RequestParam(required = false) String doKho,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.search(danhMucId, doKho, kw, PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TnCauHoiDTO>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Thêm câu hỏi")
    public ResponseEntity<ApiResponse<TnCauHoiDTO>> create(
            @RequestBody TnCauHoiRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Đã thêm câu hỏi",
                service.create(req, auth.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TnCauHoiDTO>> update(
            @PathVariable Long id, @RequestBody TnCauHoiRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật", service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Ẩn câu hỏi (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã ẩn câu hỏi", null));
    }

    // --- danh mục ---
    @GetMapping("/danh-muc")
    public ResponseEntity<ApiResponse<List<TnDanhMuc>>> danhMuc() {
        return ResponseEntity.ok(ApiResponse.success(danhMucRepo.findByIsActiveTrueOrderByTenAsc()));
    }

    @PostMapping("/danh-muc")
    public ResponseEntity<ApiResponse<TnDanhMuc>> createDanhMuc(@RequestBody TnDanhMuc dm, Authentication auth) {
        dm.setId(null);
        dm.setIsActive(true);
        dm.setCreatedBy(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(danhMucRepo.save(dm)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.warn("TnCauHoiController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }
}
