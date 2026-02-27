package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.TrangThaiTinTuc;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Quản lý bài đăng tin tức eNews.
 * TT-001: hoat_dong_id phải tồn tại trong hoat_dong nếu không NULL.
 * TT-002: khi PUBLISHED → tự động set ngay_xuat_ban = NOW().
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TinTucService {

    private final TinTucRepository repo;
    private final ChuyenMucRepository chuyenMucRepo;
    private final VanBanRepository vanBanRepo;
    private final HoatDongRepository hoatDongRepo;
    private final UrlRedirectRepository redirectRepo;
    private final SlugService slugService;
    private final FileStorageService fileStorageService;
    private final ChuyenMucService chuyenMucService;

    // ── Public queries ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TinTucDTO> getDanhSachPublic(Long chuyenMucId, String keyword, Pageable pageable) {
        if (chuyenMucId != null) {
            ChuyenMuc cm = chuyenMucRepo.findById(chuyenMucId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chuyên mục không tồn tại"));
            String pathPrefix = cm.getDuongDan();

            if (keyword != null && !keyword.isBlank()) {
                return repo.findByChuyenMucSubtreeAndKeyword(
                        pathPrefix, TrangThaiTinTuc.PUBLISHED, keyword, pageable).map(this::toDTO);
            }
            return repo.findByChuyenMucSubtree(
                    pathPrefix, TrangThaiTinTuc.PUBLISHED, pageable).map(this::toDTO);
        }
        // Không filter theo chuyên mục — tất cả PUBLISHED
        return repo.findByChuyenMucSubtree("", TrangThaiTinTuc.PUBLISHED, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public TinTucDetailDTO getDetailPublic(Long id) {
        TinTuc t = repo.findById(id)
                .filter(tt -> tt.getTrangThai() == TrangThaiTinTuc.PUBLISHED
                           && !Boolean.TRUE.equals(tt.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));

        // Tăng lượt xem
        repo.findById(id).ifPresent(tt -> { tt.setLuotXem(tt.getLuotXem() + 1); repo.save(tt); });

        return toDetailDTO(t);
    }

    // ── Management queries ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TinTucDTO> getDanhSach(String username, boolean isAdmin, Pageable pageable) {
        if (isAdmin) {
            return repo.findByIsDeletedFalseOrderByCreatedAtDesc(pageable).map(this::toDTO);
        }
        return repo.findByNguoiTaoAndIsDeletedFalseOrderByCreatedAtDesc(username, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public TinTucDetailDTO getById(Long id) {
        return toDetailDTO(findById(id));
    }

    // ── Create ──────────────────────────────────────────────────────────────────

    public TinTucDTO create(TinTucDTO dto, String username) {
        ChuyenMuc cm = chuyenMucRepo.findById(dto.getChuyenMucId())
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Chuyên mục không tồn tại"));

        // Sinh slug + fullUrlPath
        String baseSlug = slugService.truncateSlug(slugService.toSlug(dto.getTieuDe()), 80);
        String slug = slugService.ensureUnique(baseSlug,
                s -> repo.existsByFullUrlPath(cm.getFullPathSlug() + "/" + s));
        String fullUrlPath = cm.getFullPathSlug() + "/" + slug;

        TinTuc.TinTucBuilder builder = TinTuc.builder()
                .tieuDe(dto.getTieuDe())
                .slug(slug)
                .fullUrlPath(fullUrlPath)
                .tomTat(dto.getTomTat())
                .noiDung(dto.getNoiDung())
                .anhDaiDien(dto.getAnhDaiDien())
                .chuyenMuc(cm)
                .trangThai(TrangThaiTinTuc.DRAFT)
                .isGhim(Boolean.TRUE.equals(dto.getIsGhim()))
                .nguoiTao(username)
                .donViDang(dto.getDonViDang())
                .luotXem(0)
                .isDeleted(false);

        // TT-001: validate hoat_dong_id
        if (dto.getHoatDongId() != null && !dto.getHoatDongId().isBlank()) {
            if (!hoatDongRepo.existsById(dto.getHoatDongId())) {
                throw new BusinessException("HOAT_DONG_NOT_FOUND",
                        "Hoạt động không tồn tại: " + dto.getHoatDongId());
            }
            builder.hoatDongId(dto.getHoatDongId());
        }

        // Link văn bản
        if (dto.getVanBanId() != null) {
            VanBan vb = vanBanRepo.findByIdAndIsDeletedFalse(dto.getVanBanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Văn bản không tồn tại"));
            builder.vanBan(vb);
        }

        TinTuc saved = repo.save(builder.build());
        log.info("Created TinTuc id={} by {}", saved.getId(), username);
        return toDTO(saved);
    }

    // ── Update ──────────────────────────────────────────────────────────────────

    public TinTucDTO update(Long id, TinTucDTO dto, String username) {
        TinTuc t = findById(id);

        if (t.getTrangThai() == TrangThaiTinTuc.ARCHIVED) {
            throw new BusinessException("TT_ARCHIVED", "Không thể sửa bài đã lưu trữ");
        }

        t.setTieuDe(dto.getTieuDe());
        t.setTomTat(dto.getTomTat());
        t.setNoiDung(dto.getNoiDung());
        t.setAnhDaiDien(dto.getAnhDaiDien());
        t.setDonViDang(dto.getDonViDang());
        if (dto.getIsGhim() != null) t.setIsGhim(dto.getIsGhim());

        // Đổi chuyên mục → cần đổi fullUrlPath
        if (dto.getChuyenMucId() != null
                && !dto.getChuyenMucId().equals(t.getChuyenMuc().getId())) {
            ChuyenMuc newCm = chuyenMucRepo.findById(dto.getChuyenMucId())
                    .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                    .orElseThrow(() -> new ResourceNotFoundException("Chuyên mục không tồn tại"));
            String oldPath = t.getFullUrlPath();
            String newFullPath = newCm.getFullPathSlug() + "/" + t.getSlug();

            // Upsert redirect
            redirectRepo.findByUrlCu(oldPath).ifPresentOrElse(
                    r -> { r.setUrlMoi(newFullPath); redirectRepo.save(r); },
                    () -> redirectRepo.save(UrlRedirect.builder()
                            .urlCu(oldPath).urlMoi(newFullPath).kieu(301)
                            .lyDo("Đổi chuyên mục bài id=" + id).build())
            );

            t.setChuyenMuc(newCm);
            t.setFullUrlPath(newFullPath);
        }

        // TT-001: validate hoat_dong_id
        if (dto.getHoatDongId() != null && !dto.getHoatDongId().isBlank()) {
            if (!hoatDongRepo.existsById(dto.getHoatDongId())) {
                throw new BusinessException("HOAT_DONG_NOT_FOUND",
                        "Hoạt động không tồn tại: " + dto.getHoatDongId());
            }
            t.setHoatDongId(dto.getHoatDongId());
        }

        // Link văn bản
        if (dto.getVanBanId() != null) {
            VanBan vb = vanBanRepo.findByIdAndIsDeletedFalse(dto.getVanBanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Văn bản không tồn tại"));
            t.setVanBan(vb);
        } else {
            t.setVanBan(null);
        }

        repo.save(t);
        log.info("Updated TinTuc id={} by {}", id, username);
        return toDTO(t);
    }

    // ── State transitions ────────────────────────────────────────────────────────

    /** TT-002: set ngayXuatBan = NOW() khi publish */
    public TinTucDTO publish(Long id) {
        TinTuc t = findById(id);
        t.setTrangThai(TrangThaiTinTuc.PUBLISHED);
        t.setNgayXuatBan(LocalDateTime.now());
        repo.save(t);
        log.info("Published TinTuc id={}", id);
        return toDTO(t);
    }

    public TinTucDTO archive(Long id) {
        TinTuc t = findById(id);
        t.setTrangThai(TrangThaiTinTuc.ARCHIVED);
        repo.save(t);
        log.info("Archived TinTuc id={}", id);
        return toDTO(t);
    }

    public void delete(Long id) {
        TinTuc t = findById(id);
        t.setIsDeleted(true);
        repo.save(t);
        log.info("Soft-deleted TinTuc id={}", id);
    }

    // ── Upload ảnh ──────────────────────────────────────────────────────────────

    public TinTucAnhDTO uploadAnh(Long tinTucId, MultipartFile file, String username) {
        TinTuc t = findById(tinTucId);
        String duongDan = fileStorageService.saveNewsImage(file);

        TinTucAnh anh = TinTucAnh.builder()
                .tinTuc(t)
                .duongDan(duongDan)
                .tenFileGoc(file.getOriginalFilename())
                .thuTu(t.getAnhList() != null ? t.getAnhList().size() : 0)
                .build();

        log.info("Uploaded image for TinTuc id={} by {}", tinTucId, username);
        return toAnhDTO(anh);
    }

    // ── Resolve URL (public endpoint) ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResolveResultDTO resolve(String path) {
        // 1. Kiểm tra redirect
        var redirect = redirectRepo.findByUrlCu(path);
        if (redirect.isPresent()) {
            return ResolveResultDTO.builder()
                    .type("REDIRECT")
                    .redirectTo(redirect.get().getUrlMoi())
                    .build();
        }

        // 2. Kiểm tra bài viết
        var tinTuc = repo.findByFullUrlPathAndTrangThaiAndIsDeletedFalse(
                path, TrangThaiTinTuc.PUBLISHED);
        if (tinTuc.isPresent()) {
            TinTuc t = tinTuc.get();
            t.setLuotXem(t.getLuotXem() + 1);
            repo.save(t);
            return ResolveResultDTO.builder()
                    .type("POST")
                    .post(toDetailDTO(t))
                    .build();
        }

        // 3. Kiểm tra chuyên mục
        var chuyenMuc = chuyenMucRepo.findByFullPathSlugAndIsDeletedFalse(path);
        if (chuyenMuc.isPresent()) {
            ChuyenMuc cm = chuyenMuc.get();
            Page<TinTuc> page = repo.findByChuyenMucSubtree(
                    cm.getDuongDan(), TrangThaiTinTuc.PUBLISHED, PageRequest.of(0, 10));
            return ResolveResultDTO.builder()
                    .type("CATEGORY")
                    .category(chuyenMucService.toDTO(cm))
                    .posts(page.getContent().stream().map(this::toDTO).collect(Collectors.toList()))
                    .totalPosts(page.getTotalElements())
                    .build();
        }

        return ResolveResultDTO.builder().type("NOT_FOUND").build();
    }

    // ── Mapping ─────────────────────────────────────────────────────────────────

    public TinTucDTO toDTO(TinTuc t) {
        return TinTucDTO.builder()
                .id(t.getId())
                .tieuDe(t.getTieuDe())
                .slug(t.getSlug())
                .fullUrlPath(t.getFullUrlPath())
                .tomTat(t.getTomTat())
                .anhDaiDien(t.getAnhDaiDien())
                .chuyenMucId(t.getChuyenMuc() != null ? t.getChuyenMuc().getId() : null)
                .tenChuyenMuc(t.getChuyenMuc() != null ? t.getChuyenMuc().getTen() : null)
                .vanBanId(t.getVanBan() != null ? t.getVanBan().getId() : null)
                .hoatDongId(t.getHoatDongId())
                .trangThai(t.getTrangThai() != null ? t.getTrangThai().name() : null)
                .isGhim(t.getIsGhim())
                .nguoiTao(t.getNguoiTao())
                .donViDang(t.getDonViDang())
                .luotXem(t.getLuotXem())
                .ngayXuatBan(t.getNgayXuatBan())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TinTucDetailDTO toDetailDTO(TinTuc t) {
        return TinTucDetailDTO.builder()
                .id(t.getId())
                .tieuDe(t.getTieuDe())
                .tomTat(t.getTomTat())
                .noiDung(t.getNoiDung())
                .anhDaiDien(t.getAnhDaiDien())
                .trangThai(t.getTrangThai() != null ? t.getTrangThai().name() : null)
                .ngayXuatBan(t.getNgayXuatBan())
                .nguoiTao(t.getNguoiTao())
                .donViDang(t.getDonViDang())
                .luotXem(t.getLuotXem())
                .fullUrlPath(t.getFullUrlPath())
                .chuyenMuc(t.getChuyenMuc() != null ? chuyenMucService.toDTO(t.getChuyenMuc()) : null)
                .breadcrumb(buildBreadcrumb(t.getChuyenMuc()))
                .hoatDongId(t.getHoatDongId())
                .anhList(t.getAnhList() != null
                        ? t.getAnhList().stream().map(this::toAnhDTO).collect(Collectors.toList())
                        : Collections.emptyList())
                .build();
    }

    private TinTucAnhDTO toAnhDTO(TinTucAnh a) {
        return TinTucAnhDTO.builder()
                .id(a.getId())
                .duongDan(a.getDuongDan())
                .tenFileGoc(a.getTenFileGoc())
                .moTa(a.getMoTa())
                .thuTu(a.getThuTu())
                .ngayUpload(a.getNgayUpload())
                .build();
    }

    /** Build breadcrumb từ node lá lên root */
    private List<ChuyenMucDTO> buildBreadcrumb(ChuyenMuc cm) {
        List<ChuyenMucDTO> breadcrumb = new ArrayList<>();
        ChuyenMuc current = cm;
        while (current != null) {
            breadcrumb.add(0, chuyenMucService.toDTO(current));
            current = current.getParent();
        }
        return breadcrumb;
    }

    private TinTuc findById(Long id) {
        return repo.findById(id)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại: " + id));
    }
}
