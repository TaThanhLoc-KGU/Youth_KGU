package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChuyenVienDTO;
import com.tathanhloc.youthkgu.Model.ChuyenVien;
import com.tathanhloc.youthkgu.Model.Khoa;
import com.tathanhloc.youthkgu.Model.SinhVien;
import com.tathanhloc.youthkgu.Repository.ChuyenVienRepository;
import com.tathanhloc.youthkgu.Repository.KhoaRepository;
import com.tathanhloc.youthkgu.Repository.LopRepository;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import com.tathanhloc.youthkgu.Model.Lop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChuyenVienService {

    private final ChuyenVienRepository chuyenVienRepository;
    private final KhoaRepository khoaRepository;
    private final SinhVienRepository sinhVienRepository;
    private final LopRepository lopRepository;

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
        // Auto-generate mã nếu không có
        if (dto.getMaChuyenVien() == null || dto.getMaChuyenVien().isBlank()) {
            dto.setMaChuyenVien("CV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
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

        stats.put("total", total); // Changed from totalChuyenVien to total
        stats.put("active", active); // Changed from activeChuyenVien to active
        stats.put("inactive", total - active); // Changed from inactiveChuyenVien to inactive

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

    @Transactional
    public void importFromExcel(List<ChuyenVienDTO> dtos) {
        log.info("Importing {} chuyen vien from Excel", dtos.size());
        for (ChuyenVienDTO dto : dtos) {
            // 1. Lưu/cập nhật bản ghi ChuyenVien
            Optional<ChuyenVien> existing = chuyenVienRepository.findById(dto.getMaChuyenVien());
            ChuyenVien cv;
            if (existing.isPresent()) {
                updateEntity(existing.get(), dto);
                cv = chuyenVienRepository.save(existing.get());
            } else {
                cv = chuyenVienRepository.save(toEntity(dto));
            }

            // 2. Tự động tạo/cập nhật SinhVien tương ứng để chuyên viên
            //    có thể đăng ký hoạt động như đoàn viên bình thường.
            //    maSv = maChuyenVien, lop = chiDoan của Khoa/Phòng/Ban (nếu có)
            String maSv = cv.getMaChuyenVien();
            
            // Tìm chi đoàn của Khoa/Phòng/Ban này
            Lop chiDoan = null;
            if (cv.getKhoa() != null) {
                List<Lop> chiDoans = lopRepository.findByMaKhoa_MaKhoaAndLoai(cv.getKhoa().getMaKhoa(), "CHI_DOAN");
                if (!chiDoans.isEmpty()) {
                    chiDoan = chiDoans.get(0);
                }
            }
            
            Optional<SinhVien> existingSv = sinhVienRepository.findById(maSv);
            if (existingSv.isPresent()) {
                SinhVien sv = existingSv.get();
                sv.setHoTen(cv.getHoTen());
                sv.setEmail(cv.getEmail());
                sv.setSdt(cv.getSdt());
                sv.setIsActive(cv.getIsActive() != null ? cv.getIsActive() : true);
                if (chiDoan != null) sv.setLop(chiDoan);
                sinhVienRepository.save(sv);
                log.debug("Updated SinhVien record for chuyenvien: {}", maSv);
            } else {
                SinhVien sv = SinhVien.builder()
                        .maSv(maSv)
                        .hoTen(cv.getHoTen())
                        .email(cv.getEmail())
                        .sdt(cv.getSdt())
                        .isActive(cv.getIsActive() != null ? cv.getIsActive() : true)
                        .lop(chiDoan) // Link vào chi đoàn tương ứng
                        .build();
                sinhVienRepository.save(sv);
                log.info("Created SinhVien record for chuyenvien: {}", maSv);
            }
        }
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