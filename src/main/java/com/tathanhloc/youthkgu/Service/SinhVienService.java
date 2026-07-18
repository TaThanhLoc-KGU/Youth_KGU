package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SinhVienService extends BaseService<SinhVien, String, SinhVienDTO> {

    private final SinhVienRepository sinhVienRepository;
    private final LopRepository lopRepository;
    private final KhoaScopeService khoaScopeService;

    @Override
    protected JpaRepository<SinhVien, String> getRepository() {
        return sinhVienRepository;
    }

    @Override
    protected void setActive(SinhVien entity, boolean active) {
        entity.setIsActive(active);
    }

    @Override
    protected boolean isActive(SinhVien entity) {
        return entity.getIsActive() != null && entity.getIsActive();
    }
    private final SinhVienExcelService excelService;

    public SinhVienDTO create(SinhVienDTO dto) {
        SinhVien entity = toEntity(dto);
        return toDTO(sinhVienRepository.save(entity));
    }

    public SinhVienDTO update(String id, SinhVienDTO dto) {
        SinhVien sv = sinhVienRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Không tìm thấy sinh viên với mã: " + id));

        sv.setHoTen(dto.getHoTen());
        sv.setGioiTinh(dto.getGioiTinh());
        sv.setNgaySinh(dto.getNgaySinh());
        sv.setEmail(dto.getEmail());
        sv.setIsActive(dto.getIsActive());
        // THÊM DÒNG NÀY:
        sv.setSdt(dto.getSdt());

        sv.setLop(lopRepository.findById(dto.getMaLop()).orElseThrow(() ->
                new RuntimeException("Không tìm thấy lớp với mã: " + dto.getMaLop())));

        return toDTO(sinhVienRepository.save(sv));
    }

    @Override
    protected SinhVienDTO toDTO(SinhVien sv) {
        return SinhVienDTO.builder()
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .gioiTinh(sv.getGioiTinh())
                .ngaySinh(sv.getNgaySinh())
                .email(sv.getEmail())
                .sdt(sv.getSdt())
                .isActive(sv.getIsActive())
                .maLop(sv.getLop() != null ? sv.getLop().getMaLop() : null)
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .maKhoa(sv.getLop() != null && sv.getLop().getMaKhoa() != null ? sv.getLop().getMaKhoa().getMaKhoa() : null)
                .maNganh(sv.getLop() != null && sv.getLop().getNganh() != null ? sv.getLop().getNganh().getMaNganh() : null)
                .hasZalo(sv.getZaloUserId() != null && !sv.getZaloUserId().isBlank())
                .build();
    }

    @Override
    protected SinhVien toEntity(SinhVienDTO dto) {
        return SinhVien.builder()
                .maSv(dto.getMaSv())
                .hoTen(dto.getHoTen())
                .gioiTinh(dto.getGioiTinh())
                .ngaySinh(dto.getNgaySinh())
                .email(dto.getEmail())
                .sdt(dto.getSdt())                        // ← THÊM DÒNG NÀY
                .isActive(dto.getIsActive())
                .lop(lopRepository.findById(dto.getMaLop()).orElseThrow(() ->
                        new RuntimeException("Không tìm thấy lớp với mã: " + dto.getMaLop())))
                .build();
    }

    public SinhVienDTO getByMaSv(String maSv) {
        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên với mã: " + maSv));
        return toDTO(sinhVien);
    }

    // getAll() — mặc định CHỈ active, không load sinh viên tốt nghiệp
    @Override
    public List<SinhVienDTO> getAll() {
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maKhoa != null) {
            return sinhVienRepository.findByLopNganhKhoaMaKhoaAndIsActiveTrue(maKhoa).stream()
                    .map(this::toDTO).toList();
        }
        return sinhVienRepository.findByIsActiveTrue().stream()
                .map(this::toDTO).toList();
    }

    // getAllActive() — alias của getAll(), giữ lại để không break các caller khác
    public List<SinhVienDTO> getAllActive() {
        return getAll();
    }

    // getAllIncludingGraduated() — chỉ dùng cho admin xem báo cáo / export toàn bộ
    public List<SinhVienDTO> getAllIncludingGraduated() {
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maKhoa != null) {
            return sinhVienRepository.findByLopNganhKhoaMaKhoa(maKhoa).stream()
                    .map(this::toDTO).toList();
        }
        return sinhVienRepository.findAll().stream()
                .map(this::toDTO).toList();
    }

    public List<Map<String, Object>> getAllEmbeddings() {
        return sinhVienRepository.findByIsActiveTrue().stream()
                .map(sv -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("studentId", sv.getMaSv());
                    result.put("name", sv.getHoTen());
                    return result;
                })
                .collect(Collectors.toList());
    }


    public long count() {
        return sinhVienRepository.count();
    }
    // Thêm vào class SinhVienService
    public long countActive() {
        return sinhVienRepository.countByIsActiveTrue();
    }

    public long countAll() {
        return sinhVienRepository.count();
    }

    /**
     * Lấy thống kê số lượng sinh viên
     */
    public StudentCountDTO getStudentCountStatistics() {
        long total = sinhVienRepository.count();
        long active = sinhVienRepository.countByIsActiveTrue();
        long inactive = total - active;

        // Thống kê DB-level — không load toàn bộ bảng
        Map<String, Long> byFaculty = new HashMap<>();
        sinhVienRepository.countActiveGroupByKhoa()
                .forEach(row -> byFaculty.put((String) row[0], (Long) row[1]));

        Map<String, Long> byMajor = new HashMap<>();
        sinhVienRepository.countActiveGroupByNganh()
                .forEach(row -> byMajor.put((String) row[0], (Long) row[1]));

        Map<String, Long> byClass = new HashMap<>();
        sinhVienRepository.countActiveGroupByLop()
                .forEach(row -> byClass.put((String) row[0], (Long) row[1]));

        return StudentCountDTO.builder()
                .tongSinhVien(total)
                .sinhVienHoatDong(active)
                .sinhVienKhongHoatDong(inactive)
                .thongKeTheoKhoa(byFaculty)
                .thongKeTheoNganh(byMajor)
                .thongKeTheoLop(byClass)
                .build();
    }

    public List<SinhVienDTO> importFromExcel(List<SinhVienDTO> dtoList) {
        List<SinhVienDTO> savedList = new ArrayList<>();

        for (SinhVienDTO dto : dtoList) {
            try {
                // Check if exists
                Optional<SinhVien> existing = sinhVienRepository.findById(dto.getMaSv());
                SinhVien saved;

                if (existing.isPresent()) {
                    // Update
                    SinhVien sv = existing.get();
                    sv.setHoTen(dto.getHoTen());
                    sv.setGioiTinh(dto.getGioiTinh());
                    sv.setNgaySinh(dto.getNgaySinh());
                    sv.setEmail(dto.getEmail());
                    sv.setSdt(dto.getSdt());
                    sv.setIsActive(dto.getIsActive());
                    sv.setLop(lopRepository.findById(dto.getMaLop())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp")));
                    saved = sinhVienRepository.save(sv);
                } else {
                    // Create new
                    saved = sinhVienRepository.save(toEntity(dto));
                }

                savedList.add(toDTO(saved));
            } catch (Exception e) {
                log.error("Error importing student: " + dto.getMaSv(), e);
            }
        }

        return savedList;
    }

    @Transactional
    public int updateStatusBatch(List<String> studentIds, Boolean isActive) {
        int count = 0;
        for (String id : studentIds) {
            try {
                Optional<SinhVien> svOpt = sinhVienRepository.findById(id);
                if (svOpt.isPresent()) {
                    SinhVien sv = svOpt.get();
                    sv.setIsActive(isActive);
                    sinhVienRepository.save(sv);
                    count++;
                }
            } catch (Exception e) {
                log.error("Failed to update status for student: " + id, e);
            }
        }
        return count;
    }

    // ── Xóa (vô hiệu hóa) sinh viên tốt nghiệp hàng loạt ───────────────────
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> bulkDeactivate(List<String> maSvList) {
        int success = 0, notFound = 0, alreadyInactive = 0;
        List<String> failedIds = new ArrayList<>();

        for (String maSv : maSvList) {
            Optional<SinhVien> opt = sinhVienRepository.findById(maSv.trim());
            if (opt.isEmpty()) {
                notFound++;
                failedIds.add(maSv + " (không tìm thấy)");
            } else {
                SinhVien sv = opt.get();
                if (!Boolean.TRUE.equals(sv.getIsActive())) {
                    alreadyInactive++;
                } else {
                    sv.setIsActive(false);
                    sinhVienRepository.save(sv);
                    success++;
                }
            }
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("success", true);
        result.put("deactivated", success);
        result.put("alreadyInactive", alreadyInactive);
        result.put("notFound", notFound);
        result.put("total", maSvList.size());
        result.put("failedIds", failedIds);
        log.info("bulkDeactivate: {} deactivated, {} notFound, {} alreadyInactive", success, notFound, alreadyInactive);
        return result;
    }

    // ══════════════════════════════════════════════════════════════
    // BATCH MATCH — Dò MSSV/Tên từ file Excel để nhập CLB
    // ══════════════════════════════════════════════════════════════

    /**
     * Dò khớp danh sách hàng Excel với sinh viên trong hệ thống.
     * Ưu tiên: MSSV exact → Tên chuẩn hóa không dấu (+ lớp nếu có) → Không tìm thấy.
     */
    @Transactional(readOnly = true)
    public List<ClbImportMatchDTO> batchMatchForClb(List<ClbImportRowDTO> rows) {
        // Load toàn bộ sinh viên active một lần (tránh N+1)
        List<SinhVien> all = sinhVienRepository.findByIsActive(true);

        // Index MSSV → SinhVien
        Map<String, SinhVien> byMaSv = new HashMap<>();
        // Index tên chuẩn hóa → list sinh viên
        Map<String, List<SinhVien>> byNormName = new HashMap<>();

        for (SinhVien sv : all) {
            byMaSv.put(sv.getMaSv().toUpperCase().trim(), sv);
            String norm = normalizeVietnamese(sv.getHoTen());
            byNormName.computeIfAbsent(norm, k -> new ArrayList<>()).add(sv);
        }

        return rows.stream().map(row -> {
            // 1. Thử MSSV trước
            if (row.getMaSv() != null && !row.getMaSv().isBlank()) {
                SinhVien sv = byMaSv.get(row.getMaSv().trim().toUpperCase());
                if (sv != null) return ClbImportMatchDTO.matchedByMaSv(row.getRowIndex(), sv);
            }

            // 2. Thử tên chuẩn hóa
            if (row.getHoTen() != null && !row.getHoTen().isBlank()) {
                String normHoTen = normalizeVietnamese(row.getHoTen());
                List<SinhVien> candidates = byNormName.getOrDefault(normHoTen, List.of());

                // Thu hẹp theo lớp nếu có
                if (row.getTenLop() != null && !row.getTenLop().isBlank()) {
                    String normLop = row.getTenLop().trim().toUpperCase();
                    List<SinhVien> filtered = candidates.stream()
                            .filter(sv -> sv.getLop() != null && (
                                    sv.getLop().getMaLop().toUpperCase().equals(normLop) ||
                                    sv.getLop().getTenLop().toUpperCase().contains(normLop) ||
                                    normLop.contains(sv.getLop().getMaLop().toUpperCase())
                            ))
                            .collect(Collectors.toList());
                    if (!filtered.isEmpty()) candidates = filtered;
                }

                if (candidates.size() == 1) {
                    return ClbImportMatchDTO.matchedByName(row.getRowIndex(), candidates.get(0), row);
                } else if (candidates.size() > 1) {
                    return ClbImportMatchDTO.ambiguous(row.getRowIndex(), row, candidates.size());
                }
            }

            return ClbImportMatchDTO.notFound(row.getRowIndex(), row);
        }).collect(Collectors.toList());
    }

    /**
     * Chuẩn hóa tên tiếng Việt: xóa dấu, chữ thường, loại ký tự đặc biệt.
     */
    public static String normalizeVietnamese(String s) {
        if (s == null || s.isBlank()) return "";
        // Xử lý "đ" trước (không phân tách được bằng NFD)
        String r = s.trim().toLowerCase()
                .replace("đ", "d");
        r = java.text.Normalizer.normalize(r, java.text.Normalizer.Form.NFD);
        r = r.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return r.replaceAll("[^a-z0-9 ]", "").replaceAll("\\s+", " ").trim();
    }
}