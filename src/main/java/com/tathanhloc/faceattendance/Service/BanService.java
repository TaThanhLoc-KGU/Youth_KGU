package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.BanDTO;
import com.tathanhloc.faceattendance.Model.Ban;
import com.tathanhloc.faceattendance.Model.Khoa;
import com.tathanhloc.faceattendance.Repository.BanRepository;
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
public class BanService {

    private final BanRepository banRepository;
    private final KhoaRepository khoaRepository;

    // ========== CRUD OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BanDTO> getAll() {
        log.debug("Getting all active ban");
        return banRepository.findByIsActiveTrueOrderByTenBanAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BanDTO getById(String maBan) {
        log.debug("Getting ban by ID: {}", maBan);
        Ban ban = banRepository.findById(maBan)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ban: " + maBan));
        return toDTO(ban);
    }

    @Transactional
    public BanDTO create(BanDTO dto) {
        log.info("Creating new ban: {}", dto.getMaBan());

        // Validate
        if (banRepository.existsById(dto.getMaBan())) {
            throw new RuntimeException("Mã ban đã tồn tại: " + dto.getMaBan());
        }

        if (banRepository.existsByTenBan(dto.getTenBan())) {
            throw new RuntimeException("Tên ban đã tồn tại: " + dto.getTenBan());
        }

        Ban ban = toEntity(dto);
        ban.setIsActive(true);
        ban = banRepository.save(ban);

        log.info("Ban created successfully: {}", ban.getMaBan());
        return toDTO(ban);
    }

    @Transactional
    public BanDTO update(String maBan, BanDTO dto) {
        log.info("Updating ban: {}", maBan);

        Ban existing = banRepository.findById(maBan)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ban: " + maBan));

        // Validate tên ban
        if (!existing.getTenBan().equals(dto.getTenBan()) &&
                banRepository.existsByTenBan(dto.getTenBan())) {
            throw new RuntimeException("Tên ban đã tồn tại: " + dto.getTenBan());
        }

        updateEntity(existing, dto);
        existing = banRepository.save(existing);

        log.info("Ban updated successfully: {}", maBan);
        return toDTO(existing);
    }

    @Transactional
    public void delete(String maBan) {
        log.info("Soft deleting ban: {}", maBan);

        Ban ban = banRepository.findById(maBan)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ban: " + maBan));

        ban.setIsActive(false);
        banRepository.save(ban);

        log.info("Ban soft deleted: {}", maBan);
    }

    // ========== QUERY OPERATIONS ==========

    @Transactional(readOnly = true)
    public List<BanDTO> getByLoaiBan(String loaiBan) {
        log.debug("Getting ban by loai ban: {}", loaiBan);
        return banRepository.findByLoaiBanAndIsActiveTrueOrderByTenBanAsc(loaiBan)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BanDTO> getByKhoa(String maKhoa) {
        log.debug("Getting ban by khoa: {}", maKhoa);
        return banRepository.findByKhoaMaKhoaAndIsActiveTrueOrderByTenBanAsc(maKhoa)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistics() {
        log.debug("Getting ban statistics");
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", banRepository.countActive());

        List<Object[]> countByLoaiBan = banRepository.countByLoaiBan();
        for (Object[] row : countByLoaiBan) {
            stats.put((String) row[0], (Long) row[1]);
        }

        return stats;
    }

    // ========== MAPPING METHODS ==========

    private BanDTO toDTO(Ban entity) {
        if (entity == null) return null;

        return BanDTO.builder()
                .maBan(entity.getMaBan())
                .tenBan(entity.getTenBan())
                .loaiBan(entity.getLoaiBan())
                .moTa(entity.getMoTa())
                .maKhoa(entity.getKhoa() != null ? entity.getKhoa().getMaKhoa() : null)
                .tenKhoa(entity.getKhoa() != null ? entity.getKhoa().getTenKhoa() : null)
                .isActive(entity.getIsActive())
                .build();
    }

    private Ban toEntity(BanDTO dto) {
        Ban ban = Ban.builder()
                .maBan(dto.getMaBan())
                .tenBan(dto.getTenBan())
                .loaiBan(dto.getLoaiBan())
                .moTa(dto.getMoTa())
                .isActive(true)
                .build();

        if (dto.getMaKhoa() != null) {
            Khoa khoa = khoaRepository.findById(dto.getMaKhoa()).orElse(null);
            ban.setKhoa(khoa);
        }

        return ban;
    }

    private void updateEntity(Ban entity, BanDTO dto) {
        if (dto.getTenBan() != null) entity.setTenBan(dto.getTenBan());
        if (dto.getLoaiBan() != null) entity.setLoaiBan(dto.getLoaiBan());
        if (dto.getMoTa() != null) entity.setMoTa(dto.getMoTa());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());

        if (dto.getMaKhoa() != null) {
            Khoa khoa = khoaRepository.findById(dto.getMaKhoa()).orElse(null);
            entity.setKhoa(khoa);
        }
    }
}