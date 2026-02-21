package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ChungNhanHoatDongDTO;
import com.tathanhloc.faceattendance.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý chứng nhận hoạt động
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChungNhanHoatDongService {

    private final ChungNhanHoatDongRepository chungNhanRepository;
    private final DiemDanhHoatDongRepository diemDanhRepository;
    private final SinhVienRepository sinhVienRepository;
    private final HoatDongRepository hoatDongRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChungNhanHoatDongDTO> getAll() {
        log.debug("Getting all active certificates");
        return chungNhanRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChungNhanHoatDongDTO getById(Long id) {
        log.debug("Getting certificate by ID: {}", id);
        ChungNhanHoatDong chungNhan = chungNhanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chứng nhận: " + id));
        return toDTO(chungNhan);
    }

    @Transactional(readOnly = true)
    public ChungNhanHoatDongDTO getByMaChungNhan(String maChungNhan) {
        log.debug("Getting certificate by code: {}", maChungNhan);
        ChungNhanHoatDong chungNhan = chungNhanRepository.findByMaChungNhan(maChungNhan)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chứng nhận: " + maChungNhan));
        return toDTO(chungNhan);
    }

    /**
     * Cấp chứng nhận tự động cho sinh viên đã hoàn thành hoạt động
     */
    @Transactional
    public ChungNhanHoatDongDTO issueAutomatic(String maSv, String maHoatDong) {
        log.info("Auto-issuing certificate: student={}, activity={}", maSv, maHoatDong);

        // Validate sinh viên
        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + maSv));

        // Validate hoạt động
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        // Kiểm tra đã có chứng nhận chưa
        if (chungNhanRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong)) {
            throw new RuntimeException("Sinh viên đã có chứng nhận cho hoạt động này");
        }

        // Kiểm tra đã tham gia chưa
        DiemDanhHoatDong diemDanh = diemDanhRepository
                .findBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong)
                .orElseThrow(() -> new RuntimeException("Sinh viên chưa tham gia hoạt động này"));

        if (diemDanh.getTrangThai() != TrangThaiThamGiaEnum.DA_THAM_GIA) {
            throw new RuntimeException("Sinh viên chưa hoàn thành hoạt động");
        }

        // Sinh mã chứng nhận
        String maChungNhan = generateCertificateCode(maHoatDong, maSv);

        // Tạo chứng nhận
        ChungNhanHoatDong chungNhan = ChungNhanHoatDong.builder()
                .maChungNhan(maChungNhan)
                .sinhVien(sinhVien)
                .hoatDong(hoatDong)
                .ngayCap(LocalDate.now())
                .noiDung(String.format("Chứng nhận %s đã hoàn thành hoạt động '%s'",
                        sinhVien.getHoTen(), hoatDong.getTenHoatDong()))
                .isActive(true)
                .build();

        chungNhan = chungNhanRepository.save(chungNhan);

        log.info("Certificate issued: {}", maChungNhan);
        return toDTO(chungNhan);
    }

    /**
     * Cấp chứng nhận thủ công (admin)
     */
    @Transactional
    public ChungNhanHoatDongDTO issueManual(ChungNhanHoatDongDTO dto) {
        log.info("Manual-issuing certificate for student: {}", dto.getMaSv());

        // Validate
        SinhVien sinhVien = sinhVienRepository.findById(dto.getMaSv())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + dto.getMaSv()));

        HoatDong hoatDong = hoatDongRepository.findById(dto.getMaHoatDong())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + dto.getMaHoatDong()));

        if (chungNhanRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(
                dto.getMaSv(), dto.getMaHoatDong())) {
            throw new RuntimeException("Chứng nhận đã tồn tại");
        }

        String maChungNhan = dto.getMaChungNhan() != null ?
                dto.getMaChungNhan() :
                generateCertificateCode(dto.getMaHoatDong(), dto.getMaSv());

        ChungNhanHoatDong chungNhan = ChungNhanHoatDong.builder()
                .maChungNhan(maChungNhan)
                .sinhVien(sinhVien)
                .hoatDong(hoatDong)
                .ngayCap(dto.getNgayCap() != null ? dto.getNgayCap() : LocalDate.now())
                .noiDung(dto.getNoiDung())
                .filePath(dto.getFilePath())
                .isActive(true)
                .build();

        chungNhan = chungNhanRepository.save(chungNhan);

        log.info("Manual certificate issued: {}", maChungNhan);
        return toDTO(chungNhan);
    }

    /**
     * Cấp hàng loạt chứng nhận cho tất cả sinh viên đã hoàn thành
     */
    @Transactional
    public List<ChungNhanHoatDongDTO> issueBulk(String maHoatDong) {
        log.info("Bulk-issuing certificates for activity: {}", maHoatDong);

        // Lấy danh sách sinh viên đã hoàn thành
        List<DiemDanhHoatDong> completedList = diemDanhRepository
                .findByHoatDongMaHoatDongAndTrangThai(maHoatDong, TrangThaiThamGiaEnum.DA_THAM_GIA);

        List<ChungNhanHoatDongDTO> results = new ArrayList<>();

        for (DiemDanhHoatDong diemDanh : completedList) {
            String maSv = diemDanh.getSinhVien().getMaSv();

            // Skip nếu đã có chứng nhận
            if (chungNhanRepository.existsBySinhVienMaSvAndHoatDongMaHoatDong(maSv, maHoatDong)) {
                log.debug("Certificate already exists for student: {}", maSv);
                continue;
            }

            try {
                ChungNhanHoatDongDTO cert = issueAutomatic(maSv, maHoatDong);
                results.add(cert);
            } catch (Exception e) {
                log.error("Failed to issue certificate for student: {}", maSv, e);
            }
        }

        log.info("Bulk certificates issued: {} out of {}", results.size(), completedList.size());
        return results;
    }

    @Transactional
    public void revoke(Long id, String lyDo) {
        log.info("Revoking certificate: {} - Reason: {}", id, lyDo);

        ChungNhanHoatDong chungNhan = chungNhanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chứng nhận: " + id));

        chungNhan.setIsActive(false);
        chungNhanRepository.save(chungNhan);

        log.info("Certificate revoked: {}", id);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChungNhanHoatDongDTO> getByStudent(String maSv) {
        log.debug("Getting certificates for student: {}", maSv);
        return chungNhanRepository.findBySinhVienMaSvAndIsActiveTrue(maSv).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChungNhanHoatDongDTO> getByActivity(String maHoatDong) {
        log.debug("Getting certificates for activity: {}", maHoatDong);
        return chungNhanRepository.findByHoatDongMaHoatDong(maHoatDong).stream()
                .filter(cn -> cn.getIsActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChungNhanHoatDongDTO> getByDateRange(LocalDate startDate, LocalDate endDate) {
        log.debug("Getting certificates from {} to {}", startDate, endDate);
        return chungNhanRepository.findByDateRange(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== HELPER METHODS ==========

    private String generateCertificateCode(String maHoatDong, String maSv) {
        // Format: CN-{MaHoatDong}-{MaSV}-{Timestamp}
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
        return String.format("CN-%s-%s-%s", maHoatDong, maSv, timestamp);
    }

    // ========== MAPPING METHODS ==========

    private ChungNhanHoatDongDTO toDTO(ChungNhanHoatDong entity) {
        if (entity == null) return null;

        return ChungNhanHoatDongDTO.builder()
                .id(entity.getId())
                .maChungNhan(entity.getMaChungNhan())
                .maSv(entity.getSinhVien().getMaSv())
                .hoTenSinhVien(entity.getSinhVien().getHoTen())
                .emailSinhVien(entity.getSinhVien().getEmail())
                .maHoatDong(entity.getHoatDong().getMaHoatDong())
                .tenHoatDong(entity.getHoatDong().getTenHoatDong())
                .ngayCap(entity.getNgayCap())
                .noiDung(entity.getNoiDung())
                .filePath(entity.getFilePath())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}