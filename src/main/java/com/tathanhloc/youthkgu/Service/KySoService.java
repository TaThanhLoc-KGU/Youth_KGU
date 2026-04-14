package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChuKyDTO;
import com.tathanhloc.youthkgu.DTO.ConDauDTO;
import com.tathanhloc.youthkgu.DTO.DiemDanhHoatDongDTO;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Model.DanhSachBanHanh;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Repository.DanhSachBanHanhRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName;
import org.apache.pdfbox.pdmodel.graphics.image.*;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.ExternalSigningSupport;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.math.BigInteger;
import java.nio.file.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.util.*;
import java.util.List;

/**
 * Service ký số: quản lý chữ ký, con dấu, xuất PDF có chữ ký số, audit log.
 *
 * Quy trình bảo mật:
 * 1. Vẽ chữ ký/con dấu (ảnh) lên trang cuối PDF.
 * 2. Ký số cryptographic bằng X.509 self-signed cert + RSA-2048 + CMS/PKCS7 detached.
 *    → Text vẫn selectable; Adobe Acrobat hiển thị "Document was certified, validity UNKNOWN".
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KySoService {

    private final ChuKyRepository      chuKyRepository;
    private final ConDauRepository     conDauRepository;
    private final HoatDongRepository   hoatDongRepository;
    private final DiemDanhHoatDongService diemDanhService;
    private final KySoLichSuRepository lichSuRepository;
    private final DanhSachBanHanhRepository banHanhRepository;

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    // ─── PDF layout constants ─────────────────────────────────────────────
    static final float PAGE_W  = PDRectangle.A4.getWidth();   // 595.28 pt
    static final float PAGE_H  = PDRectangle.A4.getHeight();  // 841.89 pt
    // Lề chuẩn hành chính VN: trái 3cm, còn lại 2cm (1cm = 28.35pt)
    static final float MARGIN_L = 85f;   // 3cm
    static final float MARGIN_R = 57f;   // 2cm
    static final float MARGIN_T = 57f;   // 2cm
    static final float MARGIN_B = 57f;   // 2cm
    // Bảng: tổng độ rộng = 595.28 - 85 - 57 = 453pt
    static final float[] COL_WIDTHS   = {25f, 145f, 68f, 80f, 135f};
    static final String[] COL_HEADERS = {"STT", "Họ Và Tên", "Lớp", "Mssv", "Khoa"};
    static final float ROW_H          = 17f;
    static final float HEADER_ROW_H   = 20f;
    // Chiều cao khối chữ ký (text label + khoảng trống ký + tên): dùng để tính pagination
    static final float SIG_BLOCK_H    = 125f;

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC CRUD — Chữ ký
    // ═══════════════════════════════════════════════════════════════════════

    public List<ChuKyDTO> getAllChuKy() {
        return chuKyRepository.findAll().stream().map(this::toChuKyDTO).toList();
    }

    public ChuKyDTO uploadChuKy(MultipartFile file, String tenNguoiKy, String chucVu, boolean laMacDinh) {
        validateImageFile(file);
        if (laMacDinh) clearDefaultChuKy();
        String duongDan = saveImage(file, "chu-ky");
        return toChuKyDTO(chuKyRepository.save(
                ChuKy.builder().tenNguoiKy(tenNguoiKy).chucVu(chucVu)
                        .duongDan(duongDan).laMacDinh(laMacDinh).build()));
    }

    public void deleteChuKy(Long id) {
        ChuKy ck = chuKyRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy chữ ký"));
        deleteFile(ck.getDuongDan());
        chuKyRepository.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC CRUD — Con dấu
    // ═══════════════════════════════════════════════════════════════════════

    public List<ConDauDTO> getAllConDau() {
        return conDauRepository.findAll().stream().map(this::toConDauDTO).toList();
    }

    public ConDauDTO uploadConDau(MultipartFile file, String ten, boolean laMacDinh) {
        validateImageFile(file);
        if (laMacDinh) clearDefaultConDau();
        String duongDan = saveImage(file, "con-dau");
        return toConDauDTO(conDauRepository.save(
                ConDau.builder().ten(ten).duongDan(duongDan).laMacDinh(laMacDinh).build()));
    }

    public void deleteConDau(Long id) {
        ConDau cd = conDauRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy con dấu"));
        deleteFile(cd.getDuongDan());
        conDauRepository.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PREVIEW — Sinh trang ảnh xem trước (không có chữ ký)
    // ═══════════════════════════════════════════════════════════════════════

    /** Kết quả preview: danh sách trang dưới dạng base64 PNG + kích thước trang. */
    public record PreviewResult(
            List<String> pages,
            float pageWidthPt, float pageHeightPt,
            int totalStudents,
            float sigBlockTopY,   // Y (pt từ trên) nơi khối chữ ký bắt đầu (trang cuối)
            float leftColCX,      // tâm X cột trái (pt)
            float rightColCX      // tâm X cột phải (pt)
    ) {}

    @Transactional(readOnly = true)
    public PreviewResult generatePreview(String maHoatDong) throws IOException {
        return generatePreview(maHoatDong, null, null, null);
    }

    public PreviewResult generatePreview(String maHoatDong,
                                         List<OverrideRow> overrideRows,
                                         String overrideTieuDe,
                                         String overrideNgayStr) throws IOException {
        HoatDong hd = loadHoatDong(maHoatDong);

        // Nếu có overrideRows thì dùng, nếu không dùng từ DB
        List<DiemDanhHoatDongDTO> ds;
        if (overrideRows != null && !overrideRows.isEmpty()) {
            ds = overrideRows.stream().map(r -> DiemDanhHoatDongDTO.builder()
                    .hoTenSinhVien(r.hoTen()).maLop(r.maLop()).maSv(r.maSv()).tenKhoa(r.tenKhoa()).build()
            ).toList();
        } else {
            ds = loadDanhSach(maHoatDong);
        }

        // Tiêu đề và ngày override nếu có
        String tieuDe  = (overrideTieuDe  != null && !overrideTieuDe.isBlank())  ? overrideTieuDe  : null;
        String ngayStr = (overrideNgayStr != null && !overrideNgayStr.isBlank()) ? overrideNgayStr : null;

        // Dùng placeholder text cho chữ ký (preview chưa ký thật)
        DraftResult draft = buildDraftPDF(hd, ds, "BÍ THƯ", "", "", "", null, tieuDe, ngayStr);

        List<String> pages = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(draft.pdf())) {
            PDFRenderer renderer = new PDFRenderer(doc);
            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage img = renderer.renderImageWithDPI(i, 96, ImageType.RGB);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(img, "png", baos);
                pages.add("data:image/png;base64," +
                        Base64.getEncoder().encodeToString(baos.toByteArray()));
            }
        }
        return new PreviewResult(pages, PAGE_W, PAGE_H, ds.size(),
                draft.sigBlockTopY(), draft.leftCX(), draft.rightCX());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // XUẤT PDF CÓ KÝ SỐ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Vị trí phần tử trên trang (tính theo PDF points, gốc tọa độ góc TRÊN-TRÁI của trang,
     * front-end gửi lên từ drag-and-drop trên ảnh preview).
     * width/height là kích thước phần tử (pt).
     */
    public record ElementPos(float x, float y, float width, float height) {}

    /**
     * Một dòng trong bảng đã được chỉnh sửa trực tiếp trên giao diện.
     * Backend sẽ dùng dữ liệu này thay vì lấy từ DB.
     */
    public record OverrideRow(String hoTen, String maLop, String maSv, String tenKhoa) {}

    /** Toàn bộ tham số yêu cầu xuất PDF. */
    public record XuatPDFRequest(
            String maHoatDong,
            String loaiKy,
            Long   chuKyBiThuId,
            String tenNguoiKy,
            Long   chuKyNguoiLapId,
            String tenNguoiLap,
            String chucVuNguoiLap,
            Long   conDauId,
            // Vị trí kéo thả (null = dùng vị trí mặc định)
            ElementPos posBiThu,
            ElementPos posNguoiLap,
            ElementPos posConDau,
            // Danh sách SV tuỳ chỉnh (null = lấy toàn bộ checked-in)
            List<String> customMaSvList,
            // Override nội dung text trực tiếp (admin sửa trên giao diện)
            List<OverrideRow> overrideRows,   // null = dùng DB
            String overrideTieuDe,            // null = dùng tên hoạt động
            String overrideNgayStr,           // null = dùng ngày tổ chức
            // Audit
            String nguoiThucHien,
            String ipAddress
    ) {}

    /** Kết quả buildDraftPDF: PDF bytes + Y-coordinate cuối bảng trên trang cuối */
    private record DraftResult(byte[] pdf, float sigBlockTopY, float leftCX, float rightCX) {}

    @Transactional
    public byte[] xuatDanhSachPDF(XuatPDFRequest req) throws IOException {
        HoatDong hd = loadHoatDong(req.maHoatDong());
        List<DiemDanhHoatDongDTO> ds = loadDanhSach(req.maHoatDong(), req.customMaSvList());

        byte[] imgBiThu   = loadOptionalImage(req.chuKyBiThuId(),    chuKyRepository);
        byte[] imgNguoiLap = loadOptionalImage(req.chuKyNguoiLapId(), chuKyRepository);
        byte[] imgConDau   = req.conDauId() != null
                ? loadImageFromConDau(req.conDauId()) : null;

        // Bước 1: Sinh PDF nháp — dùng override nếu admin đã chỉnh sửa nội dung
        DraftResult draft = buildDraftPDF(hd, ds,
                req.loaiKy(), req.tenNguoiKy(), req.tenNguoiLap(), req.chucVuNguoiLap(),
                req.overrideRows(), req.overrideTieuDe(), req.overrideNgayStr());

        // Bước 2: Áp ảnh chữ ký / con dấu vào trang cuối
        byte[] withImages = applySignatureImages(draft, req, imgBiThu, imgNguoiLap, imgConDau);

        // Bước 3: Ký số cryptographic (X.509 self-signed, SHA256withRSA, CMS/PKCS7 detached)
        //         → text vẫn selectable; Acrobat hiển thị "Document was certified"
        byte[] certifiedPdf;
        try {
            certifiedPdf = signWithCertificate(withImages, req.tenNguoiKy());
        } catch (Exception e) {
            log.warn("Không thể ký số cryptographic, trả PDF thường: {}", e.getMessage());
            certifiedPdf = withImages;
        }

        // Bước 4: Audit log
        String tenFile = "danh_sach_" + req.maHoatDong() + ".pdf";
        lichSuRepository.save(KySoLichSu.builder()
                .maHoatDong(req.maHoatDong())
                .tenHoatDong(hd.getTenHoatDong())
                .loaiKy(req.loaiKy())
                .tenNguoiKy(req.tenNguoiKy())
                .tenNguoiLap(req.tenNguoiLap())
                .coConDau(req.conDauId() != null)
                .nguoiThucHien(req.nguoiThucHien())
                .ipAddress(req.ipAddress())
                .tenFile(tenFile)
                .tongSv(ds.size())
                .build());

        return certifiedPdf;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BAN HÀNH — Lưu PDF ra disk + ghi metadata DB
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Ban hành chính thức danh sách: tạo PDF ký số, lưu file vào disk, ghi metadata vào DB.
     * File lưu tại: {uploadBasePath}/ban-hanh/{maHoatDong}_{timestamp}.pdf
     */
    @Transactional
    public DanhSachBanHanh banHanhDanhSach(XuatPDFRequest req) throws IOException {
        HoatDong hd = loadHoatDong(req.maHoatDong());
        List<DiemDanhHoatDongDTO> ds = loadDanhSach(req.maHoatDong(), req.customMaSvList());

        byte[] imgBiThu    = loadOptionalImage(req.chuKyBiThuId(),    chuKyRepository);
        byte[] imgNguoiLap = loadOptionalImage(req.chuKyNguoiLapId(), chuKyRepository);
        byte[] imgConDau   = req.conDauId() != null ? loadImageFromConDau(req.conDauId()) : null;

        // Bước 1: Sinh PDF — dùng override nếu admin đã chỉnh sửa nội dung
        DraftResult draft = buildDraftPDF(hd, ds,
                req.loaiKy(), req.tenNguoiKy(), req.tenNguoiLap(), req.chucVuNguoiLap(),
                req.overrideRows(), req.overrideTieuDe(), req.overrideNgayStr());

        // Bước 2: Áp ảnh chữ ký
        byte[] withImages = applySignatureImages(draft, req, imgBiThu, imgNguoiLap, imgConDau);

        // Bước 3: Ký số cryptographic
        byte[] pdfBytes;
        try {
            pdfBytes = signWithCertificate(withImages, req.tenNguoiKy());
        } catch (Exception e) {
            log.warn("Không thể ký số khi ban hành, dùng PDF thường: {}", e.getMessage());
            pdfBytes = withImages;
        }

        // Bước 4: Lưu file vào disk
        String timestamp = String.valueOf(System.currentTimeMillis());
        String tenFile = "danh_sach_" + req.maHoatDong() + "_" + timestamp + ".pdf";
        Path banHanhDir = Paths.get(uploadBasePath, "ban-hanh");
        Files.createDirectories(banHanhDir);
        Path filePath = banHanhDir.resolve(tenFile);
        Files.write(filePath, pdfBytes);

        // Bước 5: Ghi metadata vào DB
        DanhSachBanHanh entity = DanhSachBanHanh.builder()
                .maHoatDong(req.maHoatDong())
                .tenHoatDong(hd.getTenHoatDong())
                .loaiKy(req.loaiKy())
                .tenNguoiKy(req.tenNguoiKy())
                .tenNguoiLap(req.tenNguoiLap())
                .chucVuNguoiLap(req.chucVuNguoiLap())
                .coConDau(req.conDauId() != null)
                .tongSv(ds.size())
                .tenFile(tenFile)
                .duongDanFile(filePath.toString())
                .nguoiBanHanh(req.nguoiThucHien())
                .ipAddress(req.ipAddress())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        entity = banHanhRepository.save(entity);

        // Bước 6: Audit log (dùng lại KySoLichSu)
        lichSuRepository.save(KySoLichSu.builder()
                .maHoatDong(req.maHoatDong())
                .tenHoatDong(hd.getTenHoatDong())
                .loaiKy(req.loaiKy())
                .tenNguoiKy(req.tenNguoiKy())
                .tenNguoiLap(req.tenNguoiLap())
                .coConDau(req.conDauId() != null)
                .nguoiThucHien(req.nguoiThucHien())
                .ipAddress(req.ipAddress())
                .tenFile(tenFile)
                .tongSv(ds.size())
                .build());

        log.info("Ban hành danh sách {} — file: {}", req.maHoatDong(), tenFile);
        return entity;
    }

    /**
     * Đọc file PDF đã ban hành từ disk.
     */
    public byte[] readBanHanhFile(Long id) throws IOException {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành id=" + id));
        Path filePath = Paths.get(entity.getDuongDanFile());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File ban hành không tồn tại trên server: " + entity.getTenFile());
        }
        return Files.readAllBytes(filePath);
    }

    /**
     * Lấy danh sách các bản ban hành theo hoạt động.
     */
    public List<DanhSachBanHanh> getBanHanhByHoatDong(String maHoatDong) {
        return banHanhRepository.findByMaHoatDongOrderByCreatedAtDesc(maHoatDong);
    }

    /**
     * Lấy bản ban hành mới nhất của một hoạt động.
     */
    public java.util.Optional<DanhSachBanHanh> getLatestBanHanh(String maHoatDong) {
        return banHanhRepository.findTopByMaHoatDongOrderByCreatedAtDesc(maHoatDong);
    }

    /**
     * Hủy ban hành: xóa record DB và xóa file vật lý trên disk.
     */
    @Transactional
    public void huyBanHanh(Long id) {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành id=" + id));

        // Xóa file vật lý
        if (entity.getDuongDanFile() != null) {
            try {
                Path filePath = Paths.get(entity.getDuongDanFile());
                Files.deleteIfExists(filePath);
                log.info("Đã xóa file ban hành: {}", filePath);
            } catch (IOException e) {
                log.warn("Không thể xóa file ban hành {}: {}", entity.getDuongDanFile(), e.getMessage());
            }
        }

        banHanhRepository.deleteById(id);
        log.info("Đã hủy ban hành id={}, file={}", id, entity.getTenFile());
    }

    /**
     * Lấy tất cả bản ban hành có phân trang và tìm kiếm.
     */
    public org.springframework.data.domain.Page<DanhSachBanHanh> getAllBanHanh(int page, int size, String search) {
        org.springframework.data.domain.PageRequest pr = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            return banHanhRepository.findByTenHoatDongContainingIgnoreCaseOrMaHoatDongContainingIgnoreCase(
                    search, search, pr);
        }
        return banHanhRepository.findAll(pr);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════════════════════════════════════

    public List<KySoLichSu> getLichSu(String maHoatDong) {
        if (maHoatDong != null && !maHoatDong.isBlank())
            return lichSuRepository.findByMaHoatDongOrderByCreatedAtDesc(maHoatDong);
        return lichSuRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, 200,
                        org.springframework.data.domain.Sort.by("createdAt").descending())
        ).getContent();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF BUILDER — Tạo PDF nháp (không ký, không mã hóa)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Xây dựng PDF nháp gồm: header chuẩn hành chính + bảng danh sách + khối chữ ký text.
     * Chữ ký ảnh chưa được áp, chỉ có text label để xem trước.
     *
     * @param loaiKy       "BÍ THƯ" hoặc "PHÓ BÍ THƯ"
     * @param tenNguoiKy   Họ tên bí thư / phó bí thư
     * @param tenNguoiLap  Họ tên người lập danh sách
     * @param chucVuNguoiLap Chức vụ người lập
     */
    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap) throws IOException {
        return buildDraftPDF(hd, ds, loaiKy, tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                null, null, null);
    }

    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap,
                                       List<OverrideRow> overrideRows,
                                       String overrideTieuDe, String overrideNgayStr) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDFont fontReg  = loadFont(doc, false);
            PDFont fontBold = loadFont(doc, true);

            // Tiêu đề và ngày: ưu tiên override từ giao diện, fallback về DB
            String tieuDe  = (overrideTieuDe  != null && !overrideTieuDe.isBlank())
                    ? overrideTieuDe  : buildTieuDe(hd);
            LocalDate ngayKy = hd.getNgayToChuc() != null ? hd.getNgayToChuc() : LocalDate.now();
            String ngayStr = (overrideNgayStr != null && !overrideNgayStr.isBlank())
                    ? overrideNgayStr
                    : String.format("An Giang, ngày %02d tháng %02d năm %d",
                            ngayKy.getDayOfMonth(), ngayKy.getMonthValue(), ngayKy.getYear());

            // Tâm X của 2 cột (dùng cho căn giữa text khối ký)
            float midX    = PAGE_W / 2f;
            float leftCX  = MARGIN_L + (midX - MARGIN_L) / 2f;
            float rightCX = midX + (PAGE_W - MARGIN_R - midX) / 2f;

            // Tính phân trang — trừ chiều cao khối ký khỏi trang cuối
            // (dự phòng: luôn trừ SIG_BLOCK_H để đảm bảo có chỗ ký trên mọi trang cuối)
            float headerH   = 75f;   // header 2 cột
            float titleH    = tieuDe.contains("\n") ? 48f : 28f;
            float availFirst = PAGE_H - MARGIN_T - headerH - titleH - HEADER_ROW_H - SIG_BLOCK_H - MARGIN_B;
            float availOther = PAGE_H - MARGIN_T - HEADER_ROW_H - SIG_BLOCK_H - MARGIN_B;

            int rowsFirst = Math.max(1, (int)(availFirst / ROW_H));
            int rowsOther = Math.max(1, (int)(availOther / ROW_H));

            // Nếu admin đã chỉnh sửa nội dung trực tiếp → dùng override rows thay vì DB
            List<DiemDanhHoatDongDTO> rows = (overrideRows != null && !overrideRows.isEmpty())
                    ? overrideRows.stream().map(r -> DiemDanhHoatDongDTO.builder()
                            .hoTenSinhVien(r.hoTen())
                            .maLop(r.maLop())
                            .maSv(r.maSv())
                            .tenKhoa(r.tenKhoa())
                            .build()).collect(java.util.stream.Collectors.toList())
                    : ds;

            List<List<DiemDanhHoatDongDTO>> pages = paginate(rows, rowsFirst, rowsOther);
            int total = pages.size();

            float sigBlockTopY = 0f; // Y tính từ trên xuống (px ~= pt ở 96 DPI)

            for (int p = 0; p < total; p++) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = PAGE_H - MARGIN_T;

                    if (p == 0) {
                        y = drawHeader(cs, fontReg, fontBold, y, ngayStr);
                        y -= 8f;
                        y = drawTitle(cs, fontBold, tieuDe, y);
                        y -= 8f;
                    }

                    y = drawTableHeader(cs, fontBold, y);
                    y = drawTableRowsFull(cs, fontReg, pages.get(p), y, countOffset(pages, p));

                    // Vẽ khối chữ ký text ngay sau bảng (chỉ trên trang CUỐI)
                    if (p == total - 1) {
                        y -= 15f; // khoảng cách sau bảng
                        // sigBlockTopY tính từ trên xuống (PDF Y từ dưới → convert)
                        sigBlockTopY = PAGE_H - y;
                        drawSignBlockText(cs, fontBold, fontReg, y, loaiKy,
                                tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                                leftCX, rightCX);
                    }
                }
            }

            doc.save(out);
            return new DraftResult(out.toByteArray(), sigBlockTopY, leftCX, rightCX);
        }
    }

    /**
     * Vẽ text cố định của khối chữ ký lên trang cuối (ngay sau bảng).
     * Ảnh chữ ký sẽ được áp đè lên sau ở bước applySignatureImages.
     *
     * Cột TRÁI: TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG / [loaiKy] / [tenNguoiKy]
     * Cột PHẢI: NGƯỜI LẬP DANH SÁCH / [tenNguoiLap] / ([chucVuNguoiLap])
     */
    private void drawSignBlockText(PDPageContentStream cs,
                                    PDFont fontBold, PDFont fontReg,
                                    float y,
                                    String loaiKy, String tenNguoiKy,
                                    String tenNguoiLap, String chucVuNguoiLap,
                                    float leftCX, float rightCX) throws IOException {
        float tw;
        cs.setFont(fontBold, 10f);

        // Dòng 1: tiêu đề cột
        String lbl1 = "TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG";
        String lbl2 = "NGƯỜI LẬP DANH SÁCH";
        tw = strWidth(fontBold, 10f, lbl1);
        drawText(cs, lbl1, leftCX - tw / 2f, y);
        tw = strWidth(fontBold, 10f, lbl2);
        drawText(cs, lbl2, rightCX - tw / 2f, y);
        y -= 14f;

        // Dòng 2: chức vụ bên trái
        String role = (loaiKy != null && !loaiKy.isBlank()) ? loaiKy.toUpperCase() : "BÍ THƯ";
        tw = strWidth(fontBold, 10f, role);
        drawText(cs, role, leftCX - tw / 2f, y);
        y -= 60f; // khoảng trống cho ảnh chữ ký

        // Dòng 3: tên người ký
        cs.setFont(fontBold, 10f);
        if (tenNguoiKy != null && !tenNguoiKy.isBlank()) {
            tw = strWidth(fontBold, 10f, tenNguoiKy);
            drawText(cs, tenNguoiKy, leftCX - tw / 2f, y);
        }
        if (tenNguoiLap != null && !tenNguoiLap.isBlank()) {
            tw = strWidth(fontBold, 10f, tenNguoiLap);
            drawText(cs, tenNguoiLap, rightCX - tw / 2f, y);
        }
        y -= 14f;

        // Dòng 4: chức vụ người lập (nếu có)
        if (chucVuNguoiLap != null && !chucVuNguoiLap.isBlank()) {
            cs.setFont(fontReg, 9f);
            String cv = "(" + chucVuNguoiLap + ")";
            tw = strWidth(fontReg, 9f, cv);
            drawText(cs, cv, rightCX - tw / 2f, y);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÁP CHỮ KÝ VÀO TRANG CUỐI
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Áp đè ảnh chữ ký và con dấu vào trang cuối của draft PDF.
     * Text khối ký đã có sẵn (từ buildDraftPDF), chỉ cần thêm ảnh.
     *
     * Cột TRÁI: con dấu + ảnh chữ ký BTV (posBiThu)
     * Cột PHẢI: ảnh chữ ký người lập (posNguoiLap)
     */
    private byte[] applySignatureImages(DraftResult draft,
                                         XuatPDFRequest req,
                                         byte[] imgBiThu,
                                         byte[] imgNguoiLap,
                                         byte[] imgConDau) throws IOException {
        try (PDDocument doc = Loader.loadPDF(draft.pdf());
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int lastPageIdx = doc.getNumberOfPages() - 1;
            PDPage lastPage = doc.getPage(lastPageIdx);

            // Kích thước ảnh chữ ký / con dấu
            float sigW = 90f, sigH = 52f;
            float stW  = 95f, stH  = 60f;

            // Vị trí mặc định dựa vào sigBlockTopY của draft (Y từ trên → PDF Y từ dưới)
            // sigBlockTopY là Y tính từ TRÊN xuống (px ≈ pt), convert sang PDF coords (từ dưới)
            float sigTextTopPdfY = PAGE_H - draft.sigBlockTopY(); // y PDF của dòng tiêu đề khối ký
            float defaultImgY    = sigTextTopPdfY - 14f - 14f - sigH; // sau 2 dòng text (tiêu đề + role)

            float leftCX  = draft.leftCX();
            float rightCX = draft.rightCX();

            float bX = resolveX(req.posBiThu(),    leftCX  - sigW / 2f);
            float bY = resolveY(req.posBiThu(),    defaultImgY, sigH);
            float nX = resolveX(req.posNguoiLap(), rightCX - sigW / 2f);
            float nY = resolveY(req.posNguoiLap(), defaultImgY, sigH);
            float dX = resolveX(req.posConDau(),   leftCX  - stW / 2f - 5f);
            float dY = resolveY(req.posConDau(),   defaultImgY - 4f, stH);

            try (PDPageContentStream cs = new PDPageContentStream(
                    doc, lastPage, PDPageContentStream.AppendMode.APPEND, true, true)) {

                // Con dấu (vẽ trước để chữ ký đè lên)
                if (imgConDau != null) {
                    PDImageXObject stamp = PDImageXObject.createFromByteArray(doc, imgConDau, "dau");
                    cs.drawImage(stamp, dX, dY, stW, stH);
                }

                // Ảnh chữ ký BTV (cột trái)
                if (imgBiThu != null) {
                    PDImageXObject sig = PDImageXObject.createFromByteArray(doc, imgBiThu, "btv");
                    cs.drawImage(sig, bX, bY, sigW, sigH);
                }

                // Ảnh chữ ký người lập (cột phải)
                if (imgNguoiLap != null) {
                    PDImageXObject sig = PDImageXObject.createFromByteArray(doc, imgNguoiLap, "nlap");
                    cs.drawImage(sig, nX, nY, sigW, sigH);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Resolve X từ ElementPos.
     * Front-end lưu toạ độ theo hệ pt (dùng pageWidthPt/pageHeightPt làm naturalW/H),
     * nên pos.x() đã là PDF points — dùng trực tiếp.
     */
    private float resolveX(ElementPos pos, float defaultVal) {
        if (pos == null) return defaultVal;
        return pos.x();
    }

    /**
     * Resolve Y: frontend dùng toạ độ Y tính từ TRÊN xuống (pt),
     * PDF dùng Y tính từ DƯỚI lên → đảo trục + trừ chiều cao phần tử.
     */
    private float resolveY(ElementPos pos, float defaultVal, float elemHeightPt) {
        if (pos == null) return defaultVal;
        return PAGE_H - pos.y() - elemHeightPt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHỮ KÝ SỐ CRYPTOGRAPHIC — X.509 self-signed + RSA-2048 + CMS/PKCS7
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Ký số PDF bằng chứng chỉ X.509 tự ký (self-signed).
     * <p>
     * Kết quả: text vẫn selectable; khi mở bằng Adobe Acrobat và click vào vùng chữ ký
     * sẽ hiển thị "Document was certified, validity is UNKNOWN" (vì cert self-signed,
     * không có CA công nhận — hành vi hoàn toàn bình thường với cert nội bộ).
     * </p>
     *
     * @param pdfBytes   PDF gốc (có ảnh chữ ký đã vẽ sẵn)
     * @param signerName Tên người ký (điền vào metadata của chữ ký số)
     * @return PDF đã được ký số (incremental update, không mất nội dung gốc)
     */
    private byte[] signWithCertificate(byte[] pdfBytes, String signerName) throws Exception {
        // Đăng ký BouncyCastle provider (idempotent nếu đã có)
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        // 1. Sinh RSA-2048 key pair
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
        kpg.initialize(2048, new SecureRandom());
        KeyPair keyPair = kpg.generateKeyPair();

        // 2. Xây dựng self-signed X.509 certificate (hạn 10 năm)
        String cn = (signerName != null && !signerName.isBlank()) ? signerName : "DOAN KGU";
        X509Certificate cert = buildSelfSignedCert(keyPair, cn);

        // 3. Load PDF và thiết lập incremental signing
        try (PDDocument doc = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDSignature pdSig = new PDSignature();
            pdSig.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            pdSig.setSubFilter(PDSignature.SUBFILTER_ADBE_PKCS7_DETACHED);
            pdSig.setName(cn);
            pdSig.setLocation("An Giang, Viet Nam");
            pdSig.setReason("Xac nhan danh sach tham gia hoat dong Doan");
            pdSig.setSignDate(Calendar.getInstance());

            doc.addSignature(pdSig);
            ExternalSigningSupport ext = doc.saveIncrementalForExternalSigning(out);

            // 4. Đọc nội dung cần ký
            byte[] contentBytes;
            try (InputStream is = ext.getContent()) {
                contentBytes = is.readAllBytes();
            }

            // 5. Tạo CMS detached signature bằng BouncyCastle
            byte[] cms = computeCMSSignature(contentBytes, keyPair.getPrivate(), cert);

            // 6. Nhúng signature vào PDF
            ext.setSignature(cms);

            return out.toByteArray();
        }
    }

    /**
     * Tạo self-signed X.509 certificate với SHA256withRSA.
     */
    private X509Certificate buildSelfSignedCert(KeyPair keyPair, String cn) throws Exception {
        long now = System.currentTimeMillis();
        Date notBefore = new Date(now - 1000L);                          // trừ 1s để tránh clock skew
        Date notAfter  = new Date(now + 10L * 365 * 24 * 60 * 60 * 1000); // 10 năm

        org.bouncycastle.asn1.x500.X500Name subject =
                new org.bouncycastle.asn1.x500.X500Name(
                        "CN=" + cn.replace(",", " ") + ", O=Doan KGU, C=VN");

        JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                subject,
                BigInteger.valueOf(now),
                notBefore,
                notAfter,
                subject,
                keyPair.getPublic()
        );

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(keyPair.getPrivate());

        return new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(builder.build(signer));
    }

    /**
     * Tạo CMS/PKCS7 detached signature (không nhúng nội dung vào signature blob).
     */
    private byte[] computeCMSSignature(byte[] content, PrivateKey privateKey,
                                        X509Certificate cert) throws Exception {
        List<X509Certificate> certList = Collections.singletonList(cert);
        JcaCertStore certStore = new JcaCertStore(certList);

        CMSProcessableByteArray msg = new CMSProcessableByteArray(content);
        CMSSignedDataGenerator gen  = new CMSSignedDataGenerator();

        ContentSigner sha256Signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(privateKey);

        gen.addSignerInfoGenerator(
                new JcaSignerInfoGeneratorBuilder(
                        new JcaDigestCalculatorProviderBuilder()
                                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                                .build()
                ).build(sha256Signer, cert)
        );
        gen.addCertificates(certStore);

        // false = detached (nội dung không nhúng vào signature blob)
        CMSSignedData signedData = gen.generate(msg, false);
        return signedData.getEncoded();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VẼ NỘI DUNG PDF
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Header chuẩn văn bản hành chính Đoàn 2 cột:
     * TRÁI (căn giữa): TỈNH ĐOÀN AN GIANG / ĐOÀN TRƯỜNG ĐH KIÊN GIANG / ***
     * PHẢI (căn giữa): ĐOÀN TNCS HỒ CHÍ MINH (gạch chân) + ngày tháng năm
     */
    private float drawHeader(PDPageContentStream cs, PDFont fontReg, PDFont fontBold,
                             float y, String ngayStr) throws IOException {
        float startY = y;
        float midX   = PAGE_W / 2f;

        // ── CỘT TRÁI (MARGIN_L .. midX) ──────────────────────────────────
        float leftColW  = midX - MARGIN_L;
        float leftColCX = MARGIN_L + leftColW / 2f;

        cs.setFont(fontBold, 10f);
        String org1 = "TỈNH ĐOÀN AN GIANG";
        String org2 = "ĐOÀN TRƯỜNG ĐẠI HỌC KIÊN GIANG";
        String sep  = "***";

        float tw;
        tw = strWidth(fontBold, 10f, org1);
        drawText(cs, org1, leftColCX - tw / 2f, y);         y -= 14f;
        tw = strWidth(fontBold, 10f, org2);
        drawText(cs, org2, leftColCX - tw / 2f, y);         y -= 14f;
        tw = strWidth(fontBold, 10f, sep);
        drawText(cs, sep, leftColCX - tw / 2f, y);          y -= 10f;

        // ── CỘT PHẢI (midX .. PAGE_W-MARGIN_R) ───────────────────────────
        float rightColW  = PAGE_W - MARGIN_R - midX;
        float rightColCX = midX + rightColW / 2f;

        cs.setFont(fontBold, 11f);
        String rightHdr = "ĐOÀN TNCS HỒ CHÍ MINH";
        float rhW = strWidth(fontBold, 11f, rightHdr);
        float rhX = rightColCX - rhW / 2f;
        drawText(cs, rightHdr, rhX, startY);
        // Gạch chân
        cs.setLineWidth(0.8f);
        cs.moveTo(rhX, startY - 2f);
        cs.lineTo(rhX + rhW, startY - 2f);
        cs.stroke();

        // Ngày tháng — căn giữa cột phải, dòng 2 (thụt xuống ~30pt từ header line)
        cs.setFont(fontReg, 10f);
        tw = strWidth(fontReg, 10f, ngayStr);
        drawText(cs, ngayStr, rightColCX - tw / 2f, startY - 30f);

        // Không vẽ đường kẻ ngang — tiêu ngữ và tiêu đề tự phân cách bằng khoảng trắng
        return Math.min(y, startY - 48f);
    }

    private String buildTieuDe(HoatDong hd) {
        String name = hd.getTenHoatDong() != null ? hd.getTenHoatDong().toUpperCase() : "";
        return "DANH SÁCH SINH VIÊN THAM GIA\n" + name;
    }

    private float drawTitle(PDPageContentStream cs, PDFont fontBold, String tieuDe, float y) throws IOException {
        String[] lines = tieuDe.split("\n");
        float maxW = 0f;
        for (String line : lines) {
            float tw = strWidth(fontBold, 12f, line);
            if (tw > maxW) maxW = tw;
        }
        cs.setFont(fontBold, 12f);
        for (String line : lines) {
            float tw = strWidth(fontBold, 12f, line);
            drawText(cs, line, (PAGE_W - tw) / 2f, y);
            y -= 16f;
        }
        // Gạch ngang sát dưới tiêu đề (cách baseline cuối ~4pt)
        float dashY = y + 12f;  // y đã trừ 16pt sau dòng cuối → +12 = cách baseline 4pt
        cs.setLineWidth(0.6f);
        float dashW = Math.min(maxW * 0.55f, 110f);
        cs.moveTo((PAGE_W - dashW) / 2f, dashY);
        cs.lineTo((PAGE_W + dashW) / 2f, dashY);
        cs.stroke();
        return dashY - 8f;
    }

    private float drawTableHeader(PDPageContentStream cs, PDFont fontBold, float y) throws IOException {
        float x = MARGIN_L;
        cs.setFont(fontBold, 9f);
        for (int i = 0; i < COL_WIDTHS.length; i++) {
            float w = COL_WIDTHS[i];
            drawCell(cs, x, y - HEADER_ROW_H, w, HEADER_ROW_H, true);
            float tw = strWidth(fontBold, 9f, COL_HEADERS[i]);
            drawText(cs, COL_HEADERS[i], x + (w - tw) / 2f, y - 13f);
            x += w;
        }
        return y - HEADER_ROW_H;
    }

    private float drawTableRowsFull(PDPageContentStream cs, PDFont font,
                                     List<DiemDanhHoatDongDTO> rows, float y, int startIdx) throws IOException {
        cs.setFont(font, 9f);
        int stt = startIdx + 1;
        for (DiemDanhHoatDongDTO row : rows) {
            float x = MARGIN_L;
            String[] cells = {
                    String.valueOf(stt++),
                    row.getHoTenSinhVien() != null ? row.getHoTenSinhVien() : "",
                    row.getMaLop()         != null ? row.getMaLop()         : "",
                    row.getMaSv()          != null ? row.getMaSv()          : "",
                    row.getTenKhoa()       != null ? row.getTenKhoa()       : ""
            };
            for (int i = 0; i < COL_WIDTHS.length; i++) {
                float w = COL_WIDTHS[i];
                drawCell(cs, x, y - ROW_H, w, ROW_H, false);
                String cell = truncate(cells[i], font, 9f, w - 4f);
                float tw    = strWidth(font, 9f, cell);
                float textX = (i == 0 || i == 3) ? x + (w - tw) / 2f : x + 3f;
                drawText(cs, cell, textX, y - 11f);
                x += w;
            }
            y -= ROW_H;
        }
        return y;
    }

    private void drawCell(PDPageContentStream cs, float x, float y, float w, float h, boolean header) throws IOException {
        cs.setLineWidth(0.5f);
        if (header) {
            // Header: nền xám nhạt
            cs.setNonStrokingColor(0.88f, 0.88f, 0.88f);
            cs.addRect(x, y, w, h);
            cs.fill();
            cs.setNonStrokingColor(0f, 0f, 0f);
        }
        cs.addRect(x, y, w, h);
        cs.stroke();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FONT — Times New Roman ưu tiên, fallback hệ thống
    // ═══════════════════════════════════════════════════════════════════════

    private PDFont loadFont(PDDocument doc, boolean bold) throws IOException {
        String[][] paths = bold
                ? new String[][]{
                    {"C:/Windows/Fonts/timesbd.ttf"},          // Windows TNR Bold
                    {"C:/Windows/Fonts/times.ttf"},             // Windows TNR Regular (fallback)
                    {"/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf"},
                    {"/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf"},
                    {"/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"}
                }
                : new String[][]{
                    {"C:/Windows/Fonts/times.ttf"},
                    {"/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf"},
                    {"/usr/share/fonts/truetype/freefont/FreeSerif.ttf"},
                    {"/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"}
                };

        for (String[] group : paths) {
            for (String path : group) {
                File f = new File(path);
                if (f.exists()) {
                    return PDType0Font.load(doc, f);
                }
            }
        }
        log.warn("Không tìm thấy Times New Roman, dùng Times-Roman (built-in)");
        return bold
                ? new PDType1Font(FontName.TIMES_BOLD)
                : new PDType1Font(FontName.TIMES_ROMAN);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private HoatDong loadHoatDong(String maHoatDong) {
        return hoatDongRepository.findById(maHoatDong)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy hoạt động: " + maHoatDong));
    }

    private List<DiemDanhHoatDongDTO> loadDanhSach(String maHoatDong) {
        return loadDanhSach(maHoatDong, null);
    }

    private List<DiemDanhHoatDongDTO> loadDanhSach(String maHoatDong, List<String> customMaSvList) {
        List<DiemDanhHoatDongDTO> all = diemDanhService.getCheckedInStudents(maHoatDong).stream()
                .filter(d -> d.getTrangThai() != null
                          && !"VANG_MAT".equals(d.getTrangThai().name()))
                .collect(java.util.stream.Collectors.toList());
        if (customMaSvList != null && !customMaSvList.isEmpty()) {
            java.util.Set<String> allowed = new java.util.HashSet<>(customMaSvList);
            all = all.stream().filter(d -> allowed.contains(d.getMaSv())).collect(java.util.stream.Collectors.toList());
            // Giữ đúng thứ tự customMaSvList
            Map<String, DiemDanhHoatDongDTO> map = all.stream()
                    .collect(java.util.stream.Collectors.toMap(DiemDanhHoatDongDTO::getMaSv, d -> d));
            all = customMaSvList.stream().map(map::get)
                    .filter(Objects::nonNull).collect(java.util.stream.Collectors.toList());
        }
        return all;
    }

    private byte[] loadOptionalImage(Long chuKyId,
                                     ChuKyRepository repo) throws IOException {
        if (chuKyId == null) return null;
        ChuKy ck = repo.findById(chuKyId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy chữ ký id=" + chuKyId));
        return readFileBytes(ck.getDuongDan());
    }

    private byte[] loadImageFromConDau(Long id) throws IOException {
        ConDau cd = conDauRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy con dấu id=" + id));
        return readFileBytes(cd.getDuongDan());
    }

    private byte[] readFileBytes(String duongDan) throws IOException {
        // duongDan = "/uploads/chu-ky/xxx.png"
        String rel = duongDan.startsWith("/uploads/")
                ? duongDan.substring("/uploads/".length()) : duongDan;
        Path full = Paths.get(uploadBasePath).resolve(rel).normalize();
        if (!full.startsWith(Paths.get(uploadBasePath).normalize())) {
            throw new BusinessException("SECURITY", "Đường dẫn không hợp lệ");
        }
        return Files.readAllBytes(full);
    }

    private void drawText(PDPageContentStream cs, String text, float x, float y) throws IOException {
        if (text == null || text.isBlank()) return;
        cs.beginText();
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    private float strWidth(PDFont font, float size, String text) throws IOException {
        try { return font.getStringWidth(text) / 1000f * size; }
        catch (Exception e) { return text.length() * size * 0.5f; }
    }

    private String truncate(String text, PDFont font, float size, float maxW) throws IOException {
        if (text == null) return "";
        if (strWidth(font, size, text) <= maxW) return text;
        while (text.length() > 1 && strWidth(font, size, text + "…") > maxW)
            text = text.substring(0, text.length() - 1);
        return text + "…";
    }

    private List<List<DiemDanhHoatDongDTO>> paginate(List<DiemDanhHoatDongDTO> all,
                                                      int first, int other) {
        List<List<DiemDanhHoatDongDTO>> pages = new ArrayList<>();
        if (all.isEmpty()) { pages.add(new ArrayList<>()); return pages; }
        int i = 0;
        pages.add(new ArrayList<>(all.subList(i, Math.min(i + first, all.size())))); i += first;
        while (i < all.size()) {
            pages.add(new ArrayList<>(all.subList(i, Math.min(i + other, all.size())))); i += other;
        }
        return pages;
    }

    private int countOffset(List<List<DiemDanhHoatDongDTO>> pages, int idx) {
        int off = 0;
        for (int i = 0; i < idx; i++) off += pages.get(i).size();
        return off;
    }

    // ─── File helpers ─────────────────────────────────────────────────────

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BusinessException("INVALID", "File không được rỗng");
        String n = (file.getOriginalFilename() != null ? file.getOriginalFilename() : "").toLowerCase();
        if (!n.endsWith(".png") && !n.endsWith(".jpg") && !n.endsWith(".jpeg"))
            throw new BusinessException("INVALID", "Chỉ chấp nhận PNG hoặc JPG");
        if (file.getSize() > 5_242_880L)
            throw new BusinessException("INVALID", "File quá lớn (tối đa 5 MB)");
    }

    private String saveImage(MultipartFile file, String subfolder) {
        try {
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "img.png";
            String ext  = name.contains(".") ? name.substring(name.lastIndexOf('.')) : ".png";
            String fn   = UUID.randomUUID() + ext;
            Path dir    = Paths.get(uploadBasePath, subfolder);
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(fn), StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + subfolder + "/" + fn;
        } catch (IOException e) {
            throw new BusinessException("FILE_ERROR", "Lỗi lưu file: " + e.getMessage());
        }
    }

    private void deleteFile(String duongDan) {
        try {
            String rel = duongDan.startsWith("/uploads/") ? duongDan.substring(9) : duongDan;
            Files.deleteIfExists(Paths.get(uploadBasePath, rel).normalize());
        } catch (IOException e) {
            log.warn("Không xóa được file: {}", duongDan);
        }
    }

    private void clearDefaultChuKy() {
        chuKyRepository.findAll().forEach(ck -> {
            if (Boolean.TRUE.equals(ck.getLaMacDinh())) {
                ck.setLaMacDinh(false); chuKyRepository.save(ck);
            }
        });
    }

    private void clearDefaultConDau() {
        conDauRepository.findAll().forEach(cd -> {
            if (Boolean.TRUE.equals(cd.getLaMacDinh())) {
                cd.setLaMacDinh(false); conDauRepository.save(cd);
            }
        });
    }

    // ─── DTO converters ───────────────────────────────────────────────────

    private ChuKyDTO toChuKyDTO(ChuKy ck) {
        return ChuKyDTO.builder().id(ck.getId()).tenNguoiKy(ck.getTenNguoiKy())
                .chucVu(ck.getChucVu()).duongDan(ck.getDuongDan())
                .laMacDinh(ck.getLaMacDinh()).createdAt(ck.getCreatedAt()).build();
    }

    private ConDauDTO toConDauDTO(ConDau cd) {
        return ConDauDTO.builder().id(cd.getId()).ten(cd.getTen())
                .duongDan(cd.getDuongDan()).laMacDinh(cd.getLaMacDinh())
                .createdAt(cd.getCreatedAt()).build();
    }
}
