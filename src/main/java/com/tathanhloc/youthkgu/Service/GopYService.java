package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.GopYAdminDTO;
import com.tathanhloc.youthkgu.DTO.GopYCreateRequest;
import com.tathanhloc.youthkgu.DTO.GopYDTO;
import com.tathanhloc.youthkgu.DTO.GopYPhanHoiRequest;
import com.tathanhloc.youthkgu.Enum.LoaiGopY;
import com.tathanhloc.youthkgu.Enum.TrangThaiGopY;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.GopY;
import com.tathanhloc.youthkgu.Repository.GopYRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Thùng thư góp ý — sinh viên phản ánh/góp ý về hoạt động Đoàn-Hội.
 * GY-001: bắt buộc đăng nhập để gửi (enforce ở Controller qua hasRole('USER')).
 * GY-002: danh tính người gửi KHÔNG BAO GIỜ lộ ra view admin (toAdminDTO không đọc nguoiGuiUsername).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GopYService {

    private final GopYRepository repo;

    public GopYDTO submit(GopYCreateRequest req, String username) {
        if (req.getTieuDe() == null || req.getTieuDe().isBlank()) {
            throw new BusinessException("TIEU_DE_TRONG", "Vui lòng nhập tiêu đề góp ý");
        }
        if (req.getNoiDung() == null || req.getNoiDung().isBlank()) {
            throw new BusinessException("NOI_DUNG_TRONG", "Vui lòng nhập nội dung góp ý");
        }

        GopY gopY = GopY.builder()
                .tieuDe(req.getTieuDe().trim())
                .noiDung(req.getNoiDung().trim())
                .loai(parseLoai(req.getLoai()))
                .nguoiGuiUsername(username)
                .trangThai(TrangThaiGopY.MOI)
                .isDeleted(false)
                .build();

        GopY saved = repo.save(gopY);
        log.info("Tạo góp ý id={} bởi {}", saved.getId(), username);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<GopYDTO> getMySubmissions(String username, Pageable pageable) {
        return repo.findByNguoiGuiUsernameAndIsDeletedFalseOrderByCreatedAtDesc(username, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public GopYDTO getMySubmission(Long id, String username) {
        GopY gopY = findById(id);
        if (!gopY.getNguoiGuiUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền xem góp ý này");
        }
        return toDTO(gopY);
    }

    /** Danh sách cho admin/BCH — ẩn danh (không lộ người gửi). */
    @Transactional(readOnly = true)
    public Page<GopYAdminDTO> getAllForAdmin(Pageable pageable, TrangThaiGopY filter) {
        Page<GopY> page = (filter != null)
                ? repo.findByTrangThaiAndIsDeletedFalseOrderByCreatedAtDesc(filter, pageable)
                : repo.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
        return page.map(this::toAdminDTO);
    }

    @Transactional(readOnly = true)
    public GopYAdminDTO getDetailForAdmin(Long id) {
        return toAdminDTO(findById(id));
    }

    public GopYAdminDTO respond(Long id, GopYPhanHoiRequest req, String admin) {
        GopY gopY = findById(id);
        gopY.setPhanHoi(req.getPhanHoi());
        gopY.setNguoiPhanHoi(admin);
        gopY.setNgayPhanHoi(LocalDateTime.now());
        if (req.getTrangThai() != null && !req.getTrangThai().isBlank()) {
            try {
                gopY.setTrangThai(TrangThaiGopY.valueOf(req.getTrangThai()));
            } catch (IllegalArgumentException ignored) {
                gopY.setTrangThai(TrangThaiGopY.DA_XU_LY);
            }
        } else {
            gopY.setTrangThai(TrangThaiGopY.DA_XU_LY);
        }
        repo.save(gopY);
        log.info("Phản hồi góp ý id={} bởi {}", id, admin);
        return toAdminDTO(gopY);
    }

    public void softDelete(Long id) {
        GopY gopY = findById(id);
        gopY.setIsDeleted(true);
        repo.save(gopY);
        log.info("Xóa (mềm) góp ý id={}", id);
    }

    private LoaiGopY parseLoai(String loai) {
        if (loai == null || loai.isBlank()) return LoaiGopY.GOP_Y;
        try {
            return LoaiGopY.valueOf(loai.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return LoaiGopY.GOP_Y;
        }
    }

    private GopY findById(Long id) {
        return repo.findById(id)
                .filter(g -> !Boolean.TRUE.equals(g.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy góp ý: " + id));
    }

    private GopYDTO toDTO(GopY g) {
        return GopYDTO.builder()
                .id(g.getId())
                .tieuDe(g.getTieuDe())
                .noiDung(g.getNoiDung())
                .loai(g.getLoai() != null ? g.getLoai().name() : null)
                .trangThai(g.getTrangThai() != null ? g.getTrangThai().name() : null)
                .phanHoi(g.getPhanHoi())
                .ngayPhanHoi(g.getNgayPhanHoi())
                .createdAt(g.getCreatedAt())
                .build();
    }

    private GopYAdminDTO toAdminDTO(GopY g) {
        return GopYAdminDTO.builder()
                .id(g.getId())
                .tieuDe(g.getTieuDe())
                .noiDung(g.getNoiDung())
                .loai(g.getLoai() != null ? g.getLoai().name() : null)
                .trangThai(g.getTrangThai() != null ? g.getTrangThai().name() : null)
                .phanHoi(g.getPhanHoi())
                .nguoiPhanHoi(g.getNguoiPhanHoi())
                .ngayPhanHoi(g.getNgayPhanHoi())
                .createdAt(g.getCreatedAt())
                .build();
    }
}
