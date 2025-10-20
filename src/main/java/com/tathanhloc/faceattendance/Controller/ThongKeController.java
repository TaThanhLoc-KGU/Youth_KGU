package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * REST API Controller cho thống kê tổng hợp
 */
@RestController
@RequestMapping("/api/thong-ke")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Thống Kê", description = "API thống kê và báo cáo")
public class ThongKeController {

    private final HoatDongService hoatDongService;
    private final DangKyHoatDongService dangKyService;
    private final DiemDanhHoatDongService diemDanhService;
    private final BCHDoanHoiService bchService;
    private final ChungNhanHoatDongService chungNhanService;

    // ========== DASHBOARD ==========

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard tổng quan")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        log.info("GET /api/thong-ke/dashboard");

        // Lấy thống kê từ các service
        Map<String, Long> statusStats = hoatDongService.getStatisticsByStatus();
        long totalBCH = bchService.getTotalActive();

        // Build dashboard response
        DashboardResponse dashboard = DashboardResponse.builder()
                .tongHoatDong(statusStats.values().stream().mapToLong(Long::longValue).sum())
                .hoatDongDangDienRa(statusStats.getOrDefault("DANG_DIEN_RA", 0L))
                .hoatDongSapDienRa(statusStats.getOrDefault("SAP_DIEN_RA", 0L))
                .hoatDongDaHoanThanh(statusStats.getOrDefault("DA_HOAN_THANH", 0L))
                .tongBCH(totalBCH)
                .bchHoatDong(totalBCH)
                .hoatDongNoiBat(hoatDongService.getUpcomingActivities())
                .thongKeoCapDo(new HashMap<>()) // TODO: Implement
                .thongKeoLoai(new HashMap<>()) // TODO: Implement
                .build();

        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    // ========== HOẠT ĐỘNG ==========

    @GetMapping("/hoat-dong/{maHoatDong}")
    @Operation(summary = "Báo cáo chi tiết hoạt động")
    public ResponseEntity<ApiResponse<ActivityReportDTO>> getActivityReport(
            @PathVariable String maHoatDong) {
        log.info("GET /api/thong-ke/hoat-dong/{}", maHoatDong);

        HoatDongDTO hoatDong = hoatDongService.getById(maHoatDong);
        List<DangKyHoatDongDTO> dangKyList = dangKyService.getByActivity(maHoatDong);
        List<DiemDanhHoatDongDTO> checkInList = diemDanhService.getCheckedInStudents(maHoatDong);
        List<Map<String, Object>> notCheckInList = diemDanhService.getNotCheckedInStudents(maHoatDong);

        Map<String, Object> stats = hoatDongService.getActivityStatistics(maHoatDong);

        ActivityReportDTO report = ActivityReportDTO.builder()
                .hoatDong(hoatDong)
                .danhSachDangKy(dangKyList)
                .danhSachCheckIn(checkInList)
                .danhSachChuaCheckIn(notCheckInList)
                .thongKe(convertToThongKeResponse(stats))
                .build();

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/hoat-dong/tong-quan")
    @Operation(summary = "Thống kê tổng quan hoạt động")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActivityOverview(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("GET /api/thong-ke/hoat-dong/tong-quan");

        Map<String, Object> overview = new HashMap<>();
        overview.put("theoTrangThai", hoatDongService.getStatisticsByStatus());

        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            overview.put("hoatDongTrongKhoang",
                    hoatDongService.getByDateRange(start, end));
        }

        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    // ========== SINH VIÊN ==========

    @GetMapping("/sinh-vien/{maSv}")
    @Operation(summary = "Lịch sử tham gia của sinh viên")
    public ResponseEntity<ApiResponse<StudentHistoryDTO>> getStudentHistory(
            @PathVariable String maSv) {
        log.info("GET /api/thong-ke/sinh-vien/{}", maSv);

        Map<String, Object> stats = diemDanhService.getStudentAttendanceHistory(maSv);
        List<DiemDanhHoatDongDTO> lichSu =
                (List<DiemDanhHoatDongDTO>) stats.get("danhSach");
        List<DangKyHoatDongDTO> sapToi = dangKyService.getByStudent(maSv);
        List<ChungNhanHoatDongDTO> chungNhan = chungNhanService.getByStudent(maSv);

        ThongKeSinhVienResponse thongKe = ThongKeSinhVienResponse.builder()
                .maSv(maSv)
                .tongDangKy((Long) stats.get("tongSoHoatDong"))
                .daThamGia((Long) stats.get("daThamGia"))
                .tongDiemRenLuyen((Integer) stats.get("tongDiemRenLuyen"))
                .build();

        StudentHistoryDTO history = StudentHistoryDTO.builder()
                .maSv(maSv)
                .lichSuThamGia(lichSu)
                .hoatDongSapToi(sapToi)
                .chungNhan(chungNhan)
                .thongKe(thongKe)
                .build();

        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // ========== BCH ==========

    @GetMapping("/bch/overview")
    @Operation(summary = "Thống kê BCH")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBCHOverview() {
        log.info("GET /api/thong-ke/bch/overview");

        Map<String, Object> overview = new HashMap<>();
        overview.put("total", bchService.getTotalActive());
        overview.put("byPosition", bchService.countByChucVu());
        overview.put("byDepartment", bchService.countByKhoa());

        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    // ========== EXPORT ==========

    @GetMapping("/export/hoat-dong/{maHoatDong}")
    @Operation(summary = "Export báo cáo hoạt động")
    public ResponseEntity<ApiResponse<String>> exportActivityReport(
            @PathVariable String maHoatDong,
            @RequestParam(defaultValue = "excel") String format) {
        log.info("GET /api/thong-ke/export/hoat-dong/{}?format={}", maHoatDong, format);

        // TODO: Implement export logic
        return ResponseEntity.ok(ApiResponse.success(
                "Chức năng export đang được phát triển",
                null));
    }

    // ========== HELPER METHODS ==========

    private ThongKeHoatDongResponse convertToThongKeResponse(Map<String, Object> stats) {
        HoatDongDTO hoatDong = (HoatDongDTO) stats.get("hoatDong");

        return ThongKeHoatDongResponse.builder()
                .maHoatDong(hoatDong.getMaHoatDong())
                .tenHoatDong(hoatDong.getTenHoatDong())
                .ngayToChuc(hoatDong.getNgayToChuc())
                .trangThai(hoatDong.getTrangThai().name())
                .tongDangKy((Long) stats.get("soDangKy"))
                .daCheckIn((Long) stats.get("daThamGia"))
                .chuaCheckIn((Long) stats.get("chuaCheckIn"))
                .soLuongToiDa(hoatDong.getSoLuongToiDa())
                .conTrong((Long) stats.get("conTrong"))
                .tyLeCheckIn((Double) stats.get("tyLeThamGia"))
                .build();
    }
}