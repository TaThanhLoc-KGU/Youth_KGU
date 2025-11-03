package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ChuyenVienDTO;
import com.tathanhloc.faceattendance.Model.ChuyenVien;
import com.tathanhloc.faceattendance.Model.Khoa;
import com.tathanhloc.faceattendance.Repository.ChuyenVienRepository;
import com.tathanhloc.faceattendance.Repository.KhoaRepository;
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
public class ChuyenVienService {

    private final ChuyenVienRepository chuyenVienRepository;
    private final KhoaRepository khoaRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChuyenVienDTO> getAll() {
        log.debug("Getting all active chuyen vien");
        return chuyenVienRepository.findByIsActiveTrueOrderByHoTenAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChuyenVienDTO getById(String maChuyenVien) {
        log.debug("Getting chuyen vien by ID: {}", maChuyenVien);
        ChuyenVien cv = chuyenVienRepository.findById(maChuyenVien)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên viên: " + maChuyenVien));
        return toDTO(cv);
    }

    @Transactional
    public ChuyenVienDTO create(ChuyenVienDTO dto) {
        log.info("Creating new chuyen vien: {}", dto.getMaChuyenVien());

        // Validate
        if (chuyenVienRepository.existsById(dto.getMaChuyenVien())) {
            throw new RuntimeException("Mã chuyên viên đã tồn tại: " + dto.getMaChuyenVien());
        }

        if (dto.getEmail() != null && chuyenVienRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng: " + dto.getEmail());
        }

        ChuyenVien cv = toEntity(dto);
        cv.setIsActive(true);
        cv = chuyenVienRepository.save(cv);

        log.info("Chuyen vien created successfully: {}", cv.getMaChuyenVien());
        return toDTO(cv);
    }

    @Transactional
    public ChuyenVienDTO update(String maChuyenVien, ChuyenVienDTO dto) {
        log.info("Updating chuyen vien: {}", maChuyenVien);

        ChuyenVien existing = chuyenVienRepository.findById(maChuyenVien)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên viên: " + maChuyenVien));

        // Validate email
        if (dto.getEmail() != null &&
                !existing.getEmail().equals(dto.getEmail()) &&
                chuyenVienRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng: " + dto.getEmail());
        }

        updateEntity(existing, dto);
        existing = chuyenVienRepository.save(existing);

        log.info("Chuyen vien updated successfully: {}", maChuyenVien);
        return toDTO(existing);
    }

    @Transactional
    public void delete(String maChuyenVien) {
        log.info("Soft deleting chuyen vien: {}", maChuyenVien);

        ChuyenVien cv = chuyenVienRepository.findById(maChuyenVien)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên viên: " + maChuyenVien));

        cv.setIsActive(false);
        chuyenVienRepository.save(cv);

        log.info("Chuyen vien soft deleted: {}", maChuyenVien);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChuyenVienDTO> searchByKeyword(String keyword) {
        log.debug("Searching chuyen vien by keyword: {}", keyword);
        return chuyenVienRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChuyenVienDTO> getByKhoa(String maKhoa) {
        log.debug("Getting chuyen vien by khoa: {}", maKhoa);
        return chuyenVienRepository.findByKhoaMaKhoaAndIsActiveTrueOrderByHoTenAsc(maKhoa)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getTotalActive() {
        return chuyenVienRepository.countActive();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        log.debug("Getting chuyen vien statistics");
        Map<String, Object> stats = new HashMap<>();

        long total = chuyenVienRepository.count();
        long active = chuyenVienRepository.countActive();

        stats.put("totalChuyenVien", total);
        stats.put("activeChuyenVien", active);
        stats.put("inactiveChuyenVien", total - active);

        // Group by khoa if exists
        Map<String, Long> byKhoa = chuyenVienRepository.findByIsActiveTrueOrderByHoTenAsc()
                .stream()
                .filter(cv -> cv.getKhoa() != null)
                .collect(Collectors.groupingBy(
                        cv -> cv.getKhoa().getTenKhoa(),
                        Collectors.counting()
                ));
        stats.put("byKhoa", byKhoa);

        return stats;
    }

    // ========== MAPPING METHODS ==========

    private ChuyenVienDTO toDTO(ChuyenVien entity) {
        if (entity == null) return null;

        return ChuyenVienDTO.builder()
                .maChuyenVien(entity.getMaChuyenVien())
                .hoTen(entity.getHoTen())
                .email(entity.getEmail())
                .sdt(entity.getSdt())
                .chucDanh(entity.getChucDanh())
                .maKhoa(entity.getKhoa() != null ? entity.getKhoa().getMaKhoa() : null)
                .tenKhoa(entity.getKhoa() != null ? entity.getKhoa().getTenKhoa() : null)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private ChuyenVien toEntity(ChuyenVienDTO dto) {
        ChuyenVien cv = ChuyenVien.builder()
                .maChuyenVien(dto.getMaChuyenVien())
                .hoTen(dto.getHoTen())
                .email(dto.getEmail())
                .sdt(dto.getSdt())
                .chucDanh(dto.getChucDanh())
                .isActive(true)
                .build();

        if (dto.getMaKhoa() != null) {
            Khoa khoa = khoaRepository.findById(dto.getMaKhoa()).orElse(null);
            cv.setKhoa(khoa);
        }

        return cv;
    }

    private void updateEntity(ChuyenVien entity, ChuyenVienDTO dto) {
        if (dto.getHoTen() != null) entity.setHoTen(dto.getHoTen());
        if (dto.getEmail() != null) entity.setEmail(dto.getEmail());
        if (dto.getSdt() != null) entity.setSdt(dto.getSdt());
        if (dto.getChucDanh() != null) entity.setChucDanh(dto.getChucDanh());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());

        if (dto.getMaKhoa() != null) {
            Khoa khoa = khoaRepository.findById(dto.getMaKhoa()).orElse(null);
            entity.setKhoa(khoa);
        }
    }
}