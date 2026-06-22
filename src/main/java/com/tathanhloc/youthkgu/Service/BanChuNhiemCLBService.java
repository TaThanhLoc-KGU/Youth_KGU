package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.BanChuNhiemCLBDTO;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BanChuNhiemCLBService {

    private final BanChuNhiemCLBRepository bcnRepository;
    private final CauLacBoRepository       cauLacBoRepository;
    private final SinhVienRepository       sinhVienRepository;
    private final GiangVienRepository      giangVienRepository;
    private final ChuyenVienRepository     chuyenVienRepository;
    private final ThanhVienCLBRepository   thanhVienCLBRepository;
    private final KhoaScopeService         khoaScopeService;

    @Transactional(readOnly = true)
    public List<BanChuNhiemCLBDTO> getByClb(String maClb, String nhiemKy, String trangThai) {
        checkClbAccess(maClb);
        List<BanChuNhiemCLB> list;
        if (nhiemKy != null && !nhiemKy.isBlank()) {
            list = bcnRepository.findByCauLacBoMaClbAndNhiemKyOrderByChucVuAsc(maClb, nhiemKy);
        } else if (trangThai != null && !trangThai.isBlank()) {
            list = bcnRepository.findByCauLacBoMaClbAndTrangThaiOrderByChucVuAsc(maClb, trangThai);
        } else {
            list = bcnRepository.findByCauLacBoMaClbOrderByNhiemKyDescChucVuAsc(maClb);
        }
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BanChuNhiemCLBDTO> getPublicByClb(String maClb) {
        // Không kiểm tra scope (checkClbAccess) vì đây là public API
        List<BanChuNhiemCLB> list = bcnRepository.findByCauLacBoMaClbAndTrangThaiOrderByChucVuAsc(maClb, "DUONG_NHIEM");
        return list.stream().map(b -> {
             BanChuNhiemCLBDTO dto = toDTO(b);
             dto.setSdt(null); // Che thông tin nhạy cảm
             dto.setEmailLienHe(null); // Che thông tin nhạy cảm
             return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getNhiemKyList(String maClb) {
        checkClbAccess(maClb);
        return bcnRepository.findDistinctNhiemKyByClb(maClb);
    }

    @Transactional
    public BanChuNhiemCLBDTO add(String maClb, BanChuNhiemCLBDTO dto) {
        checkClbAccess(maClb);

        CauLacBo clb = cauLacBoRepository.findById(maClb)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CLB: " + maClb));

        String loai = dto.getLoaiNguoi() != null ? dto.getLoaiNguoi().toUpperCase() : "SV";
        BanChuNhiemCLB bcn = BanChuNhiemCLB.builder()
                .cauLacBo(clb)
                .loaiNguoi(loai)
                .chucVu(dto.getChucVu())
                .nhiemKy(dto.getNhiemKy())
                .trangThai(dto.getTrangThai() != null ? dto.getTrangThai() : "DUONG_NHIEM")
                .emailLienHe(dto.getEmailLienHe())
                .sdt(dto.getSdt())
                .ngayBoNhiem(dto.getNgayBoNhiem())
                .ngayThoiChuc(dto.getNgayThoiChuc())
                .ghiChu(dto.getGhiChu())
                .build();

        switch (loai) {
            case "GV" -> {
                if (dto.getMaGv() == null) throw new RuntimeException("Thiếu mã giảng viên");
                if (bcnRepository.existsByCauLacBoMaClbAndGiangVienMaGvAndNhiemKy(maClb, dto.getMaGv(), dto.getNhiemKy()))
                    throw new RuntimeException("Giảng viên " + dto.getMaGv() + " đã có trong BCN nhiệm kỳ " + dto.getNhiemKy());
                GiangVien gv = giangVienRepository.findById(dto.getMaGv())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên: " + dto.getMaGv()));
                bcn.setGiangVien(gv);
            }
            case "CV" -> {
                if (dto.getMaCv() == null) throw new RuntimeException("Thiếu mã chuyên viên");
                if (bcnRepository.existsByCauLacBoMaClbAndChuyenVienMaChuyenVienAndNhiemKy(maClb, dto.getMaCv(), dto.getNhiemKy()))
                    throw new RuntimeException("Chuyên viên " + dto.getMaCv() + " đã có trong BCN nhiệm kỳ " + dto.getNhiemKy());
                ChuyenVien cv = chuyenVienRepository.findById(dto.getMaCv())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyên viên: " + dto.getMaCv()));
                bcn.setChuyenVien(cv);
            }
            default -> { // SV
                if (dto.getMaSv() == null) throw new RuntimeException("Thiếu mã sinh viên");
                if (bcnRepository.existsByCauLacBoMaClbAndSinhVienMaSvAndNhiemKy(maClb, dto.getMaSv(), dto.getNhiemKy()))
                    throw new RuntimeException("Sinh viên " + dto.getMaSv() + " đã có trong BCN nhiệm kỳ " + dto.getNhiemKy());
                SinhVien sv = sinhVienRepository.findById(dto.getMaSv())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + dto.getMaSv()));
                bcn.setSinhVien(sv);
                // Đồng bộ chức vụ trong ThanhVienCLB
                syncChucVuThanhVien(maClb, dto.getMaSv(), dto.getChucVu());
            }
        }

        bcn = bcnRepository.save(bcn);
        log.info("BCN added: clb={}, loai={}, chucVu={}, nhiemKy={}", maClb, loai, dto.getChucVu(), dto.getNhiemKy());
        return toDTO(bcn);
    }

    @Transactional
    public BanChuNhiemCLBDTO update(String maClb, Long id, BanChuNhiemCLBDTO dto) {
        checkClbAccess(maClb);

        BanChuNhiemCLB bcn = bcnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi BCN: " + id));

        if (!bcn.getCauLacBo().getMaClb().equals(maClb)) {
            throw new RuntimeException("Không có quyền chỉnh sửa BCN của CLB khác");
        }

        bcn.setChucVu(dto.getChucVu());
        bcn.setNhiemKy(dto.getNhiemKy());
        if (dto.getTrangThai() != null) bcn.setTrangThai(dto.getTrangThai());
        bcn.setEmailLienHe(dto.getEmailLienHe());
        bcn.setSdt(dto.getSdt());
        bcn.setNgayBoNhiem(dto.getNgayBoNhiem());
        bcn.setNgayThoiChuc(dto.getNgayThoiChuc());
        bcn.setGhiChu(dto.getGhiChu());

        // Sync lại chức vụ nếu là SV
        if ("SV".equals(bcn.getLoaiNguoi()) && bcn.getSinhVien() != null) {
            syncChucVuThanhVien(maClb, bcn.getSinhVien().getMaSv(), dto.getChucVu());
        }

        bcn = bcnRepository.save(bcn);
        log.info("BCN updated: id={}, clb={}", id, maClb);
        return toDTO(bcn);
    }

    @Transactional
    public void remove(String maClb, Long id) {
        checkClbAccess(maClb);

        BanChuNhiemCLB bcn = bcnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi BCN: " + id));

        if (!bcn.getCauLacBo().getMaClb().equals(maClb)) {
            throw new RuntimeException("Không có quyền xóa BCN của CLB khác");
        }

        bcnRepository.delete(bcn);
        log.info("BCN removed: id={}, clb={}", id, maClb);
    }

    @Transactional
    public BanChuNhiemCLBDTO thoiChuc(String maClb, Long id) {
        checkClbAccess(maClb);

        BanChuNhiemCLB bcn = bcnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi BCN: " + id));

        if (!bcn.getCauLacBo().getMaClb().equals(maClb)) {
            throw new RuntimeException("Không có quyền chỉnh sửa BCN của CLB khác");
        }

        bcn.setTrangThai("THOI_CHUC");
        bcn.setNgayThoiChuc(java.time.LocalDate.now());
        bcn = bcnRepository.save(bcn);
        log.info("BCN thôi chức: id={}, clb={}", id, maClb);
        return toDTO(bcn);
    }

    /** Import BCN từ file Excel.
     *  Cột A: Loại (SV/GV/CV), B: Mã, C: Chức vụ, D: Email liên hệ, E: SĐT, F: Ngày bổ nhiệm (yyyy-MM-dd)
     */
    @Transactional
    public Map<String, Object> importFromExcel(String maClb, MultipartFile file, String nhiemKy) {
        checkClbAccess(maClb);
        int success = 0, fail = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String loai   = cellStr(row, 0, "SV").toUpperCase();
                    String ma     = cellStr(row, 1, "");
                    String chucVu = cellStr(row, 2, "Thành viên");
                    String email  = cellStr(row, 3, null);
                    String sdt    = cellStr(row, 4, null);
                    String ngay   = cellStr(row, 5, null);

                    if (ma.isBlank()) { errors.add("Dòng " + (i+1) + ": thiếu mã"); fail++; continue; }

                    BanChuNhiemCLBDTO dto = BanChuNhiemCLBDTO.builder()
                            .loaiNguoi(loai).chucVu(chucVu).nhiemKy(nhiemKy)
                            .emailLienHe(email).sdt(sdt)
                            .ngayBoNhiem(ngay != null && !ngay.isBlank() ? LocalDate.parse(ngay) : null)
                            .build();
                    if ("GV".equals(loai)) dto.setMaGv(ma);
                    else if ("CV".equals(loai)) dto.setMaCv(ma);
                    else dto.setMaSv(ma);

                    add(maClb, dto);
                    success++;
                } catch (Exception e) {
                    errors.add("Dòng " + (i+1) + ": " + e.getMessage());
                    fail++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Không thể đọc file Excel: " + e.getMessage());
        }

        return Map.of("success", success, "fail", fail, "errors", errors);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void syncChucVuThanhVien(String maClb, String maSv, String chucVuBCN) {
        String newChucVu = switch (chucVuBCN) {
            case "Chủ nhiệm"      -> "CHU_NHIEM";
            case "Phó chủ nhiệm" -> "PHO_CHU_NHIEM";
            default               -> "BAN_QUAN_LY";
        };
        thanhVienCLBRepository.findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb)
                .stream()
                .filter(tv -> tv.getSinhVien() != null && tv.getSinhVien().getMaSv().equals(maSv))
                .findFirst()
                .ifPresent(tv -> {
                    tv.setChucVu(newChucVu);
                    thanhVienCLBRepository.save(tv);
                });
    }

    private String cellStr(Row row, int col, String def) {
        Cell c = row.getCell(col);
        if (c == null) return def;
        return switch (c.getCellType()) {
            case STRING  -> c.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            default      -> def;
        };
    }

    private void checkClbAccess(String maClb) {
        String scopedClb = khoaScopeService.getCurrentMaClb();
        if (scopedClb != null && !scopedClb.equals(maClb)) {
            throw new RuntimeException("Không có quyền truy cập BCN của CLB khác");
        }
    }

    private BanChuNhiemCLBDTO toDTO(BanChuNhiemCLB b) {
        String loai   = b.getLoaiNguoi() != null ? b.getLoaiNguoi() : "SV";
        String tenNguoi, donVi, maSv = null, maGv = null, maCv = null;

        if ("GV".equals(loai) && b.getGiangVien() != null) {
            GiangVien gv = b.getGiangVien();
            tenNguoi = gv.getHoTen();
            donVi    = gv.getKhoa() != null ? gv.getKhoa().getTenKhoa() : "Giảng viên";
            maGv     = gv.getMaGv();
        } else if ("CV".equals(loai) && b.getChuyenVien() != null) {
            ChuyenVien cv = b.getChuyenVien();
            tenNguoi = cv.getHoTen();
            donVi    = cv.getChucDanh() != null ? cv.getChucDanh() : "Chuyên viên";
            maCv     = cv.getMaChuyenVien();
        } else {
            SinhVien sv = b.getSinhVien();
            tenNguoi = sv != null ? sv.getHoTen() : "?";
            donVi    = sv != null && sv.getLop() != null ? sv.getLop().getTenLop() : null;
            maSv     = sv != null ? sv.getMaSv() : null;
        }

        return BanChuNhiemCLBDTO.builder()
                .id(b.getId())
                .maClb(b.getCauLacBo().getMaClb())
                .tenClb(b.getCauLacBo().getTenClb())
                .loaiNguoi(loai)
                .maSv(maSv)
                .maGv(maGv)
                .maCv(maCv)
                .tenNguoi(tenNguoi)
                .donVi(donVi)
                .tenSv(maSv != null ? tenNguoi : null)
                .lop(donVi)
                .chucVu(b.getChucVu())
                .nhiemKy(b.getNhiemKy())
                .trangThai(b.getTrangThai())
                .emailLienHe(b.getEmailLienHe() != null ? b.getEmailLienHe()
                        : (b.getSinhVien() != null ? b.getSinhVien().getEmail()
                        : (b.getGiangVien() != null ? b.getGiangVien().getEmail()
                        : (b.getChuyenVien() != null ? b.getChuyenVien().getEmail() : null))))
                .sdt(b.getSdt() != null ? b.getSdt()
                        : (b.getSinhVien() != null ? b.getSinhVien().getSdt() : null))
                .ngayBoNhiem(b.getNgayBoNhiem())
                .ngayThoiChuc(b.getNgayThoiChuc())
                .ghiChu(b.getGhiChu())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
