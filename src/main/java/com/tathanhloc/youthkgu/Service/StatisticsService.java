package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.StatisticsDTO;
import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service để tạo báo cáo và thống kê hệ thống
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StatisticsService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final HoatDongRepository hoatDongRepository;
    private final DangKyHoatDongRepository dangKyHoatDongRepository;
    private final DiemDanhHoatDongRepository diemDanhHoatDongRepository;
    private final KhoaRepository khoaRepository;

    // ==================== EXISTING METHODS (UNCHANGED) ====================

    public StatisticsDTO getSystemStatistics() {
        log.info("Lấy thống kê toàn bộ hệ thống");

        long totalAccounts = taiKhoanRepository.count();
        long activeAccounts = taiKhoanRepository.countByIsActiveTrue();
        long inactiveAccounts = taiKhoanRepository.countByIsActiveFalse();

        long totalActivities = hoatDongRepository.count();
        long totalRegistrations = dangKyHoatDongRepository.count();
        long totalAttendance = diemDanhHoatDongRepository.count();

        return StatisticsDTO.builder()
                .totalAccounts(totalAccounts)
                .activeAccounts(activeAccounts)
                .inactiveAccounts(inactiveAccounts)
                .totalActivities(totalActivities)
                .totalRegistrations(totalRegistrations)
                .totalAttendance(totalAttendance)
                .accountsByRole(getAccountsByRoleStatistics())
                .accountsByDepartment(getAccountsByDepartmentStatistics())
                .accountsByApprovalStatus(getAccountsByApprovalStatusStatistics())
                .build();
    }

    public Map<String, Long> getAccountsByRoleStatistics() {
        log.info("Lấy thống kê tài khoản theo vai trò");

        Map<String, Long> statistics = new LinkedHashMap<>();

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            if (count > 0) {
                statistics.put(vaiTro.getTenHienThi(), count);
            }
        }

        return statistics;
    }

    public Map<String, Long> getAccountsByDepartmentStatistics() {
        log.info("Lấy thống kê tài khoản theo ban chuyên môn");

        // Dùng GROUP BY 1 query thay vì N query (1 per ban)
        Map<String, Long> statistics = new LinkedHashMap<>();
        taiKhoanRepository.countGroupByBan().forEach(row -> {
            String tenBan = (String) row[1];
            long count = ((Number) row[2]).longValue();
            if (count > 0) {
                statistics.put(tenBan, count);
            }
        });
        return statistics;
    }

    public Map<String, Long> getAccountsByApprovalStatusStatistics() {
        log.info("Lấy thống kê tài khoản theo trạng thái phê duyệt");

        Map<String, Long> statistics = new LinkedHashMap<>();

        long choPhedhuyet = taiKhoanRepository.countByTrangThaiPheDuyet("CHO_PHE_DUYET");
        long daphedhuyet = taiKhoanRepository.countByTrangThaiPheDuyet("DA_PHE_DUYET");
        long tuchoi = taiKhoanRepository.countByTrangThaiPheDuyet("TU_CHOI");

        if (choPhedhuyet > 0) statistics.put("Chờ phê duyệt", choPhedhuyet);
        if (daphedhuyet > 0) statistics.put("Đã phê duyệt", daphedhuyet);
        if (tuchoi > 0) statistics.put("Từ chối", tuchoi);

        return statistics;
    }

    public Map<String, Object> getDetailedRoleStatistics(VaiTroEnum vaiTro) {
        log.info("Lấy thống kê chi tiết vai trò: {}", vaiTro);

        Map<String, Object> statistics = new LinkedHashMap<>();

        long totalByRole = taiKhoanRepository.countByVaiTro(vaiTro);
        long activeByRole = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
        long inactiveByRole = totalByRole - activeByRole;

        statistics.put("vaiTro", vaiTro.getTenHienThi());
        statistics.put("total", totalByRole);
        statistics.put("active", activeByRole);
        statistics.put("inactive", inactiveByRole);
        statistics.put("nhom", vaiTro == VaiTroEnum.QUAN_LY ? "QUAN_LY" : "THAM_GIA");
        statistics.put("toChuc", "HE_THONG");

        return statistics;
    }

    public long getPendingApprovalsCount() {
        return taiKhoanRepository.countByTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    public Map<String, Object> getActivityStatistics() {
        Map<String, Object> statistics = new LinkedHashMap<>();

        long totalActivities = hoatDongRepository.count();
        long totalRegistrations = dangKyHoatDongRepository.count();
        long totalAttendance = diemDanhHoatDongRepository.count();

        statistics.put("totalActivities", totalActivities);
        statistics.put("totalRegistrations", totalRegistrations);
        statistics.put("totalAttendance", totalAttendance);

        if (totalActivities > 0) {
            statistics.put("avgRegistrationsPerActivity", totalRegistrations / totalActivities);
            statistics.put("avgAttendancePerActivity", totalAttendance / totalActivities);
        }

        return statistics;
    }

    public Map<String, Object> getStatisticsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> statistics = new LinkedHashMap<>();

        // Dùng COUNT query thay vì findAll().stream().filter() — tránh tải toàn bộ bảng vào bộ nhớ
        long newAccounts = taiKhoanRepository.countByCreatedAtBetween(startDate, endDate);

        statistics.put("startDate", startDate);
        statistics.put("endDate", endDate);
        statistics.put("newAccountsInPeriod", newAccounts);

        return statistics;
    }

    public List<Map<String, Object>> getTopRoles(int limit) {
        List<Map<String, Object>> topRoles = new ArrayList<>();

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            if (count > 0) {
                Map<String, Object> roleInfo = new LinkedHashMap<>();
                roleInfo.put("vaiTro", vaiTro.getTenHienThi());
                roleInfo.put("count", count);
                topRoles.add(roleInfo);
            }
        }

        return topRoles.stream()
                .sorted((a, b) -> Long.compare((long) b.get("count"), (long) a.get("count")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getAccountsByRoleGroup() {
        Map<String, Long> statistics = new LinkedHashMap<>();

        long quanLy = 0, phuVu = 0, thamGia = 0;

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            if (vaiTro == VaiTroEnum.QUAN_LY) quanLy += count;
            else thamGia += count;
        }

        if (quanLy > 0) statistics.put("Quản lý", quanLy);
        if (phuVu > 0) statistics.put("Phục vụ", phuVu);
        if (thamGia > 0) statistics.put("Thành viên", thamGia);

        return statistics;
    }

    public Map<String, Long> getAccountsByOrganization() {
        Map<String, Long> statistics = new LinkedHashMap<>();

        long doan = 0, hoi = 0, heThong = 0;

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            heThong += count;
        }

        if (doan > 0) statistics.put("Đoàn", doan);
        if (hoi > 0) statistics.put("Hội", hoi);
        if (heThong > 0) statistics.put("Hệ thống", heThong);

        return statistics;
    }

    // ==================== DASHBOARD TỔNG HỢP ====================

    public Map<String, Object> getDashboardData() {
        log.info("Building unified dashboard data");
        Map<String, Object> result = new LinkedHashMap<>();

        // ---- 1. Tổng quan ----
        long tongHoatDong = hoatDongRepository.count();
        long tongDangKy   = dangKyHoatDongRepository.countAllActive();
        long tongDiemDanh = diemDanhHoatDongRepository.countByTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);
        double tyLeThamGia = tongDangKy > 0
                ? Math.round((double) tongDiemDanh / tongDangKy * 100 * 10.0) / 10.0 : 0.0;

        // ---- Tính theoKhoa dùng GROUP BY (thay thế findAll().forEach() — tránh load toàn bộ bảng) ----
        Map<String, long[]> facultyMap = new LinkedHashMap<>();

        // Điểm danh theo khoa — 1 native query
        diemDanhHoatDongRepository.countDiemDanhGroupByKhoa().forEach(row -> {
            String tenKhoa = row[0] != null ? row[0].toString() : "Không xác định";
            long count = ((Number) row[1]).longValue();
            facultyMap.computeIfAbsent(tenKhoa, k -> new long[]{0, 0})[1] = count;
        });

        // Đăng ký theo khoa — 1 native query
        dangKyHoatDongRepository.countDangKyGroupByKhoa().forEach(row -> {
            String tenKhoa = row[0] != null ? row[0].toString() : "Không xác định";
            long count = ((Number) row[1]).longValue();
            facultyMap.computeIfAbsent(tenKhoa, k -> new long[]{0, 0})[0] = count;
        });

        long soKhoaThamGia = facultyMap.values().stream().filter(stats -> stats[1] > 0).count();

        Map<String, Object> tongQuan = new LinkedHashMap<>();
        tongQuan.put("tongHoatDong", tongHoatDong);
        tongQuan.put("tongDiemDanh", tongDiemDanh);
        tongQuan.put("tyLeThamGia", tyLeThamGia);
        tongQuan.put("soKhoaThamGia", soKhoaThamGia);
        result.put("tongQuan", tongQuan);

        // ---- 2. Xu hướng theo tháng (12 tháng gần nhất) — 1 native query thay vì 120–240 queries ----
        LocalDate trendStart = LocalDate.now().minusMonths(11).withDayOfMonth(1);

        // Index data từ native query theo "year-month"
        Map<String, long[]> trendMap = new LinkedHashMap<>();
        hoatDongRepository.findTrendDataLast12Months(trendStart).forEach(row -> {
            int nam = ((Number) row[0]).intValue();
            int thang = ((Number) row[1]).intValue();
            long soHd  = ((Number) row[2]).longValue();
            long sodk  = ((Number) row[3]).longValue();
            long sodd  = ((Number) row[4]).longValue();
            String key = nam + "-" + String.format("%02d", thang);
            trendMap.put(key, new long[]{soHd, sodk, sodd});
        });

        // Đảm bảo đủ 12 tháng kể cả tháng không có dữ liệu
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            String key = month.getYear() + "-" + String.format("%02d", month.getMonthValue());
            long[] vals = trendMap.getOrDefault(key, new long[]{0, 0, 0});
            long soHoatDong     = vals[0];
            long tongDangKyThang  = vals[1];
            long tongDiemDanhThang = vals[2];
            double tyLe = tongDangKyThang > 0
                    ? Math.round((double) tongDiemDanhThang / tongDangKyThang * 100 * 10.0) / 10.0 : 0.0;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("thang", key);
            m.put("soHoatDong", soHoatDong);
            m.put("tongDangKy", tongDangKyThang);
            m.put("tongDiemDanh", tongDiemDanhThang);
            m.put("tyLe", tyLe);
            trend.add(m);
        }
        result.put("xuHuongTheoThang", trend);

        // ---- 3. Top 5 hoạt động theo điểm danh ----
        List<Object[]> topActivitiesRaw = diemDanhHoatDongRepository
                .findTopActivitiesByAttendance(PageRequest.of(0, 5));
        List<Map<String, Object>> topHoatDong = topActivitiesRaw.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maHoatDong", row[0]);
            m.put("tenHoatDong", row[1]);
            m.put("ngayToChuc", row[2]);
            m.put("tongDiemDanh", row[3]);
            return m;
        }).collect(Collectors.toList());
        result.put("topHoatDong", topHoatDong);

        // ---- 4. Top 10 sinh viên theo số lần tham gia ----
        List<Object[]> topStudentsRaw = diemDanhHoatDongRepository
                .findTopStudentsByParticipation(PageRequest.of(0, 10));
        List<Map<String, Object>> topSinhVien = topStudentsRaw.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maSv", row[0]);
            m.put("hoTen", row[1]);
            m.put("soLan", row[2]);
            return m;
        }).collect(Collectors.toList());
        result.put("topSinhVien", topSinhVien);

        // ---- 5. Theo khoa ----
        List<Map<String, Object>> theoKhoa = facultyMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("tenKhoa", e.getKey());
                    long dk = e.getValue()[0];
                    long dd = e.getValue()[1];
                    m.put("tongDangKy", dk);
                    m.put("tongDiemDanh", dd);
                    m.put("tyLe", dk > 0 ? Math.round((double) dd / dk * 100 * 10.0) / 10.0 : 0.0);
                    return m;
                })
                .sorted((a, b) -> Double.compare((Double) b.get("tyLe"), (Double) a.get("tyLe")))
                .collect(Collectors.toList());
        result.put("theoKhoa", theoKhoa);

        return result;
    }

    // ==================== THỐNG KÊ TỔNG QUAN ====================

    public Map<String, Object> getGeneralStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalAttendance = diemDanhHoatDongRepository.count();
        long successful = diemDanhHoatDongRepository
                .countByHoatDongMaHoatDongAndTrangThai(null, TrangThaiThamGiaEnum.DA_THAM_GIA);
        long absent = diemDanhHoatDongRepository
                .countByHoatDongMaHoatDongAndTrangThai(null, TrangThaiThamGiaEnum.VANG_MAT);

        stats.put("tongLuotDiemDanh", totalAttendance);
        stats.put("diemDanhThanhCong", successful);
        stats.put("vangKhongPhep", absent);
        stats.put("tiLeCoMat", totalAttendance > 0
                ? Math.round((double) successful / totalAttendance * 100 * 100.0) / 100.0 : 0);

        // Thống kê theo khoa — dùng GROUP BY 1 query thay thế findAll().forEach()
        Map<String, Long> byFaculty = new LinkedHashMap<>();
        diemDanhHoatDongRepository.countDiemDanhGroupByKhoa().forEach(row -> {
            String tenKhoa = row[0] != null ? row[0].toString() : "Không xác định";
            long count = ((Number) row[1]).longValue();
            byFaculty.put(tenKhoa, count);
        });
        stats.put("thongKeTheoKhoa", byFaculty);

        return stats;
    }

    // ==================== BÁO CÁO THEO LOẠI ====================

    public Map<String, Object> getReportByType(String type, String from, String to) {
        switch (type) {
            case "thang":  return getMonthlyReport(from, to);
            case "quy":    return getQuarterlyReport(from, to);
            default:       return getGeneralReport(from, to);
        }
    }

    // ==================== BÁO CÁO HOẠT ĐỘNG (GENERAL) ====================

    private Map<String, Object> getGeneralReport(String from, String to) {
        LocalDate start = from != null ? LocalDate.parse(from) : LocalDate.now().minusMonths(6);
        LocalDate end   = to   != null ? LocalDate.parse(to)   : LocalDate.now();

        List<Map<String, Object>> data = hoatDongRepository.findByDateRange(start, end)
                .stream()
                .map(this::buildActivityReport)
                .collect(Collectors.toList());

        Map<String, Object> report = new HashMap<>();
        report.put("data", data);
        return report;
    }

    /**
     * Build chi tiết một hoạt động bao gồm breakdown theo từng đoàn khoa
     */
    private Map<String, Object> buildActivityReport(HoatDong hd) {
        Map<String, Object> m = new LinkedHashMap<>();
        String maHD = hd.getMaHoatDong();

        m.put("maHoatDong", maHD);
        m.put("tenHoatDong", hd.getTenHoatDong());
        m.put("ngayToChuc", hd.getNgayToChuc());
        m.put("trangThai", hd.getTrangThai() != null ? hd.getTrangThai().name() : null);

        long tongDangKy = dangKyHoatDongRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHD);
        m.put("tongDangKy", tongDangKy);

        long daDiemDanh = diemDanhHoatDongRepository.countByHoatDongMaHoatDong(maHD);
        m.put("daDiemDanh", daDiemDanh);

        // facultyBreakdown: tenKhoa -> { dangKy: N, diemDanh: M }
        Map<String, Map<String, Long>> facultyBreakdown = new LinkedHashMap<>();

        // Đếm đăng ký theo khoa
        dangKyHoatDongRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHD).forEach(dk -> {
            String tenKhoa = getFacultyName(dk.getSinhVien());
            facultyBreakdown
                    .computeIfAbsent(tenKhoa, k -> new LinkedHashMap<>())
                    .merge("dangKy", 1L, Long::sum);
        });

        // Đếm điểm danh theo khoa
        diemDanhHoatDongRepository.findByHoatDongMaHoatDong(maHD).forEach(dd -> {
            String tenKhoa = getFacultyName(dd.getSinhVien());
            Map<String, Long> khoaStats = facultyBreakdown
                    .computeIfAbsent(tenKhoa, k -> new LinkedHashMap<>());
            khoaStats.putIfAbsent("dangKy", 0L);
            khoaStats.merge("diemDanh", 1L, Long::sum);
        });

        // Đảm bảo mọi khoa đều có cả 2 key
        facultyBreakdown.forEach((k, v) -> {
            v.putIfAbsent("dangKy", 0L);
            v.putIfAbsent("diemDanh", 0L);
        });

        m.put("facultyBreakdown", facultyBreakdown);
        return m;
    }

    // ==================== BÁO CÁO THÁNG ====================

    private Map<String, Object> getMonthlyReport(String from, String to) {
        LocalDate start = from != null ? LocalDate.parse(from) : LocalDate.now().withDayOfMonth(1);
        LocalDate end   = to   != null ? LocalDate.parse(to)   : start.withDayOfMonth(start.lengthOfMonth());

        List<Map<String, Object>> data = hoatDongRepository.findByDateRange(start, end)
                .stream()
                .map(hd -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    String maHD = hd.getMaHoatDong();
                    m.put("maHoatDong", maHD);
                    m.put("tenHoatDong", hd.getTenHoatDong());
                    m.put("ngayToChuc", hd.getNgayToChuc());
                    m.put("trangThai", hd.getTrangThai() != null ? hd.getTrangThai().name() : null);
                    long tongDangKy = dangKyHoatDongRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHD);
                    m.put("tongDangKy", tongDangKy);
                    long daDiemDanh = diemDanhHoatDongRepository.countByHoatDongMaHoatDong(maHD);
                    m.put("daDiemDanh", daDiemDanh);
                    return m;
                })
                .collect(Collectors.toList());

        long tongDangKy  = data.stream().mapToLong(d -> toLong(d.get("tongDangKy"))).sum();
        long tongDiemDanh = data.stream().mapToLong(d -> toLong(d.get("daDiemDanh"))).sum();

        Map<String, Object> report = new HashMap<>();
        report.put("data", data);
        report.put("tongHoatDong", data.size());
        report.put("tongDangKy",   tongDangKy);
        report.put("tongDiemDanh", tongDiemDanh);
        report.put("tyLe", tongDangKy > 0
                ? Math.round((double) tongDiemDanh / tongDangKy * 100 * 10.0) / 10.0 : 0.0);
        return report;
    }

    // ==================== BÁO CÁO QUÝ ====================

    private Map<String, Object> getQuarterlyReport(String from, String to) {
        LocalDate start = from != null ? LocalDate.parse(from) : LocalDate.now().withDayOfMonth(1).minusMonths(2);
        LocalDate end   = to   != null ? LocalDate.parse(to)   : LocalDate.now();

        List<HoatDong> activities = hoatDongRepository.findByDateRange(start, end);

        // Aggregate faculty stats across all activities in the quarter
        Map<String, Map<String, Long>> facultyStats = new LinkedHashMap<>();

        activities.forEach(hd -> {
            String maHD = hd.getMaHoatDong();

            dangKyHoatDongRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHD).forEach(dk -> {
                String tenKhoa = getFacultyName(dk.getSinhVien());
                facultyStats.computeIfAbsent(tenKhoa, k -> new LinkedHashMap<>())
                        .merge("dangKy", 1L, Long::sum);
            });

            diemDanhHoatDongRepository.findByHoatDongMaHoatDong(maHD).forEach(dd -> {
                String tenKhoa = getFacultyName(dd.getSinhVien());
                Map<String, Long> khoaStats = facultyStats
                        .computeIfAbsent(tenKhoa, k -> new LinkedHashMap<>());
                khoaStats.putIfAbsent("dangKy", 0L);
                khoaStats.merge("diemDanh", 1L, Long::sum);
            });
        });

        // Thêm tất cả các khoa đang hoạt động (kể cả khoa không có sinh viên tham gia)
        khoaRepository.findByIsActiveTrue().forEach(k -> {
            facultyStats.computeIfAbsent(k.getTenKhoa(), tenKhoa -> {
                Map<String, Long> s = new LinkedHashMap<>();
                s.put("dangKy", 0L);
                s.put("diemDanh", 0L);
                return s;
            });
        });

        facultyStats.forEach((k, v) -> {
            v.putIfAbsent("dangKy", 0L);
            v.putIfAbsent("diemDanh", 0L);
        });

        // Build ranked faculty list
        List<Map<String, Object>> theoKhoa = facultyStats.entrySet().stream()
                .map(e -> {
                    Map<String, Object> khoa = new LinkedHashMap<>();
                    khoa.put("tenKhoa", e.getKey());
                    long dk = e.getValue().getOrDefault("dangKy", 0L);
                    long dd = e.getValue().getOrDefault("diemDanh", 0L);
                    khoa.put("tongDangKy", dk);
                    khoa.put("tongDiemDanh", dd);
                    double tyLe = dk > 0 ? Math.round((double) dd / dk * 100 * 10.0) / 10.0 : 0.0;
                    khoa.put("tyLe", tyLe);
                    return khoa;
                })
                .sorted((a, b) -> Double.compare((double) b.get("tyLe"), (double) a.get("tyLe")))
                .collect(Collectors.toList());

        long tongDangKy   = theoKhoa.stream().mapToLong(k -> toLong(k.get("tongDangKy"))).sum();
        long tongDiemDanh = theoKhoa.stream().mapToLong(k -> toLong(k.get("tongDiemDanh"))).sum();
        long soKhoaKhongThamGia = theoKhoa.stream()
                .filter(k -> toLong(k.get("tongDiemDanh")) == 0 && toLong(k.get("tongDangKy")) > 0)
                .count();

        Map<String, Object> report = new HashMap<>();
        report.put("tongHoatDong",       activities.size());
        report.put("tongDangKy",          tongDangKy);
        report.put("tongDiemDanh",        tongDiemDanh);
        report.put("tyLeTong",            tongDangKy > 0
                ? Math.round((double) tongDiemDanh / tongDangKy * 100 * 10.0) / 10.0 : 0.0);
        report.put("theoKhoa",            theoKhoa);
        report.put("soKhoaKhongThamGia",  soKhoaKhongThamGia);

        return report;
    }

    // ==================== XUẤT EXCEL ====================

    // Constants cho phần đầu văn bản
    private static final String ORG_LEFT_1  = "TỈNH ĐOÀN AN GIANG";
    private static final String ORG_LEFT_2  = "ĐOÀN TRƯỜNG ĐẠI HỌC KIÊN GIANG";
    private static final String ORG_RIGHT_1 = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
    private static final String ORG_RIGHT_2 = "Độc lập - Tự do - Hạnh phúc";
    private static final String ORG_DIVIDER = "────────────────────────────";

    // Xuất báo cáo hoạt động (kèm breakdown theo đoàn khoa)
    public ByteArrayInputStream exportGeneralReport(String from, String to) throws IOException {
        Map<String, Object> reportResult = getGeneralReport(from, to);
        List<Map<String, Object>> reportData = (List<Map<String, Object>>) reportResult.get("data");
        if (reportData == null) reportData = Collections.emptyList();

        Set<String> allFaculties = new TreeSet<>();
        reportData.forEach(d -> {
            Object fb = d.get("facultyBreakdown");
            if (fb instanceof Map) {
                allFaculties.addAll(((Map<?, ?>) fb).keySet().stream()
                        .map(Object::toString).collect(Collectors.toSet()));
            }
        });

        int baseCols = 6; // STT, Mã HĐ, Tên HĐ, Ngày TC, Tổng ĐK, Đã ĐD
        int LAST_COL = baseCols - 1 + allFaculties.size() * 2; // last column index (0-based)
        if (LAST_COL < 7) LAST_COL = 7;

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Báo cáo hoạt động");

            ExcelStyles s = new ExcelStyles(wb);
            LocalDate now = LocalDate.now();
            String dateStr = "Kiên Giang, ngày " + now.getDayOfMonth() + " tháng " + now.getMonthValue() + " năm " + now.getYear();
            int row = writeDocHeader(sheet, s, LAST_COL, "BÁO CÁO ĐIỂM DANH HOẠT ĐỘNG ĐOÀN", dateStr);

            // Section label
            Row secRow = sheet.createRow(row++);
            mergedCell(sheet, secRow, 0, LAST_COL, "DANH SÁCH HOẠT ĐỘNG VÀ KẾT QUẢ ĐIỂM DANH", s.boldLeft);

            sheet.createRow(row++);

            // Table header
            Row hdr = sheet.createRow(row++);
            hdr.setHeightInPoints(18);
            String[] baseCNames = {"STT", "Mã hoạt động", "Tên hoạt động", "Ngày tổ chức", "Tổng đăng ký", "Đã điểm danh"};
            for (int i = 0; i < baseCNames.length; i++) styledCell(hdr, i, baseCNames[i], s.tableHeader);
            int ci = baseCNames.length;
            for (String f : allFaculties) {
                styledCell(hdr, ci++, f + " - ĐK", s.tableHeader);
                styledCell(hdr, ci++, f + " - ĐD", s.tableHeader);
            }

            // Data rows
            int stt = 1;
            for (Map<String, Object> data : reportData) {
                Row dr = sheet.createRow(row++);
                styledCell(dr, 0, stt++,                                                 s.cellCenter);
                styledCell(dr, 1, sv(data.get("maHoatDong")),                           s.cell);
                styledCell(dr, 2, sv(data.get("tenHoatDong")),                          s.cell);
                styledCell(dr, 3, sv(data.get("ngayToChuc")),                           s.cellCenter);
                styledCell(dr, 4, toLong(data.get("tongDangKy")),                       s.cellCenter);
                styledCell(dr, 5, toLong(data.get("daDiemDanh")),                       s.cellCenter);

                int fc = 6;
                @SuppressWarnings("unchecked")
                Map<String, Map<String, Long>> fb = (Map<String, Map<String, Long>>) data.get("facultyBreakdown");
                for (String f : allFaculties) {
                    Map<String, Long> fs = (fb != null) ? fb.getOrDefault(f, Collections.emptyMap()) : Collections.emptyMap();
                    styledCell(dr, fc++, fs.getOrDefault("dangKy",  0L), s.cellCenter);
                    styledCell(dr, fc++, fs.getOrDefault("diemDanh", 0L), s.cellCenter);
                }
            }

            // Column widths
            sheet.setColumnWidth(0, 1500);
            sheet.setColumnWidth(1, 4000);
            sheet.setColumnWidth(2, 10000);
            sheet.setColumnWidth(3, 3500);
            sheet.setColumnWidth(4, 2800);
            sheet.setColumnWidth(5, 2800);
            for (int i = 6; i <= LAST_COL; i++) sheet.setColumnWidth(i, 3200);

            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // Xuất báo cáo tháng
    public ByteArrayInputStream exportMonthlyReport(String from, String to, Integer month, Integer year) throws IOException {
        LocalDate start = from != null ? LocalDate.parse(from) : LocalDate.now().withDayOfMonth(1);
        int m = month != null ? month : start.getMonthValue();
        int y = year  != null ? year  : start.getYear();

        Map<String, Object> reportResult = getMonthlyReport(from, to);
        List<Map<String, Object>> activities = (List<Map<String, Object>>) reportResult.get("data");
        if (activities == null) activities = Collections.emptyList();

        final int LAST_COL = 7; // 8 columns: 0-7

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Báo cáo tháng " + m + "-" + y);

            ExcelStyles s  = new ExcelStyles(wb);
            String dateStr = "Kiên Giang, tháng " + m + " năm " + y;
            String title   = "BÁO CÁO HOẠT ĐỘNG ĐOÀN THÁNG " + m + " NĂM " + y;
            int row = writeDocHeader(sheet, s, LAST_COL, title, dateStr);

            // Summary section
            Row sumLabel = sheet.createRow(row++);
            mergedCell(sheet, sumLabel, 0, LAST_COL, "I. TỔNG QUAN", s.boldLeft);

            Object[][] summary = {
                {"- Tổng số hoạt động trong tháng:", reportResult.get("tongHoatDong")},
                {"- Tổng số lượt đăng ký:",           reportResult.get("tongDangKy")},
                {"- Tổng đã điểm danh:",               reportResult.get("tongDiemDanh")},
                {"- Tỷ lệ tham gia:",                  reportResult.get("tyLe") + "%"},
            };
            for (Object[] line : summary) {
                Row r = sheet.createRow(row++);
                mergedCell(sheet, r, 0, 3, (String) line[0], s.plainLeft);
                r.createCell(4).setCellValue(String.valueOf(line[1]));
            }

            sheet.createRow(row++);

            // Activity list section
            Row listLabel = sheet.createRow(row++);
            mergedCell(sheet, listLabel, 0, LAST_COL, "II. DANH SÁCH HOẠT ĐỘNG", s.boldLeft);

            Row hdr = sheet.createRow(row++);
            hdr.setHeightInPoints(18);
            String[] headers = {"STT", "Mã hoạt động", "Tên hoạt động", "Ngày tổ chức",
                                 "Đăng ký", "Điểm danh", "Tỷ lệ (%)", "Trạng thái"};
            for (int i = 0; i < headers.length; i++) styledCell(hdr, i, headers[i], s.tableHeader);

            Map<String, String> trangThaiLabel = new LinkedHashMap<>();
            trangThaiLabel.put("SAP_DIEN_RA",       "Sắp diễn ra");
            trangThaiLabel.put("DANG_MO_DANG_KY",   "Đang mở ĐK");
            trangThaiLabel.put("DANG_DIEN_RA",       "Đang diễn ra");
            trangThaiLabel.put("DA_HOAN_THANH",      "Đã hoàn thành");
            trangThaiLabel.put("DA_KET_THUC",        "Đã kết thúc");
            trangThaiLabel.put("DA_HUY",             "Đã hủy");

            int stt = 1;
            for (Map<String, Object> act : activities) {
                Row dr = sheet.createRow(row++);
                long dk = toLong(act.get("tongDangKy"));
                long dd = toLong(act.get("daDiemDanh"));
                double tyLe = dk > 0 ? Math.round((double) dd / dk * 100 * 10.0) / 10.0 : 0.0;
                String ttLabel = trangThaiLabel.getOrDefault(sv(act.get("trangThai")), sv(act.get("trangThai")));

                styledCell(dr, 0, stt++,           s.cellCenter);
                styledCell(dr, 1, sv(act.get("maHoatDong")),  s.cell);
                styledCell(dr, 2, sv(act.get("tenHoatDong")), s.cell);
                styledCell(dr, 3, sv(act.get("ngayToChuc")),  s.cellCenter);
                styledCell(dr, 4, dk,              s.cellCenter);
                styledCell(dr, 5, dd,              s.cellCenter);
                styledCell(dr, 6, tyLe + "%",      s.cellCenter);
                styledCell(dr, 7, ttLabel,         s.cellCenter);
            }

            sheet.setColumnWidth(0, 1500);
            sheet.setColumnWidth(1, 4200);
            sheet.setColumnWidth(2, 10000);
            sheet.setColumnWidth(3, 3500);
            sheet.setColumnWidth(4, 2500);
            sheet.setColumnWidth(5, 2500);
            sheet.setColumnWidth(6, 2500);
            sheet.setColumnWidth(7, 4000);

            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // Xuất báo cáo quý
    public ByteArrayInputStream exportQuarterlyReport(String from, String to, Integer quarter, Integer year) throws IOException {
        LocalDate now = LocalDate.now();
        int q = quarter != null ? quarter : (now.getMonthValue() - 1) / 3 + 1;
        int y = year    != null ? year    : now.getYear();

        Map<String, Object> reportResult = getQuarterlyReport(from, to);
        List<Map<String, Object>> theoKhoa = (List<Map<String, Object>>) reportResult.get("theoKhoa");
        if (theoKhoa == null) theoKhoa = Collections.emptyList();

        final int LAST_COL = 5; // 6 columns: 0-5

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Báo cáo quý " + q + "-" + y);

            ExcelStyles s  = new ExcelStyles(wb);
            String dateStr = "Kiên Giang, Quý " + q + " năm " + y;
            String title   = "BÁO CÁO QUÝ " + q + " NĂM " + y;
            int row = writeDocHeader(sheet, s, LAST_COL, title, dateStr);

            // Summary section
            Row sumLabel = sheet.createRow(row++);
            mergedCell(sheet, sumLabel, 0, LAST_COL, "I. TỔNG QUAN QUÝ " + q + " NĂM " + y, s.boldLeft);

            Object[][] summary = {
                {"- Tổng số hoạt động trong quý:",         reportResult.get("tongHoatDong")},
                {"- Tổng số lượt đăng ký:",                reportResult.get("tongDangKy")},
                {"- Tổng đã điểm danh:",                   reportResult.get("tongDiemDanh")},
                {"- Tỷ lệ tham gia toàn quý:",             reportResult.get("tyLeTong") + "%"},
                {"- Số đoàn khoa không tham gia:",         reportResult.get("soKhoaKhongThamGia")},
            };
            for (Object[] line : summary) {
                Row r = sheet.createRow(row++);
                mergedCell(sheet, r, 0, 3, (String) line[0], s.plainLeft);
                r.createCell(4).setCellValue(String.valueOf(line[1]));
            }

            sheet.createRow(row++);

            // Faculty ranking section
            Row rankLabel = sheet.createRow(row++);
            mergedCell(sheet, rankLabel, 0, LAST_COL, "II. KẾT QUẢ THAM GIA THEO ĐOÀN KHOA", s.boldLeft);
            mergedCell(sheet, sheet.createRow(row++), 0, LAST_COL,
                "(Sắp xếp theo tỷ lệ tham gia từ cao đến thấp)", s.italic);

            Row hdr = sheet.createRow(row++);
            hdr.setHeightInPoints(18);
            String[] headers = {"Xếp hạng", "Đoàn khoa", "Tổng đăng ký", "Đã tham gia", "Tỷ lệ (%)", "Đánh giá"};
            for (int i = 0; i < headers.length; i++) styledCell(hdr, i, headers[i], s.tableHeader);

            int rank = 1;
            for (Map<String, Object> khoa : theoKhoa) {
                Row dr = sheet.createRow(row++);
                long dk   = toLong(khoa.get("tongDangKy"));
                long dd   = toLong(khoa.get("tongDiemDanh"));
                double tl = (double) khoa.getOrDefault("tyLe", 0.0);

                String rankStr = rank == 1 ? "#1 (Cao nhất)" : rank == theoKhoa.size() ? "#" + rank + " (Thấp nhất)" : "#" + rank;
                String danhGia;
                if (dk == 0)     danhGia = "Không có đăng ký";
                else if (dd == 0) danhGia = "KHÔNG THAM GIA";
                else if (tl >= 80) danhGia = "Tốt";
                else if (tl >= 60) danhGia = "Trung bình";
                else               danhGia = "Thấp";

                CellStyle rowStyle = dd == 0 && dk > 0 ? s.cellDanger : s.cellCenter;
                styledCell(dr, 0, rankStr, rowStyle);
                styledCell(dr, 1, sv(khoa.get("tenKhoa")), dd == 0 && dk > 0 ? s.cellDangerLeft : s.cell);
                styledCell(dr, 2, dk,     rowStyle);
                styledCell(dr, 3, dd,     rowStyle);
                styledCell(dr, 4, tl + "%", rowStyle);
                styledCell(dr, 5, danhGia,  rowStyle);
                rank++;
            }

            sheet.setColumnWidth(0, 4000);
            sheet.setColumnWidth(1, 10000);
            sheet.setColumnWidth(2, 3200);
            sheet.setColumnWidth(3, 3200);
            sheet.setColumnWidth(4, 2800);
            sheet.setColumnWidth(5, 4000);

            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // ==================== EXCEL HELPERS ====================

    /** Viết phần đầu văn bản hành chính (quốc hiệu, tiêu ngữ, tiêu đề báo cáo) */
    private int writeDocHeader(Sheet sheet, ExcelStyles s, int lastCol, String reportTitle, String dateStr) {
        int mid = lastCol / 2; // cột giữa để chia đôi trái/phải

        // Row 0: Tổ chức (trái) | Quốc hiệu (phải)
        Row r0 = sheet.createRow(0);
        r0.setHeightInPoints(16);
        mergedCell(sheet, r0, 0,   mid - 1,  ORG_LEFT_1,  s.boldCenter);
        mergedCell(sheet, r0, mid, lastCol,   ORG_RIGHT_1, s.boldCenter);

        // Row 1: Đoàn trường (trái) | Tiêu ngữ (phải)
        Row r1 = sheet.createRow(1);
        r1.setHeightInPoints(16);
        mergedCell(sheet, r1, 0,   mid - 1,  ORG_LEFT_2,  s.boldCenter);
        mergedCell(sheet, r1, mid, lastCol,   ORG_RIGHT_2, s.italicCenter);

        // Row 2: Gạch ngang bên phải
        Row r2 = sheet.createRow(2);
        mergedCell(sheet, r2, mid, lastCol,   ORG_DIVIDER, s.italicCenter);

        // Row 3: Ngày tháng năm bên phải
        Row r3 = sheet.createRow(3);
        mergedCell(sheet, r3, mid, lastCol,   dateStr,     s.italicCenter);

        // Row 4: Trống
        sheet.createRow(4);

        // Row 5: Tiêu đề báo cáo (full width, to màu)
        Row r5 = sheet.createRow(5);
        r5.setHeightInPoints(28);
        mergedCell(sheet, r5, 0, lastCol, reportTitle, s.title);

        // Row 6: Trống
        sheet.createRow(6);

        return 7; // row tiếp theo
    }

    /** Helper: tạo merged cell với style */
    private void mergedCell(Sheet sheet, Row row, int startCol, int endCol, String value, CellStyle style) {
        Cell cell = row.createCell(startCol);
        cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
        if (endCol > startCol) {
            sheet.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), startCol, endCol));
        }
    }

    /** Helper: tạo cell với String value và style */
    private void styledCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        if (style != null) cell.setCellStyle(style);
    }

    /** Helper: tạo cell với long value và style */
    private void styledCell(Row row, int col, long value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

    /** Helper: safe toString */
    private String sv(Object o) {
        if (o == null) return "";
        return o.toString();
    }

    /** Inner class gom tất cả CellStyle dùng chung */
    private static class ExcelStyles {
        final CellStyle boldCenter, boldLeft, italicCenter, italic, italicLeft, title;
        final CellStyle tableHeader, cell, cellCenter, cellDanger, cellDangerLeft, plainLeft;

        ExcelStyles(Workbook wb) {
            // --- Fonts ---
            Font fBold = wb.createFont(); fBold.setBold(true); fBold.setFontHeightInPoints((short) 11);
            Font fNorm = wb.createFont(); fNorm.setFontHeightInPoints((short) 11);
            Font fItal = wb.createFont(); fItal.setItalic(true); fItal.setFontHeightInPoints((short) 11);
            Font fTitle = wb.createFont(); fTitle.setBold(true); fTitle.setFontHeightInPoints((short) 14);
            Font fHdr = wb.createFont(); fHdr.setBold(true); fHdr.setFontHeightInPoints((short) 11);
            fHdr.setColor(IndexedColors.WHITE.getIndex());

            // --- boldCenter ---
            boldCenter = wb.createCellStyle();
            boldCenter.setFont(fBold);
            boldCenter.setAlignment(HorizontalAlignment.CENTER);
            boldCenter.setVerticalAlignment(VerticalAlignment.CENTER);
            boldCenter.setWrapText(true);

            // --- boldLeft ---
            boldLeft = wb.createCellStyle();
            boldLeft.setFont(fBold);
            boldLeft.setAlignment(HorizontalAlignment.LEFT);

            // --- italicCenter ---
            italicCenter = wb.createCellStyle();
            italicCenter.setFont(fItal);
            italicCenter.setAlignment(HorizontalAlignment.CENTER);

            // --- italic ---
            italic = wb.createCellStyle();
            italic.setFont(fItal);
            italic.setAlignment(HorizontalAlignment.LEFT);

            // --- italicLeft ---
            italicLeft = wb.createCellStyle();
            italicLeft.setFont(fItal);
            italicLeft.setAlignment(HorizontalAlignment.LEFT);

            // --- title (large bold center) ---
            title = wb.createCellStyle();
            title.setFont(fTitle);
            title.setAlignment(HorizontalAlignment.CENTER);
            title.setVerticalAlignment(VerticalAlignment.CENTER);

            // --- tableHeader (blue bg, white text, bold) ---
            tableHeader = wb.createCellStyle();
            tableHeader.setFont(fHdr);
            tableHeader.setAlignment(HorizontalAlignment.CENTER);
            tableHeader.setVerticalAlignment(VerticalAlignment.CENTER);
            tableHeader.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            tableHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeader.setBorderTop(BorderStyle.THIN);    tableHeader.setBorderBottom(BorderStyle.THIN);
            tableHeader.setBorderLeft(BorderStyle.THIN);   tableHeader.setBorderRight(BorderStyle.THIN);
            tableHeader.setWrapText(true);

            // --- cell (bordered, left align) ---
            cell = wb.createCellStyle();
            cell.setFont(fNorm);
            cell.setAlignment(HorizontalAlignment.LEFT);
            cell.setVerticalAlignment(VerticalAlignment.CENTER);
            cell.setBorderTop(BorderStyle.THIN);    cell.setBorderBottom(BorderStyle.THIN);
            cell.setBorderLeft(BorderStyle.THIN);   cell.setBorderRight(BorderStyle.THIN);
            cell.setWrapText(true);

            // --- cellCenter (bordered, center) ---
            cellCenter = wb.createCellStyle();
            cellCenter.setFont(fNorm);
            cellCenter.setAlignment(HorizontalAlignment.CENTER);
            cellCenter.setVerticalAlignment(VerticalAlignment.CENTER);
            cellCenter.setBorderTop(BorderStyle.THIN);    cellCenter.setBorderBottom(BorderStyle.THIN);
            cellCenter.setBorderLeft(BorderStyle.THIN);   cellCenter.setBorderRight(BorderStyle.THIN);

            // --- cellDanger (red bg, center) ---
            cellDanger = wb.createCellStyle();
            cellDanger.setFont(fNorm);
            cellDanger.setAlignment(HorizontalAlignment.CENTER);
            cellDanger.setVerticalAlignment(VerticalAlignment.CENTER);
            cellDanger.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            cellDanger.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            cellDanger.setBorderTop(BorderStyle.THIN);    cellDanger.setBorderBottom(BorderStyle.THIN);
            cellDanger.setBorderLeft(BorderStyle.THIN);   cellDanger.setBorderRight(BorderStyle.THIN);

            // --- cellDangerLeft (red bg, left align) ---
            cellDangerLeft = wb.createCellStyle();
            cellDangerLeft.setFont(fNorm);
            cellDangerLeft.setAlignment(HorizontalAlignment.LEFT);
            cellDangerLeft.setVerticalAlignment(VerticalAlignment.CENTER);
            cellDangerLeft.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            cellDangerLeft.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            cellDangerLeft.setBorderTop(BorderStyle.THIN);    cellDangerLeft.setBorderBottom(BorderStyle.THIN);
            cellDangerLeft.setBorderLeft(BorderStyle.THIN);   cellDangerLeft.setBorderRight(BorderStyle.THIN);

            // --- plainLeft (no border, left align) ---
            plainLeft = wb.createCellStyle();
            plainLeft.setFont(fNorm);
            plainLeft.setAlignment(HorizontalAlignment.LEFT);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Lấy tên khoa từ sinh viên (qua lớp → khoa)
     */
    private String getFacultyName(SinhVien sv) {
        try {
            if (sv != null && sv.getLop() != null) {
                Lop lop = sv.getLop();
                if (lop.getMaKhoa() != null) {
                    String tenKhoa = lop.getMaKhoa().getTenKhoa();
                    if (tenKhoa != null && !tenKhoa.isBlank()) return tenKhoa;
                }
                if (lop.getTenLop() != null && !lop.getTenLop().isBlank()) {
                    String[] parts = lop.getTenLop().split("-");
                    if (parts.length > 0 && !parts[0].isBlank()) return parts[0].trim();
                }
            }
        } catch (Exception e) {
            log.warn("Không thể lấy khoa của sinh viên {}", sv != null ? sv.getMaSv() : "null");
        }
        return "Khác";
    }

    private long toLong(Object v) {
        if (v instanceof Long)    return (Long) v;
        if (v instanceof Integer) return ((Integer) v).longValue();
        if (v instanceof Number)  return ((Number) v).longValue();
        return 0L;
    }
}
