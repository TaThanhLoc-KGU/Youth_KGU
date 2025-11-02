package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.KhoaHocDTO;
import com.tathanhloc.faceattendance.Model.KhoaHoc;
import com.tathanhloc.faceattendance.Repository.KhoaHocRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KhoaHocService {

    private final KhoaHocRepository khoaHocRepository;

    public List<KhoaHocDTO> getAll() {
        return khoaHocRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public KhoaHocDTO getById(String maKhoaHoc) {
        KhoaHoc kh = khoaHocRepository.findById(maKhoaHoc)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        return toDTO(kh);
    }

    @Transactional
    public KhoaHocDTO create(KhoaHocDTO dto) {
        if (khoaHocRepository.existsById(dto.getMaKhoaHoc())) {
            throw new RuntimeException("Mã khóa học đã tồn tại");
        }
        KhoaHoc kh = toEntity(dto);
        return toDTO(khoaHocRepository.save(kh));
    }

    @Transactional
    public KhoaHocDTO update(String maKhoaHoc, KhoaHocDTO dto) {
        KhoaHoc existing = khoaHocRepository.findById(maKhoaHoc)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));

        existing.setTenKhoaHoc(dto.getTenKhoaHoc());
        existing.setNamBatDau(dto.getNamBatDau());
        existing.setNamKetThuc(dto.getNamKetThuc());
        if (dto.getIsCurrent() != null) {
            existing.setIsCurrent(dto.getIsCurrent());
        }
        existing.setIsActive(dto.getIsActive());

        return toDTO(khoaHocRepository.save(existing));
    }

    public void delete(String maKhoaHoc) {
        if (!khoaHocRepository.existsById(maKhoaHoc)) {
            throw new RuntimeException("Không tìm thấy khóa học để xóa");
        }
        khoaHocRepository.deleteById(maKhoaHoc);
    }

    // Mapping methods
    private KhoaHocDTO toDTO(KhoaHoc kh) {
        return KhoaHocDTO.builder()
                .maKhoaHoc(kh.getMaKhoaHoc())
                .tenKhoaHoc(kh.getTenKhoaHoc())
                .namBatDau(kh.getNamBatDau())
                .namKetThuc(kh.getNamKetThuc())
                .isCurrent(kh.getIsCurrent())
                .isActive(kh.getIsActive())
                .build();
    }

    private KhoaHoc toEntity(KhoaHocDTO dto) {
        return KhoaHoc.builder()
                .maKhoaHoc(dto.getMaKhoaHoc())
                .tenKhoaHoc(dto.getTenKhoaHoc())
                .namBatDau(dto.getNamBatDau())
                .namKetThuc(dto.getNamKetThuc())
                .isCurrent(dto.getIsCurrent())
                .isActive(dto.getIsActive())
                .build();
    }

    public KhoaHocDTO getByMaKhoaHoc(String maKhoaHoc) {
        return toDTO(khoaHocRepository.findById(maKhoaHoc)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học")));
    }
}
