package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Security.AccessPolicyService;
import com.tathanhloc.youthkgu.Service.HoatDongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * REST API Controller cho quản lý Hoạt động Đoàn - Hội
 */
@RestController
@RequestMapping("/api/hoat-dong")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Hoạt Động", description = "API quản lý hoạt động Đoàn - Hội")
public class HoatDongController {

    private final HoatDongService hoatDongService;
    private final AccessPolicyService accessPolicy;

    // Việc lọc theo phạm vi khoa/CLB đã chuyển hết vào tầng service (HoatDongService + AccessPolicyService,
    // fail-closed). Không còn resolveKhoaScope()/applyScope() ở controller (fail-open, lọc chồng, phân
    // trang lại trong bộ nhớ).

    // ========== CRUD ENDPOINTS ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả hoạt động")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getAll() {
        log.info("GET /api/hoat-dong - Get all activities");
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getAll()));
    }

    @GetMapping("/page")
    @Operation(summary = "Lấy hoạt động có phân trang")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<PageResponse<HoatDongDTO>> getAllWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ngayToChuc") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("GET /api/hoat-dong/page - page={}, size={}", page, size);
        // Scope (khoa/CLB) do HoatDongService.getAllWithPagination() tự xử lý bằng repo query đã đánh chỉ mục.
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(PageResponse.of(hoatDongService.getAllWithPagination(pageable)));
    }

    @GetMapping("/detail")
    @Operation(summary = "Lấy chi tiết hoạt động theo mã (dùng ?ma= để tránh lỗi %2F trong path)")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> getById(@RequestParam String ma) {
        log.info("GET /api/hoat-dong/detail?ma={}", ma);
        HoatDongDTO activity = hoatDongService.getById(ma);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Tạo hoạt động mới (JSON thuần, không kèm file quyết định)")
    @PreAuthorize("hasPermission(null, 'TAO_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> create(@Valid @RequestBody HoatDongDTO dto) {
        return doCreate(dto, null);
    }

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Tạo hoạt động mới kèm file quyết định (PDF/Word...) đính kèm")
    @PreAuthorize("hasPermission(null, 'TAO_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> createWithFile(
            @RequestPart("data") @Valid HoatDongDTO dto,
            @RequestPart(value = "quyetDinhFile", required = false) org.springframework.web.multipart.MultipartFile quyetDinhFile) {
        return doCreate(dto, quyetDinhFile);
    }

    private ResponseEntity<ApiResponse<HoatDongDTO>> doCreate(
            HoatDongDTO dto, org.springframework.web.multipart.MultipartFile quyetDinhFile) {
        // Validate logic nghiệp vụ: Thời gian kết thúc phải sau thời gian bắt đầu
        if (dto.getThoiGianBatDau() != null && dto.getThoiGianKetThuc() != null) {
            if (dto.getThoiGianKetThuc().isBefore(dto.getThoiGianBatDau())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Thời gian kết thúc không được trước thời gian bắt đầu"));
            }
        }

        log.info("POST /api/hoat-dong - Create new activity: {}", dto.getMaHoatDong());
        HoatDongDTO created = quyetDinhFile != null
                ? hoatDongService.create(dto, quyetDinhFile)
                : hoatDongService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hoạt động thành công", created));
    }

    @PutMapping("/update")
    @Operation(summary = "Cập nhật hoạt động (dùng ?ma= để tránh lỗi %2F trong path)")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> update(
            @RequestParam String ma,
            @Valid @RequestBody HoatDongDTO dto) {
        String maHoatDong = ma;
        
        // Validate logic nghiệp vụ
        if (dto.getThoiGianBatDau() != null && dto.getThoiGianKetThuc() != null) {
            if (dto.getThoiGianKetThuc().isBefore(dto.getThoiGianBatDau())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Thời gian kết thúc không được trước thời gian bắt đầu"));
            }
        }

        log.info("PUT /api/hoat-dong/{} - Update activity", maHoatDong);
        HoatDongDTO updated = hoatDongService.update(maHoatDong, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @DeleteMapping("/delete")
    @Operation(summary = "Xóa hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XOA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> delete(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("DELETE /api/hoat-dong/delete?ma={}", maHoatDong);
        hoatDongService.delete(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Xóa hoạt động thành công", null));
    }

    // ========== FILTER ENDPOINTS ==========

    @GetMapping("/trang-thai/{trangThai}")
    @Operation(summary = "Lọc theo trạng thái")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByTrangThai(
            @PathVariable String trangThai) {
        log.info("GET /api/hoat-dong/trang-thai/{}", trangThai);
        TrangThaiHoatDongEnum status = TrangThaiHoatDongEnum.valueOf(trangThai);
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getByTrangThai(status)));
    }

    @GetMapping("/loai/{loaiHoatDong}")
    @Operation(summary = "Lọc theo loại hoạt động")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByLoai(
            @PathVariable String loaiHoatDong) {
        log.info("GET /api/hoat-dong/loai/{}", loaiHoatDong);
        LoaiHoatDongEnum type = LoaiHoatDongEnum.valueOf(loaiHoatDong);
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getByLoaiHoatDong(type)));
    }

    @GetMapping("/cap-do/{capDo}")
    @Operation(summary = "Lọc theo cấp độ")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByCapDo(
            @PathVariable String capDo) {
        log.info("GET /api/hoat-dong/cap-do/{}", capDo);
        CapDoEnum level = CapDoEnum.valueOf(capDo);
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getByCapDo(level)));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Lấy hoạt động sắp diễn ra")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getUpcoming() {
        log.info("GET /api/hoat-dong/upcoming");
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getUpcomingActivities()));
    }

    @GetMapping("/ongoing")
    @Operation(summary = "Lấy hoạt động đang diễn ra")
    @PreAuthorize("hasRole('ADMIN') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG') or hasPermission(null, 'QUET_QR')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getOngoing() {
        log.info("GET /api/hoat-dong/ongoing");
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getOngoingActivities()));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm hoạt động")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> search(
            @RequestParam String keyword) {
        log.info("GET /api/hoat-dong/search?keyword={}", keyword);
        List<HoatDongDTO> activities = hoatDongService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Lọc theo khoảng thời gian")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/hoat-dong/date-range?start={}&end={}", startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(hoatDongService.getByDateRange(startDate, endDate)));
    }

    // ========== ACTION ENDPOINTS ==========

    @PostMapping("/open-registration")
    @Operation(summary = "Mở đăng ký hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> openRegistration(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/open-registration?ma={}", maHoatDong);
        hoatDongService.openRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã mở đăng ký", null));
    }

    @PostMapping("/close-registration")
    @Operation(summary = "Đóng đăng ký hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> closeRegistration(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/close-registration?ma={}", maHoatDong);
        hoatDongService.closeRegistration(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã đóng đăng ký", null));
    }

    @PostMapping("/cong-khai")
    @Operation(summary = "Công khai hoạt động — hiện cho SV xem/đăng ký, tự tạo tin tức + gửi thông báo — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> congKhaiHoatDong(@RequestParam String ma) {
        log.info("POST /api/hoat-dong/cong-khai?ma={}", ma);
        HoatDongDTO result = hoatDongService.congKhaiHoatDong(ma);
        return ResponseEntity.ok(ApiResponse.success("Đã công khai hoạt động", result));
    }

    @PostMapping("/an")
    @Operation(summary = "Ẩn hoạt động khỏi danh sách công khai — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> anHoatDong(@RequestParam String ma) {
        log.info("POST /api/hoat-dong/an?ma={}", ma);
        HoatDongDTO result = hoatDongService.anHoatDong(ma);
        return ResponseEntity.ok(ApiResponse.success("Đã ẩn hoạt động", result));
    }

    @PostMapping("/start")
    @Operation(summary = "Bắt đầu hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> startActivity(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/start?ma={}", maHoatDong);
        hoatDongService.startActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã bắt đầu hoạt động", null));
    }

    @PostMapping("/revert-start")
    @Operation(summary = "Hoàn tác lệnh Bắt đầu (chỉ khi chưa có ai check-in) — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> revertActivityStart(@RequestParam String ma) {
        log.info("POST /api/hoat-dong/revert-start?ma={}", ma);
        hoatDongService.revertActivityStart(ma);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn tác — hoạt động quay lại trạng thái trước", null));
    }

    @PostMapping("/complete")
    @Operation(summary = "Hoàn thành hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> completeActivity(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/complete?ma={}", maHoatDong);
        hoatDongService.completeActivity(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành hoạt động", null));
    }

    @PostMapping("/ket-thuc-som")
    @Operation(summary = "Kết thúc sớm hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> earlyTerminate(@RequestParam String ma) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/ket-thuc-som?ma={}", maHoatDong);
        HoatDongDTO updated = hoatDongService.earlyTerminate(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã kết thúc sớm hoạt động", updated));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Hủy hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XOA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Void>> cancelActivity(
            @RequestParam String ma,
            @RequestParam String lyDo) {
        String maHoatDong = ma;
        log.info("POST /api/hoat-dong/cancel?ma={} - Reason: {}", maHoatDong, lyDo);
        hoatDongService.cancelActivity(maHoatDong, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy hoạt động", null));
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/statistics/detail")
    @Operation(summary = "Thống kê hoạt động — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @RequestParam String ma) {
        String maHoatDong = ma;
        log.info("GET /api/hoat-dong/statistics/detail?ma={}", maHoatDong);
        Map<String, Object> stats = hoatDongService.getActivityStatistics(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/statistics/by-status")
    @Operation(summary = "Thống kê theo trạng thái")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatisticsByStatus() {
        log.info("GET /api/hoat-dong/statistics/by-status");
        Map<String, Long> stats = hoatDongService.getStatisticsByStatus();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/attendance-status")
    @Operation(summary = "Lấy danh sách trạng thái điểm danh — dùng ?ma=")
    @PreAuthorize("hasPermission(null, 'XEM_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<DiemDanhStatusDTO>>> getAttendanceStatusList(
            @RequestParam String ma) {
        String maHoatDong = ma;
        log.info("GET /api/hoat-dong/attendance-status?ma={}", maHoatDong);
        List<DiemDanhStatusDTO> list = hoatDongService.getAttendanceStatusList(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/academic-info")
    @Operation(summary = "Lấy thông tin học kỳ và năm học hiện tại")
    @PreAuthorize("hasRole('USER') or hasPermission(null, 'XEM_HOAT_DONG') or hasPermission(null, 'DANG_KY_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentAcademicInfo() {
        log.info("GET /api/hoat-dong/academic-info");
        Map<String, Object> info = hoatDongService.getCurrentAcademicInfo();
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    // ========== APPROVAL WORKFLOW (CLB / KHOA activities) ==========

    @GetMapping("/cho-duyet")
    @Operation(summary = "Lấy danh sách hoạt động đang chờ phê duyệt (CLB/Khoa tạo)")
    // DUYET_HOAT_DONG_CLB được cấp mặc định cho QUAN_LY_CLB (V27/V38); DUYET_HOAT_DONG được cấp mặc
    // định cho QUAN_LY_KHOA/PHO_QUAN_LY_KHOA (V34/V54) — nhưng trước đây endpoint chỉ chấp nhận
    // DUYET_HOAT_DONG_CLB nên Đoàn khoa luôn bị 403 khi bấm Duyệt. Chấp nhận CẢ HAI để đúng thiết kế
    // gốc "Phê duyệt hoạt động do CLB/Đoàn Khoa tạo" (xem comment gốc trong V27__bcn_clb_activity_approval.sql).
    @PreAuthorize("hasPermission(null, 'DUYET_HOAT_DONG_CLB') or hasPermission(null, 'DUYET_HOAT_DONG')")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getChouDuyet() {
        log.info("GET /api/hoat-dong/cho-duyet");
        // Chỉ trả các hoạt động chờ duyệt mà người đăng nhập ĐƯỢC PHÉP duyệt (đúng phạm vi khoa/CLB).
        return ResponseEntity.ok(ApiResponse.success(
                accessPolicy.filterApprovable(hoatDongService.getByTrangThai(TrangThaiHoatDongEnum.CHO_DUYET))));
    }

    @PutMapping("/duyet")
    @Operation(summary = "Phê duyệt hoạt động CLB/Khoa — dùng ?ma=")
    // DUYET_HOAT_DONG_CLB được cấp mặc định cho QUAN_LY_CLB (V27/V38); DUYET_HOAT_DONG được cấp mặc
    // định cho QUAN_LY_KHOA/PHO_QUAN_LY_KHOA (V34/V54) — nhưng trước đây endpoint chỉ chấp nhận
    // DUYET_HOAT_DONG_CLB nên Đoàn khoa luôn bị 403 khi bấm Duyệt. Chấp nhận CẢ HAI để đúng thiết kế
    // gốc "Phê duyệt hoạt động do CLB/Đoàn Khoa tạo" (xem comment gốc trong V27__bcn_clb_activity_approval.sql).
    @PreAuthorize("hasPermission(null, 'DUYET_HOAT_DONG_CLB') or hasPermission(null, 'DUYET_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> duyetHoatDong(
            @RequestParam String ma,
            @RequestParam(defaultValue = "SAP_DIEN_RA") String trangThaiMoi,
            org.springframework.security.core.Authentication auth) {
        log.info("PUT /api/hoat-dong/duyet?ma={} trangThaiMoi={} by={}", ma, trangThaiMoi, auth.getName());
        TrangThaiHoatDongEnum trangThai = TrangThaiHoatDongEnum.valueOf(trangThaiMoi);
        HoatDongDTO result = hoatDongService.duyetHoatDong(ma, trangThai, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt hoạt động", result));
    }

    @PutMapping("/tu-choi")
    @Operation(summary = "Từ chối hoạt động CLB/Khoa — dùng ?ma=")
    // DUYET_HOAT_DONG_CLB được cấp mặc định cho QUAN_LY_CLB (V27/V38); DUYET_HOAT_DONG được cấp mặc
    // định cho QUAN_LY_KHOA/PHO_QUAN_LY_KHOA (V34/V54) — nhưng trước đây endpoint chỉ chấp nhận
    // DUYET_HOAT_DONG_CLB nên Đoàn khoa luôn bị 403 khi bấm Duyệt. Chấp nhận CẢ HAI để đúng thiết kế
    // gốc "Phê duyệt hoạt động do CLB/Đoàn Khoa tạo" (xem comment gốc trong V27__bcn_clb_activity_approval.sql).
    @PreAuthorize("hasPermission(null, 'DUYET_HOAT_DONG_CLB') or hasPermission(null, 'DUYET_HOAT_DONG')")
    public ResponseEntity<ApiResponse<HoatDongDTO>> tuChoiHoatDong(
            @RequestParam String ma,
            @RequestBody(required = false) java.util.Map<String, String> body,
            org.springframework.security.core.Authentication auth) {
        String lyDo = body != null ? body.getOrDefault("lyDo", "") : "";
        log.info("PUT /api/hoat-dong/tu-choi?ma={} by={}", ma, auth.getName());
        HoatDongDTO result = hoatDongService.tuChoiHoatDong(ma, lyDo, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối hoạt động", result));
    }

    @PostMapping("/{maHoatDong}/gui-email")
    @Operation(summary = "Gửi email thông báo hoạt động đến tất cả sinh viên")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> guiEmailHoatDong(
            @PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/gui-email", maHoatDong);
        Map<String, Object> result = hoatDongService.guiEmailThongBao(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt gửi email thông báo", result));
    }

    @PostMapping("/{maHoatDong}/gui-zalo")
    @Operation(summary = "Gửi thông báo Zalo hoạt động đến tất cả sinh viên đã liên kết")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> guiZaloHoatDong(
            @PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/gui-zalo", maHoatDong);
        Map<String, Object> result = hoatDongService.guiZaloThongBao(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt gửi Zalo thông báo", result));
    }

    @PostMapping("/{maHoatDong}/gui-tat-ca")
    @Operation(summary = "Gửi cả Email + Zalo thông báo hoạt động")
    @PreAuthorize("hasPermission(null, 'SUA_HOAT_DONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> guiTatCaHoatDong(
            @PathVariable String maHoatDong) {
        log.info("POST /api/hoat-dong/{}/gui-tat-ca", maHoatDong);
        Map<String, Object> result = hoatDongService.guiThongBaoDayDu(maHoatDong);
        return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt gửi Email + Zalo", result));
    }

    // ========== ERROR HANDLING ==========

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException e) {
        // Bao gồm ScopeAccessDeniedException (siết phạm vi khoa/CLB) — trả nguyên văn lý do cho người dùng.
        log.warn("Access denied on /api/hoat-dong: {}", e.getMessage());
        String msg = e.getMessage();
        if (msg == null || msg.isBlank() || msg.contains("Access Denied")) {
            msg = "Bạn không có quyền thực hiện thao tác này";
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(msg, 403));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in HoatDongController", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(e.getMessage()));
    }
}
