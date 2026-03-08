package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.BieuMauDTO;
import com.tathanhloc.youthkgu.Model.BieuMau;
import com.tathanhloc.youthkgu.Repository.BieuMauRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BieuMauService {

    private final BieuMauRepository repo;
    private final FileStorageService fileStorageService;

    // ── Public ──────────────────────────────────────────────────────────────────

    public List<BieuMauDTO> getActive() {
        return repo.findAllActive().stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────────

    public List<BieuMauDTO> getAll() {
        return repo.findAllOrdered().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public BieuMauDTO create(String ten, int thuTu, boolean isActive, MultipartFile file) {
        String duongDan = fileStorageService.saveBieuMauFile(file);
        String loaiFile = getExtension(file.getOriginalFilename());
        BieuMau bm = BieuMau.builder()
                .ten(ten)
                .duongDan(duongDan)
                .loaiFile(loaiFile)
                .kichThuoc(file.getSize())
                .thuTu(thuTu)
                .isActive(isActive)
                .build();
        log.info("Created bieu mau: {}", ten);
        return toDTO(repo.save(bm));
    }

    @Transactional
    public BieuMauDTO updateMeta(Long id, String ten, int thuTu, boolean isActive) {
        BieuMau bm = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Biểu mẫu không tồn tại: " + id));
        bm.setTen(ten);
        bm.setThuTu(thuTu);
        bm.setActive(isActive);
        return toDTO(repo.save(bm));
    }

    @Transactional
    public BieuMauDTO replaceFile(Long id, MultipartFile file) {
        BieuMau bm = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Biểu mẫu không tồn tại: " + id));
        fileStorageService.deleteFile(bm.getDuongDan());
        String duongDan = fileStorageService.saveBieuMauFile(file);
        bm.setDuongDan(duongDan);
        bm.setLoaiFile(getExtension(file.getOriginalFilename()));
        bm.setKichThuoc(file.getSize());
        return toDTO(repo.save(bm));
    }

    @Transactional
    public void delete(Long id) {
        repo.findById(id).ifPresent(bm -> {
            fileStorageService.deleteFile(bm.getDuongDan());
            repo.delete(bm);
        });
        log.info("Deleted bieu mau id={}", id);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────────

    private BieuMauDTO toDTO(BieuMau bm) {
        return BieuMauDTO.builder()
                .id(bm.getId())
                .ten(bm.getTen())
                .duongDan(bm.getDuongDan())
                .loaiFile(bm.getLoaiFile())
                .kichThuoc(bm.getKichThuoc())
                .thuTu(bm.getThuTu())
                .isActive(bm.isActive())
                .createdAt(bm.getCreatedAt())
                .build();
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1).toLowerCase() : "";
    }
}
