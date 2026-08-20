package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.DiemDanhStatusDTO;
import com.tathanhloc.youthkgu.DTO.FileUploadResult;
import com.tathanhloc.youthkgu.DTO.HoatDongDTO;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Util.AcademicCalendarUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final NamHocRepository namHocRepository;
    private final CauLacBoRepository cauLacBoRepository;
    private final DiemRenLuyenCriteriaService criteriaService;
    private final NotificationService notificationService;
    private final KhoaScopeService khoaScopeService;
    private final SinhVienRepository sinhVienRepository;
    private final EmailService emailService;
    private final ZaloService zaloService;
    private final FileStorageService fileStorageService;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getAll() {
        log.debug("Getting all active activities");
        
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        String maClb  = khoaScopeService.getCurrentMaClb();
        List<HoatDong> list;

        if (maClb != null) {
            // Tài khoản CLB: chỉ thấy hoạt động của CLB mình
            list = hoatDongRepository.findByCauLacBoMaClbOrderByNgayToChucDesc(maClb);
        } else if (maKhoa != null) {
            // Cán bộ khoa thấy: hoạt động của khoa mình + hoạt động cấp trường (khoa = null)
            list = hoatDongRepository.findByKhoaScopeOrGlobal(maKhoa);
        } else {
            // Đoàn trường: thấy tất cả (findByIsActiveTrueOrIsActiveIsNull tương thích data cũ)
            list = hoatDongRepository.findByIsActiveTrueOrIsActiveIsNull();
        }
        
        Map<String, Long> dangKyCountMap = buildDangKyCountMap();
        return list.stream()
                .map(hd -> toDTO(hd, dangKyCountMap))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<HoatDongDTO> getAllWithPagination(Pageable pageable) {
        log.debug("Getting all activities with pagination");

        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        Map<String, Long> dangKyCountMap = buildDangKyCountMap();
        if (maKhoa != null) {
            // Cán bộ khoa: hoạt động khoa mình + cấp trường
            return hoatDongRepository.findByKhoaScopeOrGlobalPaged(maKhoa, pageable)
                    .map(hd -> toDTO(hd, dangKyCountMap));
        }

        return hoatDongRepository.findByIsActive(true, pageable).map(hd -> toDTO(hd, dangKyCountMap));
    }

    /**
     * Bulk-load số đăng ký của TẤT CẢ hoạt động thành 1 map, dùng cho các API trả về danh sách
     * (getAll/getAllWithPagination/getByTrangThai) để tránh N+1 — xem toDTO(entity, map) và
     * HoatDongRepository.countDangKyGroupByHoatDong().
     */
    private Map<String, Long> buildDangKyCountMap() {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : hoatDongRepository.countDangKyGroupByHoatDong()) {
            map.put((String) row[0], (Long) row[1]);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public HoatDongDTO getById(String maHoatDong) {
        log.debug("Getting activity by ID: {}", maHoatDong);
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        
        // Kiểm tra quyền truy cập (nếu là cán bộ khoa) — hoạt động cấp trường (khoa=null) luôn xem được,
        // giống quy ước ở getAll()/getAllWithPagination(); chỉ chặn khi khoa khác với scope của người xem.
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maKhoa != null) {
            if (hoatDong.getKhoa() != null && !hoatDong.getKhoa().getMaKhoa().equals(maKhoa)) {
                throw new RuntimeException("Bạn không có quyền xem hoạt động này");
            }
        }
        
        return toDTO(hoatDong);
    }

    /** Overload nhận kèm file quyết định (PDF/Word/...) — lưu file trước khi tạo hoạt động. */
    @Transactional
    public HoatDongDTO create(HoatDongDTO dto, MultipartFile quyetDinhFile) {
        if (quyetDinhFile != null && !quyetDinhFile.isEmpty()) {
            FileUploadResult result = fileStorageService.saveHoatDongQuyetDinhFile(quyetDinhFile);
            dto.setQuyetDinhUrl(result.getDuongDan());
            dto.setQuyetDinhTen(quyetDinhFile.getOriginalFilename());
        }
        return create(dto);
    }

    @Transactional
    public HoatDongDTO create(HoatDongDTO dto) {
        log.info("Creating new activity: {}", dto.getMaHoatDong());

        // Validate mã hoạt động
        if (hoatDongRepository.existsById(dto.getMaHoatDong())) {
            throw new RuntimeException("Mã hoạt động đã tồn tại: " + dto.getMaHoatDong());
        }

        // Validate điểm rèn luyện so với tiêu chí
        validateDiemRenLuyen(dto);

        HoatDong hoatDong = toEntity(dto);

        // ÉP SCOPE CLB: tài khoản CLB → ép capDo=BAN_DOI_CLB, gán cauLacBo, và bắt buộc đặt trạng thái CHO_DUYET
        String maClb = khoaScopeService.getCurrentMaClb();
        if (maClb != null) {
            hoatDong.setCapDo(CapDoEnum.BAN_DOI_CLB);
            hoatDong.setTrangThai(TrangThaiHoatDongEnum.CHO_DUYET); // Luôn bắt đầu bằng Chờ phê duyệt
            cauLacBoRepository.findById(maClb).ifPresent(hoatDong::setCauLacBo);
        } else {
            // ÉP SCOPE KHOA: cán bộ khoa → ép capDo=KHOA, khoa=khoaOfUser, và bắt buộc đặt trạng thái CHO_DUYET
            String maKhoa = khoaScopeService.getCurrentMaKhoa();
            if (maKhoa != null) {
                hoatDong.setCapDo(CapDoEnum.KHOA);
                hoatDong.setTrangThai(TrangThaiHoatDongEnum.CHO_DUYET); // Luôn bắt đầu bằng Chờ phê duyệt
                khoaRepository.findById(maKhoa).ifPresent(hoatDong::setKhoa);
            }
        }
        
        // Mọi hoạt động mới tạo đều bắt đầu Ở TRẠNG THÁI ẨN (chưa công khai) — kể cả khi tạo trực tiếp
        // bởi Đoàn trường (không qua CHO_DUYET). Tin tức, thông báo và hiển thị công khai cho sinh viên
        // chỉ phát sinh khi hoạt động được "Công khai" — qua duyệt (CLB/Khoa) hoặc bấm nút Công khai
        // (Đoàn trường tạo trực tiếp). Xem publishActivity().
        hoatDong.setIsActive(true);
        hoatDong.setCongKhai(false);
        hoatDong = hoatDongRepository.save(hoatDong);

        log.info("Activity created successfully: {}", hoatDong.getMaHoatDong());
        return toDTO(hoatDong);
    }

    /**
     * Công khai hoạt động: hiển thị cho sinh viên xem/đăng ký.
     * <p>
     * KHÔNG tự động gửi email/thông báo, KHÔNG tự động tạo tin tức ở đây — theo yêu cầu nghiệp vụ, việc
     * gửi email/thông báo CHỈ thực hiện khi người dùng chủ động bấm nút "Gửi email"/"Gửi thông báo" (xem
     * guiEmailThongBao(), NotificationController#broadcast()), và tin tức CHỈ được tạo thủ công qua giao
     * diện quản lý tin tức. Trước đây "Công khai"/"Duyệt" tự động gửi email + thông báo tới TOÀN BỘ sinh
     * viên và tự tạo 1 bài tin tức như tác dụng phụ ẩn — vừa gây khó chịu (người duyệt không chủ ý gửi
     * mail/tạo tin), vừa làm request bị delay nặng vì vòng lặp gửi đồng bộ cho hàng trăm/nghìn sinh viên
     * chạy ngay trong transaction của "Công khai"/"Duyệt".
     */
    private void publishActivity(HoatDong hoatDong) {
        hoatDong.setCongKhai(true);
    }

    /** Công khai hoạt động — hiển thị cho SV xem/đăng ký (xem publishActivity). */
    @Transactional
    public HoatDongDTO congKhaiHoatDong(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        publishActivity(hoatDong);
        hoatDong = hoatDongRepository.save(hoatDong);
        log.info("Activity công khai: {}", maHoatDong);
        return toDTO(hoatDong);
    }

    /** Ẩn hoạt động khỏi danh sách công khai (không xóa tin tức đã đăng, không thu hồi thông báo đã gửi). */
    @Transactional
    public HoatDongDTO anHoatDong(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        hoatDong.setCongKhai(false);
        hoatDong = hoatDongRepository.save(hoatDong);
        log.info("Activity đã ẩn: {}", maHoatDong);
        return toDTO(hoatDong);
    }

    /** Trả về file resource của quyết định đính kèm hoạt động, dùng để xem/tải trực tuyến. */
    @Transactional(readOnly = true)
    public Resource getQuyetDinhResource(String maHoatDong) {
        HoatDong hd = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        if (hd.getQuyetDinhUrl() == null || hd.getQuyetDinhUrl().isBlank()) {
            throw new RuntimeException("Hoạt động chưa có quyết định đính kèm");
        }
        return fileStorageService.loadAsResource(hd.getQuyetDinhUrl());
    }

    /** Đuôi file quyết định (vd "pdf") — dùng để build Content-Type khi xem trực tuyến. */
    @Transactional(readOnly = true)
    public String getQuyetDinhExtension(String maHoatDong) {
        HoatDong hd = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        String url = hd.getQuyetDinhUrl();
        if (url == null || !url.contains(".")) return "";
        return url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    }

    @Transactional
    public HoatDongDTO update(String maHoatDong, HoatDongDTO dto) {
        log.info("Updating activity: {}", maHoatDong);

        HoatDong existing = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        // KIỂM TRA SCOPE TRƯỚC KHI CẬP NHẬT
        String maClb  = khoaScopeService.getCurrentMaClb();
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maClb != null) {
            if (existing.getCauLacBo() == null || !existing.getCauLacBo().getMaClb().equals(maClb)) {
                throw new RuntimeException("Không có quyền sửa hoạt động của CLB khác");
            }
        } else if (maKhoa != null) {
            if (existing.getKhoa() == null || !existing.getKhoa().getMaKhoa().equals(maKhoa)) {
                throw new RuntimeException("Không có quyền sửa hoạt động của khoa khác");
            }
        }

        // Validate điểm rèn luyện so với tiêu chí
        validateDiemRenLuyen(dto);

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

    // ========== APPROVAL WORKFLOW ==========

    /**
     * Kiểm tra người duyệt hiện tại (theo scope CLB/khoa) có quyền duyệt/từ chối ĐÚNG hoạt động này
     * không — cùng logic với update(). ADMIN/Đoàn trường (không có scope) duyệt được mọi hoạt động.
     */
    private void kiemTraScopeDuyet(HoatDong hoatDong) {
        String maClb  = khoaScopeService.getCurrentMaClb();
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maClb != null) {
            if (hoatDong.getCauLacBo() == null || !hoatDong.getCauLacBo().getMaClb().equals(maClb)) {
                throw new RuntimeException("Không có quyền duyệt hoạt động của CLB khác");
            }
        } else if (maKhoa != null) {
            if (hoatDong.getKhoa() == null || !hoatDong.getKhoa().getMaKhoa().equals(maKhoa)) {
                throw new RuntimeException("Không có quyền duyệt hoạt động của khoa khác");
            }
        }
    }

    @Transactional
    public HoatDongDTO duyetHoatDong(String maHoatDong, TrangThaiHoatDongEnum trangThaiMoi, String nguoiDuyet) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        if (hoatDong.getTrangThai() != TrangThaiHoatDongEnum.CHO_DUYET) {
            throw new RuntimeException("Hoạt động không ở trạng thái chờ duyệt");
        }

        // KIỂM TRA SCOPE — DUYET_HOAT_DONG_CLB/DUYET_HOAT_DONG chỉ cho phép duyệt hoạt động đúng
        // phạm vi CLB/khoa của người duyệt (giống update()), tránh 1 CLB/khoa duyệt hộ CLB/khoa khác.
        kiemTraScopeDuyet(hoatDong);

        hoatDong.setTrangThai(trangThaiMoi);
        hoatDong.setNguoiDuyet(nguoiDuyet);
        hoatDong.setNgayDuyet(LocalDateTime.now());
        hoatDong.setLyDoTuChoi(null);
        // Đoàn trường duyệt = công khai luôn: hiện cho SV xem/đăng ký. Không cần bấm thêm nút
        // "Công khai" sau khi duyệt (không tự gửi email/thông báo/tạo tin tức — xem publishActivity()).
        publishActivity(hoatDong);
        hoatDong = hoatDongRepository.save(hoatDong);

        log.info("Activity approved: {} → {} by {}", maHoatDong, trangThaiMoi, nguoiDuyet);
        return toDTO(hoatDong);
    }

    @Transactional
    public HoatDongDTO tuChoiHoatDong(String maHoatDong, String lyDo, String nguoiDuyet) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        if (hoatDong.getTrangThai() != TrangThaiHoatDongEnum.CHO_DUYET) {
            throw new RuntimeException("Hoạt động không ở trạng thái chờ duyệt");
        }

        kiemTraScopeDuyet(hoatDong);

        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DA_HUY);
        hoatDong.setNguoiDuyet(nguoiDuyet);
        hoatDong.setNgayDuyet(LocalDateTime.now());
        hoatDong.setLyDoTuChoi(lyDo);
        hoatDong = hoatDongRepository.save(hoatDong);

        log.info("Activity rejected: {} by {} reason: {}", maHoatDong, nguoiDuyet, lyDo);
        return toDTO(hoatDong);
    }

    /**
     * Gửi email thông báo hoạt động đến tất cả sinh viên đang hoạt động (async).
     */
    public Map<String, Object> guiEmailThongBao(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        List<SinhVien> sinhViens = sinhVienRepository.findByIsActive(true);
        emailService.sendBulkHoatDongNotification(sinhViens, hoatDong);
        log.info("Triggered email notification for activity {} to {} students", maHoatDong, sinhViens.size());
        return Map.of("maHoatDong", maHoatDong, "soSinhVien", sinhViens.size());
    }

    /**
     * Gửi thông báo Zalo cho hoạt động đến tất cả sinh viên đã liên kết Zalo.
     */
    public Map<String, Object> guiZaloThongBao(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        List<SinhVien> sinhViens = sinhVienRepository.findByIsActive(true);
        long soCoZalo = sinhViens.stream().filter(sv -> sv.getZaloUserId() != null).count();
        zaloService.sendBulkHoatDongNotification(sinhViens, hoatDong);
        log.info("Triggered Zalo notification for activity {} to {}/{} students with Zalo",
                maHoatDong, soCoZalo, sinhViens.size());
        return Map.of("maHoatDong", maHoatDong, "soSinhVien", sinhViens.size(), "soCoZalo", soCoZalo);
    }

    /**
     * Gửi cả email + Zalo cùng lúc.
     */
    public Map<String, Object> guiThongBaoDayDu(String maHoatDong) {
        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));
        List<SinhVien> sinhViens = sinhVienRepository.findByIsActive(true);
        long soCoZalo = sinhViens.stream().filter(sv -> sv.getZaloUserId() != null).count();
        emailService.sendBulkHoatDongNotification(sinhViens, hoatDong);
        zaloService.sendBulkHoatDongNotification(sinhViens, hoatDong);
        return Map.of("maHoatDong", maHoatDong, "soSinhVien", sinhViens.size(), "soCoZalo", soCoZalo);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getByTrangThai(TrangThaiHoatDongEnum trangThai) {
        log.debug("Getting activities by status: {}", trangThai);
        Map<String, Long> dangKyCountMap = buildDangKyCountMap();
        return hoatDongRepository.findByTrangThaiAndIsActiveFetchAll(trangThai, true).stream()
                .map(hd -> toDTO(hd, dangKyCountMap))
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

        notificationService.sendNotificationToAllStudents(
                "Mở đăng ký hoạt động",
                "Hoạt động \"" + hoatDong.getTenHoatDong() + "\" đã mở đăng ký. Đăng ký ngay!",
                "HOAT_DONG_MOI",
                maHoatDong
        );

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

        // Lưu lại trạng thái cũ để có thể revert nếu lỡ tay
        if (hoatDong.getTrangThai() != TrangThaiHoatDongEnum.DANG_DIEN_RA) {
            hoatDong.setTrangThaiTruocKhiBatDau(hoatDong.getTrangThai().name());
        }
        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DANG_DIEN_RA);
        hoatDong.setThoiGianBatDauThucTe(java.time.LocalDateTime.now());
        hoatDongRepository.save(hoatDong);

        log.info("Activity started: {} at {}", maHoatDong, hoatDong.getThoiGianBatDauThucTe());
    }

    /**
     * Hoàn tác lệnh "Bắt đầu hoạt động" nếu chưa có sinh viên nào check-in.
     * Quay lại trạng thái trước đó (DANG_MO_DANG_KY, SAP_DIEN_RA...).
     */
    @Transactional
    public void revertActivityStart(String maHoatDong) {
        log.info("Reverting activity start: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        if (hoatDong.getTrangThai() != TrangThaiHoatDongEnum.DANG_DIEN_RA) {
            throw new RuntimeException("Hoạt động chưa bắt đầu — không cần hoàn tác");
        }

        // Kiểm tra đã có ai check-in chưa
        long soLuongDaDiemDanh = diemDanhRepository.countByHoatDongMaHoatDong(maHoatDong);
        if (soLuongDaDiemDanh > 0) {
            throw new RuntimeException(
                    "Không thể hoàn tác: đã có " + soLuongDaDiemDanh + " sinh viên check-in. " +
                    "Hãy dùng nút Kết thúc sớm để đóng hoạt động.");
        }

        // Khôi phục trạng thái cũ
        TrangThaiHoatDongEnum prevStatus = TrangThaiHoatDongEnum.DANG_MO_DANG_KY;
        if (hoatDong.getTrangThaiTruocKhiBatDau() != null) {
            try {
                prevStatus = TrangThaiHoatDongEnum.valueOf(hoatDong.getTrangThaiTruocKhiBatDau());
            } catch (IllegalArgumentException ignored) { /* dùng default */ }
        }

        hoatDong.setTrangThai(prevStatus);
        hoatDong.setThoiGianBatDauThucTe(null);
        hoatDong.setTrangThaiTruocKhiBatDau(null);
        hoatDongRepository.save(hoatDong);

        log.info("Activity reverted to {}: {}", prevStatus, maHoatDong);
    }

    @Transactional
    public void completeActivity(String maHoatDong) {
        log.info("Completing activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setTrangThai(TrangThaiHoatDongEnum.DA_HOAN_THANH);
        hoatDong.setChoPhepDangKy(false);
        hoatDongRepository.save(hoatDong);

        long daThamGia = diemDanhRepository.countByHoatDongMaHoatDong(maHoatDong);
        long soDangKy = dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong);
        notificationService.sendNotificationToAllStudents(
                "Hoạt động đã hoàn thành",
                "Hoạt động \"" + hoatDong.getTenHoatDong() + "\" đã hoàn thành với "
                        + daThamGia + "/" + soDangKy + " sinh viên tham gia.",
                "KET_QUA",
                maHoatDong
        );

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

        notificationService.sendNotificationToAllStudents(
                "Hoạt động bị hủy",
                "Hoạt động \"" + hoatDong.getTenHoatDong() + "\" đã bị hủy. Lý do: " + lyDo,
                "HE_THONG",
                maHoatDong
        );

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

    /**
     * Lấy thống kê hoạt động tổng hợp
     */
    public Map<String, Object> getActivityStatisticsOverview() {
        log.debug("Getting overall activity statistics");

        Map<String, Long> statusStats = getStatisticsByStatus();

        Map<String, Object> overview = new HashMap<>();
        overview.put("tongHoatDong", statusStats.values().stream().mapToLong(Long::longValue).sum());
        overview.put("hoatDongSapDienRa", statusStats.getOrDefault("SAP_DIEN_RA", 0L));
        overview.put("hoatDongDangDienRa", statusStats.getOrDefault("DANG_DIEN_RA", 0L));
        overview.put("hoatDongDaHoanThanh", statusStats.getOrDefault("DA_HOAN_THANH", 0L));
        overview.put("hoatDongDaHuy", statusStats.getOrDefault("DA_HUY", 0L));

        // Thống kê theo loại
        Map<String, Long> byType = new HashMap<>();
        Arrays.stream(LoaiHoatDongEnum.values()).forEach(loai -> {
            long count = hoatDongRepository.findByLoaiHoatDong(loai).stream()
                    .filter(hd -> hd.getIsActive())
                    .count();
            byType.put(loai.name(), count);
        });
        overview.put("thongKeTheoLoai", byType);

        // Thống kê theo cấp độ
        Map<String, Long> byLevel = new HashMap<>();
        Arrays.stream(CapDoEnum.values()).forEach(capDo -> {
            long count = hoatDongRepository.findByCapDo(capDo).stream()
                    .filter(hd -> hd.getIsActive())
                    .count();
            byLevel.put(capDo.name(), count);
        });
        overview.put("thongKeTheoCapDo", byLevel);

        // Tính tổng đăng ký và tham gia
        long totalRegistrations = hoatDongRepository.findByIsActiveTrue().stream()
                .mapToLong(hd -> dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(hd.getMaHoatDong()))
                .sum();
        overview.put("tongLuotDangKy", totalRegistrations);

        long totalParticipation = hoatDongRepository.findByIsActiveTrue().stream()
                .mapToLong(hd -> diemDanhRepository.countByHoatDongMaHoatDong(hd.getMaHoatDong()))
                .sum();
        overview.put("tongLuotThamGia", totalParticipation);

        double avgParticipationRate = totalRegistrations > 0 ?
                (double) totalParticipation / totalRegistrations * 100 : 0;
        overview.put("tiLeThamGiaTrungBinh", Math.round(avgParticipationRate * 100.0) / 100.0);

        // Tính tổng điểm rèn luyện
        int totalPoints = hoatDongRepository.findByIsActiveTrue().stream()
                .mapToInt(hd -> hd.getDiemRenLuyen() != null ? hd.getDiemRenLuyen() : 0)
                .sum();
        overview.put("tongDiemRenLuyen", totalPoints);

        overview.put("diemRenLuyenTrungBinh", hoatDongRepository.findByIsActiveTrue().isEmpty() ? 0 :
                Math.round((double) totalPoints / hoatDongRepository.findByIsActiveTrue().size() * 100.0) / 100.0);

        return overview;
    }

    /**
     * Lấy danh sách chi tiết trạng thái điểm danh của từng sinh viên trong một hoạt động
     */
    @Transactional(readOnly = true)
    public List<DiemDanhStatusDTO> getAttendanceStatusList(String maHoatDong) {
        log.debug("Getting attendance status list for activity: {}", maHoatDong);

        // 1. Lấy danh sách đăng ký — bao gồm cả isActive=NULL (legacy rows)
        List<DangKyHoatDong> dangKyList = dangKyRepository.findByHoatDongMaHoatDongAndIsActiveNotFalse(maHoatDong);

        // 2. Lấy danh sách đã điểm danh
        List<DiemDanhHoatDong> diemDanhList = diemDanhRepository.findByHoatDongMaHoatDong(maHoatDong);

        // Map để tra cứu nhanh thông tin điểm danh theo mã SV
        // Dùng merge function để tránh crash khi có bản ghi trùng (giữ bản ghi mới nhất theo thoiGianCheckIn)
        Map<String, DiemDanhHoatDong> diemDanhMap = diemDanhList.stream()
                .collect(Collectors.toMap(
                        dd -> dd.getSinhVien().getMaSv(),
                        dd -> dd,
                        (existing, replacement) -> {
                            // Giữ bản ghi có thoiGianCheckIn mới nhất
                            if (existing.getThoiGianCheckIn() == null) return replacement;
                            if (replacement.getThoiGianCheckIn() == null) return existing;
                            return replacement.getThoiGianCheckIn().isAfter(existing.getThoiGianCheckIn())
                                    ? replacement : existing;
                        }
                ));

        // 3. Merge thông tin
        return dangKyList.stream().map(dk -> {
            String maSv = dk.getSinhVien().getMaSv();
            DiemDanhHoatDong dd = diemDanhMap.get(maSv);
            
            DiemDanhStatusDTO dto = DiemDanhStatusDTO.builder()
                    .maSv(maSv)
                    .hoTen(dk.getSinhVien().getHoTen())
                    .lop(dk.getSinhVien().getLop() != null ? dk.getSinhVien().getLop().getTenLop() : null)
                    .maQR(dk.getMaQR())
                    .ngayDangKy(dk.getNgayDangKy())
                    .daDiemDanh(dd != null)
                    .studentLatitude(dk.getStudentLatitude())
                    .studentLongitude(dk.getStudentLongitude())
                    .build();
            
            if (dd != null) {
                dto.setThoiGianCheckIn(dd.getThoiGianCheckIn());
                dto.setThoiGianCheckOut(dd.getThoiGianCheckOut());
                dto.setTrangThaiCheckIn(dd.getTrangThaiCheckIn() != null ? dd.getTrangThaiCheckIn().name() : null);
                dto.setTrangThaiCheckOut(dd.getTrangThaiCheckOut() != null ? dd.getTrangThaiCheckOut().name() : null);
                dto.setTrangThaiThamGia(dd.getTrangThai() != null ? dd.getTrangThai().name() : null);
                dto.setSoPhutTre(dd.getSoPhutTre());
                dto.setSoPhutVeSom(dd.getSoPhutVeSom());
                dto.setGhiChu(dd.getGhiChu());
            } else {
                dto.setTrangThaiThamGia("CHUA_DIEM_DANH");
            }
            
            return dto;
        }).collect(Collectors.toList());
    }

    // ========== EARLY TERMINATION ==========

    @Transactional
    public HoatDongDTO earlyTerminate(String maHoatDong) {
        log.info("Early terminating activity: {}", maHoatDong);

        HoatDong hoatDong = hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoạt động: " + maHoatDong));

        hoatDong.setKetThucSom(true);
        hoatDong.setThoiGianKetThucThucTe(LocalDateTime.now());
        hoatDong = hoatDongRepository.save(hoatDong);

        log.info("Activity early terminated: {}", maHoatDong);
        return toDTO(hoatDong);
    }

    // ========== AUTO STATUS COMPUTATION ==========

    /**
     * Tính trạng thái tự động dựa trên thời gian hiện tại.
     * DA_HUY / DA_HOAN_THANH → giữ nguyên (manual override).
     */
    public TrangThaiHoatDongEnum computeTrangThai(HoatDong hoatDong) {
        TrangThaiHoatDongEnum stored = hoatDong.getTrangThai();

        // Manual overrides stay unchanged
        if (stored == TrangThaiHoatDongEnum.DA_HUY
                || stored == TrangThaiHoatDongEnum.DA_HOAN_THANH
                || stored == TrangThaiHoatDongEnum.CHO_DUYET) {
            return stored;
        }

        // Early termination flag
        if (Boolean.TRUE.equals(hoatDong.getKetThucSom())) {
            return TrangThaiHoatDongEnum.DA_KET_THUC;
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalDate ngayToChuc = hoatDong.getNgayToChuc();
        // Ngày kết thúc thực sự: dùng ngayKetThuc nếu có, fallback về ngayToChuc
        LocalDate ngayKetThucThucSu = hoatDong.getNgayKetThuc() != null
                ? hoatDong.getNgayKetThuc() : ngayToChuc;

        if (ngayToChuc != null) {
            // Trước ngày bắt đầu → SAP_DIEN_RA
            if (today.isBefore(ngayToChuc)) {
                // handled below (falls through to DANG_MO_DANG_KY or SAP_DIEN_RA)
            }
            // Sau ngày kết thúc → DA_KET_THUC
            else if (today.isAfter(ngayKetThucThucSu)) {
                return TrangThaiHoatDongEnum.DA_KET_THUC;
            }
            // Ngày kết thúc (last day): kiểm tra giờ kết thúc
            else if (today.equals(ngayKetThucThucSu)) {
                if (hoatDong.getThoiGianKetThuc() != null) {
                    int allowedCheckout = hoatDong.getThoiGianChoPhepCheckOut() != null
                            ? hoatDong.getThoiGianChoPhepCheckOut() : 30;
                    LocalTime checkoutDeadline = hoatDong.getThoiGianKetThuc().plusMinutes(allowedCheckout);
                    if (now.isAfter(checkoutDeadline)) {
                        return TrangThaiHoatDongEnum.DA_KET_THUC;
                    }
                }
                // Vẫn trong khoảng thời gian → DANG_DIEN_RA
                if (hoatDong.getThoiGianBatDau() == null || !now.isBefore(hoatDong.getThoiGianBatDau())
                        || stored == TrangThaiHoatDongEnum.DANG_DIEN_RA) {
                    return TrangThaiHoatDongEnum.DANG_DIEN_RA;
                }
            }
            // Ngày bắt đầu (first day): check giờ bắt đầu
            else if (today.equals(ngayToChuc)) {
                if (hoatDong.getThoiGianBatDau() != null && !now.isBefore(hoatDong.getThoiGianBatDau())) {
                    return TrangThaiHoatDongEnum.DANG_DIEN_RA;
                }
                if (stored == TrangThaiHoatDongEnum.DANG_DIEN_RA) {
                    return TrangThaiHoatDongEnum.DANG_DIEN_RA;
                }
            }
            // Giữa ngày bắt đầu và ngày kết thúc (multi-day middle days) → DANG_DIEN_RA
            else if (today.isAfter(ngayToChuc) && today.isBefore(ngayKetThucThucSu)) {
                return TrangThaiHoatDongEnum.DANG_DIEN_RA;
            }
        }

        // BCH manually started (e.g., no ngayToChuc or future date override) → preserve
        if (stored == TrangThaiHoatDongEnum.DANG_DIEN_RA) {
            return TrangThaiHoatDongEnum.DANG_DIEN_RA;
        }

        // Registration open → DANG_MO_DANG_KY
        if (Boolean.TRUE.equals(hoatDong.getChoPhepDangKy())) {
            if (hoatDong.getHanDangKy() == null || LocalDateTime.now().isBefore(hoatDong.getHanDangKy())) {
                return TrangThaiHoatDongEnum.DANG_MO_DANG_KY;
            }
        }

        return TrangThaiHoatDongEnum.SAP_DIEN_RA;
    }

    /**
     * Kiểm tra cửa sổ checkout còn mở không (dùng chung với DiemDanhService).
     */
    public boolean isInCheckoutWindow(HoatDong hoatDong) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        int allowedMinutes = hoatDong.getThoiGianChoPhepCheckOut() != null
                ? hoatDong.getThoiGianChoPhepCheckOut() : 30;

        // Early termination → check window from thoiGianKetThucThucTe
        if (Boolean.TRUE.equals(hoatDong.getKetThucSom()) && hoatDong.getThoiGianKetThucThucTe() != null) {
            LocalDateTime earlyEnd = hoatDong.getThoiGianKetThucThucTe();
            LocalDateTime deadline = earlyEnd.plusMinutes(allowedMinutes);
            LocalDateTime nowDt = LocalDateTime.of(today, now);
            return !nowDt.isBefore(earlyEnd) && nowDt.isBefore(deadline);
        }

        // Normal end: same day, after thoiGianKetThuc
        if (today.equals(hoatDong.getNgayToChuc()) && hoatDong.getThoiGianKetThuc() != null) {
            if (now.isAfter(hoatDong.getThoiGianKetThuc())) {
                LocalTime deadline = hoatDong.getThoiGianKetThuc().plusMinutes(allowedMinutes);
                return now.isBefore(deadline);
            }
        }

        return false;
    }

    // ========== VALIDATION HELPERS ==========

    private void validateDiemRenLuyen(HoatDongDTO dto) {
        if (dto.getMaTieuChiRenLuyen() != null && dto.getDiemRenLuyen() != null) {
            if (!criteriaService.isDiemHopLe(dto.getMaTieuChiRenLuyen(), dto.getDiemRenLuyen())) {
                int max = criteriaService.getDiemToiDa(dto.getMaTieuChiRenLuyen());
                throw new RuntimeException(
                    String.format("Điểm rèn luyện %d vượt quá mức tối đa %d của tiêu chí %s",
                        dto.getDiemRenLuyen(), max, dto.getMaTieuChiRenLuyen())
                );
            }
        }
    }

    // ========== MAPPING METHODS ==========

    private HoatDongDTO toDTO(HoatDong entity) {
        return toDTO(entity, null);
    }

    /**
     * @param dangKyCountMap map mã hoạt động → số đăng ký, build 1 lần bằng
     *                       {@link #buildDangKyCountMap()} rồi tái dùng cho cả danh sách — tránh N+1
     *                       (1 query COUNT riêng cho mỗi hoạt động). Truyền null để giữ hành vi cũ
     *                       (query từng dòng) ở những chỗ chưa được tối ưu.
     */
    private HoatDongDTO toDTO(HoatDong entity, Map<String, Long> dangKyCountMap) {
        if (entity == null) return null;

        long soNguoiDangKy = dangKyCountMap != null
                ? dangKyCountMap.getOrDefault(entity.getMaHoatDong(), 0L)
                : dangKyRepository.countByHoatDongMaHoatDongAndIsActiveTrue(entity.getMaHoatDong());

        // Tính số ngày và isMultiDay
        LocalDate ngayKetThuc = entity.getNgayKetThuc();
        LocalDate ngayToChucEntity = entity.getNgayToChuc();
        boolean isMultiDay = ngayKetThuc != null && ngayToChucEntity != null
                && ngayKetThuc.isAfter(ngayToChucEntity);
        int soNgay = 1;
        if (isMultiDay) {
            soNgay = (int) (ngayKetThuc.toEpochDay() - ngayToChucEntity.toEpochDay() + 1);
        }

        return HoatDongDTO.builder()
                .maHoatDong(entity.getMaHoatDong())
                .tenHoatDong(entity.getTenHoatDong())
                .moTa(entity.getMoTa())
                .loaiHoatDong(entity.getLoaiHoatDong())
                .capDo(entity.getCapDo())
                .ngayToChuc(ngayToChucEntity)
                .ngayKetThuc(ngayKetThuc)
                .soNgay(soNgay)
                .isMultiDay(isMultiDay)
                .gioToChuc(entity.getGioToChuc())
                .thoiGianBatDau(entity.getThoiGianBatDau())
                .thoiGianKetThuc(entity.getThoiGianKetThuc())
                .thoiGianTreToiDa(entity.getThoiGianTreToiDa())
                .thoiGianToiThieu(entity.getThoiGianToiThieu())
                .choPhepCheckInSom(entity.getChoPhepCheckInSom())
                .cheDoDiemDanh(entity.getCheDoDiemDanh())
                .yeuCauCheckOut(entity.getYeuCauCheckOut())
                .viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo())
                .khoangCachToiDa(entity.getKhoangCachToiDa())
                .ketThucSom(entity.getKetThucSom())
                .thoiGianKetThucThucTe(entity.getThoiGianKetThucThucTe())
                .thoiGianChoPhepCheckOut(entity.getThoiGianChoPhepCheckOut())
                .diaDiem(entity.getDiaDiem())
                .maPhong(entity.getPhongHoc() != null ? entity.getPhongHoc().getMaPhong() : null)
                .tenPhong(entity.getPhongHoc() != null ? entity.getPhongHoc().getTenPhong() : null)
                .soLuongToiDa(entity.getSoLuongToiDa())
                .soNguoiDangKy(soNguoiDangKy)
                .diemRenLuyen(entity.getDiemRenLuyen())
                .maDanhMucRenLuyen(entity.getMaDanhMucRenLuyen())
                .maTieuChiRenLuyen(entity.getMaTieuChiRenLuyen())
                .diemToiDaTieuChi(entity.getDiemToiDaTieuChi())
                .maBchPhuTrach(entity.getNguoiPhuTrach() != null ? entity.getNguoiPhuTrach().getMaBch() : null)
                .tenNguoiPhuTrach(entity.getNguoiPhuTrach() != null && entity.getNguoiPhuTrach().getSinhVien() != null
                        ? entity.getNguoiPhuTrach().getSinhVien().getHoTen() : null)
                .maKhoa(entity.getKhoa() != null ? entity.getKhoa().getMaKhoa() : null)
                .tenKhoa(entity.getKhoa() != null ? entity.getKhoa().getTenKhoa() : null)
                .maNganh(entity.getNganh() != null ? entity.getNganh().getMaNganh() : null)
                .tenNganh(entity.getNganh() != null ? entity.getNganh().getTenNganh() : null)
                .maClb(entity.getCauLacBo() != null ? entity.getCauLacBo().getMaClb() : null)
                .tenClb(entity.getCauLacBo() != null ? entity.getCauLacBo().getTenClb() : null)
                .soHocKy(entity.getSoHocKy())
                .maNamHoc(entity.getNamHoc() != null ? entity.getNamHoc().getMaNamHoc() : null)
                .tenNamHoc(entity.getNamHoc() != null ? entity.getNamHoc().getTenNamHoc() : null)
                .trangThai(computeTrangThai(entity))
                .yeuCauDiemDanh(entity.getYeuCauDiemDanh())
                .choPhepDangKy(entity.getChoPhepDangKy())
                .isKhongDangKy(entity.getIsKhongDangKy())
                .hanDangKy(entity.getHanDangKy())
                .hinhAnhPoster(entity.getHinhAnhPoster())
                .ghiChu(entity.getGhiChu())
                .quyetDinhUrl(entity.getQuyetDinhUrl())
                .quyetDinhTen(entity.getQuyetDinhTen())
                .isActive(entity.getIsActive())
                .congKhai(entity.getCongKhai())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .nguoiDuyet(entity.getNguoiDuyet())
                .ngayDuyet(entity.getNgayDuyet())
                .lyDoTuChoi(entity.getLyDoTuChoi())
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
                .ngayKetThuc(dto.getNgayKetThuc())
                .gioToChuc(dto.getGioToChuc())
                .thoiGianBatDau(dto.getThoiGianBatDau())
                .thoiGianKetThuc(dto.getThoiGianKetThuc())
                .thoiGianTreToiDa(dto.getThoiGianTreToiDa())
                .thoiGianToiThieu(dto.getThoiGianToiThieu())
                .choPhepCheckInSom(dto.getChoPhepCheckInSom())
                .cheDoDiemDanh(dto.getCheDoDiemDanh() != null ? dto.getCheDoDiemDanh() : CheDoDiemDanhEnum.CHECKIN_CHECKOUT)
                .yeuCauCheckOut(dto.getYeuCauCheckOut())
                .viDo(dto.getViDo())
                .kinhDo(dto.getKinhDo())
                .khoangCachToiDa(dto.getKhoangCachToiDa())
                .ketThucSom(dto.getKetThucSom() != null ? dto.getKetThucSom() : false)
                .thoiGianKetThucThucTe(dto.getThoiGianKetThucThucTe())
                .thoiGianChoPhepCheckOut(dto.getThoiGianChoPhepCheckOut() != null ? dto.getThoiGianChoPhepCheckOut() : 30)
                .diaDiem(dto.getDiaDiem())
                .soLuongToiDa(dto.getSoLuongToiDa())
                .diemRenLuyen(dto.getDiemRenLuyen())
                .maDanhMucRenLuyen(dto.getMaDanhMucRenLuyen())
                .maTieuChiRenLuyen(dto.getMaTieuChiRenLuyen())
                .diemToiDaTieuChi(dto.getMaTieuChiRenLuyen() != null
                        ? (Integer) criteriaService.getDiemToiDa(dto.getMaTieuChiRenLuyen())
                        : dto.getDiemToiDaTieuChi())
                .trangThai(dto.getTrangThai() != null ? dto.getTrangThai() : TrangThaiHoatDongEnum.SAP_DIEN_RA)
                .yeuCauDiemDanh(dto.getYeuCauDiemDanh() != null ? dto.getYeuCauDiemDanh() : true)
                .choPhepDangKy(dto.getChoPhepDangKy() != null ? dto.getChoPhepDangKy() : true)
                .isKhongDangKy(dto.getIsKhongDangKy() != null ? dto.getIsKhongDangKy() : false)
                .hanDangKy(dto.getHanDangKy())
                .hinhAnhPoster(dto.getHinhAnhPoster())
                .ghiChu(dto.getGhiChu())
                .quyetDinhUrl(dto.getQuyetDinhUrl())
                .quyetDinhTen(dto.getQuyetDinhTen())
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
        if (dto.getMaClb() != null) {
            entity.setCauLacBo(cauLacBoRepository.findById(dto.getMaClb()).orElse(null));
        }

        // Xác định Năm học và Học kỳ
        LocalDate activityDate = dto.getNgayToChuc() != null ? dto.getNgayToChuc() : LocalDate.now();
        if (dto.getMaNamHoc() != null) {
            entity.setNamHoc(namHocRepository.findById(dto.getMaNamHoc()).orElse(null));
        } else {
            // Tự động tính năm học từ ngày tổ chức
            String maNamHoc = AcademicCalendarUtil.getMaNamHoc(activityDate);
            entity.setNamHoc(namHocRepository.findById(maNamHoc).orElse(null));
        }
        if (dto.getSoHocKy() != null) {
            entity.setSoHocKy(dto.getSoHocKy());
        } else {
            // Tự động tính số học kỳ từ ngày tổ chức
            entity.setSoHocKy(AcademicCalendarUtil.getSoHocKy(activityDate));
        }

        return entity;
    }

    private void updateEntity(HoatDong entity, HoatDongDTO dto) {
        if (dto.getTenHoatDong() != null) entity.setTenHoatDong(dto.getTenHoatDong());
        if (dto.getMoTa() != null) entity.setMoTa(dto.getMoTa());
        if (dto.getLoaiHoatDong() != null) entity.setLoaiHoatDong(dto.getLoaiHoatDong());
        if (dto.getCapDo() != null) entity.setCapDo(dto.getCapDo());
        if (dto.getNgayToChuc() != null) entity.setNgayToChuc(dto.getNgayToChuc());
        // ngayKetThuc: cập nhật kể cả khi null (để xoá multi-day → single-day)
        entity.setNgayKetThuc(dto.getNgayKetThuc());
        if (dto.getGioToChuc() != null) entity.setGioToChuc(dto.getGioToChuc());
        if (dto.getThoiGianBatDau() != null) entity.setThoiGianBatDau(dto.getThoiGianBatDau());
        if (dto.getThoiGianKetThuc() != null) entity.setThoiGianKetThuc(dto.getThoiGianKetThuc());
        if (dto.getThoiGianTreToiDa() != null) entity.setThoiGianTreToiDa(dto.getThoiGianTreToiDa());
        if (dto.getThoiGianToiThieu() != null) entity.setThoiGianToiThieu(dto.getThoiGianToiThieu());
        if (dto.getChoPhepCheckInSom() != null) entity.setChoPhepCheckInSom(dto.getChoPhepCheckInSom());
        if (dto.getYeuCauCheckOut() != null) entity.setYeuCauCheckOut(dto.getYeuCauCheckOut());
        if (dto.getCheDoDiemDanh() != null) entity.setCheDoDiemDanh(dto.getCheDoDiemDanh());
        if (dto.getViDo() != null) entity.setViDo(dto.getViDo());
        if (dto.getKinhDo() != null) entity.setKinhDo(dto.getKinhDo());
        if (dto.getKhoangCachToiDa() != null) entity.setKhoangCachToiDa(dto.getKhoangCachToiDa());
        if (dto.getThoiGianChoPhepCheckOut() != null) entity.setThoiGianChoPhepCheckOut(dto.getThoiGianChoPhepCheckOut());
        if (dto.getDiaDiem() != null) entity.setDiaDiem(dto.getDiaDiem());
        if (dto.getSoLuongToiDa() != null) entity.setSoLuongToiDa(dto.getSoLuongToiDa());
        if (dto.getDiemRenLuyen() != null) entity.setDiemRenLuyen(dto.getDiemRenLuyen());
        if (dto.getMaDanhMucRenLuyen() != null) entity.setMaDanhMucRenLuyen(dto.getMaDanhMucRenLuyen());
        if (dto.getMaTieuChiRenLuyen() != null) {
            entity.setMaTieuChiRenLuyen(dto.getMaTieuChiRenLuyen());
            entity.setDiemToiDaTieuChi(criteriaService.getDiemToiDa(dto.getMaTieuChiRenLuyen()));
        }
        if (dto.getTrangThai() != null) entity.setTrangThai(dto.getTrangThai());
        if (dto.getYeuCauDiemDanh() != null) entity.setYeuCauDiemDanh(dto.getYeuCauDiemDanh());
        if (dto.getChoPhepDangKy() != null) entity.setChoPhepDangKy(dto.getChoPhepDangKy());
        if (dto.getIsKhongDangKy() != null) entity.setIsKhongDangKy(dto.getIsKhongDangKy());
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
        if (dto.getMaClb() != null) {
            entity.setCauLacBo(cauLacBoRepository.findById(dto.getMaClb()).orElse(null));
        }

        // Cập nhật Năm học và Học kỳ
        if (dto.getMaNamHoc() != null) {
            entity.setNamHoc(namHocRepository.findById(dto.getMaNamHoc()).orElse(entity.getNamHoc()));
        }
        if (dto.getSoHocKy() != null) {
            entity.setSoHocKy(dto.getSoHocKy());
        }
    }

    /**
     * Trả về thông tin học kỳ và năm học hiện tại theo ngày hôm nay.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentAcademicInfo() {
        Map<String, Object> info;
        try {
            info = AcademicCalendarUtil.getCurrentAcademicInfo();
        } catch (Exception e) {
            log.warn("AcademicCalendarUtil.getCurrentAcademicInfo() failed: {}", e.getMessage());
            info = new HashMap<>();
        }

        // Bổ sung danh sách các năm học có trong CSDL
        List<Map<String, String>> namHocList = namHocRepository.findByIsActiveTrue()
                .stream()
                .map(nh -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("maNamHoc", nh.getMaNamHoc());
                    m.put("tenNamHoc", nh.getTenNamHoc());
                    return m;
                })
                .collect(Collectors.toList());
        info.put("danhSachNamHoc", namHocList);
        return info;
    }

    // ========== AUTO STATUS SCHEDULER ==========

    /**
     * Tự động cập nhật trạng thái hoạt động theo thời gian thực.
     * Chạy mỗi 5 phút — tìm các hoạt động trong khoảng hôm qua → ngày mai
     * có trạng thái chưa kết thúc, tính lại trạng thái và lưu nếu thay đổi.
     */
    @Scheduled(fixedRate = 300000) // 5 phút = 300_000 ms
    @Transactional
    public void autoUpdateActivityStatuses() {
        LocalDate today = LocalDate.now();
        List<HoatDong> candidates = hoatDongRepository.findActiveNonTerminalByDateRange(
                today.minusDays(1), today.plusDays(1));

        if (candidates.isEmpty()) return;

        int updated = 0;
        for (HoatDong hoatDong : candidates) {
            TrangThaiHoatDongEnum computed = computeTrangThai(hoatDong);
            if (computed != hoatDong.getTrangThai()) {
                log.info("[AutoStatus] {} | {} → {}", hoatDong.getMaHoatDong(),
                        hoatDong.getTrangThai(), computed);
                hoatDong.setTrangThai(computed);
                hoatDongRepository.save(hoatDong);
                updated++;
            }
        }

        if (updated > 0) {
            log.info("[AutoStatus] Đã cập nhật trạng thái {} hoạt động", updated);
        }
    }
}