package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.DangKyThanhVienCLBDTO;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DangKyThanhVienCLBService {

    private final DangKyThanhVienCLBRepository dangKyRepo;
    private final CauLacBoRepository           clbRepo;
    private final SinhVienRepository           svRepo;
    private final ThanhVienCLBRepository       tvRepo;
    private final ClbCauHinhRepository         cauHinhRepo;

    private static final Map<String, String> STATUS_LABEL = Map.of(
            "CHO_DUYET", "Chờ duyệt",
            "DA_DUYET",  "Đã duyệt",
            "TU_CHOI",   "Từ chối",
            "HUY",       "Đã hủy"
    );

    // ══════════════════════════════════════════════════════════════
    // SINH VIÊN: nộp đơn đăng ký
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public DangKyThanhVienCLBDTO submitDangKy(String maClb, String maSv, String lyDo) {
        CauLacBo clb = clbRepo.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("CLB không tồn tại: " + maClb));
        SinhVien sv = svRepo.findById(maSv)
                .orElseThrow(() -> new ResourceNotFoundException("Sinh viên không tồn tại: " + maSv));

        // Kiểm tra cấu hình CLB có cho phép tự đăng ký không
        ClbCauHinh cfg = cauHinhRepo.findById(maClb).orElse(null);
        if (cfg != null && !Boolean.TRUE.equals(cfg.getChoPhepDangKyTuDo())) {
            throw new IllegalStateException("CLB này không nhận đơn đăng ký trực tuyến");
        }

        // Kiểm tra đã là thành viên active chưa
        boolean isAlreadyMember = tvRepo.findByCauLacBoMaClbAndSinhVienMaSvAndHocKyIsNull(maClb, maSv).isPresent()
                || tvRepo.findBySinhVienMaSvAndIsActiveTrue(maSv).stream()
                         .anyMatch(tv -> tv.getCauLacBo().getMaClb().equals(maClb));
        if (isAlreadyMember) {
            throw new IllegalStateException("Bạn đã là thành viên của CLB này");
        }

        // Kiểm tra đơn đang chờ duyệt
        dangKyRepo.findByCauLacBoMaClbAndSinhVienMaSvAndTrangThai(maClb, maSv, "CHO_DUYET")
                .ifPresent(d -> { throw new IllegalStateException("Bạn đã có đơn đang chờ duyệt"); });

        // Kiểm tra giới hạn thành viên
        if (cfg != null && cfg.getSoThanhVienToiDa() != null) {
            long current = tvRepo.countByCauLacBoMaClbAndIsActiveTrue(maClb);
            if (current >= cfg.getSoThanhVienToiDa()) {
                throw new IllegalStateException("CLB đã đạt số lượng thành viên tối đa");
            }
        }

        // Nếu không cần duyệt → thêm thẳng vào thành viên
        boolean canDuyet = cfg == null || Boolean.TRUE.equals(cfg.getCanDuyetDangKy());
        if (!canDuyet) {
            ThanhVienCLB tv = ThanhVienCLB.builder()
                    .cauLacBo(clb)
                    .sinhVien(sv)
                    .chucVu("THANH_VIEN")
                    .isActive(true)
                    .ghiChu("Tự đăng ký qua cổng sinh viên")
                    .build();
            tvRepo.save(tv);
            log.info("Auto-added {} vào CLB {} (không cần duyệt)", maSv, maClb);
            return DangKyThanhVienCLBDTO.builder()
                    .maClb(maClb).maSv(maSv).trangThai("DA_DUYET")
                    .trangThaiLabel("Đã duyệt (tự động)").build();
        }

        // Tạo đơn CHO_DUYET
        DangKyThanhVienCLB dk = DangKyThanhVienCLB.builder()
                .cauLacBo(clb)
                .sinhVien(sv)
                .trangThai("CHO_DUYET")
                .lyDoDangKy(lyDo)
                .build();
        DangKyThanhVienCLB saved = dangKyRepo.save(dk);
        log.info("SV {} nộp đơn vào CLB {}", maSv, maClb);
        return toDTO(saved);
    }

    // ══════════════════════════════════════════════════════════════
    // BCN: duyệt / từ chối
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public DangKyThanhVienCLBDTO duyet(Long id, String lyDo, String nguoiDuyet) {
        DangKyThanhVienCLB dk = findOrThrow(id);
        assertCHO_DUYET(dk);

        dk.setTrangThai("DA_DUYET");
        dk.setLyDoXuLy(lyDo);
        dk.setNguoiXuLy(nguoiDuyet);
        dk.setNgayXuLy(LocalDateTime.now());
        dangKyRepo.save(dk);

        // Thêm vào bảng thành viên
        ThanhVienCLB tv = ThanhVienCLB.builder()
                .cauLacBo(dk.getCauLacBo())
                .sinhVien(dk.getSinhVien())
                .chucVu("THANH_VIEN")
                .isActive(true)
                .ghiChu("Được duyệt từ đơn đăng ký trực tuyến")
                .build();
        tvRepo.save(tv);
        log.info("Đã duyệt đơn {} (SV {}, CLB {})", id,
                dk.getSinhVien().getMaSv(), dk.getCauLacBo().getMaClb());
        return toDTO(dk);
    }

    @Transactional
    public DangKyThanhVienCLBDTO tuChoi(Long id, String lyDo, String nguoiXuLy) {
        DangKyThanhVienCLB dk = findOrThrow(id);
        assertCHO_DUYET(dk);

        dk.setTrangThai("TU_CHOI");
        dk.setLyDoXuLy(lyDo);
        dk.setNguoiXuLy(nguoiXuLy);
        dk.setNgayXuLy(LocalDateTime.now());
        return toDTO(dangKyRepo.save(dk));
    }

    // ══════════════════════════════════════════════════════════════
    // SINH VIÊN: hủy đơn
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public DangKyThanhVienCLBDTO huyDon(Long id, String maSv) {
        DangKyThanhVienCLB dk = findOrThrow(id);
        if (!dk.getSinhVien().getMaSv().equals(maSv)) {
            throw new IllegalStateException("Không có quyền hủy đơn này");
        }
        if (!"CHO_DUYET".equals(dk.getTrangThai())) {
            throw new IllegalStateException("Chỉ có thể hủy đơn đang chờ duyệt");
        }
        dk.setTrangThai("HUY");
        dk.setNgayXuLy(LocalDateTime.now());
        return toDTO(dangKyRepo.save(dk));
    }

    // ══════════════════════════════════════════════════════════════
    // QUERIES
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<DangKyThanhVienCLBDTO> getDonByClb(String maClb, String trangThai) {
        List<DangKyThanhVienCLB> list = trangThai != null
                ? dangKyRepo.findByClbAndTrangThai(maClb, trangThai)
                : dangKyRepo.findAllByClb(maClb);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DangKyThanhVienCLBDTO> getDonBySinhVien(String maSv) {
        return dangKyRepo.findBySinhVien(maSv).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public long countCHO_DUYET(String maClb) {
        return dangKyRepo.countByCauLacBoMaClbAndTrangThai(maClb, "CHO_DUYET");
    }

    // ── Helpers ─────────────────────────────────────────────────
    private DangKyThanhVienCLB findOrThrow(Long id) {
        return dangKyRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn: " + id));
    }

    private void assertCHO_DUYET(DangKyThanhVienCLB dk) {
        if (!"CHO_DUYET".equals(dk.getTrangThai())) {
            throw new IllegalStateException("Đơn này không ở trạng thái chờ duyệt");
        }
    }

    // ── Mapper ──────────────────────────────────────────────────
    private DangKyThanhVienCLBDTO toDTO(DangKyThanhVienCLB d) {
        SinhVien sv = d.getSinhVien();
        CauLacBo clb = d.getCauLacBo();
        return DangKyThanhVienCLBDTO.builder()
                .id(d.getId())
                .maClb(clb.getMaClb())
                .tenClb(clb.getTenClb())
                .loaiClb(clb.getLoai())
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .trangThai(d.getTrangThai())
                .trangThaiLabel(STATUS_LABEL.getOrDefault(d.getTrangThai(), d.getTrangThai()))
                .lyDoDangKy(d.getLyDoDangKy())
                .lyDoXuLy(d.getLyDoXuLy())
                .nguoiXuLy(d.getNguoiXuLy())
                .ngayXuLy(d.getNgayXuLy())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
