package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.BinhLuanAdminDTO;
import com.tathanhloc.youthkgu.DTO.BinhLuanCreateRequest;
import com.tathanhloc.youthkgu.DTO.BinhLuanDTO;
import com.tathanhloc.youthkgu.Enum.TrangThaiBinhLuan;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Model.TinTuc;
import com.tathanhloc.youthkgu.Model.TinTucBinhLuan;
import com.tathanhloc.youthkgu.Repository.TinTucBinhLuanRepository;
import com.tathanhloc.youthkgu.Repository.TinTucRepository;
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Bình luận trên bài viết eNews.
 * BL-001: khách (chưa đăng nhập) bắt buộc nhập họ tên + số điện thoại + email.
 * BL-002: bài bị khóa bình luận (khoaBinhLuan=true) thì không nhận bình luận mới.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TinTucBinhLuanService {

    private final TinTucBinhLuanRepository repo;
    private final TinTucRepository tinTucRepo;
    private final SystemSettingService systemSettingService;

    @Transactional(readOnly = true)
    public Page<BinhLuanDTO> getVisibleComments(Long tinTucId, Pageable pageable) {
        return repo.findByTinTucIdAndTrangThaiOrderByCreatedAtAsc(tinTucId, TrangThaiBinhLuan.HIEN, pageable)
                .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<BinhLuanAdminDTO> getAllForAdmin(Long tinTucId, Pageable pageable) {
        return repo.findByTinTucIdOrderByCreatedAtDesc(tinTucId, pageable).map(this::toAdminDTO);
    }

    public BinhLuanDTO create(Long tinTucId, BinhLuanCreateRequest req, CustomUserDetails userOrNull, String ip) {
        // Công tắc chung: admin có thể tắt toàn bộ tính năng bình luận qua trang "Cài đặt hệ thống".
        if (!systemSettingService.getBoolean("tintuc.binh_luan_bat", true)) {
            throw new BusinessException("BINH_LUAN_TAT", "Chức năng bình luận đang tạm tắt");
        }

        TinTuc tinTuc = tinTucRepo.findById(tinTucId)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại: " + tinTucId));

        if (Boolean.TRUE.equals(tinTuc.getKhoaBinhLuan())) {
            throw new BusinessException("BINH_LUAN_KHOA", "Bài viết này đã bị khóa bình luận");
        }
        if (req.getNoiDung() == null || req.getNoiDung().isBlank()) {
            throw new BusinessException("NOI_DUNG_TRONG", "Nội dung bình luận không được để trống");
        }

        TinTucBinhLuan.TinTucBinhLuanBuilder builder = TinTucBinhLuan.builder()
                .tinTuc(tinTuc)
                .noiDung(req.getNoiDung().trim())
                .ipAddress(ip)
                .trangThai(TrangThaiBinhLuan.HIEN);

        if (userOrNull != null) {
            TaiKhoan tk = userOrNull.getTaiKhoan();
            builder.username(tk.getUsername())
                    .hoTen(tk.getHoTen() != null && !tk.getHoTen().isBlank() ? tk.getHoTen() : tk.getUsername());
        } else {
            // BL-001: khách bắt buộc đủ 3 trường
            if (isBlank(req.getHoTen()) || isBlank(req.getSoDienThoai()) || isBlank(req.getEmail())) {
                throw new BusinessException("THIEU_THONG_TIN_KHACH",
                        "Vui lòng nhập đầy đủ họ tên, số điện thoại và email");
            }
            builder.hoTen(req.getHoTen().trim())
                    .soDienThoai(req.getSoDienThoai().trim())
                    .email(req.getEmail().trim());
        }

        TinTucBinhLuan saved = repo.save(builder.build());
        tinTucRepo.incrementLuotBinhLuan(tinTucId);
        log.info("Tạo bình luận id={} cho tinTucId={} (khách={})", saved.getId(), tinTucId, userOrNull == null);
        return toDTO(saved);
    }

    public void chan(Long commentId, String admin) {
        TinTucBinhLuan bl = findById(commentId);
        if (bl.getTrangThai() == TrangThaiBinhLuan.HIEN) {
            tinTucRepo.decrementLuotBinhLuan(bl.getTinTuc().getId());
        }
        bl.setTrangThai(TrangThaiBinhLuan.CHAN);
        bl.setNguoiXuLy(admin);
        bl.setNgayXuLy(LocalDateTime.now());
        repo.save(bl);
        log.info("Chặn bình luận id={} bởi {}", commentId, admin);
    }

    public void boChan(Long commentId, String admin) {
        TinTucBinhLuan bl = findById(commentId);
        if (bl.getTrangThai() != TrangThaiBinhLuan.HIEN) {
            tinTucRepo.incrementLuotBinhLuan(bl.getTinTuc().getId());
        }
        bl.setTrangThai(TrangThaiBinhLuan.HIEN);
        bl.setNguoiXuLy(admin);
        bl.setNgayXuLy(LocalDateTime.now());
        repo.save(bl);
        log.info("Bỏ chặn bình luận id={} bởi {}", commentId, admin);
    }

    public void xoa(Long commentId, String admin) {
        TinTucBinhLuan bl = findById(commentId);
        if (bl.getTrangThai() == TrangThaiBinhLuan.HIEN) {
            tinTucRepo.decrementLuotBinhLuan(bl.getTinTuc().getId());
        }
        bl.setTrangThai(TrangThaiBinhLuan.DA_XOA);
        bl.setNguoiXuLy(admin);
        bl.setNgayXuLy(LocalDateTime.now());
        repo.save(bl);
        log.info("Xóa (mềm) bình luận id={} bởi {}", commentId, admin);
    }

    public void toggleKhoaBinhLuan(Long tinTucId, boolean khoa, String admin) {
        tinTucRepo.findById(tinTucId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại: " + tinTucId));
        tinTucRepo.updateKhoaBinhLuan(tinTucId, khoa);
        log.info("{} bình luận cho tinTucId={} bởi {}", khoa ? "Khóa" : "Mở khóa", tinTucId, admin);
    }

    private TinTucBinhLuan findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận: " + id));
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private BinhLuanDTO toDTO(TinTucBinhLuan bl) {
        return BinhLuanDTO.builder()
                .id(bl.getId())
                .hoTen(bl.getHoTen())
                .noiDung(bl.getNoiDung())
                .coTaiKhoan(bl.getUsername() != null)
                .createdAt(bl.getCreatedAt())
                .build();
    }

    private BinhLuanAdminDTO toAdminDTO(TinTucBinhLuan bl) {
        return BinhLuanAdminDTO.builder()
                .id(bl.getId())
                .hoTen(bl.getHoTen())
                .noiDung(bl.getNoiDung())
                .trangThai(bl.getTrangThai() != null ? bl.getTrangThai().name() : null)
                .username(bl.getUsername())
                .soDienThoai(bl.getSoDienThoai())
                .email(bl.getEmail())
                .ipAddress(bl.getIpAddress())
                .nguoiXuLy(bl.getNguoiXuLy())
                .ngayXuLy(bl.getNgayXuLy())
                .createdAt(bl.getCreatedAt())
                .build();
    }
}
