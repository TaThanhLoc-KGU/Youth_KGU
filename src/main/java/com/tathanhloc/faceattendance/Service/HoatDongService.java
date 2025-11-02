package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ActivityStatisticsDTO;
import com.tathanhloc.faceattendance.DTO.ActivityTrendDTO;
import com.tathanhloc.faceattendance.DTO.HoatDongDTO;
import com.tathanhloc.faceattendance.DTO.ParticipationByFacultyDTO;
import com.tathanhloc.faceattendance.Enum.*;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý Hoạt động Đoàn - Hội
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HoatDongService {

    private final HoatDongRepository hoatDongRepository;
    private final BCHDoanHoiRepository bchRepository;
    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final PhongHocRepository phongHocRepository;
    private final DangKyHoatDongRepository dangKyRepository;
    private final DiemDanhHoatDongRepository diemDanhRepository;
    private final SinhVienRepository sinhVienRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getAll() {
        log.debug("Getting all active activities");
        return hoatDongRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<HoatDongDTO> getAllWithPagination(Pageable pageable) {
        log.debug("Getting all activities with pagination");
        return hoatDongRepository.findByIsActive(true, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public HoatDongDTO getById(String maHoatDong) {
        log.debug("Getting activity by ID: {}", maHoatDong);
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        return toDTO(hoatDong);
    }

    @Transactional
    public HoatDongDTO create(HoatDongDTO dto) {
        log.info("Creating new activity: {}", dto.getMaHoatDong());

        // Validate
        if (hoatDongRepository.existsById(dto.getMaHoatDong())) {
            throw new RuntimeException("Mã hoạt động đã tồn tại: " + dto.getMaHoatDong());
        }

        HoatDong hoatDong = toEntity(dto);
        hoatDong.setIsActive(true);
        hoatDong = hoatDongRepository.save(hoatDong);

        log.info("Activity created successfully: {}", hoatDong.getMaHoatDong());
        return toDTO(hoatDong);
    }

    @Transactional
    public HoatDongDTO update(String maHoatDong, HoatDongDTO dto) {
        log.info("Updating activity: {}", maHoatDong);

        HoatDong existing = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        updateEntity(existing, dto);
        existing = hoatDongRepository.save(existing);

        log.info("Activity updated successfully: {}", maHoatDong);
        return toDTO(existing);
    }

    @Transactional
    public void delete(String maHoatDong) {
        log.info("Soft deleting activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setIsActive(false);
        hoatDongRepository.save(hoatDong);

        log.info("Activity soft deleted: {}", maHoatDong);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getByTrangThai(TrangThaiHoatDongEnum trangThai) {
        log.debug("Getting activities by status: {}", trangThai);
        return hoatDongRepository.findByTrangThaiAndIsActive(trangThai, true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getByLoaiHoatDong(LoaiHoatDongEnum loaiHoatDong) {
        log.debug("Getting activities by type: {}", loaiHoatDong);
        return hoatDongRepository.findByLoaiHoatDong(loaiHoatDong).stream()
                .filter(hd -> hd.getIsActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getByCapDo(CapDoEnum capDo) {
        log.debug("Getting activities by level: {}", capDo);
        return hoatDongRepository.findByCapDo(capDo).stream()
                .filter(hd -> hd.getIsActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getUpcomingActivities() {
        log.debug("Getting upcoming activities");
        return hoatDongRepository.findUpcomingActivities(LocalDate.now()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getOngoingActivities() {
        log.debug("Getting ongoing activities");
        LocalDate today = LocalDate.now();
        return hoatDongRepository.findOngoingActivities(today).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> searchByKeyword(String keyword) {
        log.debug("Searching activities by keyword: {}", keyword);
        return hoatDongRepository.searchByKeyword(keyword).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getByDateRange(LocalDate startDate, LocalDate endDate) {
        log.debug("Getting activities from {} to {}", startDate, endDate);
        return hoatDongRepository.findByDateRange(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== BUSINESS LOGIC ==========

    @Transactional
    public void openRegistration(String maHoatDong) {
        log.info("Opening registration for activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setChoPhepDangKy(true);
        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DANG_MO_DANG_KY);
        hoatDongRepository.save(hoatDong);

        log.info("Registration opened for: {}", maHoatDong);
    }

    @Transactional
    public void closeRegistration(String maHoatDong) {
        log.info("Closing registration for activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setChoPhepDangKy(false);
        hoatDong.setTrangThai(TrangThaiHoatDongEnum.SAP_DIEN_RA);
        hoatDongRepository.save(hoatDong);

        log.info("Registration closed for: {}", maHoatDong);
    }

    @Transactional
    public void startActivity(String maHoatDong) {
        log.info("Starting activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DANG_DIEN_RA);
        hoatDongRepository.save(hoatDong);

        log.info("Activity started: {}", maHoatDong);
    }

    @Transactional
    public void completeActivity(String maHoatDong) {
        log.info("Completing activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DA_HOAN_THANH);
        hoatDong.setChoPhepDangKy(false);
        hoatDongRepository.save(hoatDong);

        log.info("Activity completed: {}", maHoatDong);
    }

    @Transactional
    public void cancelActivity(String maHoatDong, String lyDo) {
        log.info("Cancelling activity: {} - Reason: {}", maHoatDong, lyDo);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DA_HUY);
        hoatDong.setChoPhepDangKy(false);
        hoatDong.setGhiChu(hoatDong.getGhiChu() + "\n[HỦY] " + lyDo);
        hoatDongRepository.save(hoatDong);

        log.info("Activity cancelled: {}", maHoatDong);
    }

    // ========== STATISTICS ==========

    @Transactional(readOnly = true)
    public Map<String, Object> getActivityStatistics(String maHoatDong) {
        log.debug("Getting statistics for activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        long soDangKy = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);
        long daThamGia = diemDanhRepository.countByHoatDongMaHoatDongAndTrangThai(
                maHoatDong, TrangThaiThamGiaEnum.DA_THAM_GIA);
        long chuaCheckIn = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong) -
                diemDanhRepository.countByHoatDongMaHoatDong(maHoatDong);

        double tyLeThamGia = soDangKy > 0 ? (double) daThamGia / soDangKy * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("hoatDong", toDTO(hoatDong));
        stats.put("soDangKy", soDangKy);
        stats.put("daThamGia", daThamGia);
        stats.put("chuaCheckIn", chuaCheckIn);
        stats.put("tyLeThamGia", Math.round(tyLeThamGia * 100.0) / 100.0);
        stats.put("soLuongToiDa", hoatDong.getSoLuongToiDa());
        stats.put("conTrong", hoatDong.getSoLuongToiDa() - soDangKy);

        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStatisticsByStatus() {
        List<Object[]> results = hoatDongRepository.countByTrangThai();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> ((TrangThaiHoatDongEnum) row[0]).name(),
                        row -> (Long) row[1]
                ));
    }

    // ========== MAPPING METHODS ==========

    private HoatDongDTO toDTO(HoatDong entity) {
        if (entity == null) return null;

        return HoatDongDTO.builder()
                .maHoatDong(entity.getMaHoatDong())
                .tenHoatDong(entity.getTenHoatDong())
                .moTa(entity.getMoTa())
                .loaiHoatDong(entity.getLoaiHoatDong())
                .capDo(entity.getCapDo())
                .ngayToChuc(entity.getNgayToChuc())
                .gioToChuc(entity.getGioToChuc())
                .diaDiem(entity.getDiaDiem())
                .maPhong(entity.getPhongHoc() != null ? entity.getPhongHoc().getMaPhong() : null)
                .tenPhong(entity.getPhongHoc() != null ? entity.getPhongHoc().getTenPhong() : null)
                .soLuongToiDa(entity.getSoLuongToiDa())
                .diemRenLuyen(entity.getDiemRenLuyen())
                .maBchPhuTrach(entity.getNguoiPhuTrach() != null ? entity.getNguoiPhuTrach().getMaBch() : null)
                .tenNguoiPhuTrach(entity.getNguoiPhuTrach() != null ? entity.getNguoiPhuTrach().getHoTen() : null)
                .maKhoa(entity.getKhoa() != null ? entity.getKhoa().getMaKhoa() : null)
                .tenKhoa(entity.getKhoa() != null ? entity.getKhoa().getTenKhoa() : null)
                .maNganh(entity.getNganh() != null ? entity.getNganh().getMaNganh() : null)
                .tenNganh(entity.getNganh() != null ? entity.getNganh().getTenNganh() : null)
                .trangThai(entity.getTrangThai())
                .yeuCauDiemDanh(entity.getYeuCauDiemDanh())
                .choPhepDangKy(entity.getChoPhepDangKy())
                .hanDangKy(entity.getHanDangKy())
                .hinhAnhPoster(entity.getHinhAnhPoster())
                .ghiChu(entity.getGhiChu())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private HoatDong toEntity(HoatDongDTO dto) {
        HoatDong entity = HoatDong.builder()
                .maHoatDong(dto.getMaHoatDong())
                .tenHoatDong(dto.getTenHoatDong())
                .moTa(dto.getMoTa())
                .loaiHoatDong(dto.getLoaiHoatDong())
                .capDo(dto.getCapDo())
                .ngayToChuc(dto.getNgayToChuc())
                .gioToChuc(dto.getGioToChuc())
                .diaDiem(dto.getDiaDiem())
                .soLuongToiDa(dto.getSoLuongToiDa())
                .diemRenLuyen(dto.getDiemRenLuyen())
                .trangThai(dto.getTrangThai() != null ? dto.getTrangThai() : TrangThaiHoatDongEnum.SAP_DIEN_RA)
                .yeuCauDiemDanh(dto.getYeuCauDiemDanh() != null ? dto.getYeuCauDiemDanh() : true)
                .choPhepDangKy(dto.getChoPhepDangKy() != null ? dto.getChoPhepDangKy() : true)
                .hanDangKy(dto.getHanDangKy())
                .hinhAnhPoster(dto.getHinhAnhPoster())
                .ghiChu(dto.getGhiChu())
                .isActive(true)
                .build();

        // Set relationships
        if (dto.getMaPhong() != null) {
            entity.setPhongHoc(phongHocRepository.findById(dto.getMaPhong()).orElse(null));
        }
        if (dto.getMaBchPhuTrach() != null) {
            entity.setNguoiPhuTrach(bchRepository.findById(dto.getMaBchPhuTrach()).orElse(null));
        }
        if (dto.getMaKhoa() != null) {
            entity.setKhoa(khoaRepository.findById(dto.getMaKhoa()).orElse(null));
        }
        if (dto.getMaNganh() != null) {
            entity.setNganh(nganhRepository.findById(dto.getMaNganh()).orElse(null));
        }

        return entity;
    }

    private void updateEntity(HoatDong entity, HoatDongDTO dto) {
        if (dto.getTenHoatDong() != null) entity.setTenHoatDong(dto.getTenHoatDong());
        if (dto.getMoTa() != null) entity.setMoTa(dto.getMoTa());
        if (dto.getLoaiHoatDong() != null) entity.setLoaiHoatDong(dto.getLoaiHoatDong());
        if (dto.getCapDo() != null) entity.setCapDo(dto.getCapDo());
        if (dto.getNgayToChuc() != null) entity.setNgayToChuc(dto.getNgayToChuc());
        if (dto.getGioToChuc() != null) entity.setGioToChuc(dto.getGioToChuc());
        if (dto.getDiaDiem() != null) entity.setDiaDiem(dto.getDiaDiem());
        if (dto.getSoLuongToiDa() != null) entity.setSoLuongToiDa(dto.getSoLuongToiDa());
        if (dto.getDiemRenLuyen() != null) entity.setDiemRenLuyen(dto.getDiemRenLuyen());
        if (dto.getTrangThai() != null) entity.setTrangThai(dto.getTrangThai());
        if (dto.getYeuCauDiemDanh() != null) entity.setYeuCauDiemDanh(dto.getYeuCauDiemDanh());
        if (dto.getChoPhepDangKy() != null) entity.setChoPhepDangKy(dto.getChoPhepDangKy());
        if (dto.getHanDangKy() != null) entity.setHanDangKy(dto.getHanDangKy());
        if (dto.getHinhAnhPoster() != null) entity.setHinhAnhPoster(dto.getHinhAnhPoster());
        if (dto.getGhiChu() != null) entity.setGhiChu(dto.getGhiChu());

        // Update relationships
        if (dto.getMaPhong() != null) {
            entity.setPhongHoc(phongHocRepository.findById(dto.getMaPhong()).orElse(null));
        }
        if (dto.getMaBchPhuTrach() != null) {
            entity.setNguoiPhuTrach(bchRepository.findById(dto.getMaBchPhuTrach()).orElse(null));
        }
        if (dto.getMaKhoa() != null) {
            entity.setKhoa(khoaRepository.findById(dto.getMaKhoa()).orElse(null));
        }
        if (dto.getMaNganh() != null) {
            entity.setNganh(nganhRepository.findById(dto.getMaNganh()).orElse(null));
        }
    }

    // ========== THỐNG KÊ METHODS ==========

    @Transactional(readOnly = true)
    public List<ParticipationByFacultyDTO> getParticipationByFaculty(
            String maHoatDong, LocalDate fromDate, LocalDate toDate) {
        log.debug("Getting participation statistics by faculty");

        // Lấy danh sách khoa
        List<Khoa> faculties = khoaRepository.findByIsActiveTrue();

        return faculties.stream().map(khoa -> {
            // Đếm sinh viên theo khoa
            long tongSinhVien = sinhVienRepository.countByLopMaKhoaMaKhoaAndIsActiveTrue(khoa.getMaKhoa());

            // Đếm đăng ký và tham gia
            long soLuongDangKy = dangKyRepository.countByKhoaAndDateRange(
                    khoa.getMaKhoa(), maHoatDong, fromDate, toDate);

            long soLuongThamGia = diemDanhRepository.countByKhoaAndDateRange(
                    khoa.getMaKhoa(), maHoatDong, fromDate, toDate);

            // Đếm hoạt động
            long tongHoatDong = hoatDongRepository.countByKhoaAndDateRange(
                    khoa.getMaKhoa(), fromDate, toDate);

            double tiLeThamGia = tongSinhVien > 0 ?
                    (double) soLuongThamGia / tongSinhVien * 100 : 0;

            return ParticipationByFacultyDTO.builder()
                    .maKhoa(khoa.getMaKhoa())
                    .tenKhoa(khoa.getTenKhoa())
                    .tongSinhVien(tongSinhVien)
                    .soLuongDangKy(soLuongDangKy)
                    .soLuongThamGia(soLuongThamGia)
                    .tiLeThamGia(Math.round(tiLeThamGia * 100.0) / 100.0)
                    .tongHoatDong(tongHoatDong)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityTrendDTO> getActivityTrends(int months) {
        log.debug("Getting activity trends for {} months", months);

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months);

        List<ActivityTrendDTO> trends = new ArrayList<>();

        for (int i = 0; i < months; i++) {
            LocalDate periodStart = startDate.plusMonths(i);
            LocalDate periodEnd = periodStart.plusMonths(1).minusDays(1);

            // Đếm hoạt động trong tháng
            long totalActivities = hoatDongRepository.countByNgayToChucBetween(periodStart, periodEnd);

            long completedActivities = hoatDongRepository.countByTrangThaiAndNgayToChucBetween(
                    TrangThaiHoatDongEnum.DA_HOAN_THANH, periodStart, periodEnd);

            // Đếm đăng ký và điểm danh
            long totalRegistrations = dangKyRepository.countByNgayDangKyBetween(
                    periodStart.atStartOfDay(), periodEnd.atTime(23, 59, 59));

            long totalAttendance = diemDanhRepository.countByThoiGianCheckInBetween(
                    periodStart.atStartOfDay(), periodEnd.atTime(23, 59, 59));

            double avgAttendanceRate = totalRegistrations > 0 ?
                    (double) totalAttendance / totalRegistrations * 100 : 0;

            trends.add(ActivityTrendDTO.builder()
                    .period(periodStart.getYear() + "-" + String.format("%02d", periodStart.getMonthValue()))
                    .year(periodStart.getYear())
                    .month(periodStart.getMonthValue())
                    .totalActivities(totalActivities)
                    .completedActivities(completedActivities)
                    .totalRegistrations(totalRegistrations)
                    .totalAttendance(totalAttendance)
                    .averageAttendanceRate(Math.round(avgAttendanceRate * 100.0) / 100.0)
                    .build());
        }

        return trends;
    }

    @Transactional(readOnly = true)
    public ActivityStatisticsDTO getActivityStatistics(LocalDate fromDate, LocalDate toDate) {
        log.debug("Getting activity statistics");

        // Xác định khoảng thời gian
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(6);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        // Đếm theo trạng thái
        Map<String, Long> statusStats = getStatisticsByStatus();

        // Thống kê theo loại
        Map<String, Long> thongKeTheoLoai = new HashMap<>();
        for (LoaiHoatDongEnum loai : LoaiHoatDongEnum.values()) {
            long count = hoatDongRepository.countByLoaiHoatDongAndNgayToChucBetween(
                    loai, start, end);
            if (count > 0) {
                thongKeTheoLoai.put(loai.name(), count);
            }
        }

        // Thống kê theo cấp độ
        Map<String, Long> thongKeTheoCapDo = new HashMap<>();
        for (CapDoEnum capDo : CapDoEnum.values()) {
            long count = hoatDongRepository.countByCapDoAndNgayToChucBetween(
                    capDo, start, end);
            if (count > 0) {
                thongKeTheoCapDo.put(capDo.name(), count);
            }
        }

        // Thống kê đăng ký và tham gia
        long tongLuotDangKy = dangKyRepository.countByNgayDangKyBetween(
                start.atStartOfDay(), end.atTime(23, 59, 59));

        long tongLuotThamGia = diemDanhRepository.countByThoiGianCheckInBetween(
                start.atStartOfDay(), end.atTime(23, 59, 59));

        double tiLeThamGia = tongLuotDangKy > 0 ?
                (double) tongLuotThamGia / tongLuotDangKy * 100 : 0;

        // Tính điểm rèn luyện
        Integer tongDiem = hoatDongRepository.sumDiemRenLuyenByDateRange(start, end);
        long soHoatDong = hoatDongRepository.countByNgayToChucBetween(start, end);
        double diemTrungBinh = soHoatDong > 0 ? (double) tongDiem / soHoatDong : 0;

        return ActivityStatisticsDTO.builder()
                .tongHoatDong(statusStats.values().stream().mapToLong(Long::longValue).sum())
                .hoatDongSapDienRa(statusStats.getOrDefault("SAP_DIEN_RA", 0L))
                .hoatDongDangDienRa(statusStats.getOrDefault("DANG_DIEN_RA", 0L))
                .hoatDongDaHoanThanh(statusStats.getOrDefault("DA_HOAN_THANH", 0L))
                .hoatDongDaHuy(statusStats.getOrDefault("DA_HUY", 0L))
                .thongKeTheoLoai(thongKeTheoLoai)
                .thongKeTheoCapDo(thongKeTheoCapDo)
                .tongLuotDangKy(tongLuotDangKy)
                .tongLuotThamGia(tongLuotThamGia)
                .tiLeThamGiaTrungBinh(Math.round(tiLeThamGia * 100.0) / 100.0)
                .tongDiemRenLuyen(tongDiem != null ? tongDiem : 0)
                .diemRenLuyenTrungBinh(Math.round(diemTrungBinh * 100.0) / 100.0)
                .build();
    }
}