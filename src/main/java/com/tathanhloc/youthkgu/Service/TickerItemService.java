package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.TickerItemDTO;
import com.tathanhloc.youthkgu.Model.TickerItem;
import com.tathanhloc.youthkgu.Repository.TickerItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TickerItemService {

    private final TickerItemRepository repo;

    // ── Public ──────────────────────────────────────────────────────────────────

    public List<TickerItemDTO> getActive() {
        return repo.findAllActive()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────────

    public List<TickerItemDTO> getAll() {
        return repo.findAllOrdered()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public TickerItemDTO create(TickerItemDTO dto) {
        TickerItem item = TickerItem.builder()
                .noiDung(dto.getNoiDung())
                .duongDan(dto.getDuongDan())
                .thuTu(dto.getThuTu())
                .isActive(Boolean.TRUE.equals(dto.getIsActive()))
                .build();
        return toDTO(repo.save(item));
    }

    @Transactional
    public TickerItemDTO update(Long id, TickerItemDTO dto) {
        TickerItem item = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticker item không tồn tại: " + id));
        item.setNoiDung(dto.getNoiDung());
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

    private TickerItemDTO toDTO(TickerItem item) {
        return TickerItemDTO.builder()
                .id(item.getId())
                .noiDung(item.getNoiDung())
                .duongDan(item.getDuongDan())
                .thuTu(item.getThuTu())
                .isActive(item.isActive())   // boolean → Boolean autobox OK
                .build();
    }
}
