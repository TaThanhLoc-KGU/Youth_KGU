package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.DongPhiCLBDTO;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DongPhiCLBService {

    private final DongPhiCLBRepository dongPhiRepo;
    private final CauLacBoRepository   clbRepo;
    private final SinhVienRepository   svRepo;
    private final HocKyRepository      hocKyRepo;
    private final ThanhVienCLBRepository tvRepo;

    private static final Map<String, String> TRANG_THAI_LABEL = Map.of(
            "CHUA_DONG", "Chưa đóng",
            "DA_DONG",   "Đã đóng",
            "MIEN_GIAM", "Miễn giảm",
            "QUA_HAN",   "Quá hạn"
    );

    // ══════════════════════════════════════════════════════════════
    // DANH SÁCH PHÍ
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<DongPhiCLBDTO> getByClb(String maClb, String maHocKy) {
        List<DongPhiCLB> list = maHocKy != null && !maHocKy.isBlank()
                ? dongPhiRepo.findByCauLacBoMaClbAndHocKyMaHocKy(maClb, maHocKy)
                : dongPhiRepo.findByCauLacBoMaClbOrderBySinhVienHoTenAsc(maClb);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // SINH PHÍ HỌC KỲ (tạo records cho toàn bộ thành viên active)
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public int generatePhiForHocKy(String maClb, String maHocKy, BigDecimal soTien, String createdBy) {
        CauLacBo clb = clbRepo.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("CLB không tồn tại: " + maClb));
        HocKy hk = hocKyRepo.findById(maHocKy)
                .orElseThrow(() -> new ResourceNotFoundException("Học kỳ không tồn tại: " + maHocKy));

        List<ThanhVienCLB> thanhViens = tvRepo.findByCauLacBoMaClbAndIsActiveTrueOrderByChucVuAsc(maClb);
        int created = 0;

        for (ThanhVienCLB tv : thanhViens) {
            // Bỏ qua nếu đã có record cho sinh viên này / học kỳ này
            boolean exists = dongPhiRepo
                    .findByCauLacBoMaClbAndSinhVienMaSvAndHocKyMaHocKy(maClb, tv.getSinhVien().getMaSv(), maHocKy)
                    .isPresent();
            if (exists) continue;

            DongPhiCLB phi = DongPhiCLB.builder()
                    .cauLacBo(clb)
                    .sinhVien(tv.getSinhVien())
                    .hocKy(hk)
                    .soTien(soTien)
                    .trangThai("CHUA_DONG")
                    .nguon("MANUAL")
                    .createdBy(createdBy)
                    .build();
            dongPhiRepo.save(phi);
            created++;
        }
        log.info("Sinh phí CLB {}: {} bản ghi cho học kỳ {} bởi {}", maClb, created, maHocKy, createdBy);
        return created;
    }

    // ══════════════════════════════════════════════════════════════
    // CẬP NHẬT THỦ CÔNG
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public DongPhiCLBDTO markDaDong(Long id, String hinhThuc, String ghiChu, String updatedBy) {
        DongPhiCLB phi = dongPhiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phí: " + id));
        phi.setTrangThai("DA_DONG");
        phi.setHinhThuc(hinhThuc != null ? hinhThuc : "TIEN_MAT");
        phi.setNgayDong(LocalDate.now());
        phi.setGhiChu(ghiChu);
        phi.setUpdatedBy(updatedBy);
        return toDTO(dongPhiRepo.save(phi));
    }

    @Transactional
    public DongPhiCLBDTO markMienGiam(Long id, String ghiChu, String updatedBy) {
        DongPhiCLB phi = dongPhiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phí: " + id));
        phi.setTrangThai("MIEN_GIAM");
        phi.setNgayDong(LocalDate.now());
        phi.setGhiChu(ghiChu);
        phi.setUpdatedBy(updatedBy);
        return toDTO(dongPhiRepo.save(phi));
    }

    @Transactional
    public DongPhiCLBDTO resetChuaDong(Long id, String updatedBy) {
        DongPhiCLB phi = dongPhiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phí: " + id));
        phi.setTrangThai("CHUA_DONG");
        phi.setHinhThuc(null);
        phi.setNgayDong(null);
        phi.setTransactionId(null);
        phi.setNguon("MANUAL");
        phi.setUpdatedBy(updatedBy);
        return toDTO(dongPhiRepo.save(phi));
    }

    // ══════════════════════════════════════════════════════════════
    // WEBHOOK AUTO (Casso / SePay)
    // ══════════════════════════════════════════════════════════════

    /**
     * Xử lý giao dịch đến từ webhook Casso/SePay.
     * Nội dung CK phải chứa: "[PREFIX] [MSSV]" hoặc "[PREFIX] [MA_CLB] [MSSV]"
     * Ví dụ: "PHICLB CLB001 2100001" hoặc "CLB001 2100001"
     *
     * @param transactionId  Mã GD duy nhất từ ngân hàng
     * @param noiDung        Nội dung chuyển khoản gốc
     * @param soTienCk       Số tiền thực nhận
     * @param nguon          "CASSO" | "SEPAY"
     * @return DTO nếu match thành công, null nếu không nhận ra
     */
    @Transactional
    public DongPhiCLBDTO processWebhookTransaction(
            String transactionId,
            String noiDung,
            BigDecimal soTienCk,
            String nguon) {

        // Idempotency: tránh xử lý 2 lần
        if (dongPhiRepo.existsByTransactionId(transactionId)) {
            log.info("Webhook: transaction {} đã xử lý rồi, bỏ qua.", transactionId);
            return null;
        }

        // Parse nội dung: tìm MSSV (chuỗi số 7 ký tự trở lên)
        String maSv = extractMaSv(noiDung);
        if (maSv == null) {
            log.warn("Webhook {}: không parse được MSSV từ nội dung '{}'", nguon, noiDung);
            return null;
        }

        // Tìm bản ghi phí chưa đóng
        Optional<DongPhiCLB> found = dongPhiRepo.findAll().stream()
                .filter(p -> p.getSinhVien().getMaSv().equalsIgnoreCase(maSv)
                          && "CHUA_DONG".equals(p.getTrangThai()))
                .findFirst();

        if (found.isEmpty()) {
            log.warn("Webhook: MSSV {} không có phí chưa đóng nào", maSv);
            return null;
        }

        DongPhiCLB phi = found.get();
        phi.setTrangThai("DA_DONG");
        phi.setHinhThuc("WEBHOOK_AUTO");
        phi.setNgayDong(LocalDate.now());
        phi.setTransactionId(transactionId);
        phi.setNoiDungCk(noiDung);
        phi.setSoTienCk(soTienCk);
        phi.setNguon(nguon);
        phi.setGhiChu("Tự động từ " + nguon + " lúc " + LocalDateTime.now());

        DongPhiCLB saved = dongPhiRepo.save(phi);
        log.info("Webhook {} - MSSV {} đã đóng phí CLB {} tự động, GD: {}",
                nguon, maSv, phi.getCauLacBo().getMaClb(), transactionId);
        return toDTO(saved);
    }

    /**
     * Extract MSSV từ nội dung chuyển khoản.
     * Ưu tiên: chuỗi số liên tiếp 7+ ký tự (MSSV thường là 7 chữ số).
     */
    private String extractMaSv(String noiDung) {
        if (noiDung == null) return null;
        // Tìm chuỗi số 7-10 ký tự trong nội dung
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\b(\\d{7,10})\\b")
                .matcher(noiDung.toUpperCase());
        if (m.find()) return m.group(1);
        return null;
    }

    // ══════════════════════════════════════════════════════════════
    // THỐNG KÊ
    // ══════════════════════════════════════════════════════════════

    public Map<String, Object> getStats(String maClb, String maHocKy) {
        List<DongPhiCLBDTO> list = getByClb(maClb, maHocKy);
        long daDong   = list.stream().filter(p -> "DA_DONG".equals(p.getTrangThai())).count();
        long mienGiam = list.stream().filter(p -> "MIEN_GIAM".equals(p.getTrangThai())).count();
        long chuaDong = list.stream().filter(p -> "CHUA_DONG".equals(p.getTrangThai())).count();
        BigDecimal tongThu = list.stream()
                .filter(p -> "DA_DONG".equals(p.getTrangThai()) || "MIEN_GIAM".equals(p.getTrangThai()))
                .map(DongPhiCLBDTO::getSoTienCk)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "total", list.size(),
                "daDong", daDong,
                "mienGiam", mienGiam,
                "chuaDong", chuaDong,
                "tongThu", tongThu
        );
    }

    // ══════════════════════════════════════════════════════════════
    // MAPPER
    // ══════════════════════════════════════════════════════════════

    private DongPhiCLBDTO toDTO(DongPhiCLB p) {
        return DongPhiCLBDTO.builder()
                .id(p.getId())
                .maClb(p.getCauLacBo().getMaClb())
                .tenClb(p.getCauLacBo().getTenClb())
                .maSv(p.getSinhVien().getMaSv())
                .hoTen(p.getSinhVien().getHoTen())
                .tenLop(p.getSinhVien().getLop() != null ? p.getSinhVien().getLop().getTenLop() : null)
                .maHocKy(p.getHocKy() != null ? p.getHocKy().getMaHocKy() : null)
                .tenHocKy(p.getHocKy() != null ? p.getHocKy().getTenHocKy() : null)
                .soTien(p.getSoTien())
                .trangThai(p.getTrangThai())
                .trangThaiLabel(TRANG_THAI_LABEL.getOrDefault(p.getTrangThai(), p.getTrangThai()))
                .hinhThuc(p.getHinhThuc())
                .ngayDong(p.getNgayDong())
                .ghiChu(p.getGhiChu())
                .transactionId(p.getTransactionId())
                .noiDungCk(p.getNoiDungCk())
                .soTienCk(p.getSoTienCk())
                .nguon(p.getNguon())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
