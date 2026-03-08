package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.SliderItemDTO;
import com.tathanhloc.youthkgu.Model.SliderItem;
import com.tathanhloc.youthkgu.Repository.SliderItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SliderItemService {

    private final SliderItemRepository repo;

    // ── Public ──────────────────────────────────────────────────────────────────

    public List<SliderItemDTO> getActive() {
        return repo.findAllActive()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────────

    public List<SliderItemDTO> getAll() {
        return repo.findAllOrdered()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public SliderItemDTO create(SliderItemDTO dto) {
        SliderItem item = SliderItem.builder()
                .tieuDe(dto.getTieuDe())
                .moTa(dto.getMoTa())
                .hinhAnh(dto.getHinhAnh())
                .duongDan(dto.getDuongDan())
                .thuTu(dto.getThuTu())
                .isActive(Boolean.TRUE.equals(dto.getIsActive()))
                .build();
        return toDTO(repo.save(item));
    }

    @Transactional
    public SliderItemDTO update(Long id, SliderItemDTO dto) {
        SliderItem item = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Slider item không tồn tại: " + id));
        item.setTieuDe(dto.getTieuDe());
        item.setMoTa(dto.getMoTa());
        item.setHinhAnh(dto.getHinhAnh());
        item.setDuongDan(dto.getDuongDan());
        item.setThuTu(dto.getThuTu());
        item.setActive(Boolean.TRUE.equals(dto.getIsActive()));
        return toDTO(repo.save(item));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Transactional
    public void reorder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            final int order = i;
            repo.findById(ids.get(i)).ifPresent(item -> {
                item.setThuTu(order);
                repo.save(item);
            });
        }
    }

    // ── Mapping ──────────────────────────────────────────────────────────────────

    private SliderItemDTO toDTO(SliderItem item) {
        return SliderItemDTO.builder()
                .id(item.getId())
                .tieuDe(item.getTieuDe())
                .moTa(item.getMoTa())
                .hinhAnh(item.getHinhAnh())
                .duongDan(item.getDuongDan())
                .thuTu(item.getThuTu())
                .isActive(item.isActive())   // boolean → Boolean autobox OK
                .build();
    }
}
