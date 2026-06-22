package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LopService {

    private final LopRepository lopRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final SinhVienRepository sinhVienRepository;
    private final KhoaRepository khoaRepository;

    // Lấy tất cả lớp (bao gồm cả đã xóa)
    @Transactional(readOnly = true)
    public List<LopDTO> getAll() {
        return lopRepository.findAll().stream().map(this::toDTO).toList();
    }

    // Chỉ lấy lớp đang hoạt động
    @Transactional(readOnly = true)
    public List<LopDTO> getAllActive() {
        return lopRepository.findByIsActiveTrue().stream().map(this::toDTO).toList();
    }

    // Chỉ lấy lớp đã bị xóa mềm
    @Transactional(readOnly = true)
    public List<LopDTO> getAllDeleted() {
        return lopRepository.findByIsActiveFalse().stream().map(this::toDTO).toList();
    }

    public LopDTO getById(String id) {
        return toDTO(lopRepository.findById(id).orElseThrow());
    }

    public LopDTO create(LopDTO dto) {
        Lop lop = toEntity(dto);
        return toDTO(lopRepository.save(lop));
    }

    public LopDTO update(String id, LopDTO dto) {
        Lop existing = lopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp với mã: " + id));

        Nganh nganh = nganhRepository.findById(dto.getMaNganh())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngành với mã: " + dto.getMaNganh()));

        existing.setTenLop(dto.getTenLop());
        existing.setNganh(nganh);
        existing.setKhoaHoc(khoaHocRepository.findById(dto.getMaKhoahoc())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học với mã: " + dto.getMaKhoahoc())));
        existing.setMaKhoa(nganh.getKhoa()); // Tự động cập nhật Khoa từ Ngành
        existing.setActive(dto.getIsActive());

        return toDTO(lopRepository.save(existing));
    }

    // Xóa mềm
    public void softDelete(String id) {
        Lop existing = lopRepository.findById(id).orElseThrow();
        existing.setActive(false);
        lopRepository.save(existing);
    }

    // Khôi phục lớp đã xóa mềm
    public LopDTO restore(String id) {
        Lop existing = lopRepository.findById(id).orElseThrow();
        existing.setActive(true);
        return toDTO(lopRepository.save(existing));
    }

    // Xóa vĩnh viễn
    public void hardDelete(String id) {
        lopRepository.deleteById(id);
    }

    // Xóa mềm (alias cho softDelete)
    public void delete(String id) {
        softDelete(id);
    }

    @Transactional
    public List<LopDTO> saveAll(List<LopDTO> dtoList) {
        List<Lop> entities = dtoList.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
        return lopRepository.saveAll(entities).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private LopDTO toDTO(Lop e) {
        return LopDTO.builder()
                .maLop(e.getMaLop())
                .tenLop(e.getTenLop())
                .maNganh(e.getNganh() != null ? e.getNganh().getMaNganh() : null)
                .tenNganh(e.getNganh() != null ? e.getNganh().getTenNganh() : null)
                .maKhoahoc(e.getKhoaHoc() != null ? e.getKhoaHoc().getMaKhoahoc() : null)
                .tenKhoahoc(e.getKhoaHoc() != null ? e.getKhoaHoc().getTenKhoahoc() : null)
                .maKhoa(e.getMaKhoa() != null ? e.getMaKhoa().getMaKhoa() : null)
                .tenKhoa(e.getMaKhoa() != null ? e.getMaKhoa().getTenKhoa() : null)
                .isActive(e.isActive())
                .loai(e.getLoai() != null ? e.getLoai() : "LOP")
                .build();
    }

    private Lop toEntity(LopDTO dto) {
        Nganh nganh = nganhRepository.findById(dto.getMaNganh())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngành với mã: " + dto.getMaNganh()));

        KhoaHoc khoaHoc = khoaHocRepository.findById(dto.getMaKhoahoc())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học với mã: " + dto.getMaKhoahoc()));

        return Lop.builder()
                .maLop(dto.getMaLop())
                .tenLop(dto.getTenLop())
                .nganh(nganh)
                .khoaHoc(khoaHoc)
                .maKhoa(nganh.getKhoa()) // Tự động lấy Khoa từ Ngành
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }

    public LopDTO getByMaLop(String maLop) {
        Lop lop = lopRepository.findById(maLop)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp"));
        return toDTO(lop);
    }

    public long count() {
        return lopRepository.count();
    }

    public long countActive() {
        return lopRepository.countByIsActiveTrue();
    }

    public long countInactive() {
        return lopRepository.countByIsActiveFalse();
    }
    // Thêm vào class LopService
    public long countSinhVienByLop(String maLop) {
        lopRepository.findById(maLop)
                .orElseThrow(() -> new RuntimeException("Khong tim thay lop voi ma: " + maLop));
        return sinhVienRepository.countByLopMaLopAndIsActiveTrue(maLop);
    }

    // ========== CHI DOAN METHODS ==========

    /** Lay tat ca chi doan dang hoat dong */
    @Transactional(readOnly = true)
    public List<LopDTO> getAllChiDoan() {
        return lopRepository.findByLoaiAndIsActiveTrue("CHI_DOAN").stream()
                .map(this::toDTO).toList();
    }

    /** Lay tat ca lop (loai = LOP) dang hoat dong */
    @Transactional(readOnly = true)
    public List<LopDTO> getAllLopOnly() {
        return lopRepository.findByLoaiAndIsActiveTrue("LOP").stream()
                .map(this::toDTO).toList();
    }

    /**
     * Tao chi doan moi - khong yeu cau nganh/khoahoc.
     * maKhoa co the null (cap truong) hoac co (cap khoa).
     */
    @Transactional
    public LopDTO createChiDoan(LopDTO dto) {
        Lop.LopBuilder builder = Lop.builder()
                .maLop(dto.getMaLop())
                .tenLop(dto.getTenLop())
                .loai("CHI_DOAN")
                .isActive(true);

        if (dto.getMaKhoa() != null && !dto.getMaKhoa().isBlank()) {
            khoaRepository.findById(dto.getMaKhoa()).ifPresent(builder::maKhoa);
        }

        return toDTO(lopRepository.save(builder.build()));
    }
}