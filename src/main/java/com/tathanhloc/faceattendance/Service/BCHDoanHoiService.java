package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.BCHDoanHoiDTO;
import com.tathanhloc.faceattendance.Model.BCHDoanHoi;
import com.tathanhloc.faceattendance.Model.Khoa;
import com.tathanhloc.faceattendance.Repository.BCHDoanHoiRepository;
import com.tathanhloc.faceattendance.Repository.KhoaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý Ban Chấp Hành Đoàn - Hội
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BCHDoanHoiService {

    private final BCHDoanHoiRepository bchRepository;
    private final KhoaRepository khoaRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getAll() {
        log.debug("Getting all active BCH members");
        return bchRepository.findByIsActive(true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BCHDoanHoiDTO getById(String maBch) {
        log.debug("Getting BCH by ID: {}", maBch);
        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));
        return toDTO(bch);
    }

    @Transactional(readOnly = true)
    public BCHDoanHoiDTO getByEmail(String email) {
        log.debug("Getting BCH by email: {}", email);
        BCHDoanHoi bch = bchRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH với email: " + email));
        return toDTO(bch);
    }

    @Transactional
    public BCHDoanHoiDTO create(BCHDoanHoiDTO dto) {
        log.info("Creating new BCH member: {}", dto.getMaBch());

        // Validate
        if (bchRepository.existsById(dto.getMaBch())) {
            throw new RuntimeException("Mã BCH đã tồn tại: " + dto.getMaBch());
        }

        if (bchRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng: " + dto.getEmail());
        }

        BCHDoanHoi bch = toEntity(dto);
        bch.setIsActive(true);
        bch = bchRepository.save(bch);

        log.info("BCH member created successfully: {}", bch.getMaBch());
        return toDTO(bch);
    }

    @Transactional
    public BCHDoanHoiDTO update(String maBch, BCHDoanHoiDTO dto) {
        log.info("Updating BCH member: {}", maBch);

        BCHDoanHoi existing = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        // Validate email nếu thay đổi
        if (!existing.getEmail().equals(dto.getEmail()) &&
                bchRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng: " + dto.getEmail());
        }

        updateEntity(existing, dto);
        existing = bchRepository.save(existing);

        log.info("BCH member updated successfully: {}", maBch);
        return toDTO(existing);
    }

    @Transactional
    public void delete(String maBch) {
        log.info("Soft deleting BCH member: {}", maBch);

        BCHDoanHoi bch = bchRepository.findById(maBch)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BCH: " + maBch));

        bch.setIsActive(false);
        bchRepository.save(bch);

        log.info("BCH member soft deleted: {}", maBch);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getByChucVu(String chucVu) {
        log.debug("Getting BCH members by position: {}", chucVu);
        return bchRepository.findByChucVuAndIsActive(chucVu, true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> getByKhoa(String maKhoa) {
        log.debug("Getting BCH members by department: {}", maKhoa);
        return bchRepository.findByKhoaMaKhoaAndIsActive(maKhoa, true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> searchByKeyword(String keyword) {
        log.debug("Searching BCH members by keyword: {}", keyword);
        return bchRepository.searchByKeyword(keyword).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BCHDoanHoiDTO> searchAdvanced(String keyword, String chucVu, String maKhoa) {
        log.debug("Advanced search BCH: keyword={}, chucVu={}, khoa={}", keyword, chucVu, maKhoa);
        return bchRepository.searchAdvanced(keyword, chucVu, maKhoa).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== STATISTICS ==========

    @Transactional(readOnly = true)
    public Map<String, Long> countByChucVu() {
        log.debug("Getting BCH count by position");
        List<Object[]> results = bchRepository.countByChucVu();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> countByKhoa() {
        log.debug("Getting BCH count by department");
        List<Object[]> results = bchRepository.countByKhoa();
        return results.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("maKhoa", row[0]);
                    map.put("tenKhoa", row[1]);
                    map.put("soLuong", row[2]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getTotalActive() {
        return bchRepository.countByIsActiveTrue();
    }

    // ========== MAPPING METHODS ==========

    private BCHDoanHoiDTO toDTO(BCHDoanHoi entity) {
        if (entity == null) return null;

        return BCHDoanHoiDTO.builder()
                .maBch(entity.getMaBch())
                .hoTen(entity.getHoTen())
                .email(entity.getEmail())
                .soDienThoai(entity.getSoDienThoai())
                .chucVu(entity.getChucVu())
                .maKhoa(entity.getKhoa() != null ? entity.getKhoa().getMaKhoa() : null)
                .tenKhoa(entity.getKhoa() != null ? entity.getKhoa().getTenKhoa() : null)
                .nhiemKy(entity.getNhiemKy())
                .ngayBatDau(entity.getNgayBatDau())
                .ngayKetThuc(entity.getNgayKetThuc())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private BCHDoanHoi toEntity(BCHDoanHoiDTO dto) {
        BCHDoanHoi entity = BCHDoanHoi.builder()
                .maBch(dto.getMaBch())
                .hoTen(dto.getHoTen())
                .email(dto.getEmail())
                .soDienThoai(dto.getSoDienThoai())
                .chucVu(dto.getChucVu())
                .nhiemKy(dto.getNhiemKy())
                .ngayBatDau(dto.getNgayBatDau())
                .ngayKetThuc(dto.getNgayKetThuc())
                .isActive(true)
                .build();

        if (dto.getMaKhoa() != null) {
            entity.setKhoa(khoaRepository.findById(dto.getMaKhoa()).orElse(null));
        }

        return entity;
    }

    private void updateEntity(BCHDoanHoi entity, BCHDoanHoiDTO dto) {
        if (dto.getHoTen() != null) entity.setHoTen(dto.getHoTen());
        if (dto.getEmail() != null) entity.setEmail(dto.getEmail());
        if (dto.getSoDienThoai() != null) entity.setSoDienThoai(dto.getSoDienThoai());
        if (dto.getChucVu() != null) entity.setChucVu(dto.getChucVu());
        if (dto.getNhiemKy() != null) entity.setNhiemKy(dto.getNhiemKy());
        if (dto.getNgayBatDau() != null) entity.setNgayBatDau(dto.getNgayBatDau());
        if (dto.getNgayKetThuc() != null) entity.setNgayKetThuc(dto.getNgayKetThuc());

        if (dto.getMaKhoa() != null) {
            entity.setKhoa(khoaRepository.findById(dto.getMaKhoa()).orElse(null));
        }
    }
}