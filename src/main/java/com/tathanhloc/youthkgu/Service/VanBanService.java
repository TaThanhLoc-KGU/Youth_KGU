package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.FileUploadResult;
import com.tathanhloc.youthkgu.DTO.VanBanDTO;
import com.tathanhloc.youthkgu.DTO.VanBanSearchResultDTO;
import com.tathanhloc.youthkgu.Enum.TrangThaiVanBan;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.ChuyenMuc;
import com.tathanhloc.youthkgu.Model.VanBan;
import com.tathanhloc.youthkgu.Model.VanBanFile;
import com.tathanhloc.youthkgu.Repository.ChuyenMucRepository;
import com.tathanhloc.youthkgu.Repository.VanBanFileRepository;
import com.tathanhloc.youthkgu.Repository.VanBanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Quản lý kho văn bản / kế hoạch.
 * VB-001: PUBLISHED → bất biến (không sửa, không thay file).
 * VB-002: mỗi VanBan chỉ có đúng 1 bản ghi trong van_ban_file.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VanBanService {

    private final VanBanRepository repo;
    private final VanBanFileRepository fileRepo;
    private final ChuyenMucRepository chuyenMucRepo;
    private final SlugService slugService;
    private final FileStorageService fileStorageService;

    // ── Queries ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<VanBanDTO> getDanhSachPublic(String loai, Pageable pageable) {
        com.tathanhloc.youthkgu.Enum.LoaiVanBan loaiEnum = null;
        if (loai != null && !loai.isBlank()) {
            try {
                loaiEnum = com.tathanhloc.youthkgu.Enum.LoaiVanBan.valueOf(loai);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("INVALID_LOAI", "Loại văn bản không hợp lệ: " + loai);
            }
        }
        return repo.findPublic(TrangThaiVanBan.PUBLISHED, loaiEnum, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<VanBanDTO> getDanhSach(Pageable pageable) {
        return repo.findByIsDeletedFalseOrderByCreatedAtDesc(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public VanBanDTO getById(Long id) {
        return toDTO(findById(id));
    }

    // ── Search cho autocomplete ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VanBanSearchResultDTO> search(String keyword) {
        return repo.searchForAutocomplete(keyword, PageRequest.of(0, 10))
                .stream()
                .map(vb -> VanBanSearchResultDTO.builder()
                        .id(vb.getId())
                        .soHieu(vb.getSoHieu())
                        .trichYeu(vb.getTrichYeu())
                        .ngayBanHanh(vb.getNgayBanHanh())
                        .loaiVanBan(vb.getLoaiVanBan() != null ? vb.getLoaiVanBan().name() : null)
                        .tenFile(vb.getFile() != null ? vb.getFile().getTenHienThi() : null)
                        .kichThuocFile(vb.getFile() != null ? vb.getFile().getKichThuoc() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // ── Create ──────────────────────────────────────────────────────────────────

    public VanBanDTO create(VanBanDTO dto, MultipartFile file, String username) {
        String baseSlug = slugService.truncateSlug(
                slugService.toSlug((dto.getSoHieu() != null ? dto.getSoHieu() + " " : "") + dto.getTrichYeu()), 80);
        String slug = slugService.ensureUnique(baseSlug,
                s -> repo.findAll().stream().anyMatch(v -> s.equals(v.getSlug())));

        ChuyenMuc cm = resolveChuyenMuc(dto.getChuyenMucId());
        String fullUrlPath = buildFullUrlPath(cm, slug);

        VanBan vb = repo.save(VanBan.builder()
                .soHieu(dto.getSoHieu())
                .trichYeu(dto.getTrichYeu())
                .slug(slug)
                .fullUrlPath(fullUrlPath)
                .loaiVanBan(com.tathanhloc.youthkgu.Enum.LoaiVanBan.valueOf(dto.getLoaiVanBan()))
                .chuyenMuc(cm)
                .coQuanBanHanh(dto.getCoQuanBanHanh())
                .nguoiKy(dto.getNguoiKy())
                .ngayBanHanh(dto.getNgayBanHanh())
                .ngayHieuLuc(dto.getNgayHieuLuc())
                .ngayHetHan(dto.getNgayHetHan())
                .hoatDongId(dto.getHoatDongId())
                .nguoiDang(username)
                .donViDang(dto.getDonViDang())
                .isDeleted(false)
                .build());

        // Upload file nếu có
        if (file != null && !file.isEmpty()) {
            saveFile(vb, file, username);
        }

        log.info("Created VanBan id={} by {}", vb.getId(), username);
        return toDTO(repo.findById(vb.getId()).orElse(vb));
    }

    // ── Update (VB-001) ─────────────────────────────────────────────────────────

    public VanBanDTO update(Long id, VanBanDTO dto) {
        VanBan vb = findById(id);

        // VB-001: PUBLISHED → bất biến
        if (vb.getTrangThai() == TrangThaiVanBan.PUBLISHED) {
            throw new BusinessException("VB_IMMUTABLE",
                    "Văn bản đã ban hành không thể chỉnh sửa. Nếu cần sửa đổi, hãy tạo văn bản mới.");
        }

        vb.setSoHieu(dto.getSoHieu());
        vb.setTrichYeu(dto.getTrichYeu());
        vb.setCoQuanBanHanh(dto.getCoQuanBanHanh());
        vb.setNguoiKy(dto.getNguoiKy());
        vb.setNgayBanHanh(dto.getNgayBanHanh());
        vb.setNgayHieuLuc(dto.getNgayHieuLuc());
        vb.setNgayHetHan(dto.getNgayHetHan());
        vb.setHoatDongId(dto.getHoatDongId());
        vb.setDonViDang(dto.getDonViDang());

        if (dto.getLoaiVanBan() != null) {
            vb.setLoaiVanBan(com.tathanhloc.youthkgu.Enum.LoaiVanBan.valueOf(dto.getLoaiVanBan()));
        }
        if (dto.getChuyenMucId() != null) {
            vb.setChuyenMuc(resolveChuyenMuc(dto.getChuyenMucId()));
        }

        repo.save(vb);
        log.info("Updated VanBan id={}", id);
        return toDTO(vb);
    }

    // ── Publish (VB-001: sau đó bất biến) ──────────────────────────────────────

    public VanBanDTO publish(Long id) {
        VanBan vb = findById(id);
        if (vb.getTrangThai() == TrangThaiVanBan.PUBLISHED) {
            throw new BusinessException("VB_ALREADY_PUBLISHED", "Văn bản đã được ban hành.");
        }
        vb.setTrangThai(TrangThaiVanBan.PUBLISHED);
        repo.save(vb);
        log.info("Published VanBan id={}", id);
        return toDTO(vb);
    }

    // ── Upload / thay thế file (VB-001 + VB-002) ────────────────────────────────

    public void uploadFile(Long vanBanId, MultipartFile file, String username) {
        VanBan vb = findById(vanBanId);

        // VB-001: không cho upload khi đã PUBLISHED
        if (vb.getTrangThai() == TrangThaiVanBan.PUBLISHED) {
            throw new BusinessException("VB_IMMUTABLE",
                    "Không thể thay thế file của văn bản đã ban hành.");
        }

        // VB-002: xóa file cũ trước khi upload mới
        fileRepo.findByVanBanId(vanBanId).ifPresent(old -> {
            fileStorageService.deleteFile(old.getDuongDan());
            fileRepo.delete(old);
        });

        saveFile(vb, file, username);
        log.info("Replaced file for VanBan id={} by {}", vanBanId, username);
    }

    // ── Delete ──────────────────────────────────────────────────────────────────

    public void delete(Long id) {
        VanBan vb = findById(id);
        vb.setIsDeleted(true);
        repo.save(vb);
        log.info("Soft-deleted VanBan id={}", id);
    }

    // ── Download / xem online ────────────────────────────────────────────────────

    @Transactional
    public Resource getFileForDownload(Long id, boolean incrementLuotTai) {
        VanBan vb = findById(id);
        VanBanFile f = fileRepo.findByVanBanId(id)
                .orElseThrow(() -> new ResourceNotFoundException("File không tồn tại cho văn bản id=" + id));

        if (incrementLuotTai) {
            vb.setLuotTai(vb.getLuotTai() + 1);
            repo.save(vb);
        } else {
            vb.setLuotXem(vb.getLuotXem() + 1);
            repo.save(vb);
        }

        return fileStorageService.loadAsResource(f.getDuongDan());
    }

    public VanBanFile getFileEntity(Long vanBanId) {
        return fileRepo.findByVanBanId(vanBanId)
                .orElseThrow(() -> new ResourceNotFoundException("File không tồn tại cho văn bản id=" + vanBanId));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private void saveFile(VanBan vb, MultipartFile file, String username) {
        FileUploadResult result = fileStorageService.saveVanBanFile(file);
        fileRepo.save(VanBanFile.builder()
                .vanBan(vb)
                .tenFileGoc(file.getOriginalFilename())
                .tenHienThi(file.getOriginalFilename())
                .duongDan(result.getDuongDan())
                .loaiFile(result.getLoaiFile())
                .kichThuoc(file.getSize())
                .nguoiUpload(username)
                .build());
    }

    private ChuyenMuc resolveChuyenMuc(Long id) {
        if (id == null) return null;
        return chuyenMucRepo.findById(id)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElse(null);
    }

    private String buildFullUrlPath(ChuyenMuc cm, String slug) {
        return (cm != null ? cm.getFullPathSlug() + "/" : "van-ban/") + slug;
    }

    // ── Mapping ─────────────────────────────────────────────────────────────────

    public VanBanDTO toDTO(VanBan vb) {
        VanBanFile f = vb.getFile();
        return VanBanDTO.builder()
                .id(vb.getId())
                .soHieu(vb.getSoHieu())
                .trichYeu(vb.getTrichYeu())
                .slug(vb.getSlug())
                .fullUrlPath(vb.getFullUrlPath())
                .loaiVanBan(vb.getLoaiVanBan() != null ? vb.getLoaiVanBan().name() : null)
                .chuyenMucId(vb.getChuyenMuc() != null ? vb.getChuyenMuc().getId() : null)
                .tenChuyenMuc(vb.getChuyenMuc() != null ? vb.getChuyenMuc().getTen() : null)
                .coQuanBanHanh(vb.getCoQuanBanHanh())
                .nguoiKy(vb.getNguoiKy())
                .ngayBanHanh(vb.getNgayBanHanh())
                .ngayHieuLuc(vb.getNgayHieuLuc())
                .ngayHetHan(vb.getNgayHetHan())
                .hoatDongId(vb.getHoatDongId())
                .trangThai(vb.getTrangThai() != null ? vb.getTrangThai().name() : null)
                .hieuLuc(vb.getHieuLuc() != null ? vb.getHieuLuc().name() : null)
                .nguoiDang(vb.getNguoiDang())
                .donViDang(vb.getDonViDang())
                .luotXem(vb.getLuotXem())
                .luotTai(vb.getLuotTai())
                .createdAt(vb.getCreatedAt())
                .updatedAt(vb.getUpdatedAt())
                // File info
                .tenFile(f != null ? f.getTenHienThi() : null)
                .duongDanFile(f != null ? f.getDuongDan() : null)
                .loaiFile(f != null ? f.getLoaiFile() : null)
                .kichThuocFile(f != null ? f.getKichThuoc() : null)
                .build();
    }

    private VanBan findById(Long id) {
        return repo.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Văn bản không tồn tại: " + id));
    }
}
