package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChungNhanHoatDongDTO;
import com.tathanhloc.youthkgu.DTO.ChungNhanTemplateFieldDTO;
import com.tathanhloc.youthkgu.Enum.TrangThaiThamGiaEnum;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    private final KhoaScopeService khoaScopeService;
    private final ChungNhanTemplateService chungNhanTemplateService;
    private final ChungNhanRenderService chungNhanRenderService;
    private final FileStorageService fileStorageService;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChungNhanHoatDongDTO> getAll() {
        log.debug("Getting all active certificates");
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maKhoa != null) {
            return chungNhanRepository.findByIsActiveTrue().stream()
                    .filter(cn -> cn.getHoatDong() != null
                            && cn.getHoatDong().getKhoa() != null
                            && maKhoa.equals(cn.getHoatDong().getKhoa().getMaKhoa()))
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }
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
     * Cấp chứng nhận tự động cho sinh viên đã hoàn thành hoạt động.
     * templateId != null → render kèm file PDF (ảnh khoá) từ mẫu; null → chỉ tạo bản ghi (tương
     * thích ngược với các nơi gọi cũ chưa chọn mẫu).
     */
    @Transactional
    public ChungNhanHoatDongDTO issueAutomatic(String maSv, String maHoatDong, Long templateId) {
        log.info("Auto-issuing certificate: student={}, activity={}, template={}", maSv, maHoatDong, templateId);

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

        ChungNhanTemplate template = null;
        String filePath = null;
        if (templateId != null) {
            template = chungNhanTemplateService.getEntityById(templateId);
            filePath = renderAndSave(template, sinhVien, hoatDong, maChungNhan);
        }

        // Tạo chứng nhận
        ChungNhanHoatDong chungNhan = ChungNhanHoatDong.builder()
                .maChungNhan(maChungNhan)
                .sinhVien(sinhVien)
                .hoatDong(hoatDong)
                .template(template)
                .ngayCap(LocalDate.now())
                .noiDung(String.format("Chứng nhận %s đã hoàn thành hoạt động '%s'",
                        sinhVien.getHoTen(), hoatDong.getTenHoatDong()))
                .filePath(filePath)
                .isActive(true)
                .build();

        chungNhan = chungNhanRepository.save(chungNhan);

        log.info("Certificate issued: {}", maChungNhan);
        return toDTO(chungNhan);
    }

    /**
     * Xem trước chứng nhận (PNG, base64) trước khi cấp thật. Có maSv+maHoatDong → dùng dữ liệu
     * thật; không có → dùng dữ liệu mẫu (để xem trước ngay trong lúc thiết kế mẫu).
     */
    @Transactional(readOnly = true)
    public String previewBase64(Long templateId, String maSv, String maHoatDong) {
        ChungNhanTemplate template = chungNhanTemplateService.getEntityById(templateId);
        List<ChungNhanTemplateFieldDTO> fields = chungNhanTemplateService.parseFields(template.getFieldsJson());

        ChungNhanRenderService.CertData data;
        if (maSv != null && !maSv.isBlank() && maHoatDong != null && !maHoatDong.isBlank()) {
            SinhVien sinhVien = sinhVienRepository.findById(maSv)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + maSv));
            HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
            data = new ChungNhanRenderService.CertData(
                    sinhVien.getHoTen(), sinhVien.getMaSv(),
                    sinhVien.getLop() != null ? sinhVien.getLop().getTenLop() : null,
                    (sinhVien.getLop() != null && sinhVien.getLop().getMaKhoa() != null)
                            ? sinhVien.getLop().getMaKhoa().getTenKhoa() : null,
                    hoatDong.getTenHoatDong(),
                    LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    "CN-XEM-TRUOC");
        } else {
            data = new ChungNhanRenderService.CertData(
                    "NGUYỄN VĂN A", "SV000000", "Lớp mẫu", "Khoa mẫu",
                    "Tên hoạt động mẫu",
                    LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    "CN-XEM-TRUOC");
        }

        try {
            byte[] png = chungNhanRenderService.renderToPng(template, fields, data);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi tạo bản xem trước: " + e.getMessage());
        }
    }

    /** Render chứng nhận từ mẫu + dữ liệu thật, lưu file, trả về đường dẫn tương đối. */
    private String renderAndSave(ChungNhanTemplate template, SinhVien sinhVien, HoatDong hoatDong, String maChungNhan) {
        List<ChungNhanTemplateFieldDTO> fields = chungNhanTemplateService.parseFields(template.getFieldsJson());
        ChungNhanRenderService.CertData data = new ChungNhanRenderService.CertData(
                sinhVien.getHoTen(),
                sinhVien.getMaSv(),
                sinhVien.getLop() != null ? sinhVien.getLop().getTenLop() : null,
                (sinhVien.getLop() != null && sinhVien.getLop().getMaKhoa() != null)
                        ? sinhVien.getLop().getMaKhoa().getTenKhoa() : null,
                hoatDong.getTenHoatDong(),
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                maChungNhan
        );
        try {
            byte[] pdf = chungNhanRenderService.render(template, fields, data);
            return fileStorageService.saveChungNhanFile(pdf);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi tạo file chứng nhận: " + e.getMessage());
        }
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
     * Cấp hàng loạt chứng nhận cho tất cả sinh viên đã hoàn thành. Bắt buộc chọn mẫu — mục đích
     * của tính năng là thay hoàn toàn chứng nhận giấy bằng file PDF thật, không chỉ tạo bản ghi.
     */
    @Transactional
    public List<ChungNhanHoatDongDTO> issueBulk(String maHoatDong, Long templateId) {
        log.info("Bulk-issuing certificates for activity: {}, template={}", maHoatDong, templateId);

        if (templateId == null) {
            throw new RuntimeException("Vui lòng chọn mẫu chứng nhận trước khi cấp hàng loạt");
        }

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
                ChungNhanHoatDongDTO cert = issueAutomatic(maSv, maHoatDong, templateId);
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
                .templateId(entity.getTemplate() != null ? entity.getTemplate().getId() : null)
                .ngayCap(entity.getNgayCap())
                .noiDung(entity.getNoiDung())
                .filePath(entity.getFilePath())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}