package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.StatisticsDTO;
import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Model.Ban;
import com.tathanhloc.faceattendance.Repository.BanRepository;
import com.tathanhloc.faceattendance.Repository.TaiKhoanRepository;
import com.tathanhloc.faceattendance.Repository.HoatDongRepository;
import com.tathanhloc.faceattendance.Repository.DangKyHoatDongRepository;
import com.tathanhloc.faceattendance.Repository.DiemDanhHoatDongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
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
    private final BanRepository banRepository;

    /**
     * Lấy thống kê toàn bộ hệ thống
     * @return StatisticsDTO chứa toàn bộ thống kê
     */
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

    /**
     * Lấy thống kê tài khoản theo vai trò
     * @return Map<String, Long> tên vai trò -> số lượng
     */
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

    /**
     * Lấy thống kê tài khoản theo ban chuyên môn
     * @return Map<String, Long> tên ban -> số lượng
     */
    public Map<String, Long> getAccountsByDepartmentStatistics() {
        log.info("Lấy thống kê tài khoản theo ban chuyên môn");

        Map<String, Long> statistics = new LinkedHashMap<>();

        for (Ban ban : banRepository.findAll()) {
            long count = taiKhoanRepository.countByBanChuyenMon(ban);
            if (count > 0) {
                statistics.put(ban.getTenBan(), count);
            }
        }

        return statistics;
    }

    /**
     * Lấy thống kê tài khoản theo trạng thái phê duyệt
     * @return Map<String, Long> trạng thái -> số lượng
     */
    public Map<String, Long> getAccountsByApprovalStatusStatistics() {
        log.info("Lấy thống kê tài khoản theo trạng thái phê duyệt");

        Map<String, Long> statistics = new LinkedHashMap<>();

        long choPhedhuyet = taiKhoanRepository.countByTrangThaiPheDuyet("CHO_PHE_DUYET");
        long daphedhuyet = taiKhoanRepository.countByTrangThaiPheDuyet("DA_PHE_DUYET");
        long tuchoi = taiKhoanRepository.countByTrangThaiPheDuyet("TU_CHOI");

        if (choPhedhuyet > 0) {
            statistics.put("Chờ phê duyệt", choPhedhuyet);
        }
        if (daphedhuyet > 0) {
            statistics.put("Đã phê duyệt", daphedhuyet);
        }
        if (tuchoi > 0) {
            statistics.put("Từ chối", tuchoi);
        }

        return statistics;
    }

    /**
     * Lấy thống kê chi tiết theo vai trò
     * @param vaiTro Vai trò cần thống kê
     * @return Map<String, Object> chứa thống kê chi tiết
     */
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
        statistics.put("nhom", vaiTro.getNhomVaiTro());
        statistics.put("toChuc", vaiTro.getToChuc());

        return statistics;
    }

    /**
     * Lấy số tài khoản chờ phê duyệt
     * @return Số lượng tài khoản chờ phê duyệt
     */
    public long getPendingApprovalsCount() {
        log.info("Lấy số tài khoản chờ phê duyệt");
        return taiKhoanRepository.countByTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    /**
     * Lấy thống kê hoạt động
     * @return Map<String, Object> thống kê hoạt động
     */
    public Map<String, Object> getActivityStatistics() {
        log.info("Lấy thống kê hoạt động");

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

    /**
     * Lấy thống kê trong khoảng thời gian
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Map<String, Object> thống kê trong thời gian
     */
    public Map<String, Object> getStatisticsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Lấy thống kê từ {} đến {}", startDate, endDate);

        Map<String, Object> statistics = new LinkedHashMap<>();

        // Thống kê tài khoản được tạo trong khoảng thời gian
        var newAccounts = taiKhoanRepository.findAll()
                .stream()
                .filter(tk -> tk.getCreatedAt() != null &&
                        tk.getCreatedAt().isAfter(startDate) &&
                        tk.getCreatedAt().isBefore(endDate))
                .count();

        statistics.put("startDate", startDate);
        statistics.put("endDate", endDate);
        statistics.put("newAccountsInPeriod", newAccounts);

        return statistics;
    }

    /**
     * Lấy top N roles có nhiều thành viên nhất
     * @param limit Số lượng roles muốn lấy
     * @return List<Map<String, Object>> danh sách roles
     */
    public List<Map<String, Object>> getTopRoles(int limit) {
        log.info("Lấy top {} roles có nhiều thành viên nhất", limit);

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

    /**
     * Lấy tổng số tài khoản theo nhóm vai trò
     * @return Map<String, Long> nhóm vai trò -> số lượng
     */
    public Map<String, Long> getAccountsByRoleGroup() {
        log.info("Lấy thống kê tài khoản theo nhóm vai trò");

        Map<String, Long> statistics = new LinkedHashMap<>();

        long quanLy = 0;
        long phuVu = 0;
        long thamGia = 0;

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            if ("QUAN_LY".equals(vaiTro.getNhomVaiTro())) {
                quanLy += count;
            } else if ("PHU_VU".equals(vaiTro.getNhomVaiTro())) {
                phuVu += count;
            } else if ("THAM_GIA".equals(vaiTro.getNhomVaiTro())) {
                thamGia += count;
            }
        }

        if (quanLy > 0) statistics.put("Quản lý", quanLy);
        if (phuVu > 0) statistics.put("Phục vụ", phuVu);
        if (thamGia > 0) statistics.put("Thành viên", thamGia);

        return statistics;
    }

    /**
     * Lấy tổng số tài khoản theo tổ chức
     * @return Map<String, Long> tổ chức -> số lượng
     */
    public Map<String, Long> getAccountsByOrganization() {
        log.info("Lấy thống kê tài khoản theo tổ chức");

        Map<String, Long> statistics = new LinkedHashMap<>();

        long doan = 0;
        long hoi = 0;
        long heThong = 0;

        for (VaiTroEnum vaiTro : VaiTroEnum.values()) {
            long count = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vaiTro);
            if ("DOAN".equals(vaiTro.getToChuc())) {
                doan += count;
            } else if ("HOI".equals(vaiTro.getToChuc())) {
                hoi += count;
            } else if ("HE_THONG".equals(vaiTro.getToChuc())) {
                heThong += count;
            }
        }

        if (doan > 0) statistics.put("Đoàn", doan);
        if (hoi > 0) statistics.put("Hội", hoi);
        if (heThong > 0) statistics.put("Hệ thống", heThong);

        return statistics;
    }

    public ByteArrayInputStream exportGeneralReport(String type) throws IOException {
        List<Map<String, Object>> reportData = (List<Map<String, Object>>) getReportByType(type, null, null).get("data");

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Báo cáo hoạt động");

            // Xác định danh sách các khoa có trong dữ liệu
            Set<String> allFaculties = new TreeSet<>();
            reportData.forEach(d -> {
                Map<String, Long> fb = (Map<String, Long>) d.get("facultyBreakdown");
                if (fb != null) allFaculties.addAll(fb.keySet());
            });

            Row headerRow = sheet.createRow(0);
            String[] baseCols = {"STT", "Mã hoạt động", "Tên hoạt động", "Ngày tổ chức", "Tổng đăng ký", "Đã điểm danh"};
            int colIdx = 0;
            for (String c : baseCols) headerRow.createCell(colIdx++).setCellValue(c);
            for (String f : allFaculties) headerRow.createCell(colIdx++).setCellValue("Khoa: " + f);

            int rowIdx = 1;
            for (Map<String, Object> data : reportData) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(String.valueOf(data.get("maHoatDong")));
                row.createCell(2).setCellValue(String.valueOf(data.get("tenHoatDong")));
                row.createCell(3).setCellValue(data.get("ngayToChuc") != null ? data.get("ngayToChuc").toString() : "");
                row.createCell(4).setCellValue(Double.parseDouble(data.get("tongDangKy").toString()));
                row.createCell(5).setCellValue(Double.parseDouble(data.get("daDiemDanh").toString()));

                int fCol = 6;
                Map<String, Long> fb = (Map<String, Long>) data.get("facultyBreakdown");
                for (String f : allFaculties) {
                    row.createCell(fCol++).setCellValue(fb != null ? fb.getOrDefault(f, 0L) : 0L);
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public Map<String, Object> getGeneralStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalAttendance = diemDanhHoatDongRepository.count();
        long successful = diemDanhHoatDongRepository.countByHoatDongMaHoatDongAndTrangThai(null, com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum.DA_THAM_GIA);
        long absent = diemDanhHoatDongRepository.countByHoatDongMaHoatDongAndTrangThai(null, com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum.VANG_MAT);
        
        stats.put("tongLuotDiemDanh", totalAttendance);
        stats.put("diemDanhThanhCong", successful);
        stats.put("vangKhongPhep", absent);
        stats.put("tiLeCoMat", totalAttendance > 0 ? Math.round((double) successful / totalAttendance * 100 * 100.0) / 100.0 : 0);
        
        Map<String, Long> byFaculty = new HashMap<>();
        stats.put("thongKeTheoKhoa", byFaculty);
        
        return stats;
    }

    public Map<String, Object> getReportByType(String type, String from, String to) {
        Map<String, Object> report = new HashMap<>();
        
        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(6);
        LocalDateTime end = to != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        List<Map<String, Object>> data = hoatDongRepository.findAll().stream()
                .filter(hd -> hd.getNgayToChuc() != null && 
                             !hd.getNgayToChuc().isBefore(start.toLocalDate()) && 
                             !hd.getNgayToChuc().isAfter(end.toLocalDate()))
                .map(hd -> {
                    Map<String, Object> m = new HashMap<>();
                    String maHĐ = hd.getMaHoatDong();
                    m.put("maHoatDong", maHĐ);
                    m.put("tenHoatDong", hd.getTenHoatDong());
                    m.put("ngayToChuc", hd.getNgayToChuc());
                    m.put("tongDangKy", dangKyHoatDongRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHĐ));
                    m.put("daDiemDanh", diemDanhHoatDongRepository.countByHoatDongMaHoatDong(maHĐ));
                    
                    Map<String, Long> facultyBreakdown = new HashMap<>();
                    diemDanhHoatDongRepository.findByHoatDongMaHoatDong(maHĐ).forEach(dd -> {
                        String k = (dd.getSinhVien().getLop() != null) ? 
                                   dd.getSinhVien().getLop().getTenLop().split("-")[0] : "Khác";
                        facultyBreakdown.put(k, facultyBreakdown.getOrDefault(k, 0L) + 1);
                    });
                    m.put("facultyBreakdown", facultyBreakdown);
                    return m;
                })
                .collect(Collectors.toList());
        
        report.put("data", data);
        return report;
    }
}
