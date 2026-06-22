package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.BanChuNhiemCLBDTO;
import com.tathanhloc.youthkgu.Service.BanChuNhiemCLBService;
import com.tathanhloc.youthkgu.Service.NguoiTimKiemBCNService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clb/{maClb}/bcn")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Ban Chủ Nhiệm CLB", description = "Quản lý Ban Chủ Nhiệm CLB theo nhiệm kỳ")
public class BanChuNhiemCLBController {

    private final BanChuNhiemCLBService   bcnService;
    private final NguoiTimKiemBCNService  searchService;

    @GetMapping
    @Operation(summary = "Lấy danh sách BCN của CLB (có thể lọc theo nhiệm kỳ hoặc trạng thái)")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB') or hasPermission(null, 'XEM_CLB')")
    public ResponseEntity<ApiResponse<List<BanChuNhiemCLBDTO>>> getByClb(
            @PathVariable String maClb,
            @RequestParam(required = false) String nhiemKy,
            @RequestParam(required = false) String trangThai) {
        log.info("GET /api/clb/{}/bcn nhiemKy={} trangThai={}", maClb, nhiemKy, trangThai);
        return ResponseEntity.ok(ApiResponse.success(bcnService.getByClb(maClb, nhiemKy, trangThai)));
    }

    @GetMapping("/nhiem-ky")
    @Operation(summary = "Lấy danh sách các nhiệm kỳ đã có của CLB")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB') or hasPermission(null, 'XEM_CLB')")
    public ResponseEntity<ApiResponse<List<String>>> getNhiemKyList(@PathVariable String maClb) {
        log.info("GET /api/clb/{}/bcn/nhiem-ky", maClb);
        return ResponseEntity.ok(ApiResponse.success(bcnService.getNhiemKyList(maClb)));
    }

    @PostMapping
    @Operation(summary = "Thêm nhân sự vào BCN CLB")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<BanChuNhiemCLBDTO>> add(
            @PathVariable String maClb,
            @RequestBody BanChuNhiemCLBDTO dto) {
        log.info("POST /api/clb/{}/bcn maSv={} chucVu={} nhiemKy={}", maClb, dto.getMaSv(), dto.getChucVu(), dto.getNhiemKy());
        return ResponseEntity.ok(ApiResponse.success("Thêm BCN thành công", bcnService.add(maClb, dto)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin BCN")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<BanChuNhiemCLBDTO>> update(
            @PathVariable String maClb,
            @PathVariable Long id,
            @RequestBody BanChuNhiemCLBDTO dto) {
        log.info("PUT /api/clb/{}/bcn/{}", maClb, id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật BCN thành công", bcnService.update(maClb, id, dto)));
    }

    @PutMapping("/{id}/thoi-chuc")
    @Operation(summary = "Đánh dấu nhân sự BCN đã thôi chức")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<BanChuNhiemCLBDTO>> thoiChuc(
            @PathVariable String maClb,
            @PathVariable Long id) {
        log.info("PUT /api/clb/{}/bcn/{}/thoi-chuc", maClb, id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thôi chức", bcnService.thoiChuc(maClb, id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa nhân sự BCN")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable String maClb,
            @PathVariable Long id) {
        log.info("DELETE /api/clb/{}/bcn/{}", maClb, id);
        bcnService.remove(maClb, id);
        return ResponseEntity.ok(ApiResponse.success("Xóa BCN thành công", null));
    }

    /** Tìm kiếm SV / GV / CV để thêm vào BCN */
    @GetMapping("/search-nguoi")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchNguoi(
            @PathVariable String maClb,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "SV") String loai) {
        log.info("GET /api/clb/{}/bcn/search-nguoi loai={} kw={}", maClb, loai, keyword);
        return ResponseEntity.ok(ApiResponse.success(searchService.search(keyword, loai)));
    }

    /** Import Excel danh sách BCN */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'QUAN_LY_BCN_CLB')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importExcel(
            @PathVariable String maClb,
            @RequestParam("file") MultipartFile file,
            @RequestParam String nhiemKy) {
        log.info("POST /api/clb/{}/bcn/import nhiemKy={} file={}", maClb, nhiemKy, file.getOriginalFilename());
        Map<String, Object> result = bcnService.importFromExcel(maClb, file, nhiemKy);
        return ResponseEntity.ok(ApiResponse.success("Import hoàn tất", result));
    }
}
