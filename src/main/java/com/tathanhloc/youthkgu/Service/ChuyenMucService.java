package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChuyenMucDTO;
import com.tathanhloc.youthkgu.DTO.ChuyenMucTreeDTO;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.Ban;
import com.tathanhloc.youthkgu.Model.ChuyenMuc;
import com.tathanhloc.youthkgu.Model.UrlRedirect;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Quản lý danh mục bài viết (cây N cấp — Adjacency List).
 * CM-001: Khi đổi tên → cascade recalculate slug + full_path_slug + insert url_redirect toàn subtree.
 * CM-002: Không cho xóa nếu còn tin_tuc hoặc van_ban đang dùng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChuyenMucService {

    private final ChuyenMucRepository repo;
    private final TinTucRepository tinTucRepo;
    private final VanBanRepository vanBanRepo;
    private final UrlRedirectRepository redirectRepo;
    private final BanRepository banRepo;
    private final SlugService slugService;

    // ── Queries ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChuyenMucDTO> getAll() {
        return repo.findByParentIsNullAndIsDeletedFalseOrderByThuTuAsc().stream()
                .flatMap(root -> flattenTree(root).stream())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChuyenMucTreeDTO> getTree() {
        List<ChuyenMuc> roots = repo.findByParentIsNullAndIsDeletedFalseOrderByThuTuAsc();
        return roots.stream().map(this::toTreeDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChuyenMucDTO getById(Long id) {
        return toDTO(findById(id));
    }

    // ── Create ──────────────────────────────────────────────────────────────────

    public ChuyenMucDTO create(ChuyenMucDTO dto) {
        ChuyenMuc parent = null;
        String parentFullPath = "";
        String parentDuongDan = "";
        int cap = 1;

        if (dto.getParentId() != null) {
            parent = findById(dto.getParentId());
            parentFullPath = parent.getFullPathSlug() + "/";
            parentDuongDan = parent.getDuongDan() + "/";
            cap = parent.getCap() + 1;
        }

        String baseSlug = slugService.truncateSlug(slugService.toSlug(dto.getTen()), 80);
        String slug = slugService.ensureUnique(baseSlug, s -> repo.existsBySlug(s));
        String fullPathSlug = parentFullPath + slug;

        Ban ban = resolveBan(dto.getBanId());

        ChuyenMuc saved = repo.save(ChuyenMuc.builder()
                .ten(dto.getTen())
                .slug(slug)
                .fullPathSlug(fullPathSlug)
                .duongDan(parentDuongDan + "PLACEHOLDER") // sẽ cập nhật sau khi có ID
                .parent(parent)
                .cap(cap)
                .moTa(dto.getMoTa())
                .mauSac(dto.getMauSac())
                .icon(dto.getIcon())
                .toChuc(dto.getToChuc() != null
                        ? com.tathanhloc.youthkgu.Enum.ToChucEnum.valueOf(dto.getToChuc()) : null)
                .ban(ban)
                .thuTu(dto.getThuTu() != null ? dto.getThuTu() : 0)
                .isActive(true)
                .isDeleted(false)
                .build());

        // Cập nhật duongDan với ID thực
        String duongDan = (parent != null ? parent.getDuongDan() + "/" : "") + saved.getId();
        saved.setDuongDan(duongDan);
        repo.save(saved);

        log.info("Created ChuyenMuc id={} slug={}", saved.getId(), fullPathSlug);
        return toDTO(saved);
    }

    // ── Update (CM-001) ─────────────────────────────────────────────────────────

    public ChuyenMucDTO update(Long id, ChuyenMucDTO dto) {
        ChuyenMuc cm = findById(id);
        String oldFullPath = cm.getFullPathSlug();

        cm.setTen(dto.getTen());
        cm.setMoTa(dto.getMoTa());
        cm.setMauSac(dto.getMauSac());
        cm.setIcon(dto.getIcon());
        cm.setThuTu(dto.getThuTu() != null ? dto.getThuTu() : cm.getThuTu());
        cm.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : cm.getIsActive());
        cm.setBan(resolveBan(dto.getBanId()));
        if (dto.getToChuc() != null) {
            cm.setToChuc(com.tathanhloc.youthkgu.Enum.ToChucEnum.valueOf(dto.getToChuc()));
        }

        // Tính slug mới
        String newSlug = slugService.ensureUnique(
                slugService.truncateSlug(slugService.toSlug(dto.getTen()), 80),
                s -> repo.existsBySlugAndIdNot(s, id)
        );
        cm.setSlug(newSlug);

        // Tính fullPathSlug mới
        String newFullPath = cm.getParent() != null
                ? cm.getParent().getFullPathSlug() + "/" + newSlug
                : newSlug;
        cm.setFullPathSlug(newFullPath);
        repo.save(cm);

        // CM-001: nếu đường dẫn thay đổi → insert redirect + cascade update subtree
        if (!oldFullPath.equals(newFullPath)) {
            log.info("ChuyenMuc id={} path changed: {} → {}", id, oldFullPath, newFullPath);
            saveRedirect(oldFullPath, newFullPath, "Đổi tên chuyên mục id=" + id);
            cascadeUpdateChildren(cm, newFullPath, cm.getDuongDan());
        }

        return toDTO(cm);
    }

    // ── Delete (CM-002) ─────────────────────────────────────────────────────────

    public void delete(Long id) {
        ChuyenMuc cm = findById(id);

        // CM-002: kiểm tra còn bài viết hay văn bản sử dụng
        if (tinTucRepo.existsByChuyenMucIdAndIsDeletedFalse(id)) {
            throw new BusinessException("CM_HAS_TINTUC",
                    "Không thể xóa chuyên mục còn bài viết đang dùng");
        }
        if (vanBanRepo.existsByChuyenMucIdAndIsDeletedFalse(id)) {
            throw new BusinessException("CM_HAS_VANBAN",
                    "Không thể xóa chuyên mục còn văn bản đang dùng");
        }
        if (repo.existsByParentIdAndIsDeletedFalse(id)) {
            throw new BusinessException("CM_HAS_CHILDREN",
                    "Không thể xóa chuyên mục còn danh mục con");
        }

        cm.setIsDeleted(true);
        repo.save(cm);
        log.info("Soft-deleted ChuyenMuc id={}", id);
    }

    // ── Cascade helpers ─────────────────────────────────────────────────────────

    private void cascadeUpdateChildren(ChuyenMuc parent, String parentFullPath, String parentDuongDan) {
        List<ChuyenMuc> children = repo.findByParentIdAndIsDeletedFalseOrderByThuTuAsc(parent.getId());
        for (ChuyenMuc child : children) {
            String oldChildPath = child.getFullPathSlug();
            String newChildPath = parentFullPath + "/" + child.getSlug();
            String newDuongDan  = parentDuongDan + "/" + child.getId();

            child.setFullPathSlug(newChildPath);
            child.setDuongDan(newDuongDan);
            repo.save(child);

            saveRedirect(oldChildPath, newChildPath, "Cascade update từ parent id=" + parent.getId());

            // Cập nhật full_url_path tất cả bài viết trong chuyên mục này
            tinTucRepo.updateFullUrlPathByChuyenMucId(child.getId(), oldChildPath, newChildPath);

            // Đệ quy xuống con
            cascadeUpdateChildren(child, newChildPath, newDuongDan);
        }
    }

    private void saveRedirect(String urlCu, String urlMoi, String lyDo) {
        // Upsert — nếu đã tồn tại redirect cũ → update urlMoi
        redirectRepo.findByUrlCu(urlCu).ifPresentOrElse(
                existing -> {
                    existing.setUrlMoi(urlMoi);
                    redirectRepo.save(existing);
                },
                () -> redirectRepo.save(UrlRedirect.builder()
                        .urlCu(urlCu).urlMoi(urlMoi).kieu(301).lyDo(lyDo).build())
        );
    }

    // ── Mapping ─────────────────────────────────────────────────────────────────

    public ChuyenMucDTO toDTO(ChuyenMuc cm) {
        return ChuyenMucDTO.builder()
                .id(cm.getId())
                .ten(cm.getTen())
                .slug(cm.getSlug())
                .fullPathSlug(cm.getFullPathSlug())
                .duongDan(cm.getDuongDan())
                .parentId(cm.getParent() != null ? cm.getParent().getId() : null)
                .tenParent(cm.getParent() != null ? cm.getParent().getTen() : null)
                .cap(cm.getCap())
                .moTa(cm.getMoTa())
                .mauSac(cm.getMauSac())
                .icon(cm.getIcon())
                .toChuc(cm.getToChuc() != null ? cm.getToChuc().name() : null)
                .banId(cm.getBan() != null ? cm.getBan().getMaBan() : null)
                .tenBan(cm.getBan() != null ? cm.getBan().getTenBan() : null)
                .thuTu(cm.getThuTu())
                .isActive(cm.getIsActive())
                .createdAt(cm.getCreatedAt())
                .updatedAt(cm.getUpdatedAt())
                .build();
    }

    private ChuyenMucTreeDTO toTreeDTO(ChuyenMuc cm) {
        List<ChuyenMucTreeDTO> childDTOs = repo
                .findByParentIdAndIsDeletedFalseOrderByThuTuAsc(cm.getId())
                .stream()
                .map(this::toTreeDTO)
                .collect(Collectors.toList());

        return ChuyenMucTreeDTO.builder()
                .id(cm.getId())
                .ten(cm.getTen())
                .slug(cm.getSlug())
                .fullPathSlug(cm.getFullPathSlug())
                .mauSac(cm.getMauSac())
                .icon(cm.getIcon())
                .toChuc(cm.getToChuc() != null ? cm.getToChuc().name() : null)
                .cap(cm.getCap())
                .thuTu(cm.getThuTu())
                .isActive(cm.getIsActive())
                .children(childDTOs)
                .build();
    }

    // ── Internal helpers ─────────────────────────────────────────────────────────

    private ChuyenMuc findById(Long id) {
        return repo.findById(id)
                .filter(cm -> !Boolean.TRUE.equals(cm.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Chuyên mục không tồn tại: " + id));
    }

    private Ban resolveBan(String banId) {
        if (banId == null || banId.isBlank()) return null;
        return banRepo.findById(banId).orElse(null);
    }

    private List<ChuyenMuc> flattenTree(ChuyenMuc node) {
        List<ChuyenMuc> result = new ArrayList<>();
        result.add(node);
        repo.findByParentIdAndIsDeletedFalseOrderByThuTuAsc(node.getId())
                .forEach(child -> result.addAll(flattenTree(child)));
        return result;
    }
}
