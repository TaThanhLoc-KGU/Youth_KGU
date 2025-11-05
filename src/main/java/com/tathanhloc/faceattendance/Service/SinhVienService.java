package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SinhVienService extends BaseService<SinhVien, String, SinhVienDTO> {

    private final SinhVienRepository sinhVienRepository;
    private final LopRepository lopRepository;

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

    // Chỉ lấy sinh viên đang hoạt động
    public List<SinhVienDTO> getAllActive() {
        return sinhVienRepository.findAll().stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .map(this::toDTO)
                .toList();
    }

    /**
     * Lấy tất cả embedding của sinh viên đang hoạt động
     * @return Danh sách embedding của sinh viên
     */
    public List<Map<String, Object>> getAllEmbeddings() {
        return sinhVienRepository.findAll().stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
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

        // Thống kê theo khoa
        Map<String, Long> byFaculty = new HashMap<>();
        List<SinhVien> allStudents = sinhVienRepository.findAll();
        allStudents.stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .collect(Collectors.groupingBy(
                        sv -> sv.getLop().getNganh().getKhoa().getTenKhoa(),
                        Collectors.counting()
                ))
                .forEach(byFaculty::put);

        // Thống kê theo ngành
        Map<String, Long> byMajor = new HashMap<>();
        allStudents.stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .collect(Collectors.groupingBy(
                        sv -> sv.getLop().getNganh().getTenNganh(),
                        Collectors.counting()
                ))
                .forEach(byMajor::put);

        // Thống kê theo lớp
        Map<String, Long> byClass = new HashMap<>();
        allStudents.stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .collect(Collectors.groupingBy(
                        sv -> sv.getLop().getTenLop(),
                        Collectors.counting()
                ))
                .forEach(byClass::put);

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
}
