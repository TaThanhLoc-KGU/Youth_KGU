package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.BCHChucVuDTO;
import com.tathanhloc.faceattendance.DTO.BCHDoanHoiDTO;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BCHDoanHoiService {

    private final BCHDoanHoiRepository bchRepository;
    private final SinhVienRepository sinhVienRepository;
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
                .filter(Objects::nonNull)
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
        log.info("Creating new BCH member for student: {}", dto.getMaSv());

        // 1. Validate sinh viên
        SinhVien sinhVien = sinhVienRepository.findById(dto.getMaSv())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + dto.getMaSv()));

        if (bchRepository.existsBySinhVienMaSv(dto.getMaSv())) {
            throw new RuntimeException("Sinh viên này đã là BCH: " + dto.getMaSv());
        }

        // 2. Gen mã BCH tự động
        String maBch = generateMaBCH();
        log.info("Generated BCH code: {}", maBch);

        // 3. Tạo BCH
        BCHDoanHoi bch = BCHDoanHoi.builder()
                .maBch(maBch)
                .sinhVien(sinhVien)
                .nhiemKy(dto.getNhiemKy())
                .ngayBatDau(dto.getNgayBatDau())
                .ngayKetThuc(dto.getNgayKetThuc())
                .hinhAnh(dto.getHinhAnh())
                .isActive(true)
                .build();

        bch = bchRepository.save(bch);
        log.info("BCH member created: {}", maBch);

        // 4. Thêm các chức vụ
        if (dto.getDanhSachChucVu() != null && !dto.getDanhSachChucVu().isEmpty()) {
            for (BCHChucVuDTO cvDto : dto.getDanhSachChucVu()) {
                addChucVuInternal(bch, cvDto);
            }
        }

        return toDTOWithChucVu(bch);
    }

    @Transactional
    public BCHDoanHoiDTO update(String maBch, BCHDoanHoiDTO dto) {
        log.info("Updating BCH member: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        // Update basic info
        if (dto.getNhiemKy() != null) bch.setNhiemKy(dto.getNhiemKy());
        if (dto.getNgayBatDau() != null) bch.setNgayBatDau(dto.getNgayBatDau());
        if (dto.getNgayKetThuc() != null) bch.setNgayKetThuc(dto.getNgayKetThuc());
        if (dto.getHinhAnh() != null) bch.setHinhAnh(dto.getHinhAnh());
        if (dto.getIsActive() != null) bch.setIsActive(dto.getIsActive());

        bch = bchRepository.save(bch);
        log.info("BCH member updated: {}", maBch);

        return toDTOWithChucVu(bch);
    }

    @Transactional
    public void delete(String maBch) {
        log.info("Soft deleting BCH member: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        bch.setIsActive(false);
        bchRepository.save(bch);

        // Soft delete tất cả chức vụ
        List<BCHChucVu> chucVuList = bchChucVuRepository.findByBchMaBchAndIsActiveTrueOrderByIdAsc(maBch);
        for (BCHChucVu cv : chucVuList) {
            cv.setIsActive(false);
            bchChucVuRepository.save(cv);
        }

        log.info("BCH member soft deleted: {}", maBch);
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
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getByNhiemKy(String nhiemKy) {
        log.debug("Getting BCH by nhiem ky: {}", nhiemKy);
        return bchRepository.findByNhiemKyAndIsActiveTrueOrderByMaBchDesc(nhiemKy)
                .stream()
                .map(this::toDTOWithChucVu)
                .filter(Objects::nonNull)
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
                .filter(Objects::nonNull)
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
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        log.debug("Getting BCH statistics");
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalBCH", bchRepository.countActive());

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

        SinhVien sv = entity.getSinhVien();

        // Skip if sinh vien is null
        if (sv == null) {
            log.warn("BCH {} has no associated student", entity.getMaBch());
            return null;
        }

        BCHDoanHoiDTO dto = BCHDoanHoiDTO.builder()
                .maBch(entity.getMaBch())
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .email(sv.getEmail())
                .soDienThoai(sv.getSdt())
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .gioiTinh(sv.getGioiTinh() != null ? sv.getGioiTinh().name() : null)
                .ngaySinh(sv.getNgaySinh())
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
                .hoTenBch(entity.getBch().getSinhVien().getHoTen())
                .maChucVu(entity.getChucVu().getMaChucVu())
                .tenChucVu(entity.getChucVu().getTenChucVu())
                .maBan(entity.getBan() != null ? entity.getBan().getMaBan() : null)
                .tenBan(entity.getBan() != null ? entity.getBan().getTenBan() : null)
                .ngayNhanChuc(entity.getNgayNhanChuc())
                .ngayKetThuc(entity.getNgayKetThuc())
                .isActive(entity.getIsActive())
                .build();
    }

    // ========== STATISTICS HELPER METHODS ==========

    @Transactional(readOnly = true)
    public long getTotalActive() {
        log.debug("Getting total active BCH count");
        return bchRepository.countActive();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByChucVu() {
        log.debug("Counting BCH by chuc vu");
        List<Object[]> results = bchChucVuRepository.countBCHByChucVu();
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : results) {
            countMap.put((String) row[0], (Long) row[1]);
        }
        return countMap;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByKhoa() {
        log.debug("Counting BCH by khoa");
        Map<String, Long> khoaStats = new HashMap<>();

        // Get all active BCH with their student info
        List<BCHDoanHoi> activeBCH = bchRepository.findByIsActiveTrueOrderByMaBchDesc();

        // Group by khoa from sinhVien -> lop -> khoa
        for (BCHDoanHoi bch : activeBCH) {
            if (bch.getSinhVien() != null && bch.getSinhVien().getLop() != null
                    && bch.getSinhVien().getLop().getMaKhoa() != null) {
                String tenKhoa = bch.getSinhVien().getLop().getMaKhoa().getTenKhoa();
                khoaStats.put(tenKhoa, khoaStats.getOrDefault(tenKhoa, 0L) + 1);
            }
        }

        return khoaStats;
    }
}