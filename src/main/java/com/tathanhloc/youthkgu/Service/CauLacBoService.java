package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.CauLacBoDTO;
import com.tathanhloc.youthkgu.DTO.HoatDongDTO;
import com.tathanhloc.youthkgu.DTO.ThanhVienCLBDTO;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Repository.ClbCauHinhRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Model.TaiKhoan;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CauLacBoService {

    private final CauLacBoRepository cauLacBoRepository;
    private final ThanhVienCLBRepository thanhVienCLBRepository;
    private final SinhVienRepository sinhVienRepository;
    private final HocKyRepository hocKyRepository;
    private final KhoaRepository khoaRepository;
    private final BanRepository banRepository;
    private final HoatDongRepository hoatDongRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final ClbCauHinhRepository clbCauHinhRepository;

    // ══════════════════════════════════════════════════════════════
    // TƯ CÁCH THÀNH VIÊN (dành cho sinh viên xem CLB của mình)
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<ThanhVienCLBDTO> getMyMembership(String username) {
        TaiKhoan tk = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (tk.getSinhVien() == null) return List.of();
        return thanhVienCLBRepository
                .findBySinhVienMaSvAndIsActiveTrue(tk.getSinhVien().getMaSv())
                .stream().map(this::toThanhVienDTO).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // CLB CỦA TÔI (dành cho chủ nhiệm CLB)
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<CauLacBoDTO> getMyClubs(String username) {
        TaiKhoan tk = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));

        Set<CauLacBo> result = new LinkedHashSet<>();

        // 1. Quản lý theo trường trực tiếp (GV/CV)
        result.addAll(cauLacBoRepository.findByMaQuanLyAndIsActiveTrueOrderByTenClbAsc(username));

        // 2. Trưởng CLB qua sinh viên liên kết
        if (tk.getSinhVien() != null) {
            String maSv = tk.getSinhVien().getMaSv();
            result.addAll(cauLacBoRepository.findByTruongClbMaSvAndIsActiveTrueOrderByTenClbAsc(maSv));
            // 3. Thành viên có chức vụ CHU_NHIEM
            thanhVienCLBRepository.findBySinhVienMaSvAndIsActiveTrue(maSv).stream()
                    .filter(tv -> "CHU_NHIEM".equals(tv.getChucVu()))
                    .map(tv -> tv.getCauLacBo())
                    .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                    .forEach(result::add);
        }

        if (result.isEmpty()) {
            return List.of();
        }

        Map<String, Long> soThanhVienMap = thanhVienCLBRepository.countActiveGroupByClb()
                .stream().collect(Collectors.toMap(r -> (String) r[0], r -> (Long) r[1]));

        return result.stream()
                .map(c -> toDTO(c, soThanhVienMap.getOrDefault(c.getMaClb(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // KHÓA DANH SÁCH THEO HỌC KỲ
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public void lockHocKy(String maHocKy, boolean locked, String lockedBy) {
        HocKy hk = hocKyRepository.findById(maHocKy)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ: " + maHocKy));
        hk.setIsClbLocked(locked);
        hk.setClbLockedAt(locked ? LocalDateTime.now() : null);
        hk.setClbLockedBy(locked ? lockedBy : null);
        hocKyRepository.save(hk);
        log.info("{} danh sách CLB học kỳ {} bởi {}", locked ? "Khóa" : "Mở khóa", maHocKy, lockedBy);
    }

    // ══════════════════════════════════════════════════════════════
    // QUẢN LÝ CLB
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<CauLacBoDTO> getAll(String loai, String maKhoa, String keyword) {
        return getAll(loai, maKhoa, keyword, null);
    }

    @Transactional(readOnly = true)
    public List<CauLacBoDTO> getAll(String loai, String maKhoa, String keyword, Boolean choPhepDangKy) {
        List<CauLacBo> list;

        if (keyword != null && !keyword.isBlank()) {
            list = cauLacBoRepository.searchByKeyword(keyword.trim());
        } else if (maKhoa != null && !maKhoa.isBlank()) {
            if ("TRUONG".equals(maKhoa)) {
                list = cauLacBoRepository.findByKhoaIsNullAndIsActiveTrueOrderByTenClbAsc();
            } else {
                list = cauLacBoRepository.findByKhoaMaKhoaAndIsActiveTrueOrderByTenClbAsc(maKhoa);
            }
        } else if (loai != null && !loai.isBlank()) {
            list = cauLacBoRepository.findByLoaiAndIsActiveTrueOrderByTenClbAsc(loai);
        } else {
            list = cauLacBoRepository.findByIsActiveTrueOrderByTenClbAsc();
        }

        // Bulk-load số thành viên để tránh N+1
        Map<String, Long> soThanhVienMap = thanhVienCLBRepository.countActiveGroupByClb()
                .stream().collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1]
                ));

        // Bulk-load cấu hình CLB
        Map<String, ClbCauHinh> cauHinhMap = clbCauHinhRepository.findAll()
                .stream().collect(Collectors.toMap(ClbCauHinh::getMaClb, c -> c));

        List<CauLacBoDTO> result = list.stream()
                .map(c -> toDTO(c, soThanhVienMap.getOrDefault(c.getMaClb(), 0L).intValue(),
                        cauHinhMap.get(c.getMaClb())))
                .collect(Collectors.toList());

        // Lọc theo choPhepDangKy (dùng cho trang đăng ký sinh viên)
        if (Boolean.TRUE.equals(choPhepDangKy)) {
            result = result.stream()
                    .filter(dto -> !Boolean.FALSE.equals(dto.getChoPhepDangKyTuDo()))
                    .collect(Collectors.toList());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public CauLacBoDTO getDetail(String maClb) {
        CauLacBo clb = cauLacBoRepository.findByMaClb(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CLB: " + maClb));

        List<ThanhVienCLB> thanhViens = thanhVienCLBRepository
                .findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb);

        int soTv = (int) thanhVienCLBRepository.countByCauLacBoMaClbAndIsActiveTrue(maClb);

        CauLacBoDTO dto = toDTO(clb, soTv);
        dto.setThanhViens(thanhViens.stream().map(this::toThanhVienDTO).collect(Collectors.toList()));
        return dto;
    }

    @Transactional
    public CauLacBoDTO create(CauLacBoDTO req) {
        if (cauLacBoRepository.existsByMaClb(req.getMaClb())) {
            throw new IllegalArgumentException("Mã CLB đã tồn tại: " + req.getMaClb());
        }

        CauLacBo clb = CauLacBo.builder()
                .maClb(req.getMaClb().trim().toUpperCase())
                .tenClb(req.getTenClb())
                .loai(req.getLoai() != null ? req.getLoai() : "CLB")
                .moTa(req.getMoTa())
                .linhVuc(req.getLinhVuc())
                .ngayThanhLap(req.getNgayThanhLap())
                .maQuanLy(req.getMaQuanLy())
                .isActive(true)
                .build();

        if (req.getMaKhoa() != null && !req.getMaKhoa().isBlank()) {
            clb.setKhoa(khoaRepository.findById(req.getMaKhoa())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Khoa: " + req.getMaKhoa())));
        }
        if (req.getMaBan() != null && !req.getMaBan().isBlank()) {
            clb.setBan(banRepository.findById(req.getMaBan())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ban: " + req.getMaBan())));
        }
        if (req.getTruongClbMaSv() != null && !req.getTruongClbMaSv().isBlank()) {
            clb.setTruongClb(sinhVienRepository.findById(req.getTruongClbMaSv())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + req.getTruongClbMaSv())));
        }

        CauLacBo saved = cauLacBoRepository.save(clb);
        log.info("Tạo CLB: {} - {}", saved.getMaClb(), saved.getTenClb());
        return toDTO(saved, 0);
    }

    @Transactional
    public CauLacBoDTO update(String maClb, CauLacBoDTO req) {
        CauLacBo clb = cauLacBoRepository.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CLB: " + maClb));

        clb.setTenClb(req.getTenClb());
        if (req.getLoai() != null) clb.setLoai(req.getLoai());
        clb.setMoTa(req.getMoTa());
        clb.setLinhVuc(req.getLinhVuc());
        clb.setNgayThanhLap(req.getNgayThanhLap());
        clb.setMaQuanLy(req.getMaQuanLy());

        clb.setKhoa(req.getMaKhoa() != null && !req.getMaKhoa().isBlank()
                ? khoaRepository.findById(req.getMaKhoa()).orElse(null) : null);
        clb.setBan(req.getMaBan() != null && !req.getMaBan().isBlank()
                ? banRepository.findById(req.getMaBan()).orElse(null) : null);
        clb.setTruongClb(req.getTruongClbMaSv() != null && !req.getTruongClbMaSv().isBlank()
                ? sinhVienRepository.findById(req.getTruongClbMaSv()).orElse(null) : null);

        CauLacBo saved = cauLacBoRepository.save(clb);
        log.info("Cập nhật CLB: {}", maClb);
        int soTv = (int) thanhVienCLBRepository.countByCauLacBoMaClbAndIsActiveTrue(maClb);
        return toDTO(saved, soTv);
    }

    @Transactional
    public void delete(String maClb) {
        CauLacBo clb = cauLacBoRepository.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CLB: " + maClb));
        clb.setIsActive(false);
        cauLacBoRepository.save(clb);
        log.info("Xóa mềm CLB: {}", maClb);
    }

    // ══════════════════════════════════════════════════════════════
    // QUẢN LÝ THÀNH VIÊN
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<ThanhVienCLBDTO> getThanhVien(String maClb, String maHocKy) {
        List<ThanhVienCLB> list = maHocKy != null && !maHocKy.isBlank()
                ? thanhVienCLBRepository.findByCauLacBoMaClbAndHocKyMaHocKyAndIsActiveTrueOrderByChucVuAsc(maClb, maHocKy)
                : thanhVienCLBRepository.findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb);
        return list.stream().map(this::toThanhVienDTO).collect(Collectors.toList());
    }

    @Transactional
    public ThanhVienCLBDTO addThanhVien(String maClb, ThanhVienCLBDTO req) {
        CauLacBo clb = cauLacBoRepository.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CLB: " + maClb));
        SinhVien sv = sinhVienRepository.findById(req.getMaSv())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + req.getMaSv()));

        // Kiểm tra khóa danh sách học kỳ
        if (req.getMaHocKy() != null && !req.getMaHocKy().isBlank()) {
            hocKyRepository.findById(req.getMaHocKy()).ifPresent(hk -> {
                if (Boolean.TRUE.equals(hk.getIsClbLocked())) {
                    throw new IllegalStateException("Danh sách thành viên CLB học kỳ này đã bị khóa, không thể thêm thành viên");
                }
            });
        }

        // Kiểm tra trùng
        boolean trung = req.getMaHocKy() != null
                ? thanhVienCLBRepository.findByCauLacBoMaClbAndSinhVienMaSvAndHocKyMaHocKy(maClb, req.getMaSv(), req.getMaHocKy()).isPresent()
                : thanhVienCLBRepository.findByCauLacBoMaClbAndSinhVienMaSvAndHocKyIsNull(maClb, req.getMaSv()).isPresent();
        if (trung) throw new IllegalArgumentException("Sinh viên đã là thành viên CLB trong học kỳ này");

        HocKy hocKy = req.getMaHocKy() != null && !req.getMaHocKy().isBlank()
                ? hocKyRepository.findById(req.getMaHocKy()).orElse(null) : null;

        ThanhVienCLB tv = ThanhVienCLB.builder()
                .cauLacBo(clb)
                .sinhVien(sv)
                .hocKy(hocKy)
                .chucVu(req.getChucVu() != null ? req.getChucVu() : "THANH_VIEN")
                .ngayThamGia(req.getNgayThamGia() != null ? req.getNgayThamGia() : LocalDate.now())
                .ghiChu(req.getGhiChu())
                .isActive(true)
                .build();

        ThanhVienCLB saved = thanhVienCLBRepository.save(tv);
        log.info("Thêm thành viên {} vào CLB {}", req.getMaSv(), maClb);
        return toThanhVienDTO(saved);
    }

    @Transactional
    public ThanhVienCLBDTO updateThanhVien(Long id, ThanhVienCLBDTO req) {
        ThanhVienCLB tv = thanhVienCLBRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên ID: " + id));

        if (req.getChucVu() != null) tv.setChucVu(req.getChucVu());
        if (req.getNgayThamGia() != null) tv.setNgayThamGia(req.getNgayThamGia());
        if (req.getNgayRoiClb() != null) tv.setNgayRoiClb(req.getNgayRoiClb());
        tv.setGhiChu(req.getGhiChu());

        if (req.getMaHocKy() != null && !req.getMaHocKy().isBlank()) {
            tv.setHocKy(hocKyRepository.findById(req.getMaHocKy()).orElse(null));
        }

        return toThanhVienDTO(thanhVienCLBRepository.save(tv));
    }

    @Transactional
    public void removeThanhVien(Long id) {
        ThanhVienCLB tv = thanhVienCLBRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên ID: " + id));

        // Kiểm tra khóa danh sách
        if (tv.getHocKy() != null && Boolean.TRUE.equals(tv.getHocKy().getIsClbLocked())) {
            throw new IllegalStateException("Danh sách thành viên CLB học kỳ này đã bị khóa, không thể xóa thành viên");
        }

        tv.setIsActive(false);
        tv.setNgayRoiClb(tv.getNgayRoiClb() != null ? tv.getNgayRoiClb() : LocalDate.now());
        thanhVienCLBRepository.save(tv);
        log.info("Xóa thành viên {} khỏi CLB {}", tv.getSinhVien().getMaSv(), tv.getCauLacBo().getMaClb());
    }

    // ══════════════════════════════════════════════════════════════
    // HOẠT ĐỘNG CỦA CLB
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<HoatDongDTO> getHoatDong(String maClb, String maNamHoc) {
        List<HoatDong> list = maNamHoc != null && !maNamHoc.isBlank()
                ? hoatDongRepository.findByCauLacBoMaClbAndNamHoc(maClb, maNamHoc)
                : hoatDongRepository.findByCauLacBoMaClbOrderByNgayToChucDesc(maClb);
        return list.stream().map(this::toHoatDongDTO).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // MAPPER
    // ══════════════════════════════════════════════════════════════

    private CauLacBoDTO toDTO(CauLacBo c, int soThanhVien) {
        return toDTO(c, soThanhVien, null);
    }

    private CauLacBoDTO toDTO(CauLacBo c, int soThanhVien, ClbCauHinh cauHinh) {
        CauLacBoDTO.CauLacBoDTOBuilder builder = CauLacBoDTO.builder()
                .maClb(c.getMaClb())
                .tenClb(c.getTenClb())
                .loai(c.getLoai())
                .moTa(c.getMoTa())
                .linhVuc(c.getLinhVuc())
                .maKhoa(c.getKhoa() != null ? c.getKhoa().getMaKhoa() : null)
                .tenKhoa(c.getKhoa() != null ? c.getKhoa().getTenKhoa() : null)
                .maBan(c.getBan() != null ? c.getBan().getMaBan() : null)
                .tenBan(c.getBan() != null ? c.getBan().getTenBan() : null)
                .truongClbMaSv(c.getTruongClb() != null ? c.getTruongClb().getMaSv() : null)
                .truongClbHoTen(c.getTruongClb() != null ? c.getTruongClb().getHoTen() : null)
                .maQuanLy(c.getMaQuanLy())
                .ngayThanhLap(c.getNgayThanhLap())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .soThanhVien(soThanhVien);

        if (cauHinh != null) {
            builder.cocheThanHVien(cauHinh.getCocheThanHVien())
                   .soTienPhiKy(cauHinh.getSoTienPhiKy())
                   .donViPhi(cauHinh.getDonViPhi())
                   .soHoatDongToiThieu(cauHinh.getSoHoatDongToiThieu())
                   .choPhepDangKyTuDo(cauHinh.getChoPhepDangKyTuDo())
                   .moTaYeuCau(cauHinh.getMoTaYeuCau());
        }

        return builder.build();
    }

    public ThanhVienCLBDTO toThanhVienDTO(ThanhVienCLB tv) {
        SinhVien sv = tv.getSinhVien();
        HocKy hk = tv.getHocKy();
        return ThanhVienCLBDTO.builder()
                .id(tv.getId())
                .maClb(tv.getCauLacBo() != null ? tv.getCauLacBo().getMaClb() : null)
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .maLop(sv.getLop() != null ? sv.getLop().getMaLop() : null)
                .tenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null)
                .tenKhoa(sv.getLop() != null && sv.getLop().getNganh() != null
                        && sv.getLop().getNganh().getKhoa() != null
                        ? sv.getLop().getNganh().getKhoa().getTenKhoa() : null)
                .maHocKy(hk != null ? hk.getMaHocKy() : null)
                .tenHocKy(hk != null ? hk.getTenHocKy() : null)
                .chucVu(tv.getChucVu())
                .chucVuLabel(mapChucVuLabel(tv.getChucVu()))
                .ngayThamGia(tv.getNgayThamGia())
                .ngayRoiClb(tv.getNgayRoiClb())
                .ghiChu(tv.getGhiChu())
                .isActive(tv.getIsActive())
                .createdAt(tv.getCreatedAt())
                .build();
    }

    private HoatDongDTO toHoatDongDTO(HoatDong hd) {
        return HoatDongDTO.builder()
                .maHoatDong(hd.getMaHoatDong())
                .tenHoatDong(hd.getTenHoatDong())
                .loaiHoatDong(hd.getLoaiHoatDong())
                .capDo(hd.getCapDo())
                .ngayToChuc(hd.getNgayToChuc())
                .diaDiem(hd.getDiaDiem())
                .trangThai(hd.getTrangThai())
                .diemRenLuyen(hd.getDiemRenLuyen())
                .build();
    }

    private String mapChucVuLabel(String chucVu) {
        if (chucVu == null) return "Thành viên";
        return switch (chucVu) {
            case "CHU_NHIEM"      -> "Chủ nhiệm";
            case "PHO_CHU_NHIEM"  -> "Phó chủ nhiệm";
            case "BAN_QUAN_LY"    -> "Ban quản lý";
            case "CO_VAN"         -> "Cố vấn";
            default               -> "Thành viên";
        };
    }
}
