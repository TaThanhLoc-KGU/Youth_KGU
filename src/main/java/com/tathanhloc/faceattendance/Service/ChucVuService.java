package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ChucVuDTO;
import com.tathanhloc.faceattendance.Model.ChucVu;
import com.tathanhloc.faceattendance.Repository.ChucVuRepository;
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
public class ChucVuService {

    private final ChucVuRepository chucVuRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChucVuDTO> getAll() {
        log.debug("Getting all active chuc vu");
        return chucVuRepository.findByIsActiveTrueOrderByThuTuAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChucVuDTO getById(String maChucVu) {
        log.debug("Getting chuc vu by ID: {}", maChucVu);
        ChucVu chucVu = chucVuRepository.findById(maChucVu)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chức vụ: " + maChucVu));
        return toDTO(chucVu);
    }

    @Transactional
    public ChucVuDTO create(ChucVuDTO dto) {
        log.info("Creating new chuc vu: {}", dto.getMaChucVu());

        // Validate
        if (chucVuRepository.existsById(dto.getMaChucVu())) {
            throw new RuntimeException("Mã chức vụ đã tồn tại: " + dto.getMaChucVu());
        }

        if (chucVuRepository.existsByTenChucVu(dto.getTenChucVu())) {
            throw new RuntimeException("Tên chức vụ đã tồn tại: " + dto.getTenChucVu());
        }

        ChucVu chucVu = toEntity(dto);
        chucVu.setIsActive(true);
        chucVu = chucVuRepository.save(chucVu);

        log.info("Chuc vu created successfully: {}", chucVu.getMaChucVu());
        return toDTO(chucVu);
    }

    @Transactional
    public ChucVuDTO update(String maChucVu, ChucVuDTO dto) {
        log.info("Updating chuc vu: {}", maChucVu);

        ChucVu existing = chucVuRepository.findById(maChucVu)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chức vụ: " + maChucVu));

        // Validate tên chức vụ
        if (!existing.getTenChucVu().equals(dto.getTenChucVu()) &&
                chucVuRepository.existsByTenChucVu(dto.getTenChucVu())) {
            throw new RuntimeException("Tên chức vụ đã tồn tại: " + dto.getTenChucVu());
        }

        updateEntity(existing, dto);
        existing = chucVuRepository.save(existing);

        log.info("Chuc vu updated successfully: {}", maChucVu);
        return toDTO(existing);
    }

    @Transactional
    public void delete(String maChucVu) {
        log.info("Soft deleting chuc vu: {}", maChucVu);

        ChucVu chucVu = chucVuRepository.findById(maChucVu)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chức vụ: " + maChucVu));

        chucVu.setIsActive(false);
        chucVuRepository.save(chucVu);

        log.info("Chuc vu soft deleted: {}", maChucVu);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<ChucVuDTO> getByThuocBan(String thuocBan) {
        log.debug("Getting chuc vu by thuoc ban: {}", thuocBan);
        return chucVuRepository.findByThuocBanAndIsActiveTrueOrderByThuTuAsc(thuocBan)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistics() {
        log.debug("Getting chuc vu statistics");
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", chucVuRepository.countActive());

        List<Object[]> countByThuocBan = chucVuRepository.countByThuocBan();
        for (Object[] row : countByThuocBan) {
            stats.put((String) row[0], (Long) row[1]);
        }

        return stats;
    }

    // ========== MAPPING METHODS ==========

    private ChucVuDTO toDTO(ChucVu entity) {
        if (entity == null) return null;

        return ChucVuDTO.builder()
                .maChucVu(entity.getMaChucVu())
                .tenChucVu(entity.getTenChucVu())
                .thuocBan(entity.getThuocBan())
                .moTa(entity.getMoTa())
                .thuTu(entity.getThuTu())
                .isActive(entity.getIsActive())
                .build();
    }

    private ChucVu toEntity(ChucVuDTO dto) {
        return ChucVu.builder()
                .maChucVu(dto.getMaChucVu())
                .tenChucVu(dto.getTenChucVu())
                .thuocBan(dto.getThuocBan())
                .moTa(dto.getMoTa())
                .thuTu(dto.getThuTu())
                .isActive(true)
                .build();
    }

    private void updateEntity(ChucVu entity, ChucVuDTO dto) {
        if (dto.getTenChucVu() != null) entity.setTenChucVu(dto.getTenChucVu());
        if (dto.getThuocBan() != null) entity.setThuocBan(dto.getThuocBan());
        if (dto.getMoTa() != null) entity.setMoTa(dto.getMoTa());
        if (dto.getThuTu() != null) entity.setThuTu(dto.getThuTu());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());
    }
}