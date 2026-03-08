package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
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
    private final NotificationService notificationService;

    // ========== QR CODE ATTENDANCE ==========

    /**
     * CHỨC NĂNG CHÍNH: Quét QR Code — tự động nhận biết check-in hay checkout.
     * Workflow: Validate QR → Kiểm tra ngày → Kiểm tra vị trí → Xác định mode → Xử lý
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

            // STEP 4a: Kiểm tra ngày — QR chỉ hợp lệ đúng ngày sự kiện
            LocalDate today = LocalDate.now();
            if (hoatDong.getNgayToChuc() != null && !today.equals(hoatDong.getNgayToChuc())) {
                return DiemDanhQRResponse.failed("QR chỉ hợp lệ vào ngày " + hoatDong.getNgayToChuc());
            }

            // STEP 4b: Kiểm tra vị trí (nếu được cấu hình)
            if (hoatDong.getViDo() != null && hoatDong.getKinhDo() != null && hoatDong.getKhoangCachToiDa() != null) {
                if (request.getLatitude() == null || request.getLongitude() == null) {
                    return DiemDanhQRResponse.failed("Cần cung cấp vị trí để điểm danh tại địa điểm này");
                }
                double distance = calculateDistance(
                        request.getLatitude(), request.getLongitude(),
                        hoatDong.getViDo(), hoatDong.getKinhDo());
                if (distance > hoatDong.getKhoangCachToiDa()) {
                    return DiemDanhQRResponse.failed(String.format(
                            "Vị trí quá xa địa điểm tổ chức (%.0f m, tối đa %d m)", distance, hoatDong.getKhoangCachToiDa()));
                }
            }

            // STEP 5: Kiểm tra trạng thái điểm danh hiện tại
            LocalTime now = LocalTime.now();
            Optional<DiemDanhHoatDong> existingOpt = diemDanhRepository
                    .findBySinhVienMaSvAndHoatDongMaHoatDong(dangKy.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());
            boolean alreadyCheckedIn = existingOpt.isPresent();

            // STEP 6: Xác định mode dựa theo cửa sổ thời gian
            if (isInCheckoutWindow(hoatDong, today, now)) {
                // Checkout mode
                if (!alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Bạn chưa check-in hoạt động này");
                }
                DiemDanhHoatDong diemDanh = existingOpt.get();
                if (diemDanh.getThoiGianCheckOut() != null) {
                    return DiemDanhQRResponse.failed("Bạn đã check-out rồi");
                }
                return processCheckoutByQR(request, diemDanh, hoatDong);
            }

            if (isInCheckInWindow(hoatDong, today, now)) {
                // Check-in mode
                if (alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Mã QR này đã được quét rồi (đã check-in)");
                }
                return processCheckInByQR(request, dangKy, hoatDong, now);
            }

            return DiemDanhQRResponse.failed("Ngoài thời gian điểm danh");

        } catch (Exception e) {
            log.error("Error processing QR scan: {}", request.getMaQR(), e);
            return DiemDanhQRResponse.failed("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Xử lý check-in qua QR (tách ra từ scanQRCode).
     */
    private DiemDanhQRResponse processCheckInByQR(DiemDanhQRRequest request, DangKyHoatDong dangKy,
                                                   HoatDong hoatDong, LocalTime checkInTime) {
        BCHDoanHoi nguoiXacNhan = null;
        if (request.getMaBchXacNhan() != null) {
            nguoiXacNhan = bchRepository.findById(request.getMaBchXacNhan()).orElse(null);
        }

        TrangThaiCheckInEnum trangThaiCheckIn = TrangThaiCheckInEnum.DUNG_GIO;
        int soPhutTre = 0;

        if (hoatDong.getThoiGianBatDau() != null) {
            if (hoatDong.getChoPhepCheckInSom() != null) {
                LocalTime earliestCheckIn = hoatDong.getThoiGianBatDau().minusMinutes(hoatDong.getChoPhepCheckInSom());
                if (checkInTime.isBefore(earliestCheckIn)) {
                    return DiemDanhQRResponse.failed("Chưa đến giờ check-in (Sớm nhất: " + earliestCheckIn + ")");
                }
            }
            if (checkInTime.isAfter(hoatDong.getThoiGianBatDau())) {
                long minutesLate = ChronoUnit.MINUTES.between(hoatDong.getThoiGianBatDau(), checkInTime);
                soPhutTre = (int) minutesLate;
                if (hoatDong.getThoiGianTreToiDa() != null && minutesLate > hoatDong.getThoiGianTreToiDa()) {
                    trangThaiCheckIn = TrangThaiCheckInEnum.TRE_QUA_GIO;
                } else {
                    trangThaiCheckIn = TrangThaiCheckInEnum.TRE_CHAP_NHAN;
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        // Nếu không yêu cầu checkout, set DA_THAM_GIA ngay; ngược lại đợi checkout
        TrangThaiThamGiaEnum trangThai = Boolean.TRUE.equals(hoatDong.getYeuCauCheckOut())
                ? TrangThaiThamGiaEnum.DANG_KY
                : TrangThaiThamGiaEnum.DA_THAM_GIA;

        DiemDanhHoatDong diemDanh = DiemDanhHoatDong.builder()
                .hoatDong(hoatDong)
                .sinhVien(dangKy.getSinhVien())
                .maQRDaQuet(request.getMaQR())
                .trangThai(trangThai)
                .thoiGianCheckIn(now)
                .trangThaiCheckIn(trangThaiCheckIn)
                .soPhutTre(soPhutTre)
                .nguoiCheckIn(nguoiXacNhan)
                .thietBiQuet(request.getThietBi())
                // Ưu tiên dùng vị trí sinh viên đã gửi trước (chống điểm danh hộ);
                // fallback sang vị trí scanner nếu sinh viên chưa gửi
                .latitude(dangKy.getStudentLatitude() != null ? dangKy.getStudentLatitude() : request.getLatitude())
                .longitude(dangKy.getStudentLongitude() != null ? dangKy.getStudentLongitude() : request.getLongitude())
                .ghiChu(request.getGhiChu())
                .build();

        diemDanh = diemDanhRepository.save(diemDanh);
        log.info("Check-in successful: student={}, activity={}", dangKy.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());

        notificationService.sendNotification(
                dangKy.getSinhVien().getMaSv(),
                "Check-in thành công",
                "Bạn đã check-in thành công hoạt động \"" + hoatDong.getTenHoatDong() + "\".",
                "ATTENDANCE_CHECKIN",
                hoatDong.getMaHoatDong()
        );

        return DiemDanhQRResponse.success("Check-in thành công", toDTO(diemDanh));
    }

    /**
     * Xử lý checkout qua QR.
     */
    private DiemDanhQRResponse processCheckoutByQR(DiemDanhQRRequest request,
                                                    DiemDanhHoatDong diemDanh, HoatDong hoatDong) {
        LocalDateTime now = LocalDateTime.now();

        BCHDoanHoi nguoiCheckOut = null;
        if (request.getMaBchXacNhan() != null) {
            nguoiCheckOut = bchRepository.findById(request.getMaBchXacNhan()).orElse(null);
        }

        diemDanh.setThoiGianCheckOut(now);
        diemDanh.setNguoiCheckOut(nguoiCheckOut);
        diemDanh.setTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);

        long minutesParticipated = ChronoUnit.MINUTES.between(diemDanh.getThoiGianCheckIn(), now);
        diemDanh.setTongThoiGianThamGia((int) minutesParticipated);

        TrangThaiCheckOutEnum trangThaiCheckOut = TrangThaiCheckOutEnum.HOAN_THANH;
        int soPhutVeSom = 0;

        if (hoatDong.getThoiGianToiThieu() != null) {
            diemDanh.setDatThoiGianToiThieu(minutesParticipated >= hoatDong.getThoiGianToiThieu());
            if (minutesParticipated < hoatDong.getThoiGianToiThieu()) {
                trangThaiCheckOut = TrangThaiCheckOutEnum.VE_SOM_QUA_SUA;
            }
        } else {
            diemDanh.setDatThoiGianToiThieu(true);
        }

        if (hoatDong.getThoiGianKetThuc() != null) {
            LocalTime checkOutTime = now.toLocalTime();
            if (checkOutTime.isBefore(hoatDong.getThoiGianKetThuc())) {
                long minutesEarly = ChronoUnit.MINUTES.between(checkOutTime, hoatDong.getThoiGianKetThuc());
                soPhutVeSom = (int) minutesEarly;
                trangThaiCheckOut = minutesEarly > 30
                        ? TrangThaiCheckOutEnum.VE_SOM_QUA_SUA
                        : TrangThaiCheckOutEnum.VE_SOM_CHAP_NHAN;
            }
        }

        diemDanh.setTrangThaiCheckOut(trangThaiCheckOut);
        diemDanh.setSoPhutVeSom(soPhutVeSom);

        diemDanh = diemDanhRepository.save(diemDanh);
        log.info("QR checkout successful: student={}, activity={}", diemDanh.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());

        notificationService.sendNotification(
                diemDanh.getSinhVien().getMaSv(),
                "Kết quả điểm danh",
                "Bạn đã hoàn thành hoạt động \"" + hoatDong.getTenHoatDong() + "\". Điểm rèn luyện sẽ được cập nhật sớm.",
                "ATTENDANCE_RESULT",
                hoatDong.getMaHoatDong()
        );

        return DiemDanhQRResponse.success("Check-out thành công", toDTO(diemDanh));
    }

    /**
     * Kiểm tra có trong cửa sổ check-in không.
     */
    private boolean isInCheckInWindow(HoatDong hoatDong, LocalDate today, LocalTime now) {
        if (Boolean.TRUE.equals(hoatDong.getKetThucSom())) return false;
        if (hoatDong.getNgayToChuc() != null && !today.equals(hoatDong.getNgayToChuc())) return false;
        if (hoatDong.getThoiGianBatDau() == null) return true;

        LocalTime earliest = hoatDong.getThoiGianBatDau()
                .minusMinutes(hoatDong.getChoPhepCheckInSom() != null ? hoatDong.getChoPhepCheckInSom() : 0);
        if (now.isBefore(earliest)) return false;
        if (hoatDong.getThoiGianKetThuc() != null && now.isAfter(hoatDong.getThoiGianKetThuc())) return false;
        return true;
    }

    /**
     * Kiểm tra có trong cửa sổ checkout không.
     */
    private boolean isInCheckoutWindow(HoatDong hoatDong, LocalDate today, LocalTime now) {
        int allowedMinutes = hoatDong.getThoiGianChoPhepCheckOut() != null
                ? hoatDong.getThoiGianChoPhepCheckOut() : 30;

        // Early termination → checkout window from actual end time
        if (Boolean.TRUE.equals(hoatDong.getKetThucSom()) && hoatDong.getThoiGianKetThucThucTe() != null) {
            LocalDateTime earlyEnd = hoatDong.getThoiGianKetThucThucTe();
            LocalDateTime deadline = earlyEnd.plusMinutes(allowedMinutes);
            LocalDateTime nowDt = LocalDateTime.of(today, now);
            return !nowDt.isBefore(earlyEnd) && nowDt.isBefore(deadline);
        }

        // Normal end: same day, after thoiGianKetThuc, within window
        if (today.equals(hoatDong.getNgayToChuc()) && hoatDong.getThoiGianKetThuc() != null) {
            if (now.isAfter(hoatDong.getThoiGianKetThuc())) {
                LocalTime deadline = hoatDong.getThoiGianKetThuc().plusMinutes(allowedMinutes);
                return now.isBefore(deadline);
            }
        }

        return false;
    }

    /**
     * Tính khoảng cách Haversine (mét) giữa 2 tọa độ.
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371000;
        double latRad = Math.toRadians(lat2 - lat1);
        double lngRad = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latRad / 2) * Math.sin(latRad / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngRad / 2) * Math.sin(lngRad / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    public DiemDanhHoatDongDTO checkOut(CheckOutRequest request) {
        log.info("Processing check-out: diemDanhId={}, qr={}, bch={}",
                request.getDiemDanhId(), request.getMaQR(), request.getMaBchXacNhan());

        DiemDanhHoatDong diemDanh;

        // Tìm bản ghi điểm danh
        if (request.getDiemDanhId() != null) {
            diemDanh = diemDanhRepository.findById(request.getDiemDanhId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi điểm danh"));
        } else if (request.getMaQR() != null) {
            // Tìm bản ghi đang active (chưa check-out) của QR này
            diemDanh = diemDanhRepository.findByMaQRDaQuetAndThoiGianCheckOutIsNull(request.getMaQR())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi check-in chưa check-out cho QR này"));
        } else {
            throw new RuntimeException("Phải cung cấp ID điểm danh hoặc mã QR");
        }

        if (diemDanh.getThoiGianCheckOut() != null) {
            throw new RuntimeException("Đã check-out rồi");
        }

        BCHDoanHoi nguoiCheckOut = bchRepository.findById(request.getMaBchXacNhan())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH"));

        LocalDateTime now = LocalDateTime.now();
        diemDanh.setThoiGianCheckOut(now);
        diemDanh.setNguoiCheckOut(nguoiCheckOut);
        if (request.getGhiChu() != null) {
            diemDanh.setGhiChu(request.getGhiChu());
        }
        if (request.getLatitude() != null) {
            diemDanh.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            diemDanh.setLongitude(request.getLongitude());
        }

        // Tính toán thời gian tham gia
        long minutesParticipated = ChronoUnit.MINUTES.between(diemDanh.getThoiGianCheckIn(), now);
        diemDanh.setTongThoiGianThamGia((int) minutesParticipated);

        // Logic Check-out Time
        HoatDong hoatDong = diemDanh.getHoatDong();
        TrangThaiCheckOutEnum trangThaiCheckOut = TrangThaiCheckOutEnum.HOAN_THANH;
        int soPhutVeSom = 0;

        // Kiểm tra thời gian tối thiểu
        if (hoatDong.getThoiGianToiThieu() != null) {
            if (minutesParticipated < hoatDong.getThoiGianToiThieu()) {
                diemDanh.setDatThoiGianToiThieu(false);
                trangThaiCheckOut = TrangThaiCheckOutEnum.VE_SOM_QUA_SUA; // Hoặc logic khác tùy nghiệp vụ
            } else {
                diemDanh.setDatThoiGianToiThieu(true);
            }
        } else {
            diemDanh.setDatThoiGianToiThieu(true);
        }

        // Kiểm tra về sớm so với giờ kết thúc (nếu có)
        if (hoatDong.getThoiGianKetThuc() != null) {
            LocalTime checkOutTime = now.toLocalTime();
            if (checkOutTime.isBefore(hoatDong.getThoiGianKetThuc())) {
                long minutesEarly = ChronoUnit.MINUTES.between(checkOutTime, hoatDong.getThoiGianKetThuc());
                soPhutVeSom = (int) minutesEarly;
                // Logic phân loại về sớm chấp nhận được hay không
                // Ví dụ: về sớm > 30p là quá sớm
                if (minutesEarly > 30) {
                     trangThaiCheckOut = TrangThaiCheckOutEnum.VE_SOM_QUA_SUA;
                } else {
                     trangThaiCheckOut = TrangThaiCheckOutEnum.VE_SOM_CHAP_NHAN;
                }
            }
        }

        diemDanh.setTrangThaiCheckOut(trangThaiCheckOut);
        diemDanh.setSoPhutVeSom(soPhutVeSom);

        diemDanh = diemDanhRepository.save(diemDanh);

        log.info("Check-out successful: {}", diemDanh.getId());
        return toDTO(diemDanh);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportAttendanceExcel(String maHoatDong) throws IOException {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động"));

        List<DiemDanhHoatDongDTO> attendanceList = getByActivity(maHoatDong);
        List<Map<String, Object>> notCheckedIn = getNotCheckedInStudents(maHoatDong);
        long tongDangKy = attendanceList.size() + notCheckedIn.size();
        long daThamGia  = attendanceList.size();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ─── Styles ──────────────────────────────────────────────────────────

            // Title: large bold
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            // Header: dark-blue BG, white bold, centered, bordered
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            setBorder(headerStyle);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Label: bold, light-yellow BG
            CellStyle labelStyle = workbook.createCellStyle();
            Font labelFont = workbook.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);
            labelStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            labelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            setBorder(labelStyle);

            // Section divider: cornflower-blue BG, bold
            CellStyle sectionStyle = workbook.createCellStyle();
            sectionStyle.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 11);
            sectionStyle.setFont(sectionFont);
            setBorder(sectionStyle);

            // Data: bordered, wrap text
            CellStyle dataStyle = workbook.createCellStyle();
            setBorder(dataStyle);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Alt-row: bordered + light yellow
            CellStyle altStyle = workbook.createCellStyle();
            altStyle.cloneStyleFrom(dataStyle);
            altStyle.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            altStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Center: bordered, centered
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(dataStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Center-alt: bordered, centered + alt BG
            CellStyle centerAltStyle = workbook.createCellStyle();
            centerAltStyle.cloneStyleFrom(altStyle);
            centerAltStyle.setAlignment(HorizontalAlignment.CENTER);

            // Absent: rose BG, bordered
            CellStyle absentStyle = workbook.createCellStyle();
            absentStyle.cloneStyleFrom(dataStyle);
            absentStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            absentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Center-absent
            CellStyle centerAbsentStyle = workbook.createCellStyle();
            centerAbsentStyle.cloneStyleFrom(absentStyle);
            centerAbsentStyle.setAlignment(HorizontalAlignment.CENTER);

            // Total: bold, tan BG, bordered
            CellStyle totalStyle = workbook.createCellStyle();
            Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(IndexedColors.TAN.getIndex());
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            setBorder(totalStyle);
            totalStyle.setAlignment(HorizontalAlignment.CENTER);

            // ─── Sheet 1: Thống kê chung ─────────────────────────────────────────
            Sheet s1 = workbook.createSheet("Thống kê chung");
            s1.setColumnWidth(0, 1600);   // STT
            s1.setColumnWidth(1, 10000);  // Tên Khoa
            s1.setColumnWidth(2, 4500);   // Tổng ĐK
            s1.setColumnWidth(3, 4500);   // Đã tham gia
            s1.setColumnWidth(4, 4000);   // Tỷ lệ

            // Row 0 – tiêu đề
            Row s1r0 = s1.createRow(0);
            s1r0.setHeightInPoints(32);
            Cell s1TitleCell = s1r0.createCell(0);
            s1TitleCell.setCellValue("BÁO CÁO ĐĂNG KÝ THAM GIA HOẠT ĐỘNG");
            s1TitleCell.setCellStyle(titleStyle);
            s1.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            // Row 1 – tên hoạt động
            Row s1r1 = s1.createRow(1);
            s1r1.setHeightInPoints(20);
            Cell s1Lbl1 = s1r1.createCell(0); s1Lbl1.setCellValue("Hoạt động:"); s1Lbl1.setCellStyle(labelStyle);
            Cell s1Val1 = s1r1.createCell(1); s1Val1.setCellValue(hoatDong.getTenHoatDong());
            s1.addMergedRegion(new CellRangeAddress(1, 1, 1, 4));

            // Row 2 – ngày tổ chức
            Row s1r2 = s1.createRow(2);
            Cell s1Lbl2 = s1r2.createCell(0); s1Lbl2.setCellValue("Ngày tổ chức:"); s1Lbl2.setCellStyle(labelStyle);
            s1r2.createCell(1).setCellValue(hoatDong.getNgayToChuc() != null ? hoatDong.getNgayToChuc().toString() : "");

            // Row 3 – tổng số liệu
            Row s1r3 = s1.createRow(3);
            Cell s1Lbl3 = s1r3.createCell(0); s1Lbl3.setCellValue("Tổng đăng ký:"); s1Lbl3.setCellStyle(labelStyle);
            s1r3.createCell(1).setCellValue(tongDangKy);
            Cell s1Lbl3b = s1r3.createCell(2); s1Lbl3b.setCellValue("Đã tham gia:"); s1Lbl3b.setCellStyle(labelStyle);
            s1r3.createCell(3).setCellValue(daThamGia);
            s1r3.createCell(4).setCellValue(String.format("%.1f%%", tongDangKy > 0 ? (double) daThamGia / tongDangKy * 100 : 0));

            // Row 4 – trống
            s1.createRow(4);

            // Row 5 – section header
            Row s1SecRow = s1.createRow(5);
            s1SecRow.setHeightInPoints(22);
            Cell s1SecCell = s1SecRow.createCell(0);
            s1SecCell.setCellValue("THỐNG KÊ THEO KHOA / ĐƠN VỊ");
            s1SecCell.setCellStyle(sectionStyle);
            for (int i = 1; i <= 4; i++) s1SecRow.createCell(i).setCellStyle(sectionStyle);
            s1.addMergedRegion(new CellRangeAddress(5, 5, 0, 4));

            // Row 6 – column headers
            Row s1HdrRow = s1.createRow(6);
            s1HdrRow.setHeightInPoints(22);
            String[] s1Cols = {"STT", "Tên Khoa / Đơn vị", "Tổng Đăng Ký", "Đã Tham Gia", "Tỷ lệ (%)"};
            for (int i = 0; i < s1Cols.length; i++) {
                Cell c = s1HdrRow.createCell(i);
                c.setCellValue(s1Cols[i]);
                c.setCellStyle(headerStyle);
            }

            // Gom nhóm theo tenKhoa thực tế
            Map<String, Long> regByKhoa = new LinkedHashMap<>();
            Map<String, Long> attByKhoa = new LinkedHashMap<>();
            for (DiemDanhHoatDongDTO a : attendanceList) {
                String khoa = (a.getTenKhoa() != null && !a.getTenKhoa().isBlank()) ? a.getTenKhoa() : "Chưa xác định";
                attByKhoa.merge(khoa, 1L, Long::sum);
                regByKhoa.merge(khoa, 1L, Long::sum);
            }
            for (Map<String, Object> m : notCheckedIn) {
                String khoa = (m.get("tenKhoa") != null && !m.get("tenKhoa").toString().isBlank())
                        ? m.get("tenKhoa").toString() : "Chưa xác định";
                regByKhoa.merge(khoa, 1L, Long::sum);
            }

            int sIdx = 7;
            int stt = 1;
            for (Map.Entry<String, Long> entry : regByKhoa.entrySet()) {
                Row row = s1.createRow(sIdx++);
                long reg = entry.getValue();
                long att = attByKhoa.getOrDefault(entry.getKey(), 0L);
                CellStyle cs = (stt % 2 == 0) ? centerAltStyle : centerStyle;
                CellStyle ds = (stt % 2 == 0) ? altStyle : dataStyle;
                row.createCell(0).setCellStyle(cs);
                row.getCell(0).setCellValue(stt++);
                Cell c1 = row.createCell(1); c1.setCellValue(entry.getKey()); c1.setCellStyle(ds);
                Cell c2 = row.createCell(2); c2.setCellValue(reg);            c2.setCellStyle(cs);
                Cell c3 = row.createCell(3); c3.setCellValue(att);            c3.setCellStyle(cs);
                Cell c4 = row.createCell(4); c4.setCellValue(String.format("%.1f%%", reg > 0 ? (double) att / reg * 100 : 0)); c4.setCellStyle(cs);
            }

            // Total row
            Row totalRow = s1.createRow(sIdx);
            totalRow.setHeightInPoints(20);
            totalRow.createCell(0).setCellStyle(totalStyle);
            Cell tLbl = totalRow.createCell(1); tLbl.setCellValue("TỔNG CỘNG"); tLbl.setCellStyle(totalStyle);
            Cell tReg = totalRow.createCell(2); tReg.setCellValue(tongDangKy);  tReg.setCellStyle(totalStyle);
            Cell tAtt = totalRow.createCell(3); tAtt.setCellValue(daThamGia);   tAtt.setCellStyle(totalStyle);
            Cell tRate = totalRow.createCell(4); tRate.setCellValue(String.format("%.1f%%", tongDangKy > 0 ? (double) daThamGia / tongDangKy * 100 : 0)); tRate.setCellStyle(totalStyle);

            s1.createFreezePane(0, 7);

            // ─── Sheet 2: Danh sách chi tiết ─────────────────────────────────────
            Sheet s2 = workbook.createSheet("Danh sách chi tiết");
            // Cols: STT | Mã SV | Họ Tên | Lớp | Khoa | Check-in | TT CI | Check-out | TT CO | Trạng thái | Ghi chú
            int[] s2Widths = {1600, 3500, 8000, 3500, 6500, 6000, 4500, 6000, 4500, 4500, 6000};
            for (int i = 0; i < s2Widths.length; i++) s2.setColumnWidth(i, s2Widths[i]);

            // Row 0 – tiêu đề
            Row s2Title = s2.createRow(0);
            s2Title.setHeightInPoints(32);
            Cell s2TCell = s2Title.createCell(0);
            s2TCell.setCellValue("DANH SÁCH ĐĂNG KÝ THAM GIA: " + hoatDong.getTenHoatDong().toUpperCase());
            s2TCell.setCellStyle(titleStyle);
            s2.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            // Row 1 – thông tin tóm tắt
            Row s2Info = s2.createRow(1);
            s2Info.createCell(0).setCellValue(
                    "Ngày: " + (hoatDong.getNgayToChuc() != null ? hoatDong.getNgayToChuc() : "")
                    + "   |   Tổng đăng ký: " + tongDangKy
                    + "   |   Đã tham gia: " + daThamGia
                    + "   |   Vắng mặt: " + notCheckedIn.size());
            s2.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));

            // Row 2 – column headers
            Row s2Hdr = s2.createRow(2);
            s2Hdr.setHeightInPoints(25);
            String[] s2Cols = {"STT", "Mã SV", "Họ và Tên", "Lớp", "Khoa",
                    "Check-in", "TT Check-in", "Check-out", "TT Check-out", "Trạng thái", "Ghi chú"};
            for (int i = 0; i < s2Cols.length; i++) {
                Cell c = s2Hdr.createCell(i);
                c.setCellValue(s2Cols[i]);
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 3;

            // --- Phần 1: Đã tham gia ---
            if (!attendanceList.isEmpty()) {
                Row secARow = s2.createRow(rowIdx++);
                secARow.setHeightInPoints(20);
                Cell secACell = secARow.createCell(0);
                secACell.setCellValue("✓  ĐÃ THAM GIA  (" + attendanceList.size() + " người)");
                secACell.setCellStyle(sectionStyle);
                for (int i = 1; i <= 10; i++) secARow.createCell(i).setCellStyle(sectionStyle);
                s2.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 10));

                int idx = 1;
                for (DiemDanhHoatDongDTO dto : attendanceList) {
                    Row row = s2.createRow(rowIdx++);
                    row.setHeightInPoints(18);
                    boolean alt = (idx % 2 == 0);
                    CellStyle cs = alt ? centerAltStyle : centerStyle;
                    CellStyle ds = alt ? altStyle : dataStyle;

                    row.createCell(0).setCellValue(idx++);   row.getCell(0).setCellStyle(cs);
                    row.createCell(1).setCellValue(dto.getMaSv() != null ? dto.getMaSv() : "");                          row.getCell(1).setCellStyle(cs);
                    row.createCell(2).setCellValue(dto.getHoTenSinhVien() != null ? dto.getHoTenSinhVien() : "");        row.getCell(2).setCellStyle(ds);
                    row.createCell(3).setCellValue(dto.getMaLop() != null ? dto.getMaLop() : "");                        row.getCell(3).setCellStyle(cs);
                    row.createCell(4).setCellValue(dto.getTenKhoa() != null ? dto.getTenKhoa() : "");                    row.getCell(4).setCellStyle(ds);
                    row.createCell(5).setCellValue(dto.getThoiGianCheckIn() != null ? dto.getThoiGianCheckIn().toString().replace("T", " ") : ""); row.getCell(5).setCellStyle(cs);
                    row.createCell(6).setCellValue(dto.getTrangThaiCheckIn() != null ? dto.getTrangThaiCheckIn() : "");  row.getCell(6).setCellStyle(cs);
                    row.createCell(7).setCellValue(dto.getThoiGianCheckOut() != null ? dto.getThoiGianCheckOut().toString().replace("T", " ") : ""); row.getCell(7).setCellStyle(cs);
                    row.createCell(8).setCellValue(dto.getTrangThaiCheckOut() != null ? dto.getTrangThaiCheckOut() : ""); row.getCell(8).setCellStyle(cs);
                    row.createCell(9).setCellValue(dto.getTrangThai() != null ? dto.getTrangThai().name() : "");          row.getCell(9).setCellStyle(cs);
                    row.createCell(10).setCellValue(dto.getGhiChu() != null ? dto.getGhiChu() : "");                     row.getCell(10).setCellStyle(ds);
                }
            }

            // --- Phần 2: Vắng mặt ---
            if (!notCheckedIn.isEmpty()) {
                Row secBRow = s2.createRow(rowIdx++);
                secBRow.setHeightInPoints(20);
                Cell secBCell = secBRow.createCell(0);
                secBCell.setCellValue("✗  VẮNG MẶT  (" + notCheckedIn.size() + " người)");
                secBCell.setCellStyle(sectionStyle);
                for (int i = 1; i <= 10; i++) secBRow.createCell(i).setCellStyle(sectionStyle);
                s2.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 10));

                int idx = 1;
                for (Map<String, Object> m : notCheckedIn) {
                    Row row = s2.createRow(rowIdx++);
                    row.setHeightInPoints(18);
                    row.createCell(0).setCellValue(idx++);       row.getCell(0).setCellStyle(centerAbsentStyle);
                    row.createCell(1).setCellValue(m.get("maSv") != null ? m.get("maSv").toString() : "");     row.getCell(1).setCellStyle(centerAbsentStyle);
                    row.createCell(2).setCellValue(m.get("hoTen") != null ? m.get("hoTen").toString() : "");   row.getCell(2).setCellStyle(absentStyle);
                    row.createCell(3).setCellValue(m.get("maLop") != null ? m.get("maLop").toString() : "");   row.getCell(3).setCellStyle(centerAbsentStyle);
                    row.createCell(4).setCellValue(m.get("tenKhoa") != null ? m.get("tenKhoa").toString() : ""); row.getCell(4).setCellStyle(absentStyle);
                    for (int i = 5; i <= 9; i++) row.createCell(i).setCellStyle(centerAbsentStyle);
                    row.getCell(9).setCellValue("VẮNG MẶT");
                    row.createCell(10).setCellValue("Chưa quét mã QR"); row.getCell(10).setCellStyle(absentStyle);
                }
            }

            s2.createFreezePane(0, 3);

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    /** Helper: áp dụng viền mỏng 4 phía cho CellStyle */
    private void setBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

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
            map.put("maSv",       row[0]);
            map.put("hoTen",      row[1]);
            map.put("maQR",       row[2]);
            map.put("ngayDangKy", row[3]);
            map.put("maLop",      row[4] != null ? row[4].toString() : "");
            map.put("tenKhoa",    row[5] != null ? row[5].toString() : "");
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

    /**
     * Lấy thống kê điểm danh tổng hợp
     */
    @Transactional(readOnly = true)
    public AttendanceStatisticsDTO getAttendanceStatisticsOverview() {
        log.debug("Getting overall attendance statistics");

        long totalAttendance = diemDanhRepository.count();
        long successful = diemDanhRepository.countByHoatDongMaHoatDongAndTrangThai(null, TrangThaiThamGiaEnum.DA_THAM_GIA);
        long absent = diemDanhRepository.countByHoatDongMaHoatDongAndTrangThai(null, TrangThaiThamGiaEnum.VANG_MAT);

        double presentRate = totalAttendance > 0 ? (double) successful / totalAttendance * 100 : 0;
        double absentRate = totalAttendance > 0 ? (double) absent / totalAttendance * 100 : 0;

        // Thống kê theo khoa (giả định có thể lấy từ sinh viên)
        // Đây là phần cần query phức tạp hơn, tạm thời trả về map rỗng hoặc query đơn giản
        Map<String, Long> byFaculty = new HashMap<>();
        // TODO: Implement query to group by faculty

        return AttendanceStatisticsDTO.builder()
                .tongLuotDiemDanh(totalAttendance)
                .diemDanhThanhCong(successful)
                .vangKhongPhep(absent)
                .tiLeCoMat(Math.round(presentRate * 100.0) / 100.0)
                .tiLeDiemDanhTre(Math.round(absentRate * 100.0) / 100.0)
                .thongKeTheoKhoa(byFaculty)
                .build();
    }

    // ========== ADMIN OPERATIONS ==========

    /**
     * Điểm danh thủ công hàng loạt (admin/BCH tích chọn sinh viên)
     * Trả về map: maSv -> kết quả (SUCCESS hoặc lý do thất bại)
     */
    @Transactional
    public Map<String, String> manualCheckInBulk(ManualCheckInRequest request) {
        log.info("Manual bulk check-in: activity={}, students={}", request.getMaHoatDong(), request.getMaSvList().size());

        HoatDong hoatDong = hoatDongRepository.findById(request.getMaHoatDong())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + request.getMaHoatDong()));

        BCHDoanHoi nguoiCheckIn = null;
        if (request.getMaBchXacNhan() != null) {
            nguoiCheckIn = bchRepository.findById(request.getMaBchXacNhan()).orElse(null);
        }

        Map<String, String> results = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (String maSv : request.getMaSvList()) {
            try {
                // Kiểm tra đã có bản ghi chưa
                Optional<DiemDanhHoatDong> existingOpt = diemDanhRepository
                        .findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, request.getMaHoatDong());
                if (existingOpt.isPresent()) {
                    results.put(maSv, "ALREADY_CHECKED_IN");
                    continue;
                }

                SinhVien sinhVien = sinhVienRepository.findById(maSv).orElse(null);
                if (sinhVien == null) {
                    results.put(maSv, "STUDENT_NOT_FOUND");
                    continue;
                }

                DiemDanhHoatDong diemDanh = DiemDanhHoatDong.builder()
                        .hoatDong(hoatDong)
                        .sinhVien(sinhVien)
                        .maQRDaQuet("MANUAL")
                        .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                        .thoiGianCheckIn(now)
                        .trangThaiCheckIn(TrangThaiCheckInEnum.DUNG_GIO)
                        .soPhutTre(0)
                        .nguoiCheckIn(nguoiCheckIn)
                        .ghiChu(request.getGhiChu() != null ? request.getGhiChu() : "Điểm danh thủ công")
                        .build();

                diemDanhRepository.save(diemDanh);
                results.put(maSv, "SUCCESS");
                log.info("Manual check-in OK: student={}, activity={}", maSv, request.getMaHoatDong());

            } catch (Exception e) {
                log.error("Manual check-in failed for student {}: {}", maSv, e.getMessage());
                results.put(maSv, "ERROR: " + e.getMessage());
            }
        }

        log.info("Manual bulk check-in done: {}/{} succeeded",
                results.values().stream().filter("SUCCESS"::equals).count(), request.getMaSvList().size());
        return results;
    }

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
                .maLop(entity.getSinhVien().getLop() != null ? entity.getSinhVien().getLop().getMaLop() : null)
                .tenLop(entity.getSinhVien().getLop() != null ? entity.getSinhVien().getLop().getTenLop() : null)
                .tenKhoa(entity.getSinhVien().getLop() != null && entity.getSinhVien().getLop().getMaKhoa() != null
                        ? entity.getSinhVien().getLop().getMaKhoa().getTenKhoa() : null)
                .maQRDaQuet(entity.getMaQRDaQuet())
                .trangThai(entity.getTrangThai())
                .thoiGianCheckIn(entity.getThoiGianCheckIn())
                .thoiGianCheckOut(entity.getThoiGianCheckOut())
                .maBchXacNhan(entity.getNguoiCheckIn() != null ?
                        entity.getNguoiCheckIn().getMaBch() : null)
                .tenNguoiXacNhan(entity.getNguoiCheckIn() != null ?
                        entity.getNguoiCheckIn().getSinhVien().getHoTen() : null)
                .ghiChu(entity.getGhiChu())
                .trangThaiCheckIn(entity.getTrangThaiCheckIn() != null ? entity.getTrangThaiCheckIn().name() : null)
                .soPhutTre(entity.getSoPhutTre())
                .trangThaiCheckOut(entity.getTrangThaiCheckOut() != null ? entity.getTrangThaiCheckOut().name() : null)
                .soPhutVeSom(entity.getSoPhutVeSom())
                .tongThoiGianThamGia(entity.getTongThoiGianThamGia())
                .datThoiGianToiThieu(entity.getDatThoiGianToiThieu())
                .thietBiQuet(entity.getThietBiQuet())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}