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
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
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

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ── Styles ────────────────────────────────────────────────────────────────
            // Tiêu đề lớn (tên hoạt động)
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            // Label info (cột nhãn bên trái)
            CellStyle labelStyle = wb.createCellStyle();
            Font labelFont = wb.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);
            labelStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            labelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header bảng (xanh đậm, chữ trắng)
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Header bảng thống kê theo lớp (xanh lá)
            CellStyle headerGreenStyle = wb.createCellStyle();
            Font headerGreenFont = wb.createFont();
            headerGreenFont.setBold(true);
            headerGreenFont.setColor(IndexedColors.WHITE.getIndex());
            headerGreenStyle.setFont(headerGreenFont);
            headerGreenStyle.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            headerGreenStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerGreenStyle.setAlignment(HorizontalAlignment.CENTER);
            headerGreenStyle.setBorderBottom(BorderStyle.THIN);
            headerGreenStyle.setBorderTop(BorderStyle.THIN);
            headerGreenStyle.setBorderLeft(BorderStyle.THIN);
            headerGreenStyle.setBorderRight(BorderStyle.THIN);

            // Data cell có border
            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Data cell căn giữa
            CellStyle dataCenterStyle = wb.createCellStyle();
            dataCenterStyle.setBorderBottom(BorderStyle.THIN);
            dataCenterStyle.setBorderTop(BorderStyle.THIN);
            dataCenterStyle.setBorderLeft(BorderStyle.THIN);
            dataCenterStyle.setBorderRight(BorderStyle.THIN);
            dataCenterStyle.setAlignment(HorizontalAlignment.CENTER);

            // Data cell tô vàng (vắng mặt)
            CellStyle absentStyle = wb.createCellStyle();
            absentStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            absentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            absentStyle.setBorderBottom(BorderStyle.THIN);
            absentStyle.setBorderTop(BorderStyle.THIN);
            absentStyle.setBorderLeft(BorderStyle.THIN);
            absentStyle.setBorderRight(BorderStyle.THIN);

            // Data cell tô đỏ nhạt (trễ/sớm về)
            CellStyle lateStyle = wb.createCellStyle();
            lateStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            lateStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            lateStyle.setBorderBottom(BorderStyle.THIN);
            lateStyle.setBorderTop(BorderStyle.THIN);
            lateStyle.setBorderLeft(BorderStyle.THIN);
            lateStyle.setBorderRight(BorderStyle.THIN);

            // ── Tính toán dữ liệu thống kê ───────────────────────────────────────────
            long tongDangKy = attendanceList.size() + notCheckedIn.size();
            long daThamGia = attendanceList.stream()
                    .filter(a -> a.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA).count();
            long diTre = attendanceList.stream()
                    .filter(a -> a.getSoPhutTre() != null && a.getSoPhutTre() > 0).count();
            long veSom = attendanceList.stream()
                    .filter(a -> a.getSoPhutVeSom() != null && a.getSoPhutVeSom() > 0).count();
            long vangMat = notCheckedIn.size();

            // Gom nhóm theo lớp (tenLop)
            // Dùng LinkedHashMap để giữ thứ tự chèn (sắp xếp ổn định)
            Map<String, long[]> statsByLop = new LinkedHashMap<>(); // [0]=đăng ký, [1]=tham gia
            attendanceList.forEach(a -> {
                String lop = a.getTenLop() != null && !a.getTenLop().isBlank() ? a.getTenLop() : "Chưa rõ lớp";
                statsByLop.computeIfAbsent(lop, k -> new long[]{0, 0});
                statsByLop.get(lop)[0]++;
                if (a.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA) statsByLop.get(lop)[1]++;
            });
            notCheckedIn.forEach(m -> {
                String lop = m.get("tenLop") != null ? String.valueOf(m.get("tenLop")) : "Chưa rõ lớp";
                statsByLop.computeIfAbsent(lop, k -> new long[]{0, 0});
                statsByLop.get(lop)[0]++;
            });
            // Sắp xếp theo tên lớp
            List<Map.Entry<String, long[]>> sortedStats = statsByLop.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .collect(Collectors.toList());

            // ── Helper: tạo cell có style ────────────────────────────────────────────
            // (dùng inner lambda qua method reference — Java không hỗ trợ local method,
            //  nên ta tạo BiConsumer đơn giản)

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 1: Thống kê tổng hợp
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetTK = wb.createSheet("Thống kê tổng hợp");
            sheetTK.setColumnWidth(0, 7000);
            sheetTK.setColumnWidth(1, 14000);
            int rowNum = 0;

            // Tiêu đề tên hoạt động
            Row rTitle = sheetTK.createRow(rowNum++);
            Cell cTitle = rTitle.createCell(0);
            cTitle.setCellValue("BÁO CÁO ĐIỂM DANH HOẠT ĐỘNG");
            cTitle.setCellStyle(titleStyle);

            rowNum++; // Dòng trống

            // Thông tin hoạt động
            String[][] info = {
                {"Tên hoạt động",  hoatDong.getTenHoatDong()},
                {"Mã hoạt động",   hoatDong.getMaHoatDong()},
                {"Ngày tổ chức",   hoatDong.getNgayToChuc() != null ? hoatDong.getNgayToChuc().toString() : ""},
                {"Giờ bắt đầu",    hoatDong.getThoiGianBatDau() != null ? hoatDong.getThoiGianBatDau().toString() : ""},
                {"Giờ kết thúc",   hoatDong.getThoiGianKetThuc() != null ? hoatDong.getThoiGianKetThuc().toString() : ""},
                {"Địa điểm",       hoatDong.getDiaDiem() != null ? hoatDong.getDiaDiem() : ""},
                {"Loại hoạt động", hoatDong.getLoaiHoatDong() != null ? hoatDong.getLoaiHoatDong().name() : ""},
                {"Cấp độ",         hoatDong.getCapDo() != null ? hoatDong.getCapDo().name() : ""},
            };
            for (String[] pair : info) {
                Row r = sheetTK.createRow(rowNum++);
                Cell label = r.createCell(0);
                label.setCellValue(pair[0]);
                label.setCellStyle(labelStyle);
                r.createCell(1).setCellValue(pair[1]);
            }

            rowNum++; // Dòng trống

            // Tổng hợp số liệu
            Row rSumTitle = sheetTK.createRow(rowNum++);
            Cell cSumTitle = rSumTitle.createCell(0);
            cSumTitle.setCellValue("TỔNG HỢP SỐ LIỆU");
            cSumTitle.setCellStyle(titleStyle);

            String[][] summary = {
                {"Tổng sinh viên đăng ký",  String.valueOf(tongDangKy)},
                {"Đã tham gia (đúng giờ + trễ)", String.valueOf(attendanceList.size())},
                {"  Trong đó: đúng giờ",    String.valueOf(attendanceList.size() - diTre)},
                {"  Trong đó: đến trễ",     String.valueOf(diTre)},
                {"  Trong đó: về sớm",      String.valueOf(veSom)},
                {"  Đạt thời gian tối thiểu", String.valueOf(daThamGia)},
                {"Vắng mặt (không quét QR)", String.valueOf(vangMat)},
                {"Tỷ lệ tham gia",           tongDangKy > 0
                        ? String.format("%.1f%%", (double) attendanceList.size() / tongDangKy * 100)
                        : "0%"},
                {"Tỷ lệ đạt điểm",           tongDangKy > 0
                        ? String.format("%.1f%%", (double) daThamGia / tongDangKy * 100)
                        : "0%"},
            };
            for (String[] pair : summary) {
                Row r = sheetTK.createRow(rowNum++);
                Cell label = r.createCell(0);
                label.setCellValue(pair[0]);
                label.setCellStyle(labelStyle);
                r.createCell(1).setCellValue(pair[1]);
            }

            rowNum += 2; // Dòng trống

            // Bảng thống kê theo lớp
            Row rLopTitle = sheetTK.createRow(rowNum++);
            Cell cLopTitle = rLopTitle.createCell(0);
            cLopTitle.setCellValue("THỐNG KÊ THEO LỚP");
            cLopTitle.setCellStyle(titleStyle);

            sheetTK.setColumnWidth(2, 5000);
            sheetTK.setColumnWidth(3, 5000);
            sheetTK.setColumnWidth(4, 4000);
            sheetTK.setColumnWidth(5, 4000);

            Row rLopHeader = sheetTK.createRow(rowNum++);
            String[] lopCols = {"STT", "Tên lớp", "Tổng đăng ký", "Đã tham gia", "Vắng mặt", "Tỷ lệ (%)"};
            for (int i = 0; i < lopCols.length; i++) {
                Cell c = rLopHeader.createCell(i);
                c.setCellValue(lopCols[i]);
                c.setCellStyle(headerGreenStyle);
            }

            int lopStt = 1;
            for (Map.Entry<String, long[]> entry : sortedStats) {
                Row r = sheetTK.createRow(rowNum++);
                long[] v = entry.getValue();
                long absent = v[0] - v[1];
                double rate = v[0] > 0 ? (double) v[1] / v[0] * 100 : 0;

                Cell c0 = r.createCell(0); c0.setCellValue(lopStt++); c0.setCellStyle(dataCenterStyle);
                Cell c1 = r.createCell(1); c1.setCellValue(entry.getKey()); c1.setCellStyle(dataStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(v[0]); c2.setCellStyle(dataCenterStyle);
                Cell c3 = r.createCell(3); c3.setCellValue(v[1]); c3.setCellStyle(dataCenterStyle);
                Cell c4 = r.createCell(4); c4.setCellValue(absent); c4.setCellStyle(dataCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(String.format("%.1f%%", rate)); c5.setCellStyle(dataCenterStyle);
            }

            // Dòng tổng cộng
            if (!sortedStats.isEmpty()) {
                Row rTotal = sheetTK.createRow(rowNum++);
                CellStyle totalStyle = wb.createCellStyle();
                Font totalFont = wb.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
                totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderBottom(BorderStyle.THIN);
                totalStyle.setBorderTop(BorderStyle.THIN);
                totalStyle.setBorderLeft(BorderStyle.THIN);
                totalStyle.setBorderRight(BorderStyle.THIN);
                totalStyle.setAlignment(HorizontalAlignment.CENTER);

                Cell cTotalLabel = rTotal.createCell(0); cTotalLabel.setCellValue("TỔNG"); cTotalLabel.setCellStyle(totalStyle);
                Cell cTotalEmpty = rTotal.createCell(1); cTotalEmpty.setCellValue(""); cTotalEmpty.setCellStyle(totalStyle);
                Cell cTotalReg = rTotal.createCell(2); cTotalReg.setCellValue(tongDangKy); cTotalReg.setCellStyle(totalStyle);
                Cell cTotalAtt = rTotal.createCell(3); cTotalAtt.setCellValue(attendanceList.size()); cTotalAtt.setCellStyle(totalStyle);
                Cell cTotalAbs = rTotal.createCell(4); cTotalAbs.setCellValue(vangMat); cTotalAbs.setCellStyle(totalStyle);
                double totalRate = tongDangKy > 0 ? (double) attendanceList.size() / tongDangKy * 100 : 0;
                Cell cTotalRate = rTotal.createCell(5); cTotalRate.setCellValue(String.format("%.1f%%", totalRate)); cTotalRate.setCellStyle(totalStyle);
            }

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 2: Danh sách đã check-in
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetCI = wb.createSheet("Đã điểm danh (" + attendanceList.size() + ")");

            int[] ciWidths = {2000, 5000, 10000, 6000, 8000, 6000, 8000, 6000, 7000, 4000, 5000, 7000};
            for (int i = 0; i < ciWidths.length; i++) sheetCI.setColumnWidth(i, ciWidths[i]);

            String[] ciCols = {
                "STT", "Mã SV", "Họ và tên", "Lớp",
                "Giờ check-in", "TT check-in", "Giờ check-out", "TT check-out",
                "Trễ (phút)", "Về sớm (phút)", "Đạt TG tối thiểu", "Ghi chú"
            };
            Row ciHeader = sheetCI.createRow(0);
            for (int i = 0; i < ciCols.length; i++) {
                Cell c = ciHeader.createCell(i);
                c.setCellValue(ciCols[i]);
                c.setCellStyle(headerStyle);
            }

            int ciRow = 1;
            for (DiemDanhHoatDongDTO dto : attendanceList) {
                Row r = sheetCI.createRow(ciRow++);
                boolean isLate = dto.getSoPhutTre() != null && dto.getSoPhutTre() > 0;
                CellStyle rowStyle = isLate ? lateStyle : dataStyle;
                CellStyle rowCenterStyle = isLate ? lateStyle : dataCenterStyle;

                setCell(r, 0, ciRow - 1, rowCenterStyle);
                setCell(r, 1, dto.getMaSv(), rowCenterStyle);
                setCell(r, 2, dto.getHoTenSinhVien(), rowStyle);
                setCell(r, 3, dto.getTenLop(), rowCenterStyle);
                setCell(r, 4, dto.getThoiGianCheckIn() != null
                        ? dto.getThoiGianCheckIn().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                        : "", rowCenterStyle);
                setCell(r, 5, dto.getTrangThaiCheckIn() != null ? dto.getTrangThaiCheckIn() : "", rowCenterStyle);
                setCell(r, 6, dto.getThoiGianCheckOut() != null
                        ? dto.getThoiGianCheckOut().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                        : "", rowCenterStyle);
                setCell(r, 7, dto.getTrangThaiCheckOut() != null ? dto.getTrangThaiCheckOut() : "", rowCenterStyle);
                setCell(r, 8, dto.getSoPhutTre() != null ? dto.getSoPhutTre() : 0, rowCenterStyle);
                setCell(r, 9, dto.getSoPhutVeSom() != null ? dto.getSoPhutVeSom() : 0, rowCenterStyle);
                setCell(r, 10, Boolean.TRUE.equals(dto.getDatThoiGianToiThieu()) ? "Đạt" : "Chưa đạt", rowCenterStyle);
                setCell(r, 11, dto.getGhiChu() != null ? dto.getGhiChu() : "", rowStyle);
            }

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 3: Danh sách vắng mặt
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetVM = wb.createSheet("Vắng mặt (" + notCheckedIn.size() + ")");

            int[] vmWidths = {2000, 5000, 10000, 6000, 9000};
            for (int i = 0; i < vmWidths.length; i++) sheetVM.setColumnWidth(i, vmWidths[i]);

            String[] vmCols = {"STT", "Mã SV", "Họ và tên", "Lớp", "Ngày đăng ký"};
            Row vmHeader = sheetVM.createRow(0);
            for (int i = 0; i < vmCols.length; i++) {
                Cell c = vmHeader.createCell(i);
                c.setCellValue(vmCols[i]);

                // Header vắng mặt: đỏ đậm
                CellStyle redHeaderStyle = wb.createCellStyle();
                Font redFont = wb.createFont();
                redFont.setBold(true);
                redFont.setColor(IndexedColors.WHITE.getIndex());
                redHeaderStyle.setFont(redFont);
                redHeaderStyle.setFillForegroundColor(IndexedColors.DARK_RED.getIndex());
                redHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                redHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
                redHeaderStyle.setBorderBottom(BorderStyle.THIN);
                redHeaderStyle.setBorderTop(BorderStyle.THIN);
                redHeaderStyle.setBorderLeft(BorderStyle.THIN);
                redHeaderStyle.setBorderRight(BorderStyle.THIN);
                c.setCellStyle(redHeaderStyle);
            }

            int vmRow = 1;
            for (Map<String, Object> m : notCheckedIn) {
                Row r = sheetVM.createRow(vmRow++);
                setCell(r, 0, vmRow - 1, absentStyle);
                setCell(r, 1, String.valueOf(m.getOrDefault("maSv", "")), absentStyle);
                setCell(r, 2, String.valueOf(m.getOrDefault("hoTen", "")), absentStyle);
                setCell(r, 3, String.valueOf(m.getOrDefault("tenLop", "")), absentStyle);
                Object ngayDK = m.get("ngayDangKy");
                setCell(r, 4, ngayDK != null ? ngayDK.toString() : "", absentStyle);
            }

            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    /** Helper: ghi giá trị String vào cell với style */
    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    /** Helper: ghi giá trị số nguyên vào cell với style */
    private void setCell(Row row, int col, long value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
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
            map.put("maSv", row[0]);
            map.put("hoTen", row[1]);
            map.put("maQR", row[2]);
            map.put("ngayDangKy", row[3]);
            map.put("tenLop", row.length > 4 ? row[4] : "");
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
                .tenLop(entity.getSinhVien().getLop().getTenLop())
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