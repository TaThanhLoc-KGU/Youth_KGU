package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ReactionSummaryDTO;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.TinTuc;
import com.tathanhloc.youthkgu.Model.TinTucLuotThich;
import com.tathanhloc.youthkgu.Repository.TinTucLuotThichRepository;
import com.tathanhloc.youthkgu.Repository.TinTucRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Lượt thích (toggle, dedup theo username hoặc device_id ẩn danh) và lượt chia sẻ
 * (chỉ tăng đếm, không cần định danh) của bài viết eNews.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TinTucTuongTacService {

    private final TinTucRepository tinTucRepo;
    private final TinTucLuotThichRepository luotThichRepo;

    @Transactional(readOnly = true)
    public ReactionSummaryDTO getReactionSummary(Long tinTucId, String username, String deviceId) {
        TinTuc t = loadTinTuc(tinTucId);
        boolean daThich = findExisting(tinTucId, username, deviceId).isPresent();
        return toSummary(t, daThich);
    }

    /** Toggle thích/bỏ thích. username ưu tiên nếu đã đăng nhập, ngược lại dùng deviceId. */
    public ReactionSummaryDTO toggleLike(Long tinTucId, String username, String deviceId) {
        TinTuc t = loadTinTuc(tinTucId);
        Optional<TinTucLuotThich> existing = findExisting(tinTucId, username, deviceId);

        boolean daThich;
        if (existing.isPresent()) {
            luotThichRepo.delete(existing.get());
            tinTucRepo.decrementLuotThich(tinTucId);
            daThich = false;
        } else {
            luotThichRepo.save(TinTucLuotThich.builder()
                    .tinTuc(t)
                    .username(username)
                    .deviceId(username == null ? deviceId : null)
                    .build());
            tinTucRepo.incrementLuotThich(tinTucId);
            daThich = true;
        }

        TinTuc refreshed = loadTinTuc(tinTucId);
        return toSummary(refreshed, daThich);
    }

    public int recordShare(Long tinTucId) {
        loadTinTuc(tinTucId);
        tinTucRepo.incrementLuotChiaSe(tinTucId);
        return loadTinTuc(tinTucId).getLuotChiaSe();
    }

    private Optional<TinTucLuotThich> findExisting(Long tinTucId, String username, String deviceId) {
        if (username != null) {
            return luotThichRepo.findByTinTucIdAndUsername(tinTucId, username);
        }
        if (deviceId != null && !deviceId.isBlank()) {
            return luotThichRepo.findByTinTucIdAndDeviceId(tinTucId, deviceId);
        }
        return Optional.empty();
    }

    private TinTuc loadTinTuc(Long id) {
        return tinTucRepo.findById(id)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại: " + id));
    }

    private ReactionSummaryDTO toSummary(TinTuc t, boolean daThich) {
        return ReactionSummaryDTO.builder()
                .luotThich(t.getLuotThich())
                .luotBinhLuan(t.getLuotBinhLuan())
                .luotChiaSe(t.getLuotChiaSe())
                .daThich(daThich)
                .khoaBinhLuan(Boolean.TRUE.equals(t.getKhoaBinhLuan()))
                .build();
    }
}
