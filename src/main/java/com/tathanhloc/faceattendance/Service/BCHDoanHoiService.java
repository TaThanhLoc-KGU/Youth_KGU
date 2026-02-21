package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.BCHChucVuDTO;
import com.tathanhloc.faceattendance.DTO.BCHDoanHoiDTO;
import com.tathanhloc.faceattendance.Enum.LoaiThanhVienEnum;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BCHDoanHoiService {

    private final BCHDoanHoiRepository bchRepository;
    private final SinhVienRepository sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final ChuyenVienRepository chuyenVienRepository;
    private final BCHChucVuRepository bchChucVuRepository;
    private final ChucVuRepository chucVuRepository;
    private final BanRepository banRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getAll() {
        log.debug("Getting all active BCH members");
        return bchRepository.findByIsActiveTrueOrderByMaBchDesc()
                .stream()
                .map(this::toDTOWithChucVu)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BCHDoanHoiDTO getById(String maBch) {
        log.debug("Getting BCH by ID: {}", maBch);
        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));
        return toDTOWithChucVu(bch);
    }

    @Transactional
    public BCHDoanHoiDTO create(BCHDoanHoiDTO dto) {
        log.info("Creating BCH: type={}, member={}", dto.getLoaiThanhVien(), dto.getMaThanhVien());

        // 1. Gen mã BCH
        String maBch = generateMaBCH();

        // 2. Validate và lấy thành viên
        SinhVien sinhVien = null;
        GiangVien giangVien = null;
        ChuyenVien chuyenVien = null;

        switch (dto.getLoaiThanhVien()) {
            case SINH_VIEN:
                sinhVien = sinhVienRepository.findById(dto.getMaThanhVien())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + dto.getMaThanhVien()));
                if (bchRepository.existsBySinhVienMaSvAndIsActiveTrue(dto.getMaThanhVien())) {
                    throw new RuntimeException("Sinh viên này đã là BCH");
                }
                break;

            case GIANG_VIEN:
                giangVien = giangVienRepository.findById(dto.getMaThanhVien())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên: " + dto.getMaThanhVien()));
                if (bchRepository.existsByGiangVienMaGvAndIsActiveTrue(dto.getMaThanhVien())) {
                    throw new RuntimeException("Giảng viên này đã là BCH");
                }
                break;

            case CHUYEN_VIEN:
                chuyenVien = chuyenVienRepository.findById(dto.getMaThanhVien())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên viên: " + dto.getMaThanhVien()));
                if (bchRepository.existsByChuyenVienMaChuyenVienAndIsActiveTrue(dto.getMaThanhVien())) {
                    throw new RuntimeException("Chuyên viên này đã là BCH");
                }
                break;
        }

        // 3. Tạo BCH
        BCHDoanHoi bch = BCHDoanHoi.builder()
                .maBch(maBch)
                .loaiThanhVien(dto.getLoaiThanhVien())
                .sinhVien(sinhVien)
                .giangVien(giangVien)
                .chuyenVien(chuyenVien)
                .nhiemKy(dto.getNhiemKy())
                .ngayBatDau(dto.getNgayBatDau())
                .ngayKetThuc(dto.getNgayKetThuc())
                .hinhAnh(dto.getHinhAnh())
                .isActive(true)
                .build();

        bch = bchRepository.save(bch);
        log.info("BCH created: {}", maBch);

        // 4. Thêm chức vụ
        if (dto.getDanhSachChucVu() != null && !dto.getDanhSachChucVu().isEmpty()) {
            for (BCHChucVuDTO cvDto : dto.getDanhSachChucVu()) {
                addChucVuInternal(bch, cvDto);
            }
        }

        return toDTOWithChucVu(bch);
    }

    @Transactional
    public BCHDoanHoiDTO update(String maBch, BCHDoanHoiDTO dto) {
        log.info("Updating BCH: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        // Update basic info (không update loại và mã thành viên)
        if (dto.getNhiemKy() != null) bch.setNhiemKy(dto.getNhiemKy());
        if (dto.getNgayBatDau() != null) bch.setNgayBatDau(dto.getNgayBatDau());
        if (dto.getNgayKetThuc() != null) bch.setNgayKetThuc(dto.getNgayKetThuc());
        if (dto.getHinhAnh() != null) bch.setHinhAnh(dto.getHinhAnh());
        if (dto.getIsActive() != null) bch.setIsActive(dto.getIsActive());

        bch = bchRepository.save(bch);
        log.info("BCH updated: {}", maBch);

        return toDTOWithChucVu(bch);
    }

    @Transactional
    public void delete(String maBch) {
        log.info("Soft deleting BCH: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        bch.setIsActive(false);
        bchRepository.save(bch);

        // Soft delete tất cả chức vụ
        List<BCHChucVu> chucVuList = bchChucVuRepository
                .findByBchMaBchAndIsActiveTrueOrderByIdAsc(maBch);
        for (BCHChucVu cv : chucVuList) {
            cv.setIsActive(false);
            bchChucVuRepository.save(cv);
        }

        log.info("BCH soft deleted: {}", maBch);
    }

    // ========== CHỨC VỤ OPERATIONS ==========

    @Transactional
    public BCHChucVuDTO addChucVu(String maBch, BCHChucVuDTO dto) {
        log.info("Adding chuc vu to BCH: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        return addChucVuInternal(bch, dto);
    }

    private BCHChucVuDTO addChucVuInternal(BCHDoanHoi bch, BCHChucVuDTO dto) {
        // Validate chức vụ đã tồn tại chưa
        if (bchChucVuRepository.existsByBchAndChucVu(bch.getMaBch(), dto.getMaChucVu())) {
            throw new RuntimeException("BCH đã có chức vụ này: " + dto.getMaChucVu());
        }

        ChucVu chucVu = chucVuRepository.findById(dto.getMaChucVu())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chức vụ: " + dto.getMaChucVu()));

        Ban ban = null;
        if (dto.getMaBan() != null) {
            ban = banRepository.findById(dto.getMaBan()).orElse(null);
        }

        BCHChucVu bchChucVu = BCHChucVu.builder()
                .bch(bch)
                .chucVu(chucVu)
                .ban(ban)
                .ngayNhanChuc(dto.getNgayNhanChuc())
                .ngayKetThuc(dto.getNgayKetThuc())
                .isActive(true)
                .build();

        bchChucVu = bchChucVuRepository.save(bchChucVu);
        log.info("Chuc vu added: {} to BCH: {}", dto.getMaChucVu(), bch.getMaBch());

        return toChucVuDTO(bchChucVu);
    }

    @Transactional
    public void removeChucVu(Long id) {
        log.info("Removing chuc vu: {}", id);

        BCHChucVu bchChucVu = bchChucVuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chức vụ: " + id));

        bchChucVu.setIsActive(false);
        bchChucVuRepository.save(bchChucVu);

        log.info("Chuc vu removed: {}", id);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> searchByKeyword(String keyword) {
        log.debug("Searching BCH by keyword: {}", keyword);
        return bchRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toDTOWithChucVu)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getByLoaiThanhVien(LoaiThanhVienEnum loaiThanhVien) {
        log.debug("Getting BCH by loai thanh vien: {}", loaiThanhVien);
        return bchRepository.findByLoaiThanhVienAndIsActiveTrueOrderByMaBchDesc(loaiThanhVien)
                .stream()
                .map(this::toDTOWithChucVu)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getByNhiemKy(String nhiemKy) {
        log.debug("Getting BCH by nhiem ky: {}", nhiemKy);
        return bchRepository.findByNhiemKyAndIsActiveTrueOrderByMaBchDesc(nhiemKy)
                .stream()
                .map(this::toDTOWithChucVu)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHChucVuDTO> getChucVuByBCH(String maBch) {
        log.debug("Getting chuc vu by BCH: {}", maBch);
        return bchChucVuRepository.findByBchMaBchAndIsActiveTrueOrderByIdAsc(maBch)
                .stream()
                .map(this::toChucVuDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getBCHByChucVu(String maChucVu) {
        log.debug("Getting BCH by chuc vu: {}", maChucVu);
        List<BCHChucVu> bchChucVuList = bchChucVuRepository
                .findByChucVuMaChucVuAndIsActiveTrueOrderByBchMaBchAsc(maChucVu);

        return bchChucVuList.stream()
                .map(bcv -> toDTOWithChucVu(bcv.getBch()))
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getBCHByBan(String maBan) {
        log.debug("Getting BCH by ban: {}", maBan);
        List<BCHChucVu> bchChucVuList = bchChucVuRepository
                .findByBanMaBanAndIsActiveTrueOrderByBchMaBchAsc(maBan);

        return bchChucVuList.stream()
                .map(bcv -> toDTOWithChucVu(bcv.getBch()))
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        log.debug("Getting BCH statistics");
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalBCH", bchRepository.countActive());

        // Thống kê theo loại thành viên
        List<Object[]> byLoaiThanhVien = bchRepository.countByLoaiThanhVien();
        Map<String, Long> loaiThanhVienStats = new HashMap<>();
        for (Object[] row : byLoaiThanhVien) {
            LoaiThanhVienEnum loai = (LoaiThanhVienEnum) row[0];
            loaiThanhVienStats.put(loai.name(), (Long) row[1]);
        }
        stats.put("byLoaiThanhVien", loaiThanhVienStats);

        // Thống kê theo chức vụ
        List<Object[]> byChucVu = bchChucVuRepository.countBCHByChucVu();
        Map<String, Long> chucVuStats = new HashMap<>();
        for (Object[] row : byChucVu) {
            chucVuStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("byChucVu", chucVuStats);

        // Thống kê theo ban
        List<Object[]> byBan = bchChucVuRepository.countBCHByBan();
        Map<String, Long> banStats = new HashMap<>();
        for (Object[] row : byBan) {
            banStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("byBan", banStats);

        return stats;
    }

    // ========== HELPER METHODS ==========

    /**
     * Sinh mã BCH tự động: BCHKGU0001, BCHKGU0002...
     */
    private String generateMaBCH() {
        List<BCHDoanHoi> latest = bchRepository.findLatestBCHCode();

        if (latest.isEmpty()) {
            return "BCHKGU0001";
        }

        String lastCode = latest.get(0).getMaBch();
        try {
            int number = Integer.parseInt(lastCode.substring(6));
            return String.format("BCHKGU%04d", number + 1);
        } catch (Exception e) {
            log.error("Error parsing BCH code: {}", lastCode, e);
            return "BCHKGU0001";
        }
    }

    // ========== MAPPING METHODS ==========

    private BCHDoanHoiDTO toDTOWithChucVu(BCHDoanHoi entity) {
        if (entity == null) return null;

        BCHDoanHoiDTO dto = BCHDoanHoiDTO.builder()
                .maBch(entity.getMaBch())
                .loaiThanhVien(entity.getLoaiThanhVien())
                .loaiThanhVienDisplay(entity.getLoaiThanhVien().getDisplayName())
                .maThanhVien(entity.getMaThanhVien())
                .hoTen(entity.getHoTen())
                .email(entity.getEmail())
                .soDienThoai(entity.getSoDienThoai())
                .donVi(entity.getDonVi())
                .nhiemKy(entity.getNhiemKy())
                .ngayBatDau(entity.getNgayBatDau())
                .ngayKetThuc(entity.getNgayKetThuc())
                .hinhAnh(entity.getHinhAnh())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        // Lấy danh sách chức vụ
        List<BCHChucVu> chucVuList = bchChucVuRepository
                .findByBchMaBchAndIsActiveTrueOrderByIdAsc(entity.getMaBch());
        dto.setDanhSachChucVu(
                chucVuList.stream().map(this::toChucVuDTO).collect(Collectors.toList())
        );

        return dto;
    }

    private BCHChucVuDTO toChucVuDTO(BCHChucVu entity) {
        if (entity == null) return null;

        return BCHChucVuDTO.builder()
                .id(entity.getId())
                .maBch(entity.getBch().getMaBch())
                .hoTenBch(entity.getBch().getHoTen())
                .maChucVu(entity.getChucVu().getMaChucVu())
                .tenChucVu(entity.getChucVu().getTenChucVu())
                .maBan(entity.getBan() != null ? entity.getBan().getMaBan() : null)
                .tenBan(entity.getBan() != null ? entity.getBan().getTenBan() : null)
                .ngayNhanChuc(entity.getNgayNhanChuc())
                .ngayKetThuc(entity.getNgayKetThuc())
                .isActive(entity.getIsActive())
                .build();
    }
// ========== METHODS CHO THỐNG KÊ CONTROLLER ==========

    /**
     * Đếm tổng số BCH active
     */
    @Transactional(readOnly = true)
    public long getTotalActive() {
        return bchRepository.countActive();
    }

    /**
     * Thống kê BCH theo chức vụ
     * @return Map<tenChucVu, soBCH>
     */
    @Transactional(readOnly = true)
    public Map<String, Long> countByChucVu() {
        log.debug("Counting BCH by chuc vu");
        List<Object[]> results = bchChucVuRepository.countBCHByChucVu();

        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : results) {
            String tenChucVu = (String) row[0];
            Long count = (Long) row[1];
            stats.put(tenChucVu, count);
        }

        return stats;
    }

    /**
     * Thống kê BCH theo khoa (dựa trên sinh viên/giảng viên/chuyên viên)
     * @return Map<tenKhoa, soBCH>
     */
    @Transactional(readOnly = true)
    public Map<String, Long> countByKhoa() {
        log.debug("Counting BCH by khoa");
        List<BCHDoanHoi> allBch = bchRepository.findByIsActiveTrueOrderByMaBchDesc();

        Map<String, Long> stats = new HashMap<>();

        for (BCHDoanHoi bch : allBch) {
            String tenKhoa = null;

            switch (bch.getLoaiThanhVien()) {
                case SINH_VIEN:
                    if (bch.getSinhVien() != null &&
                            bch.getSinhVien().getLop() != null &&
                            bch.getSinhVien().getLop().getMaKhoa() != null) {
                        tenKhoa = bch.getSinhVien().getLop().getMaKhoa().getTenKhoa();
                    }
                    break;

                case GIANG_VIEN:
                    if (bch.getGiangVien() != null &&
                            bch.getGiangVien().getKhoa() != null) {
                        tenKhoa = bch.getGiangVien().getKhoa().getTenKhoa();
                    }
                    break;

                case CHUYEN_VIEN:
                    if (bch.getChuyenVien() != null &&
                            bch.getChuyenVien().getKhoa() != null) {
                        tenKhoa = bch.getChuyenVien().getKhoa().getTenKhoa();
                    }
                    break;
            }

            if (tenKhoa != null) {
                stats.put(tenKhoa, stats.getOrDefault(tenKhoa, 0L) + 1);
            } else {
                stats.put("Chưa xác định", stats.getOrDefault("Chưa xác định", 0L) + 1);
            }
        }

        return stats;
    }

    /**
     * Thống kê BCH theo loại thành viên
     * @return Map<loaiThanhVien, soBCH>
     */
    @Transactional(readOnly = true)
    public Map<String, Long> countByLoaiThanhVien() {
        log.debug("Counting BCH by loai thanh vien");
        List<Object[]> results = bchRepository.countByLoaiThanhVien();

        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : results) {
            LoaiThanhVienEnum loai = (LoaiThanhVienEnum) row[0];
            Long count = (Long) row[1];
            stats.put(loai.getDisplayName(), count);
        }

        return stats;
    }

    /**
     * Thống kê BCH theo nhiệm kỳ
     * @return Map<nhiemKy, soBCH>
     */
    @Transactional(readOnly = true)
    public Map<String, Long> countByNhiemKy() {
        log.debug("Counting BCH by nhiem ky");
        List<BCHDoanHoi> allBch = bchRepository.findByIsActiveTrueOrderByMaBchDesc();

        Map<String, Long> stats = new HashMap<>();
        for (BCHDoanHoi bch : allBch) {
            String nhiemKy = bch.getNhiemKy() != null ? bch.getNhiemKy() : "Chưa xác định";
            stats.put(nhiemKy, stats.getOrDefault(nhiemKy, 0L) + 1);
        }

        return stats;
    }

    /**
     * Lấy danh sách BCH gần đây nhất (top N)
     */
    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getRecentBCH(int limit) {
        log.debug("Getting {} recent BCH members", limit);
        return bchRepository.findByIsActiveTrueOrderByMaBchDesc()
                .stream()
                .limit(limit)
                .map(this::toDTOWithChucVu)
                .collect(Collectors.toList());
    }

}