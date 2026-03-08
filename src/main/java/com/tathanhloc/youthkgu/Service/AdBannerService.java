package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.AdBannerDTO;
import com.tathanhloc.youthkgu.Model.AdBanner;
import com.tathanhloc.youthkgu.Repository.AdBannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdBannerService {

    private final AdBannerRepository repo;

    // ── Public ──────────────────────────────────────────────────────────────────

    public List<AdBannerDTO> getActive() {
        return repo.findAllActive()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AdBannerDTO> getActiveByLoai(String loai) {
        return repo.findAllActiveByLoai(loai)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────────

    public List<AdBannerDTO> getAll() {
        return repo.findAllOrdered()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public AdBannerDTO create(AdBannerDTO dto) {
        AdBanner banner = AdBanner.builder()
                .tieuDe(dto.getTieuDe())
                .hinhAnh(dto.getHinhAnh())
                .duongDan(dto.getDuongDan())
                .loai(dto.getLoai() != null ? dto.getLoai() : "MAIN")
                .thuTu(dto.getThuTu())
                .isActive(Boolean.TRUE.equals(dto.getIsActive()))
                .build();
        return toDTO(repo.save(banner));
    }

    @Transactional
    public AdBannerDTO update(Long id, AdBannerDTO dto) {
        AdBanner banner = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ad banner không tồn tại: " + id));
        banner.setTieuDe(dto.getTieuDe());
        banner.setHinhAnh(dto.getHinhAnh());
        banner.setDuongDan(dto.getDuongDan());
        if (dto.getLoai() != null) banner.setLoai(dto.getLoai());
        banner.setThuTu(dto.getThuTu());
        banner.setActive(Boolean.TRUE.equals(dto.getIsActive()));
        return toDTO(repo.save(banner));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Transactional
    public void reorder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            final int order = i;
            repo.findById(ids.get(i)).ifPresent(banner -> {
                banner.setThuTu(order);
                repo.save(banner);
            });
        }
    }

    // ── Mapping ──────────────────────────────────────────────────────────────────

    private AdBannerDTO toDTO(AdBanner banner) {
        return AdBannerDTO.builder()
                .id(banner.getId())
                .tieuDe(banner.getTieuDe())
                .hinhAnh(banner.getHinhAnh())
                .duongDan(banner.getDuongDan())
                .loai(banner.getLoai())
                .thuTu(banner.getThuTu())
                .isActive(banner.isActive())   // boolean → Boolean autobox OK
                .build();
    }
}
