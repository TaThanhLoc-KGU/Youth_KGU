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
import java.util.Collections;
import vn.payos.PayOS;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

@Service
@RequiredArgsConstructor
@Slf4j
public class DongPhiCLBService {

    private final DongPhiCLBRepository dongPhiRepo;
    private final CauLacBoRepository   clbRepo;
    private final SinhVienRepository   svRepo;
    private final HocKyRepository      hocKyRepo;
    private final ThanhVienCLBRepository tvRepo;
    private final ClbCauHinhRepository cauHinhRepo;
    private final PayOSConfigService   payOSConfigService;

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

    @Transactional(readOnly = true)
    public List<DongPhiCLBDTO> getByStudent(String maSv) {
        List<DongPhiCLB> list = dongPhiRepo.findBySinhVienMaSvOrderByCreatedAtDesc(maSv);
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

            String maSv = tv.getSinhVien().getMaSv();
            // maReference = "PHI" + maSv — ngắn gọn, đủ unique, dễ nhớ để ghi vào nội dung CK
            String ref = "PHI" + maSv;

            DongPhiCLB phi = DongPhiCLB.builder()
                    .cauLacBo(clb)
                    .sinhVien(tv.getSinhVien())
                    .hocKy(hk)
                    .soTien(soTien)
                    .trangThai("CHUA_DONG")
                    .maReference(ref)
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
    // WEBHOOK AUTO (Casso / SePay / PayOS)
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public String createPayOSPaymentLink(Long id, String returnUrl, String cancelUrl) {
        DongPhiCLB phi = dongPhiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phí: " + id));

        if ("DA_DONG".equals(phi.getTrangThai())) {
            throw new RuntimeException("Khoản phí này đã được thanh toán.");
        }

        ClbCauHinh cauHinh = cauHinhRepo.findById(phi.getCauLacBo().getMaClb())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa cấu hình CLB: " + phi.getCauLacBo().getMaClb()));

        PayOS payOS = payOSConfigService.getPayOSInstance(cauHinh);
        if (payOS == null) {
            throw new RuntimeException("CLB chưa cấu hình PayOS hợp lệ.");
        }

        try {
            Long orderCode = phi.getPayosOrderCode();
            if (orderCode == null || phi.getPayosPaymentUrl() == null) {
                // Sinh orderCode mới (tối đa 53 bits cho Javascript an toàn)
                // ID của phí kết hợp random hoặc time
                orderCode = Long.parseLong(phi.getId() + String.format("%04d", System.currentTimeMillis() % 10000));
                phi.setPayosOrderCode(orderCode);
            }

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Phí CLB " + phi.getCauLacBo().getMaClb() + " HK " + (phi.getHocKy() != null ? phi.getHocKy().getTenHocKy() : ""))
                    .quantity(1)
                    .price(phi.getSoTien().longValue())
                    .build();

            CreatePaymentLinkRequest paymentRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(phi.getSoTien().longValue())
                    .description("MSSV " + phi.getSinhVien().getMaSv())
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .item(item)
                    .build();

            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentRequest);
            phi.setPayosPaymentUrl(data.getCheckoutUrl());
            dongPhiRepo.save(phi);

            return data.getCheckoutUrl();

        } catch (Exception e) {
            log.error("Lỗi tạo PayOS checkout: ", e);
            throw new RuntimeException("Không thể tạo link thanh toán PayOS: " + e.getMessage());
        }
    }

    @Transactional
    public DongPhiCLBDTO processPayOSWebhook(String maClb, Object webhookBody) {
        ClbCauHinh cauHinh = cauHinhRepo.findById(maClb)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa cấu hình CLB: " + maClb));

        PayOS payOS = payOSConfigService.getPayOSInstance(cauHinh);
        if (payOS == null) {
            throw new RuntimeException("CLB chưa cấu hình PayOS hợp lệ.");
        }

        try {
            WebhookData data = payOS.webhooks().verify(webhookBody);
            
            // Tìm theo orderCode
            DongPhiCLB phi = dongPhiRepo.findAll().stream()
                    .filter(p -> p.getPayosOrderCode() != null && p.getPayosOrderCode().equals(data.getOrderCode()))
                    .findFirst()
                    .orElse(null);

            if (phi == null) {
                log.warn("PayOS Webhook: Không tìm thấy phí có orderCode {}", data.getOrderCode());
                return null;
            }

            if ("DA_DONG".equals(phi.getTrangThai())) {
                log.info("PayOS Webhook: Phí {} đã thanh toán rồi.", phi.getId());
                return toDTO(phi);
            }

            phi.setTrangThai("DA_DONG");
            phi.setHinhThuc("PAYOS");
            phi.setNgayDong(LocalDate.now());
            phi.setTransactionId(data.getReference());
            phi.setNoiDungCk(data.getDescription());
            phi.setSoTienCk(new BigDecimal(data.getAmount()));
            phi.setNguon("PAYOS");
            phi.setGhiChu("Tự động từ PayOS lúc " + LocalDateTime.now());

            DongPhiCLB saved = dongPhiRepo.save(phi);
            log.info("PayOS Webhook: MSSV {} đã đóng phí CLB {} thành công, GD: {}",
                    phi.getSinhVien().getMaSv(), phi.getCauLacBo().getMaClb(), data.getReference());
            return toDTO(saved);

        } catch (Exception e) {
            log.error("Lỗi xử lý PayOS webhook cho CLB {}: ", maClb, e);
            throw new RuntimeException("Lỗi xác thực webhook PayOS");
        }
    }

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

        // ── Bước 1: khớp theo maReference (ưu tiên — chính xác nhất) ─────────
        // Nội dung CK chứa chuỗi "PHI{MSSV}" → tìm pattern PHI + số 7-15 chữ số
        Optional<DongPhiCLB> found = extractReference(noiDung)
                .flatMap(ref -> dongPhiRepo.findByMaReferenceAndTrangThai(ref, "CHUA_DONG"));

        // ── Bước 2: fallback — tìm theo MSSV trong nội dung ─────────────────
        if (found.isEmpty()) {
            String maSv = extractMaSv(noiDung);
            if (maSv == null) {
                log.warn("Webhook {}: không parse được mã tham chiếu / MSSV từ '{}'", nguon, noiDung);
                return null;
            }
            List<DongPhiCLB> pending = dongPhiRepo.findChuaDongBySinhVien(maSv);
            if (pending.isEmpty()) {
                log.warn("Webhook: MSSV {} không có phí chưa đóng nào", maSv);
                return null;
            }
            found = Optional.of(pending.get(0)); // lấy bản ghi cũ nhất
        }

        if (found.isEmpty()) return null;

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
                nguon, phi.getSinhVien().getMaSv(), phi.getCauLacBo().getMaClb(), transactionId);
        return toDTO(saved);
    }

    /**
     * Tìm maReference (PHI + maSv) trong nội dung CK.
     * Ví dụ: "PHI23092006189 hoc phi clb" → "PHI23092006189"
     */
    private Optional<String> extractReference(String noiDung) {
        if (noiDung == null) return Optional.empty();
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("PHI(\\d{7,15})")
                .matcher(noiDung.toUpperCase().replaceAll("\\s+", ""));
        if (m.find()) return Optional.of("PHI" + m.group(1));
        return Optional.empty();
    }

    /**
     * Fallback: tìm MSSV (chuỗi số 7-15 ký tự) trong nội dung CK.
     * MSSV Việt Nam thường 8-11 chữ số.
     */
    private String extractMaSv(String noiDung) {
        if (noiDung == null) return null;
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\b(\\d{7,15})\\b")
                .matcher(noiDung.toUpperCase());
        String best = null;
        while (m.find()) {
            String candidate = m.group(1);
            // Ưu tiên chuỗi 8-12 chữ số (MSSV phổ biến)
            if (candidate.length() >= 8 && candidate.length() <= 12) return candidate;
            if (best == null) best = candidate;
        }
        return best;
    }

    @Transactional(readOnly = true)
    public DongPhiCLBDTO getById(Long id) {
        DongPhiCLB phi = dongPhiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi phí: " + id));
        return toDTO(phi);
    }

    // ══════════════════════════════════════════════════════════════
    // THỐNG KÊ
    // ══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
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
        // Khởi tạo proxy tránh LazyInitializationException
        String maClb = p.getCauLacBo().getMaClb();
        String tenClb = p.getCauLacBo().getTenClb(); // Trigger lazy load

        ClbCauHinh cfg = cauHinhRepo.findById(maClb).orElse(null);
        String prefix = (cfg != null && cfg.getMaXacThucCk() != null) ? cfg.getMaXacThucCk() : "PHI";

        // Định dạng tên học kỳ: Học kỳ X - Năm học YYYY-ZZZZ
        String tenHocKy = "N/A";
        String maHocKy = null;
        if (p.getHocKy() != null) {
            maHocKy = p.getHocKy().getMaHocKy();
            StringBuilder sb = new StringBuilder(p.getHocKy().getTenHocKy());
            // Trigger load collection của học kỳ
            if (p.getHocKy().getHocKyNamHocs() != null && !p.getHocKy().getHocKyNamHocs().isEmpty()) {
                NamHoc nh = p.getHocKy().getHocKyNamHocs().get(0).getNamHoc();
                if (nh != null) {
                    String tenNh = nh.getTenNamHoc();
                    if (tenNh.toLowerCase().startsWith("năm học")) {
                        sb.append(" - ").append(tenNh);
                    } else {
                        sb.append(" - Năm học ").append(tenNh);
                    }
                }
            }
            tenHocKy = sb.toString();
        }

        return DongPhiCLBDTO.builder()
                .id(p.getId())
                .maClb(maClb)
                .tenClb(tenClb)
                .maSv(p.getSinhVien().getMaSv())
                .hoTen(p.getSinhVien().getHoTen())
                .tenLop(p.getSinhVien().getLop() != null ? p.getSinhVien().getLop().getTenLop() : null)
                .maHocKy(maHocKy)
                .tenHocKy(tenHocKy)
                .soTien(p.getSoTien())
                .trangThai(p.getTrangThai())
                .trangThaiLabel(TRANG_THAI_LABEL.getOrDefault(p.getTrangThai(), p.getTrangThai()))
                .hinhThuc(p.getHinhThuc())
                .ngayDong(p.getNgayDong())
                .ghiChu(p.getGhiChu())
                .maReference(p.getMaReference())
                .transactionId(p.getTransactionId())
                .noiDungCk(p.getNoiDungCk())
                .soTienCk(p.getSoTienCk())
                .nguon(p.getNguon())
                .payosOrderCode(p.getPayosOrderCode())
                .payosPaymentUrl(p.getPayosPaymentUrl())
                .bankAccountNo(cfg != null ? cfg.getBankAccountNo() : null)
                .bankName(cfg != null ? cfg.getBankName() : null)
                .accountName(cfg != null ? cfg.getAccountName() : null)
                .maXacThucCk(prefix)
                .createdAt(p.getCreatedAt())
                .build();
    }

}
