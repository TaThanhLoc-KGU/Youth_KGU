package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý điểm danh hoạt động qua QR Code
 * CORE SERVICE - Xử lý logic quét QR code
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DiemDanhHoatDongService {

    private final DiemDanhHoatDongRepository diemDanhRepository;
    private final DangKyHoatDongRepository dangKyRepository;
    private final HoatDongRepository hoatDongRepository;
    private final SinhVienRepository sinhVienRepository;
    private final BCHDoanHoiRepository bchRepository;
    private final QRCodeService qrCodeService;
    private final KhoaRepository khoaRepository;
    private final LopRepository lopRepository;
    // ========== QR CODE ATTENDANCE ==========

    /**
     * CHỨC NĂNG CHÍNH: Quét QR Code để điểm danh
     * Workflow: Validate QR → Check đã quét → Tạo bản ghi điểm danh
     */
    @Transactional
    public DiemDanhQRResponse scanQRCode(DiemDanhQRRequest request) {
        log.info("Processing QR scan: {} by BCH: {}", request.getMaQR(), request.getMaBchXacNhan());

        try {
            // STEP 1: Validate QR format
            if (!qrCodeService.validateQRFormat(request.getMaQR())) {
                return DiemDanhQRResponse.failed("Mã QR không hợp lệ");
            }

            // STEP 2: Tìm đăng ký từ mã QR
            DangKyHoatDong dangKy = dangKyRepository.findByMaQRWithDetails(request.getMaQR())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với mã QR này"));

            if (!dangKy.getIsActive()) {
                return DiemDanhQRResponse.failed("Đăng ký đã bị hủy");
            }

            // STEP 3: Validate hoạt động
            HoatDong hoatDong = dangKy.getHoatDong();
            if (!hoatDong.getYeuCauDiemDanh()) {
                return DiemDanhQRResponse.failed("Hoạt động này không yêu cầu điểm danh");
            }

            // STEP 4: Kiểm tra đã quét chưa
            boolean daQuet = diemDanhRepository.isQRAlreadyUsed(request.getMaQR(), hoatDong.getMaHoatDong());
            if (daQuet) {
                return DiemDanhQRResponse.failed("Mã QR này đã được quét rồi");
            }

            // STEP 5: Validate người xác nhận (BCH)
            BCHDoanHoi nguoiXacNhan = null;
            if (request.getMaBchXacNhan() != null) {
                nguoiXacNhan = bchRepository.findById(request.getMaBchXacNhan())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH"));
            }

            // STEP 6: Tạo bản ghi điểm danh
            DiemDanhHoatDong diemDanh = DiemDanhHoatDong.builder()
                    .hoatDong(hoatDong)
                    .sinhVien(dangKy.getSinhVien())
                    .maQRDaQuet(request.getMaQR())
                    .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                    .thoiGianCheckIn(LocalDateTime.now())
                    .nguoiCheckIn(nguoiXacNhan)
                    .thietBiQuet(request.getThietBi())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .ghiChu(request.getGhiChu())
                    .build();

            diemDanh = diemDanhRepository.save(diemDanh);

            log.info("QR scan successful: student={}, activity={}",
                    dangKy.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());

            return DiemDanhQRResponse.success(
                    "Điểm danh thành công",
                    toDTO(diemDanh)
            );

        } catch (Exception e) {
            log.error("Error processing QR scan: {}", request.getMaQR(), e);
            return DiemDanhQRResponse.failed("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Validate QR Code trước khi quét (để UI hiển thị)
     */
    @Transactional(readOnly = true)
    public QRValidationResult validateQRCode(String maQR, String maHoatDong) {
        log.debug("Validating QR code: {} for activity: {}", maQR, maHoatDong);

        // Check 1: Format
        if (!qrCodeService.validateQRFormat(maQR)) {
            return QRValidationResult.invalid("Mã QR không hợp lệ");
        }

        // Check 2: Tồn tại
        Optional<DangKyHoatDong> dangKyOpt = dangKyRepository.findByMaQR(maQR);
        if (dangKyOpt.isEmpty()) {
            return QRValidationResult.invalid("Mã QR không tồn tại trong hệ thống");
        }

        DangKyHoatDong dangKy = dangKyOpt.get();

        // Check 3: Active
        if (!dangKy.getIsActive()) {
            return QRValidationResult.invalid("Đăng ký đã bị hủy");
        }

        // Check 4: Đúng hoạt động
        if (!dangKy.getId().getMaHoatDong().equals(maHoatDong)) {
            return QRValidationResult.invalid("Mã QR không thuộc hoạt động này");
        }

        // Check 5: Đã quét chưa
        boolean daQuet = diemDanhRepository.isQRAlreadyUsed(maQR, maHoatDong);
        if (daQuet) {
            return QRValidationResult.invalid("Mã QR đã được sử dụng");
        }

        // Valid!
        return QRValidationResult.valid(
                "Mã QR hợp lệ",
                dangKy.getSinhVien().getHoTen(),
                dangKy.getSinhVien().getMaSv()
        );
    }

    // ========== CHECK-OUT FEATURE ==========

    /**
     * Check-out khi kết thúc hoạt động
     */
    @Transactional
    public DiemDanhHoatDongDTO checkOut(Long diemDanhId, String maBchXacNhan) {
        log.info("Processing check-out: diemDanhId={}, bch={}", diemDanhId, maBchXacNhan);

        DiemDanhHoatDong diemDanh = diemDanhRepository.findById(diemDanhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi điểm danh"));

        if (diemDanh.getThoiGianCheckOut() != null) {
            throw new RuntimeException("Đã check-out rồi");
        }

        BCHDoanHoi nguoiCheckOut = bchRepository.findById(maBchXacNhan)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH"));

        diemDanh.setThoiGianCheckOut(LocalDateTime.now());
        diemDanh.setNguoiCheckOut(nguoiCheckOut);

        diemDanh = diemDanhRepository.save(diemDanh);

        log.info("Check-out successful: {}", diemDanhId);
        return toDTO(diemDanh);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<DiemDanhHoatDongDTO> getByActivity(String maHoatDong) {
        log.debug("Getting attendance records for activity: {}", maHoatDong);
        return diemDanhRepository.findByHoatDongMaHoatDong(maHoatDong).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemDanhHoatDongDTO> getCheckedInStudents(String maHoatDong) {
        log.debug("Getting checked-in students for activity: {}", maHoatDong);
        return diemDanhRepository.findCheckedInStudents(maHoatDong).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNotCheckedInStudents(String maHoatDong) {
        log.debug("Getting not checked-in students for activity: {}", maHoatDong);

        List<Object[]> results = diemDanhRepository.findNotCheckedInStudents(maHoatDong);

        return results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("maSv", row[0]);
            map.put("hoTen", row[1]);
            map.put("maQR", row[2]);
            map.put("ngayDangKy", row[3]);
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DiemDanhHoatDongDTO> getByStudent(String maSv) {
        log.debug("Getting attendance records for student: {}", maSv);
        return diemDanhRepository.findBySinhVienMaSv(maSv).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== STATISTICS ==========

    @Transactional(readOnly = true)
    public Map<String, Object> getAttendanceStatistics(String maHoatDong) {
        log.debug("Getting attendance statistics for activity: {}", maHoatDong);

        long tongDangKy = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);
        long daCheckIn = diemDanhRepository.countByHoatDongMaHoatDong(maHoatDong);
        long chuaCheckIn = diemDanhRepository.countNotCheckedIn(maHoatDong);
        long daThamGia = diemDanhRepository.countByHoatDongMaHoatDongAndTrangThai(
                maHoatDong, TrangThaiThamGiaEnum.DA_THAM_GIA);

        double tyLeCheckIn = tongDangKy > 0 ? (double) daCheckIn / tongDangKy * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("tongDangKy", tongDangKy);
        stats.put("daCheckIn", daCheckIn);
        stats.put("chuaCheckIn", chuaCheckIn);
        stats.put("daThamGia", daThamGia);
        stats.put("tyLeCheckIn", Math.round(tyLeCheckIn * 100.0) / 100.0);

        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentAttendanceHistory(String maSv) {
        log.debug("Getting attendance history for student: {}", maSv);

        List<DiemDanhHoatDong> records = diemDanhRepository.findBySinhVienMaSv(maSv);

        long tongThamGia = records.size();
        long daThamGia = records.stream()
                .filter(dd -> dd.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA)
                .count();

        int tongDiemRenLuyen = records.stream()
                .filter(dd -> dd.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA)
                .mapToInt(dd -> dd.getHoatDong().getDiemRenLuyen() != null ?
                        dd.getHoatDong().getDiemRenLuyen() : 0)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("tongSoHoatDong", tongThamGia);
        stats.put("daThamGia", daThamGia);
        stats.put("tongDiemRenLuyen", tongDiemRenLuyen);
        stats.put("danhSach", records.stream().map(this::toDTO).collect(Collectors.toList()));

        return stats;
    }

    // ========== ADMIN OPERATIONS ==========

    @Transactional
    public void markAbsent(String maSv, String maHoatDong, String ghiChu) {
        log.info("Marking student as absent: student={}, activity={}", maSv, maHoatDong);

        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động"));

        // Check đã có bản ghi chưa
        Optional<DiemDanhHoatDong> existingOpt = diemDanhRepository
                .findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong);

        if (existingOpt.isPresent()) {
            DiemDanhHoatDong existing = existingOpt.get();
            existing.setTrangThai(TrangThaiThamGiaEnum.VANG_MAT);
            existing.setGhiChu(ghiChu);
            diemDanhRepository.save(existing);
        } else {
            DiemDanhHoatDong diemDanh = DiemDanhHoatDong.builder()
                    .hoatDong(hoatDong)
                    .sinhVien(sinhVien)
                    .maQRDaQuet("ABSENT")
                    .trangThai(TrangThaiThamGiaEnum.VANG_MAT)
                    .ghiChu(ghiChu)
                    .build();
            diemDanhRepository.save(diemDanh);
        }

        log.info("Student marked as absent");
    }

    @Transactional
    public void deleteAttendance(Long diemDanhId) {
        log.info("Deleting attendance record: {}", diemDanhId);

        if (!diemDanhRepository.existsById(diemDanhId)) {
            throw new RuntimeException("Không tìm thấy bản ghi điểm danh");
        }

        diemDanhRepository.deleteById(diemDanhId);
        log.info("Attendance record deleted: {}", diemDanhId);
    }

    // ========== MAPPING METHODS ==========

    private DiemDanhHoatDongDTO toDTO(DiemDanhHoatDong entity) {
        if (entity == null) return null;

        return DiemDanhHoatDongDTO.builder()
                .id(entity.getId())
                .maHoatDong(entity.getHoatDong().getMaHoatDong())
                .tenHoatDong(entity.getHoatDong().getTenHoatDong())
                .maSv(entity.getSinhVien().getMaSv())
                .hoTenSinhVien(entity.getSinhVien().getHoTen())
                .emailSinhVien(entity.getSinhVien().getEmail())
                .tenLop(entity.getSinhVien().getLop().getTenLop())
                .maQRDaQuet(entity.getMaQRDaQuet())
                .trangThai(entity.getTrangThai())
                .thoiGianCheckIn(entity.getThoiGianCheckIn())
                .thoiGianCheckOut(entity.getThoiGianCheckOut())
                .maBchXacNhan(entity.getNguoiCheckIn() != null ?
                        entity.getNguoiCheckIn().getMaBch() : null)
                .tenNguoiXacNhan(entity.getNguoiCheckIn() != null ?
                        entity.getNguoiCheckIn().getHoTen() : null)
                .ghiChu(entity.getGhiChu())
                .thietBiQuet(entity.getThietBiQuet())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public AttendanceStatisticsDTO getAttendanceStatistics(
            String maHoatDong, String maKhoa, LocalDate fromDate, LocalDate toDate) {
        log.debug("Getting attendance statistics");

        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(3);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        // Thống kê tổng quan
        long tongLuotDiemDanh = diemDanhRepository.countByDateRange(start, end, maHoatDong, maKhoa);
        long diemDanhThanhCong = diemDanhRepository.countByTrangThaiAndDateRange(
                TrangThaiThamGiaEnum.DA_THAM_GIA,
                start.atStartOfDay(), end.atTime(23, 59, 59), maHoatDong, maKhoa);

        // Tính những trường hợp vắng (DANG_KY hoặc VANG_MAT)
        long vangKhongPhep = diemDanhRepository.countByTrangThaiAndDateRange(
                TrangThaiThamGiaEnum.VANG_MAT,
                start.atStartOfDay(), end.atTime(23, 59, 59), maHoatDong, maKhoa);

        // Điểm danh trễ - cần check thêm field soPhutTre
        long diemDanhTre = 0; // Cần implement query riêng cho trường hợp này

        double tiLeCoMat = tongLuotDiemDanh > 0 ?
                (double) diemDanhThanhCong / tongLuotDiemDanh * 100 : 0;
        double tiLeDiemDanhTre = tongLuotDiemDanh > 0 ?
                (double) diemDanhTre / tongLuotDiemDanh * 100 : 0;

        // Thống kê theo khoa
        Map<String, Long> thongKeTheoKhoa = new HashMap<>();
        List<Khoa> faculties = khoaRepository.findByIsActiveTrue();
        for (Khoa khoa : faculties) {
            long count = diemDanhRepository.countByKhoaAndDateRange(
                    khoa.getMaKhoa(), maHoatDong, start, end);
            if (count > 0) {
                thongKeTheoKhoa.put(khoa.getTenKhoa(), count);
            }
        }

        // Thống kê theo hoạt động
        Map<String, AttendanceByActivityDTO> thongKeTheoHoatDong = new HashMap<>();
        List<HoatDong> activities = maHoatDong != null ?
                List.of(hoatDongRepository.findById(maHoatDong).orElse(null)) :
                hoatDongRepository.findByNgayToChucBetween(start, end);

        for (HoatDong hd : activities) {
            if (hd == null) continue;

            long tongDangKy = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(hd.getMaHoatDong());
            long soLuongCoMat = diemDanhRepository.countByHoatDongMaHoatDongAndTrangThai(
                    hd.getMaHoatDong(), TrangThaiThamGiaEnum.DA_THAM_GIA);
            long soLuongVang = tongDangKy - soLuongCoMat;
            double tiLe = tongDangKy > 0 ? (double) soLuongCoMat / tongDangKy * 100 : 0;

            thongKeTheoHoatDong.put(hd.getMaHoatDong(), AttendanceByActivityDTO.builder()
                    .maHoatDong(hd.getMaHoatDong())
                    .tenHoatDong(hd.getTenHoatDong())
                    .tongDangKy(tongDangKy)
                    .soLuongCoMat(soLuongCoMat)
                    .soLuongVang(soLuongVang)
                    .tiLeCoMat(Math.round(tiLe * 100.0) / 100.0)
                    .build());
        }

        return AttendanceStatisticsDTO.builder()
                .tongLuotDiemDanh(tongLuotDiemDanh)
                .diemDanhThanhCong(diemDanhThanhCong)
                .diemDanhTre(diemDanhTre)
                .vangKhongPhep(vangKhongPhep)
                .tiLeCoMat(Math.round(tiLeCoMat * 100.0) / 100.0)
                .tiLeDiemDanhTre(Math.round(tiLeDiemDanhTre * 100.0) / 100.0)
                .thongKeTheoKhoa(thongKeTheoKhoa)
                .thongKeTheoHoatDong(thongKeTheoHoatDong)
                .build();
    }
    @Transactional(readOnly = true)
    public List<DiemDanhHoatDongDTO> getByDateRange(
            LocalDate fromDate, LocalDate toDate, String maHoatDong, String maSv) {
        log.debug("Getting attendance records from {} to {}", fromDate, toDate);

        LocalDateTime startDateTime = fromDate.atStartOfDay();
        LocalDateTime endDateTime = toDate.atTime(23, 59, 59);

        List<DiemDanhHoatDong> records;

        if (maHoatDong != null && maSv != null) {
            // Lọc theo cả hoạt động và sinh viên
            records = diemDanhRepository.findByHoatDongMaHoatDongAndSinhVienMaSvAndThoiGianCheckInBetween(
                    maHoatDong, maSv, startDateTime, endDateTime);
        } else if (maHoatDong != null) {
            // Chỉ lọc theo hoạt động
            records = diemDanhRepository.findByHoatDongMaHoatDongAndThoiGianCheckInBetween(
                    maHoatDong, startDateTime, endDateTime);
        } else if (maSv != null) {
            // Chỉ lọc theo sinh viên
            records = diemDanhRepository.findBySinhVienMaSvAndThoiGianCheckInBetween(
                    maSv, startDateTime, endDateTime);
        } else {
            // Lấy tất cả trong khoảng thời gian
            records = diemDanhRepository.findByThoiGianCheckInBetween(
                    startDateTime, endDateTime);
        }

        return records.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRateByClassDTO> getAttendanceRateByClass(
            String maHoatDong, String maKhoa, LocalDate fromDate, LocalDate toDate) {
        log.debug("Getting attendance rate by class");

        // Lấy danh sách lớp
        List<Lop> classes = lopRepository.findByIsActiveTrue();

        List<AttendanceRateByClassDTO> result = new ArrayList<>();

        for (Lop lop : classes) {
            // Filter theo khoa nếu có
            if (maKhoa != null && !lop.getNganh().getKhoa().getMaKhoa().equals(maKhoa)) {
                continue;
            }

            // Đếm sinh viên trong lớp
            long tongSinhVien = sinhVienRepository.countByLopMaLopAndIsActiveTrue(lop.getMaLop());

            if (tongSinhVien == 0) continue;

            // Đếm đăng ký và tham gia của lớp
            long tongLuotDangKy = dangKyRepository.countByLopAndDateRange(
                    lop.getMaLop(), maHoatDong, fromDate, toDate);

            long tongLuotThamGia = diemDanhRepository.countByLopAndDateRange(
                    lop.getMaLop(), maHoatDong, fromDate, toDate);

            long tongLuotVang = tongLuotDangKy - tongLuotThamGia;

            // Tính tỷ lệ
            double tiLeThamGia = tongLuotDangKy > 0 ?
                    (double) tongLuotThamGia / tongLuotDangKy * 100 : 0;
            double tiLeVang = tongLuotDangKy > 0 ?
                    (double) tongLuotVang / tongLuotDangKy * 100 : 0;

            // Đếm số hoạt động
            long soHoatDong = maHoatDong != null ? 1 :
                    hoatDongRepository.countByDateRange(fromDate, toDate);

            result.add(AttendanceRateByClassDTO.builder()
                    .maLop(lop.getMaLop())
                    .tenLop(lop.getTenLop())
                    .maKhoa(lop.getNganh().getKhoa().getMaKhoa())
                    .tenKhoa(lop.getNganh().getKhoa().getTenKhoa())
                    .maNganh(lop.getNganh().getMaNganh())
                    .tenNganh(lop.getNganh().getTenNganh())
                    .tongSinhVien(tongSinhVien)
                    .tongLuotDangKy(tongLuotDangKy)
                    .tongLuotThamGia(tongLuotThamGia)
                    .tongLuotVang(tongLuotVang)
                    .tiLeThamGia(Math.round(tiLeThamGia * 100.0) / 100.0)
                    .tiLeVang(Math.round(tiLeVang * 100.0) / 100.0)
                    .soHoatDong(soHoatDong)
                    .build());
        }

        // Sắp xếp theo tỷ lệ tham gia giảm dần
        result.sort((a, b) -> Double.compare(b.getTiLeThamGia(), a.getTiLeThamGia()));

        return result;
    }
}