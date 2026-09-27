package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.NhapKhoaMoiCommitRequest;
import com.tathanhloc.youthkgu.DTO.NhapKhoaMoiPreviewDTO;
import com.tathanhloc.youthkgu.Repository.KhoaRepository;
import com.tathanhloc.youthkgu.Service.NhapKhoaMoiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * "Nhập khóa mới" — nạp thẳng file export sinh viên tải từ hệ thống nhà trường khi có khóa mới
 * nhập học, tự phát hiện ngành/lớp chưa có để tạo mới (tên lớp = mã lớp), tránh phải chuẩn bị lại
 * file mẫu và tạo tay từng ngành/lớp trước khi import sinh viên như trước.
 */
@RestController
@RequestMapping("/api/nhap-khoa-moi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Nhập khóa mới")
@PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
public class NhapKhoaMoiController {

    private final NhapKhoaMoiService service;
    private final KhoaRepository khoaRepository;

    @PostMapping("/preview")
    @Operation(summary = "Xem trước file export sinh viên: lớp/ngành mới cần tạo, lỗi dữ liệu")
    public ResponseEntity<ApiResponse<NhapKhoaMoiPreviewDTO>> preview(
            @RequestParam("file") MultipartFile file) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        return ResponseEntity.ok(ApiResponse.success(service.preview(file)));
    }

    @PostMapping(value = "/confirm", consumes = "multipart/form-data")
    @Operation(summary = "Xác nhận nhập khóa mới — tạo Khóa học/Ngành/Lớp còn thiếu + Sinh viên")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirm(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "khoaChoNganhMoiJson", required = false) String khoaJson,
            @RequestParam(value = "maNganhChoNganhMoiJson", required = false) String maNganhJson,
            Authentication auth) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        NhapKhoaMoiCommitRequest req = new NhapKhoaMoiCommitRequest();
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        if (khoaJson != null && !khoaJson.isBlank())
            req.setKhoaChoNganhMoi(mapper.readValue(khoaJson, Map.class));
        if (maNganhJson != null && !maNganhJson.isBlank())
            req.setMaNganhChoNganhMoi(mapper.readValue(maNganhJson, Map.class));

        Map<String, Object> result = service.commit(file, req, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã nhập khóa mới thành công", result));
    }

    /** Danh sách khoa để FE hiển thị dropdown gán ngành mới. */
    @GetMapping("/khoa")
    public ResponseEntity<ApiResponse<?>> danhSachKhoa() {
        return ResponseEntity.ok(ApiResponse.success(khoaRepository.findByIsActiveTrue()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handle(Exception e) {
        log.warn("NhapKhoaMoiController: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }
}
