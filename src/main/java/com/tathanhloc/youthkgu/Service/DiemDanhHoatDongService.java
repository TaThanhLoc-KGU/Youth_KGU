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

import org.springframework.dao.DataIntegrityViolationException;

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
    private final LopRepository lopRepository;
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
            // STEP 1: Kiểm tra QR không rỗng
            if (request.getMaQR() == null || request.getMaQR().isBlank()) {
                return DiemDanhQRResponse.failed("Mã QR không được để trống");
            }

            // STEP 2: Tìm đăng ký từ mã QR
            // Thử exact-match trước
            Optional<DangKyHoatDong> dangKyOpt = dangKyRepository.findByMaQRWithDetails(request.getMaQR());

            // Fallback: nếu exact-match thất bại và có maHoatDong (từ frontend),
            // thử tìm bằng suffix của maSv — đề phòng jsQR decode Latin-1 thay vì UTF-8
            // làm hỏng phần tiếng Việt trong maQR nhưng phần maSv (toàn số) vẫn nguyên vẹn.
            if (dangKyOpt.isEmpty() && request.getMaHoatDong() != null && !request.getMaHoatDong().isBlank()) {
                String qrScanned = request.getMaQR();
                dangKyOpt = dangKyRepository.findByHoatDongMaHoatDongAndIsActiveTrue(request.getMaHoatDong())
                        .stream()
                        .filter(dk -> dk.getMaQR() != null && qrScanned.endsWith(dk.getId().getMaSv()))
                        .findFirst()
                        .flatMap(dk -> dangKyRepository.findByMaQRWithDetails(dk.getMaQR()));
                if (dangKyOpt.isPresent()) {
                    log.warn("QR encoding fallback used for activity={} — scanner may have decoded UTF-8 as Latin-1", request.getMaHoatDong());
                }
            }

            DangKyHoatDong dangKy = dangKyOpt
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với mã QR này"));

            if (!dangKy.getIsActive()) {
                return DiemDanhQRResponse.failed("Đăng ký đã bị hủy");
            }

            // STEP 3: Validate hoạt động
            HoatDong hoatDong = dangKy.getHoatDong();
            if (!hoatDong.getYeuCauDiemDanh()) {
                return DiemDanhQRResponse.failed("Hoạt động này không yêu cầu điểm danh");
            }

            // STEP 4a: Kiểm tra ngày — bỏ qua nếu hoạt động đang thực sự diễn ra (BCH đã bấm Bắt đầu)
            LocalDate today = LocalDate.now();
            boolean isActuallyRunning = hoatDong.getTrangThai() == TrangThaiHoatDongEnum.DANG_DIEN_RA;
            if (!isActuallyRunning && hoatDong.getNgayToChuc() != null && !today.equals(hoatDong.getNgayToChuc())) {
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

            // STEP 6: Phân nhánh theo chế độ điểm danh
            CheDoDiemDanhEnum cheDoMode = hoatDong.getCheDoDiemDanh() != null
                    ? hoatDong.getCheDoDiemDanh()
                    : CheDoDiemDanhEnum.CHECKIN_CHECKOUT;

            if (cheDoMode == CheDoDiemDanhEnum.AUTO_FULL) {
                return DiemDanhQRResponse.failed("Hoạt động này dùng điểm danh tự động — không cần quét QR");
            }

            // STEP 6b: BCH chọn rõ mode CHECK-IN / CHECK-OUT → bỏ qua cửa sổ thời gian
            String forcedMode = request.getAttendanceMode();
            if ("CHECKOUT".equalsIgnoreCase(forcedMode)
                    && cheDoMode == CheDoDiemDanhEnum.CHECKIN_CHECKOUT) {
                if (!alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Sinh viên chưa check-in — không thể check-out");
                }
                DiemDanhHoatDong dd = existingOpt.get();
                if (dd.getThoiGianCheckOut() != null) {
                    return DiemDanhQRResponse.failed("Sinh viên đã check-out rồi");
                }
                return processCheckoutByQR(request, dd, hoatDong);
            }
            if ("CHECKIN".equalsIgnoreCase(forcedMode)
                    && cheDoMode == CheDoDiemDanhEnum.CHECKIN_CHECKOUT) {
                if (alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Sinh viên đã check-in rồi");
                }
                return processCheckInByQR(request, dangKy, hoatDong, now);
            }

            if (cheDoMode == CheDoDiemDanhEnum.CHECKOUT_ONLY) {
                return processCheckoutOnlyMode(request, dangKy, hoatDong, today, now, existingOpt);
            }

            if (cheDoMode == CheDoDiemDanhEnum.CHECKIN_ONLY) {
                if (!isInCheckInWindow(hoatDong, today, now)) {
                    return DiemDanhQRResponse.failed("Ngoài thời gian điểm danh");
                }
                if (alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Mã QR này đã được quét rồi (đã check-in)");
                }
                return processCheckInOnlyMode(request, dangKy, hoatDong, now);
            }

            // CHECKIN_CHECKOUT — hành vi gốc theo cửa sổ thời gian
            if (isInCheckoutWindow(hoatDong, today, now)) {
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
                if (alreadyCheckedIn) {
                    return DiemDanhQRResponse.failed("Mã QR này đã được quét rồi (đã check-in)");
                }
                return processCheckInByQR(request, dangKy, hoatDong, now);
            }

            return DiemDanhQRResponse.failed("Ngoài thời gian điểm danh");

        } catch (DataIntegrityViolationException e) {
            // Hai tài khoản BCH quét cùng lúc → unique_attendance constraint → bắt gracefully
            log.warn("Duplicate attendance detected for QR: {} (concurrent scan)", request.getMaQR());
            return DiemDanhQRResponse.failed("Sinh viên đã được điểm danh rồi (quét đồng thời)");
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

        boolean isRunning = hoatDong.getTrangThai() == TrangThaiHoatDongEnum.DANG_DIEN_RA;
        if (hoatDong.getThoiGianBatDau() != null) {
            if (!isRunning && hoatDong.getChoPhepCheckInSom() != null) {
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
                // Ghi vào cả cột chung và cột check-in riêng
                .thietBiQuet(request.getThietBi())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .thietBiCheckIn(request.getThietBi())
                .latitudeCheckIn(request.getLatitude())
                .longitudeCheckIn(request.getLongitude())
                .ghiChu(request.getGhiChu())
                .build();

        diemDanh = diemDanhRepository.save(diemDanh);

        // ✅ FIX: Cập nhật DangKyHoatDong.trangThai → DA_CHECK_IN
        dangKy.setTrangThai("DA_CHECK_IN");
        dangKyRepository.save(dangKy);

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
     * CHECKIN_ONLY mode: chỉ cần check-in, không cần checkout.
     * Tự động set DA_THAM_GIA + datThoiGianToiThieu ngay khi quét.
     */
    private DiemDanhQRResponse processCheckInOnlyMode(DiemDanhQRRequest request,
                                                       DangKyHoatDong dangKy, HoatDong hoatDong,
                                                       LocalTime checkInTime) {
        BCHDoanHoi nguoiXacNhan = null;
        if (request.getMaBchXacNhan() != null) {
            nguoiXacNhan = bchRepository.findById(request.getMaBchXacNhan()).orElse(null);
        }

        TrangThaiCheckInEnum trangThaiCheckIn = TrangThaiCheckInEnum.DUNG_GIO;
        int soPhutTre = 0;

        if (hoatDong.getThoiGianBatDau() != null && checkInTime.isAfter(hoatDong.getThoiGianBatDau())) {
            long minutesLate = ChronoUnit.MINUTES.between(hoatDong.getThoiGianBatDau(), checkInTime);
            soPhutTre = (int) minutesLate;
            if (hoatDong.getThoiGianTreToiDa() != null && minutesLate > hoatDong.getThoiGianTreToiDa()) {
                trangThaiCheckIn = TrangThaiCheckInEnum.TRE_QUA_GIO;
            } else {
                trangThaiCheckIn = TrangThaiCheckInEnum.TRE_CHAP_NHAN;
            }
        }

        LocalDateTime now = LocalDateTime.now();
        DiemDanhHoatDong diemDanh = DiemDanhHoatDong.builder()
                .hoatDong(hoatDong)
                .sinhVien(dangKy.getSinhVien())
                .maQRDaQuet(request.getMaQR())
                .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)  // không cần checkout → đạt ngay
                .thoiGianCheckIn(now)
                .trangThaiCheckIn(trangThaiCheckIn)
                .soPhutTre(soPhutTre)
                .nguoiCheckIn(nguoiXacNhan)
                .thietBiQuet(request.getThietBi())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .thietBiCheckIn(request.getThietBi())
                .latitudeCheckIn(request.getLatitude())
                .longitudeCheckIn(request.getLongitude())
                .ghiChu(request.getGhiChu())
                .datThoiGianToiThieu(true)  // CHECKIN_ONLY không kiểm tra thời gian tối thiểu
                .build();

        diemDanh = diemDanhRepository.save(diemDanh);

        dangKy.setTrangThai("DA_THAM_GIA");
        dangKyRepository.save(dangKy);

        log.info("CHECKIN_ONLY check-in: student={}, activity={}", dangKy.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());
        notificationService.sendNotification(
                dangKy.getSinhVien().getMaSv(),
                "Điểm danh thành công",
                "Bạn đã điểm danh thành công hoạt động \"" + hoatDong.getTenHoatDong() + "\".",
                "ATTENDANCE_CHECKIN",
                hoatDong.getMaHoatDong()
        );

        return DiemDanhQRResponse.success("Điểm danh thành công", toDTO(diemDanh));
    }

    /**
     * CHECKOUT_ONLY mode: không cần check-in vật lý.
     * Khi QR được quét lần đầu → tạo record với thoiGianCheckIn = thoiGianBatDau (tự động),
     * rồi xử lý checkout ngay. Lần quét sau → lỗi đã checkout.
     */
    private DiemDanhQRResponse processCheckoutOnlyMode(DiemDanhQRRequest request,
                                                        DangKyHoatDong dangKy, HoatDong hoatDong,
                                                        LocalDate today, LocalTime now,
                                                        Optional<DiemDanhHoatDong> existingOpt) {
        // Chỉ cho checkout sau khi hoạt động đã bắt đầu
        if (hoatDong.getThoiGianBatDau() != null && now.isBefore(hoatDong.getThoiGianBatDau())) {
            return DiemDanhQRResponse.failed("Hoạt động chưa bắt đầu — chưa thể điểm danh ra");
        }

        DiemDanhHoatDong diemDanh;

        if (existingOpt.isPresent()) {
            diemDanh = existingOpt.get();
            if (diemDanh.getThoiGianCheckOut() != null) {
                return DiemDanhQRResponse.failed("Bạn đã check-out rồi");
            }
        } else {
            // Tạo auto check-in với thoiGianCheckIn = giờ bắt đầu hoạt động
            LocalDateTime autoCheckInTime = hoatDong.getThoiGianBatDau() != null
                    ? LocalDateTime.of(hoatDong.getNgayToChuc(), hoatDong.getThoiGianBatDau())
                    : LocalDateTime.of(hoatDong.getNgayToChuc(), LocalTime.of(0, 0));

            BCHDoanHoi nguoiXacNhan = request.getMaBchXacNhan() != null
                    ? bchRepository.findById(request.getMaBchXacNhan()).orElse(null)
                    : null;

            diemDanh = DiemDanhHoatDong.builder()
                    .hoatDong(hoatDong)
                    .sinhVien(dangKy.getSinhVien())
                    .maQRDaQuet(request.getMaQR())
                    .trangThai(TrangThaiThamGiaEnum.DANG_KY)
                    .thoiGianCheckIn(autoCheckInTime)
                    .trangThaiCheckIn(TrangThaiCheckInEnum.TU_DONG)
                    .soPhutTre(0)
                    .nguoiCheckIn(nguoiXacNhan)
                    .thietBiQuet(request.getThietBi())
                    .latitude(dangKy.getStudentLatitude() != null ? dangKy.getStudentLatitude() : request.getLatitude())
                    .longitude(dangKy.getStudentLongitude() != null ? dangKy.getStudentLongitude() : request.getLongitude())
                    .ghiChu(request.getGhiChu())
                    .build();
            diemDanh = diemDanhRepository.save(diemDanh);
            log.info("CHECKOUT_ONLY: auto check-in created for student={}, activity={}",
                    dangKy.getSinhVien().getMaSv(), hoatDong.getMaHoatDong());
        }

        return processCheckoutByQR(request, diemDanh, hoatDong);
    }

    /**
     * AUTO_FULL mode: BCH kích hoạt thủ công để điểm danh toàn bộ sinh viên đã đăng ký.
     */
    @Transactional
    public int autoDiemDanhAll(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        List<DangKyHoatDong> danhSach = dangKyRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);

        LocalDateTime checkInTime = hoatDong.getThoiGianBatDau() != null
                ? LocalDateTime.of(hoatDong.getNgayToChuc(), hoatDong.getThoiGianBatDau())
                : LocalDateTime.of(hoatDong.getNgayToChuc(), LocalTime.of(0, 0));

        LocalDateTime checkOutTime;
        if (Boolean.TRUE.equals(hoatDong.getKetThucSom()) && hoatDong.getThoiGianKetThucThucTe() != null) {
            checkOutTime = hoatDong.getThoiGianKetThucThucTe();
        } else if (hoatDong.getThoiGianKetThuc() != null) {
            checkOutTime = LocalDateTime.of(hoatDong.getNgayToChuc(), hoatDong.getThoiGianKetThuc());
        } else {
            checkOutTime = LocalDateTime.now();
        }

        long tongPhut = ChronoUnit.MINUTES.between(checkInTime, checkOutTime);
        boolean datToiThieu = hoatDong.getThoiGianToiThieu() == null || tongPhut >= hoatDong.getThoiGianToiThieu();

        int count = 0;
        for (DangKyHoatDong dk : danhSach) {
            boolean exists = diemDanhRepository
                    .existsBySinhVienMaSvAndHoatDongMaHoatDong(dk.getSinhVien().getMaSv(), maHoatDong);
            if (exists) continue;

            DiemDanhHoatDong dd = DiemDanhHoatDong.builder()
                    .hoatDong(hoatDong)
                    .sinhVien(dk.getSinhVien())
                    .maQRDaQuet(dk.getMaQR())
                    .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                    .thoiGianCheckIn(checkInTime)
                    .trangThaiCheckIn(TrangThaiCheckInEnum.TU_DONG)
                    .soPhutTre(0)
                    .thoiGianCheckOut(checkOutTime)
                    .trangThaiCheckOut(TrangThaiCheckOutEnum.HOAN_THANH)
                    .soPhutVeSom(0)
                    .tongThoiGianThamGia((int) tongPhut)
                    .datThoiGianToiThieu(datToiThieu)
                    .tinhGioPhucVu(datToiThieu)
                    .build();
            diemDanhRepository.save(dd);
            count++;
        }

        log.info("AUTO_FULL: created {} attendance records for activity={}", count, maHoatDong);
        return count;
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
        // Ghi vào cột check-out riêng
        diemDanh.setThietBiCheckOut(request.getThietBi());
        diemDanh.setLatitudeCheckOut(request.getLatitude());
        diemDanh.setLongitudeCheckOut(request.getLongitude());

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

        // ✅ FIX: Cập nhật DangKyHoatDong.trangThai → DA_CHECK_OUT
        dangKyRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(
                diemDanh.getSinhVien().getMaSv(), hoatDong.getMaHoatDong()
        ).ifPresent(dk -> {
            dk.setTrangThai("DA_CHECK_OUT");
            dangKyRepository.save(dk);
        });

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

        boolean isActuallyRunning = hoatDong.getTrangThai() == TrangThaiHoatDongEnum.DANG_DIEN_RA;

        // Nếu BCH đã bấm Bắt đầu → bỏ qua kiểm tra ngày và cửa sổ giờ
        if (isActuallyRunning) return true;

        if (hoatDong.getNgayToChuc() != null && !today.equals(hoatDong.getNgayToChuc())) return false;
        if (hoatDong.getThoiGianBatDau() == null) return true;

        LocalTime earliest = hoatDong.getThoiGianBatDau()
                .minusMinutes(hoatDong.getChoPhepCheckInSom() != null ? hoatDong.getChoPhepCheckInSom() : 15);
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

        // Normal end: same day (hoặc đang diễn ra sớm), after thoiGianKetThuc, within window
        boolean onEventDay = today.equals(hoatDong.getNgayToChuc())
                || hoatDong.getTrangThai() == TrangThaiHoatDongEnum.DANG_DIEN_RA;
        if (onEventDay && hoatDong.getThoiGianKetThuc() != null) {
            if (now.isAfter(hoatDong.getThoiGianKetThuc())) {
                LocalTime deadline = hoatDong.getThoiGianKetThuc().plusMinutes(allowedMinutes);
                return now.isBefore(deadline);
            }
        }

        // Fallback: hoạt động không có giờ kết thúc (thoiGianKetThuc = null) nhưng đang DANG_DIEN_RA
        // → cho phép checkout bất cứ lúc nào trong ngày tổ chức
        if (hoatDong.getThoiGianKetThuc() == null
                && hoatDong.getTrangThai() == TrangThaiHoatDongEnum.DANG_DIEN_RA
                && (hoatDong.getNgayToChuc() == null || today.equals(hoatDong.getNgayToChuc()))) {
            return true;
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

        // Check 1: Không rỗng
        if (maQR == null || maQR.isBlank()) {
            return QRValidationResult.invalid("Mã QR không được để trống");
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

        // ✅ FIX: maBchXacNhan có thể null (admin checkout thủ công không cần BCH xác nhận)
        BCHDoanHoi nguoiCheckOut = null;
        if (request.getMaBchXacNhan() != null && !request.getMaBchXacNhan().isBlank()) {
            nguoiCheckOut = bchRepository.findById(request.getMaBchXacNhan()).orElse(null);
        }

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

        // ✅ FIX: Cập nhật trangThai = DA_THAM_GIA khi checkout thành công
        diemDanh.setTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);
        diemDanh.setTrangThaiCheckOut(trangThaiCheckOut);
        diemDanh.setSoPhutVeSom(soPhutVeSom);
        // Tính giờ phục vụ dựa trên đạt thời gian tối thiểu
        diemDanh.setTinhGioPhucVu(Boolean.TRUE.equals(diemDanh.getDatThoiGianToiThieu()));

        diemDanh = diemDanhRepository.save(diemDanh);

        // ✅ FIX: Cập nhật DangKyHoatDong.trangThai → DA_CHECK_OUT
        dangKyRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(
                diemDanh.getSinhVien().getMaSv(), diemDanh.getHoatDong().getMaHoatDong()
        ).ifPresent(dk -> {
            dk.setTrangThai("DA_CHECK_OUT");
            dangKyRepository.save(dk);
        });

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

        // Tách riêng: sv đã thực sự check-in vs sv bị đánh vắng thủ công (VANG_MAT)
        List<DiemDanhHoatDongDTO> manualAbsentList = attendanceList.stream()
                .filter(a -> a.getTrangThai() == TrangThaiThamGiaEnum.VANG_MAT)
                .collect(Collectors.toList());

        // Sv có check-in VÀ có check-out → mới tính là đã tham gia
        List<DiemDanhHoatDongDTO> checkedInList = attendanceList.stream()
                .filter(a -> a.getTrangThai() != TrangThaiThamGiaEnum.VANG_MAT
                          && a.getThoiGianCheckOut() != null)
                .collect(Collectors.toList());

        // Sv có check-in nhưng KHÔNG checkout → tính vắng mặt
        List<DiemDanhHoatDongDTO> noCheckoutList = attendanceList.stream()
                .filter(a -> a.getTrangThai() != TrangThaiThamGiaEnum.VANG_MAT
                          && a.getThoiGianCheckOut() == null)
                .collect(Collectors.toList());

        // Sheet vắng = sv không có record + sv bị đánh vắng thủ công + sv không checkout
        List<Map<String, Object>> allAbsentList = new java.util.ArrayList<>(notCheckedIn);
        for (DiemDanhHoatDongDTO dto : manualAbsentList) {
            Map<String, Object> m = new HashMap<>();
            m.put("maSv", dto.getMaSv());
            m.put("hoTen", dto.getHoTenSinhVien());
            m.put("lop", dto.getMaLop() != null ? dto.getMaLop() : "");
            m.put("ngayDangKy", "");
            m.put("ghiChu", dto.getGhiChu() != null ? dto.getGhiChu() : "Đánh vắng thủ công");
            allAbsentList.add(m);
        }
        for (DiemDanhHoatDongDTO dto : noCheckoutList) {
            Map<String, Object> m = new HashMap<>();
            m.put("maSv", dto.getMaSv());
            m.put("hoTen", dto.getHoTenSinhVien());
            m.put("lop", dto.getMaLop() != null ? dto.getMaLop() : "");
            m.put("ngayDangKy", dto.getThoiGianCheckIn() != null
                    ? dto.getThoiGianCheckIn().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                    : "");
            m.put("ghiChu", "Có check-in nhưng không checkout");
            allAbsentList.add(m);
        }

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
            long daThamGia = checkedInList.stream()
                    .filter(a -> a.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA).count();
            long diTre = checkedInList.stream()
                    .filter(a -> a.getSoPhutTre() != null && a.getSoPhutTre() > 0).count();
            long veSom = checkedInList.stream()
                    .filter(a -> a.getSoPhutVeSom() != null && a.getSoPhutVeSom() > 0).count();
            long vangMat = allAbsentList.size(); // = notCheckedIn + manualAbsent

            // Gom nhóm theo lớp (maLop)
            // Dùng LinkedHashMap để giữ thứ tự chèn (sắp xếp ổn định)
            Map<String, long[]> statsByLop = new LinkedHashMap<>(); // [0]=đăng ký, [1]=tham gia
            checkedInList.forEach(a -> {
                String lop = a.getMaLop() != null && !a.getMaLop().isBlank() ? a.getMaLop() : "Chưa rõ lớp";
                statsByLop.computeIfAbsent(lop, k -> new long[]{0, 0});
                statsByLop.get(lop)[0]++;
                if (a.getTrangThai() == TrangThaiThamGiaEnum.DA_THAM_GIA) statsByLop.get(lop)[1]++;
            });
            allAbsentList.forEach(m -> {
                String lop = m.get("lop") != null ? String.valueOf(m.get("lop")) : "Chưa rõ lớp";
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
                {"Đã tham gia (đúng giờ + trễ)", String.valueOf(checkedInList.size())},
                {"  Trong đó: đúng giờ",    String.valueOf(checkedInList.size() - diTre)},
                {"  Trong đó: đến trễ",     String.valueOf(diTre)},
                {"  Trong đó: về sớm",      String.valueOf(veSom)},
                {"  Đạt thời gian tối thiểu", String.valueOf(daThamGia)},
                {"Vắng mặt (tổng)", String.valueOf(vangMat)},
                {"  Trong đó: không quét QR", String.valueOf(notCheckedIn.size())},
                {"  Trong đó: đánh vắng thủ công", String.valueOf(manualAbsentList.size())},
                {"Tỷ lệ tham gia",           tongDangKy > 0
                        ? String.format("%.1f%%", (double) checkedInList.size() / tongDangKy * 100)
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
                Cell cTotalAtt = rTotal.createCell(3); cTotalAtt.setCellValue(checkedInList.size()); cTotalAtt.setCellStyle(totalStyle);
                Cell cTotalAbs = rTotal.createCell(4); cTotalAbs.setCellValue(vangMat); cTotalAbs.setCellStyle(totalStyle);
                double totalRate = tongDangKy > 0 ? (double) checkedInList.size() / tongDangKy * 100 : 0;
                Cell cTotalRate = rTotal.createCell(5); cTotalRate.setCellValue(String.format("%.1f%%", totalRate)); cTotalRate.setCellStyle(totalStyle);
            }

            // Build cache maLop → tenKhoa từ DB (1 query, tránh N+1)
            Map<String, String> lopKhoaCache = new HashMap<>();
            lopRepository.findAll().forEach(lop -> {
                if (lop.getMaKhoa() != null && lop.getMaKhoa().getTenKhoa() != null) {
                    lopKhoaCache.put(lop.getMaLop(), lop.getMaKhoa().getTenKhoa());
                }
            });

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 2: Danh sách đã check-in
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetCI = wb.createSheet("Đã điểm danh (" + checkedInList.size() + ")");

            int[] ciWidths = {2000, 5000, 10000, 5000, 8000, 8000, 6000, 8000, 6000, 7000, 4000, 5000, 7000};
            for (int i = 0; i < ciWidths.length; i++) sheetCI.setColumnWidth(i, ciWidths[i]);

            String[] ciCols = {
                "STT", "Mã SV", "Họ và tên", "Lớp", "Khoa",
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
            for (DiemDanhHoatDongDTO dto : checkedInList) {
                Row r = sheetCI.createRow(ciRow++);
                boolean isLate = dto.getSoPhutTre() != null && dto.getSoPhutTre() > 0;
                CellStyle rowStyle = isLate ? lateStyle : dataStyle;
                CellStyle rowCenterStyle = isLate ? lateStyle : dataCenterStyle;

                setCell(r, 0, ciRow - 1, rowCenterStyle);
                setCell(r, 1, dto.getMaSv(), rowCenterStyle);
                setCell(r, 2, dto.getHoTenSinhVien(), rowStyle);
                setCell(r, 3, dto.getMaLop(), rowCenterStyle);
                setCell(r, 4, dto.getTenKhoa() != null ? dto.getTenKhoa() : getKhoaFromLop(dto.getMaLop(), lopKhoaCache), rowStyle);
                setCell(r, 5, dto.getThoiGianCheckIn() != null
                        ? dto.getThoiGianCheckIn().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                        : "", rowCenterStyle);
                setCell(r, 6, dto.getTrangThaiCheckIn() != null ? dto.getTrangThaiCheckIn() : "", rowCenterStyle);
                setCell(r, 7, dto.getThoiGianCheckOut() != null
                        ? dto.getThoiGianCheckOut().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                        : "", rowCenterStyle);
                setCell(r, 8, dto.getTrangThaiCheckOut() != null ? dto.getTrangThaiCheckOut() : "", rowCenterStyle);
                setCell(r, 9, dto.getSoPhutTre() != null ? dto.getSoPhutTre() : 0, rowCenterStyle);
                setCell(r, 10, dto.getSoPhutVeSom() != null ? dto.getSoPhutVeSom() : 0, rowCenterStyle);
                setCell(r, 11, Boolean.TRUE.equals(dto.getDatThoiGianToiThieu()) ? "Đạt" : "Chưa đạt", rowCenterStyle);
                setCell(r, 12, dto.getGhiChu() != null ? dto.getGhiChu() : "", rowStyle);
            }

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 3: Danh sách vắng mặt
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetVM = wb.createSheet("Vắng mặt (" + allAbsentList.size() + ")");

            int[] vmWidths = {2000, 5000, 10000, 5000, 8000, 9000, 9000};
            for (int i = 0; i < vmWidths.length; i++) sheetVM.setColumnWidth(i, vmWidths[i]);

            String[] vmCols = {"STT", "Mã SV", "Họ và tên", "Lớp", "Khoa", "Ngày đăng ký", "Ghi chú"};
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
            for (Map<String, Object> m : allAbsentList) {
                Row r = sheetVM.createRow(vmRow++);
                setCell(r, 0, vmRow - 1, absentStyle);
                setCell(r, 1, String.valueOf(m.getOrDefault("maSv", "")), absentStyle);
                setCell(r, 2, String.valueOf(m.getOrDefault("hoTen", "")), absentStyle);
                setCell(r, 3, String.valueOf(m.getOrDefault("lop", "")), absentStyle);
                setCell(r, 4, getKhoaFromLop(String.valueOf(m.getOrDefault("lop", "")), lopKhoaCache), absentStyle);
                Object ngayDK = m.get("ngayDangKy");
                setCell(r, 5, ngayDK != null ? ngayDK.toString() : "", absentStyle);
                setCell(r, 6, String.valueOf(m.getOrDefault("ghiChu", "")), absentStyle);
            }

            // ════════════════════════════════════════════════════════════════════════
            // SHEET 4: Tỷ lệ theo Khoa
            // ════════════════════════════════════════════════════════════════════════
            Sheet sheetKhoa = wb.createSheet("Tỷ lệ theo Khoa");
            sheetKhoa.setColumnWidth(0, 2000);
            sheetKhoa.setColumnWidth(1, 14000);
            sheetKhoa.setColumnWidth(2, 5000);
            sheetKhoa.setColumnWidth(3, 4000);
            sheetKhoa.setColumnWidth(4, 4000);
            sheetKhoa.setColumnWidth(5, 6000);

            // Header
            Row khoaHeader = sheetKhoa.createRow(0);
            String[] khoaCols = {"STT", "Khoa / Ngành", "Tổng đăng ký", "Có mặt", "Vắng mặt", "Tỷ lệ có mặt (%)"};
            for (int i = 0; i < khoaCols.length; i++) {
                Cell c = khoaHeader.createCell(i);
                c.setCellValue(khoaCols[i]);
                c.setCellStyle(headerStyle);
            }

            // Tính thống kê theo khoa
            Map<String, long[]> statsByKhoa = new LinkedHashMap<>(); // [0]=đăng ký, [1]=có mặt
            for (DiemDanhHoatDongDTO dto : checkedInList) {
                String khoa = getKhoaFromLop(dto.getMaLop(), lopKhoaCache);
                statsByKhoa.computeIfAbsent(khoa, k -> new long[]{0, 0});
                statsByKhoa.get(khoa)[0]++;
                statsByKhoa.get(khoa)[1]++;
            }
            for (Map<String, Object> m : allAbsentList) {
                String lop = m.get("lop") != null ? String.valueOf(m.get("lop")) : "";
                String khoa = getKhoaFromLop(lop, lopKhoaCache);
                statsByKhoa.computeIfAbsent(khoa, k -> new long[]{0, 0});
                statsByKhoa.get(khoa)[0]++;
            }

            List<Map.Entry<String, long[]>> sortedKhoa = statsByKhoa.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .collect(Collectors.toList());

            int khoaRow = 1;
            for (Map.Entry<String, long[]> entry : sortedKhoa) {
                Row r = sheetKhoa.createRow(khoaRow++);
                long[] v = entry.getValue();
                long vangKhoa = v[0] - v[1];
                double rateKhoa = v[0] > 0 ? (double) v[1] / v[0] * 100 : 0;
                Cell c0 = r.createCell(0); c0.setCellValue(khoaRow - 1); c0.setCellStyle(dataCenterStyle);
                Cell c1 = r.createCell(1); c1.setCellValue(entry.getKey()); c1.setCellStyle(dataStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(v[0]); c2.setCellStyle(dataCenterStyle);
                Cell c3 = r.createCell(3); c3.setCellValue(v[1]); c3.setCellStyle(dataCenterStyle);
                Cell c4 = r.createCell(4); c4.setCellValue(vangKhoa); c4.setCellStyle(dataCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(String.format("%.1f%%", rateKhoa)); c5.setCellStyle(dataCenterStyle);
            }

            // Dòng tổng
            Row khoaTotal = sheetKhoa.createRow(khoaRow);
            CellStyle khoaTotalStyle = wb.createCellStyle();
            Font khoaTotalFont = wb.createFont(); khoaTotalFont.setBold(true);
            khoaTotalStyle.setFont(khoaTotalFont);
            khoaTotalStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            khoaTotalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            khoaTotalStyle.setBorderBottom(BorderStyle.THIN); khoaTotalStyle.setBorderTop(BorderStyle.THIN);
            khoaTotalStyle.setBorderLeft(BorderStyle.THIN);  khoaTotalStyle.setBorderRight(BorderStyle.THIN);
            khoaTotalStyle.setAlignment(HorizontalAlignment.CENTER);
            Cell kt0 = khoaTotal.createCell(0); kt0.setCellValue(""); kt0.setCellStyle(khoaTotalStyle);
            Cell kt1 = khoaTotal.createCell(1); kt1.setCellValue("TỔNG CỘNG"); kt1.setCellStyle(khoaTotalStyle);
            Cell kt2 = khoaTotal.createCell(2); kt2.setCellValue(tongDangKy); kt2.setCellStyle(khoaTotalStyle);
            Cell kt3 = khoaTotal.createCell(3); kt3.setCellValue(checkedInList.size()); kt3.setCellStyle(khoaTotalStyle);
            Cell kt4 = khoaTotal.createCell(4); kt4.setCellValue(allAbsentList.size()); kt4.setCellStyle(khoaTotalStyle);
            double totalRateKhoa = tongDangKy > 0 ? (double) checkedInList.size() / tongDangKy * 100 : 0;
            Cell kt5 = khoaTotal.createCell(5); kt5.setCellValue(String.format("%.1f%%", totalRateKhoa)); kt5.setCellStyle(khoaTotalStyle);

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

    /** Tra tên khoa từ mã lớp qua DB. lopKhoaCache: maLop → tenKhoa (truyền vào để tránh query N+1) */
    private String getKhoaFromLop(String maLop, Map<String, String> lopKhoaCache) {
        if (maLop == null || maLop.isBlank()) return "Chưa rõ khoa";
        return lopKhoaCache.getOrDefault(maLop, "Chưa rõ khoa");
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

    /**
     * Thêm sinh viên vào danh sách điểm danh theo MSSV — chỉ dành cho admin.
     * Nếu SV đã có record trong activity → cập nhật trangThai thành DA_THAM_GIA.
     * Nếu chưa có → tạo record mới với check-in/out = now.
     */
    @Transactional
    public DiemDanhHoatDongDTO themThuCongTheoMSSV(String maHoatDong, String maSv,
                                                    String ghiChu, String nguoiThucHien) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new com.tathanhloc.youthkgu.Exception.BusinessException(
                        "NOT_FOUND", "Không tìm thấy hoạt động: " + maHoatDong));
        SinhVien sinhVien = sinhVienRepository.findByMaSv(maSv)
                .orElseThrow(() -> new com.tathanhloc.youthkgu.Exception.BusinessException(
                        "NOT_FOUND", "Không tìm thấy sinh viên MSSV: " + maSv));

        String note = (ghiChu != null && !ghiChu.isBlank())
                ? ghiChu : "Thêm thủ công bởi " + nguoiThucHien;

        LocalDateTime now = LocalDateTime.now();

        // 1. Tạo hoặc cập nhật DangKyHoatDong để SV xuất hiện trong danh sách đăng ký
        Optional<DangKyHoatDong> dangKyOpt =
                dangKyRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong);
        if (dangKyOpt.isEmpty()) {
            DangKyHoatDongId dkId = new DangKyHoatDongId(maSv, maHoatDong);
            DangKyHoatDong dk = DangKyHoatDong.builder()
                    .id(dkId)
                    .sinhVien(sinhVien)
                    .hoatDong(hoatDong)
                    .maQR("MANUAL_" + maHoatDong + "_" + maSv)
                    .trangThai("DA_THAM_GIA")
                    .ghiChu("[Bổ sung thủ công] " + note)
                    .isActive(true)
                    .build();
            dangKyRepository.save(dk);
        } else {
            DangKyHoatDong dk = dangKyOpt.get();
            dk.setTrangThai("DA_THAM_GIA");
            dangKyRepository.save(dk);
        }

        // 2. Tạo hoặc cập nhật DiemDanhHoatDong
        Optional<DiemDanhHoatDong> existing =
                diemDanhRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong);

        DiemDanhHoatDong dd;
        if (existing.isPresent()) {
            dd = existing.get();
            dd.setTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);
            if (dd.getThoiGianCheckIn() == null) dd.setThoiGianCheckIn(now);
            if (dd.getThoiGianCheckOut() == null) dd.setThoiGianCheckOut(now);
            dd.setGhiChu(note);
        } else {
            dd = DiemDanhHoatDong.builder()
                    .hoatDong(hoatDong)
                    .sinhVien(sinhVien)
                    .maQRDaQuet("MANUAL_" + maHoatDong + "_" + maSv)
                    .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                    .thoiGianCheckIn(now)
                    .thoiGianCheckOut(now)
                    .trangThaiCheckIn(TrangThaiCheckInEnum.TU_DONG)
                    .datThoiGianToiThieu(true)
                    .ghiChu(note)
                    .build();
        }
        dd = diemDanhRepository.save(dd);
        log.info("Thêm thủ công SV {} vào HĐ {} bởi {}", maSv, maHoatDong, nguoiThucHien);
        return toDTO(dd);
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
            map.put("lop", row.length > 4 ? row[4] : "");
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

        long totalAttendance = diemDanhRepository.countAll();
        // ✅ FIX: dùng countByTrangThai thay vì countByHoatDongMaHoatDongAndTrangThai(null, ...)
        long successful = diemDanhRepository.countByTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);
        long absent = diemDanhRepository.countByTrangThai(TrangThaiThamGiaEnum.VANG_MAT);

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

    /**
     * Thêm thủ công 1 sinh viên CHƯA đăng ký vào hoạt động đã kết thúc (tính năng ẩn).
     * Tạo luôn DangKyHoatDong + DiemDanhHoatDong với trạng thái DA_THAM_GIA.
     */
    @Transactional
    public DiemDanhHoatDongDTO manualAddUnregistered(String maSv, String maHoatDong, String ghiChu) {
        log.info("Manual add unregistered: student={}, activity={}", maSv, maHoatDong);

        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + maSv));

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        // Kiểm tra đã có điểm danh chưa
        if (diemDanhRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong)) {
            throw new RuntimeException("Sinh viên này đã có bản ghi điểm danh trong hoạt động");
        }

        LocalDateTime now = LocalDateTime.now();

        // Tạo DangKyHoatDong nếu chưa có
        boolean hasDangKy = dangKyRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong).isPresent();
        if (!hasDangKy) {
            DangKyHoatDongId dkId = new DangKyHoatDongId(maSv, maHoatDong);
            DangKyHoatDong dk = DangKyHoatDong.builder()
                    .id(dkId)
                    .sinhVien(sinhVien)
                    .hoatDong(hoatDong)
                    .maQR(maHoatDong + maSv)
                    .trangThai("DA_THAM_GIA")
                    .ghiChu("[Bổ sung thủ công]")
                    .isActive(true)
                    .build();
            dangKyRepository.save(dk);
        }

        // Tạo DiemDanhHoatDong
        DiemDanhHoatDong dd = DiemDanhHoatDong.builder()
                .hoatDong(hoatDong)
                .sinhVien(sinhVien)
                .maQRDaQuet("MANUAL_ADD")
                .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                .thoiGianCheckIn(now)
                .trangThaiCheckIn(TrangThaiCheckInEnum.DUNG_GIO)
                .soPhutTre(0)
                .datThoiGianToiThieu(true)
                .ghiChu(ghiChu != null && !ghiChu.isBlank() ? ghiChu : "Bổ sung thủ công sau khi kết thúc")
                .build();

        dd = diemDanhRepository.save(dd);
        log.info("Manual add unregistered OK: student={}, activity={}", maSv, maHoatDong);
        return toDTO(dd);
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

    // ========== ATTENDANCE SELECTION PAGE ==========

    /**
     * Lấy danh sách hoạt động kèm thống kê điểm danh để hiển thị trang chọn hoạt động điểm danh.
     *
     * @param filter "dang_dien_ra" | "sap_bat_dau" | "hom_nay" (default) | "tat_ca"
     */
    public List<ActivityAttendanceOverviewDTO> getActivitiesForAttendance(String filter) {
        LocalDate today = LocalDate.now();
        List<HoatDong> activities;

        switch (filter != null ? filter.toLowerCase() : "hom_nay") {
            case "dang_dien_ra":
                activities = hoatDongRepository.findByTrangThaiAndIsActive(
                        TrangThaiHoatDongEnum.DANG_DIEN_RA, true);
                break;
            case "sap_bat_dau":
                // Bao gồm cả SAP_DIEN_RA và DANG_MO_DANG_KY (chưa diễn ra)
                List<HoatDong> sap = hoatDongRepository.findByTrangThaiAndIsActive(
                        TrangThaiHoatDongEnum.SAP_DIEN_RA, true);
                List<HoatDong> dangMo = hoatDongRepository.findByTrangThaiAndIsActive(
                        TrangThaiHoatDongEnum.DANG_MO_DANG_KY, true);
                activities = new ArrayList<>(sap);
                activities.addAll(dangMo);
                activities.sort(Comparator.comparing(HoatDong::getNgayToChuc)
                        .thenComparing(hd -> hd.getGioToChuc() != null ? hd.getGioToChuc() : LocalTime.MIN));
                break;
            case "tat_ca":
                activities = hoatDongRepository.findByIsActiveTrue().stream()
                        .filter(hd -> hd.getTrangThai() != TrangThaiHoatDongEnum.DA_HUY
                                && hd.getTrangThai() != TrangThaiHoatDongEnum.DA_HOAN_THANH)
                        .sorted(Comparator.comparing(HoatDong::getNgayToChuc).reversed())
                        .collect(Collectors.toList());
                break;
            case "hom_nay":
            default:
                activities = hoatDongRepository.findOngoingActivities(today);
                break;
        }

        return activities.stream()
                .map(hd -> {
                    long soLuongDangKy = dangKyRepository
                            .countByHoatDongMaHoatDongAndIsActiveTrue(hd.getMaHoatDong());
                    long soLuongDaDiemDanh = diemDanhRepository
                            .countByHoatDongMaHoatDong(hd.getMaHoatDong());
                    return ActivityAttendanceOverviewDTO.builder()
                            .maHoatDong(hd.getMaHoatDong())
                            .tenHoatDong(hd.getTenHoatDong())
                            .ngayToChuc(hd.getNgayToChuc())
                            .gioToChuc(hd.getGioToChuc())
                            .thoiGianBatDau(hd.getThoiGianBatDau())
                            .thoiGianKetThuc(hd.getThoiGianKetThuc())
                            .diaDiem(hd.getDiaDiem())
                            .trangThai(hd.getTrangThai())
                            .loaiHoatDong(hd.getLoaiHoatDong())
                            .cheDoDiemDanh(hd.getCheDoDiemDanh())
                            .soLuongDangKy(soLuongDangKy)
                            .soLuongDaDiemDanh(soLuongDaDiemDanh)
                            .diemRenLuyen(hd.getDiemRenLuyen())
                            .maDanhMucRenLuyen(hd.getMaDanhMucRenLuyen())
                            .build();
                })
                .collect(Collectors.toList());
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