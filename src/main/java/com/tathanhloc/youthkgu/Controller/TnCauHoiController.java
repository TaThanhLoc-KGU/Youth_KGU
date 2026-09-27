package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.youthkgu.DTO.TnCauHoiDTO;
import com.tathanhloc.youthkgu.DTO.TnCauHoiRequest;
import com.tathanhloc.youthkgu.Model.TnDanhMuc;
import com.tathanhloc.youthkgu.Repository.TnDanhMucRepository;
import com.tathanhloc.youthkgu.Service.TnCauHoiExcelService;
import com.tathanhloc.youthkgu.Service.TnCauHoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
    private final TnCauHoiExcelService excelService;

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

    // ==================== Nhập hàng loạt từ Excel ====================

    @GetMapping("/import/template")
    @Operation(summary = "Tải file mẫu nhập câu hỏi bằng Excel")
    public ResponseEntity<ByteArrayResource> downloadTemplate() throws Exception {
        byte[] bytes = excelService.createTemplate();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("mau_nhap_cau_hoi.xlsx").build().toString())
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/import/preview")
    @Operation(summary = "Xem trước danh sách câu hỏi trước khi nhập từ Excel")
    public ResponseEntity<ApiResponse<ExcelImportPreviewDTO>> previewImport(
            @RequestParam("file") MultipartFile file) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        return ResponseEntity.ok(ApiResponse.success(excelService.preview(file)));
    }

    @PostMapping("/import/confirm")
    @Operation(summary = "Xác nhận nhập câu hỏi từ Excel (chỉ nhập các dòng hợp lệ)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmImport(
            @RequestParam("file") MultipartFile file, Authentication auth) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        ExcelImportPreviewDTO preview = excelService.preview(file);
        @SuppressWarnings("unchecked")
        List<TnCauHoiRequest> valid = (List<TnCauHoiRequest>) (List<?>) preview.getValidData();
        int created = excelService.commit(valid, service, auth.getName());
        log.info("Nhập câu hỏi TN từ Excel: {} câu thành công, {} dòng lỗi, bởi {}",
                created, preview.getErrorRows(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã nhập " + created + " câu hỏi",
                Map.of("created", created, "errorRows", preview.getErrorRows())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.warn("TnCauHoiController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }
}
