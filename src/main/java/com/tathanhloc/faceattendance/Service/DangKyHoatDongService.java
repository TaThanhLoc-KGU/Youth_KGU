package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý đăng ký hoạt động
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DangKyHoatDongService {

    private final DangKyHoatDongRepository dangKyRepository;
    private final HoatDongRepository hoatDongRepository;
    private final SinhVienRepository sinhVienRepository;
    private final DiemDanhHoatDongRepository diemDanhRepository;
    private final QRCodeService qrCodeService;

    // ========== ĐĂNG KÝ OPERATIONS ==========

    @Transactional
    public DangKyHoatDongDTO registerActivity(DangKyHoatDongRequest request) {
        log.info("Registering student {} for activity {}", request.getMaSv(), request.getMaHoatDong());

        // 1. Validate hoạt động
        HoatDong hoatDong = hoatDongRepository.findById(request.getMaHoatDong())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + request.getMaHoatDong()));

        if (!hoatDong.getChoPhepDangKy()) {
            throw new RuntimeException("Hoạt động không cho phép đăng ký");
        }

        if (hoatDong.getHanDangKy() != null && LocalDateTime.now().isAfter(hoatDong.getHanDangKy())) {
            throw new RuntimeException("Đã hết hạn đăng ký");
        }

        // 2. Validate sinh viên
        SinhVien sinhVien = sinhVienRepository.findById(request.getMaSv())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + request.getMaSv()));

        // 3. Kiểm tra đã đăng ký chưa
        DangKyHoatDongId id = new DangKyHoatDongId(request.getMaSv(), request.getMaHoatDong());
        if (dangKyRepository.existsById(id)) {
            throw new RuntimeException("Sinh viên đã đăng ký hoạt động này");
        }

        // 4. Kiểm tra số lượng
        long currentRegistrations = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(request.getMaHoatDong());
        if (currentRegistrations >= hoatDong.getSoLuongToiDa()) {
            throw new RuntimeException("Hoạt động đã đủ số lượng");
        }

        // 5. Tạo đăng ký
        DangKyHoatDong dangKy = DangKyHoatDong.builder()
                .id(id)
                .sinhVien(sinhVien)
                .hoatDong(hoatDong)
                .ghiChu(request.getGhiChu())
                .daXacNhan(false)
                .isActive(true)
                .build();

        // Mã QR sẽ tự động sinh trong @PrePersist
        dangKy = dangKyRepository.save(dangKy);

        // 6. Sinh QR Code image
        try {
            String qrImagePath = qrCodeService.generateAndSaveQRCode(
                    dangKy.getMaQR(),
                    request.getMaHoatDong()
            );
            dangKy.setQrCodeImagePath(qrImagePath);
            dangKy = dangKyRepository.save(dangKy);

            log.info("QR code generated and saved: {}", qrImagePath);
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code for registration", e);
            // Vẫn cho phép đăng ký, chỉ log lỗi
        }

        log.info("Registration successful: {} - QR: {}", id, dangKy.getMaQR());
        return toDTO(dangKy);
    }

    @Transactional
    public void cancelRegistration(String maSv, String maHoatDong) {
        log.info("Cancelling registration: student={}, activity={}", maSv, maHoatDong);

        DangKyHoatDongId id = new DangKyHoatDongId(maSv, maHoatDong);
        DangKyHoatDong dangKy = dangKyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký"));

        // Xóa QR code file nếu có
        if (dangKy.getQrCodeImagePath() != null) {
            qrCodeService.deleteQRCodeFile(dangKy.getQrCodeImagePath());
        }

        dangKy.setIsActive(false);
        dangKyRepository.save(dangKy);

        log.info("Registration cancelled successfully");
    }

    @Transactional
    public void confirmRegistration(String maSv, String maHoatDong) {
        log.info("Confirming registration: student={}, activity={}", maSv, maHoatDong);

        DangKyHoatDongId id = new DangKyHoatDongId(maSv, maHoatDong);
        DangKyHoatDong dangKy = dangKyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký"));

        dangKy.setDaXacNhan(true);
        dangKyRepository.save(dangKy);

        log.info("Registration confirmed");
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<DangKyHoatDongDTO> getByActivity(String maHoatDong) {
        log.debug("Getting registrations for activity: {}", maHoatDong);
        return dangKyRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DangKyHoatDongDTO> getByStudent(String maSv) {
        log.debug("Getting registrations for student: {}", maSv);
        return dangKyRepository.findBySinhVienMaSvAndIsActiveTrue(maSv).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DangKyHoatDongDTO getByQRCode(String maQR) {
        log.debug("Getting registration by QR code: {}", maQR);
        DangKyHoatDong dangKy = dangKyRepository.findByMaQRAndIsActiveTrue(maQR)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với mã QR: " + maQR));
        return toDTO(dangKy);
    }

    @Transactional(readOnly = true)
    public List<DangKyHoatDongDTO> getPendingConfirmations(String maHoatDong) {
        log.debug("Getting pending confirmations for activity: {}", maHoatDong);
        return dangKyRepository.findByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(maHoatDong).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== QR CODE OPERATIONS ==========

    @Transactional(readOnly = true)
    public String getQRCodeBase64(String maSv, String maHoatDong) {
        log.debug("Getting QR code Base64 for: student={}, activity={}", maSv, maHoatDong);

        DangKyHoatDongId id = new DangKyHoatDongId(maSv, maHoatDong);
        DangKyHoatDong dangKy = dangKyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký"));

        try {
            return qrCodeService.generateQRCodeBase64(dangKy.getMaQR());
        } catch (Exception e) {
            log.error("Failed to generate QR code Base64", e);
            throw new RuntimeException("Lỗi khi sinh QR code: " + e.getMessage());
        }
    }

    @Transactional
    public Map<String, String> regenerateQRCodes(String maHoatDong) {
        log.info("Regenerating QR codes for activity: {}", maHoatDong);

        List<DangKyHoatDong> registrations = dangKyRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);

        List<String> maQRList = registrations.stream()
                .map(DangKyHoatDong::getMaQR)
                .collect(Collectors.toList());

        Map<String, String> results = qrCodeService.generateBulkQRCodes(maQRList, maHoatDong);

        // Update paths
        for (DangKyHoatDong dangKy : registrations) {
            String newPath = results.get(dangKy.getMaQR());
            if (newPath != null && !newPath.startsWith("ERROR")) {
                dangKy.setQrCodeImagePath(newPath);
            }
        }

        dangKyRepository.saveAll(registrations);

        log.info("QR codes regenerated for {} registrations", registrations.size());
        return results;
    }

    // ========== STATISTICS ==========

    @Transactional(readOnly = true)
    public Map<String, Object> getRegistrationStatistics(String maHoatDong) {
        long total = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);
        long confirmed = dangKyRepository.countByHoatDongMaHoatDongAndDaXacNhanTrueAndIsActiveTrue(maHoatDong);
        long pending = dangKyRepository.countByHoatDongMaHoatDongAndDaXacNhanFalseAndIsActiveTrue(maHoatDong);
        long checkedIn = diemDanhRepository.countByHoatDongMaHoatDong(maHoatDong);

        Map<String, Object> stats = new HashMap<>();
        stats.put("tongDangKy", total);
        stats.put("daXacNhan", confirmed);
        stats.put("choXacNhan", pending);
        stats.put("daCheckIn", checkedIn);
        stats.put("chuaCheckIn", total - checkedIn);
        stats.put("tyLeCheckIn", total > 0 ? (double) checkedIn / total * 100 : 0);

        return stats;
    }

    // ========== MAPPING METHODS ==========

    private DangKyHoatDongDTO toDTO(DangKyHoatDong entity) {
        if (entity == null) return null;

        // Check if already checked in
        boolean daDiemDanh = diemDanhRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(
                entity.getId().getMaSv(),
                entity.getId().getMaHoatDong()
        );

        return DangKyHoatDongDTO.builder()
                .maSv(entity.getId().getMaSv())
                .hoTenSinhVien(entity.getSinhVien().getHoTen())
                .emailSinhVien(entity.getSinhVien().getEmail())
                .tenLop(entity.getSinhVien().getLop().getTenLop())
                .maHoatDong(entity.getId().getMaHoatDong())
                .tenHoatDong(entity.getHoatDong().getTenHoatDong())
                .ngayToChuc(entity.getHoatDong().getNgayToChuc())
                .maQR(entity.getMaQR())
                .qrCodeImagePath(entity.getQrCodeImagePath())
                .ngayDangKy(entity.getNgayDangKy())
                .ghiChu(entity.getGhiChu())
                .daXacNhan(entity.getDaXacNhan())
                .isActive(entity.getIsActive())
                .daDiemDanh(daDiemDanh)
                .build();
    }
    @Transactional(readOnly = true)
    public List<TopStudentDTO> getTopStudents(int limit, String maKhoa,
                                              LocalDate fromDate, LocalDate toDate) {
        log.debug("Getting top {} students", limit);

        // Lấy danh sách sinh viên có nhiều hoạt động nhất
        List<Object[]> results = dangKyRepository.findTopStudentsByParticipation(
                limit, maKhoa, fromDate, toDate);

        int rank = 1;
        List<TopStudentDTO> topStudents = new ArrayList<>();

        for (Object[] row : results) {
            String maSv = (String) row[0];
            Long soHoatDongDangKy = ((Number) row[1]).longValue();
            Long soHoatDongThamGia = ((Number) row[2]).longValue();

            // Lấy thông tin sinh viên
            SinhVien sv = sinhVienRepository.findById(maSv).orElse(null);
            if (sv == null) continue;

            // Tính tỷ lệ hoàn thành
            double tiLeHoanThanh = soHoatDongDangKy > 0 ?
                    (double) soHoatDongThamGia / soHoatDongDangKy * 100 : 0;

            // Tính tổng điểm rèn luyện
            Integer tongDiem = diemDanhRepository.sumDiemRenLuyenBySinhVien(
                    maSv, fromDate, toDate);

            topStudents.add(TopStudentDTO.builder()
                    .maSv(sv.getMaSv())
                    .hoTen(sv.getHoTen())
                    .email(sv.getEmail())
                    .tenLop(sv.getLop().getTenLop())
                    .tenKhoa(sv.getLop().getNganh().getKhoa().getTenKhoa()) // SỬA LẠI ĐÚNG
                    .soHoatDongDangKy(soHoatDongDangKy)
                    .soHoatDongThamGia(soHoatDongThamGia)
                    .tiLeHoanThanh(Math.round(tiLeHoanThanh * 100.0) / 100.0)
                    .tongDiemRenLuyen(tongDiem != null ? tongDiem : 0)
                    .rank(rank++)
                    .build());
        }

        return topStudents;
    }
}