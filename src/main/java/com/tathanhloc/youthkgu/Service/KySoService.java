package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChuKyDTO;
import com.tathanhloc.youthkgu.DTO.ConDauDTO;
import com.tathanhloc.youthkgu.DTO.DiemDanhHoatDongDTO;
import com.tathanhloc.youthkgu.Enum.LoaiChuKy;
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
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
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
import java.time.LocalDateTime;
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
    static final float MARGIN_L = 85f;
    static final float MARGIN_R = 57f;
    static final float MARGIN_T = 57f;
    static final float MARGIN_B = 57f;
    static final float ROW_H         = 22f;
    static final float HEADER_ROW_H  = 22f;
    static final float SIG_BLOCK_H   = 130f;

    /** Cấu hình một cột trong bảng. */
    public record ColConfig(String key, String header, float widthPt, boolean visible) {}

    /** Zone chỉnh sửa được trực tiếp trên preview (toạ độ PDF từ dưới lên). */
    public record EditZone(
            String type,        // "title" | "date" | "row"
            int    pageIndex,
            float  x, float y,  // bottom-left (PDF coords, Y from bottom)
            float  w, float h,
            int    rowIndex     // -1 for non-row zones
    ) {}

    /** Cấu hình cột mặc định: STT, Họ và Tên, Lớp, MSSV, Tên Khoa. */
    public static final List<ColConfig> DEFAULT_COL_CONFIG = List.of(
            new ColConfig("stt",     "STT",       26f,  true),
            new ColConfig("hoTen",   "Họ và Tên", 148f, true),
            new ColConfig("maLop",   "Lớp",        62f, true),
            new ColConfig("maSv",    "MSSV",       75f, true),
            new ColConfig("tenKhoa", "Tên Khoa",  142f, true)
    );

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC CRUD — Chữ ký
    // ═══════════════════════════════════════════════════════════════════════

    /** Lấy chữ ký của một user (chỉ chữ ký cá nhân của họ), mọi loại. */
    public List<ChuKyDTO> getAllChuKy(String ownerUsername) {
        return getAllChuKy(ownerUsername, null);
    }

    /** Lấy chữ ký của một user, lọc theo loại (FULL/NHAY) nếu chỉ định. */
    public List<ChuKyDTO> getAllChuKy(String ownerUsername, LoaiChuKy loai) {
        List<ChuKy> list = chuKyRepository.findByOwnerUsernameOrderByCreatedAtDesc(ownerUsername);
        if (loai != null) {
            list = list.stream().filter(ck -> loai.equals(ck.getLoaiChuKy())).toList();
        }
        return list.stream().map(this::toChuKyDTO).toList();
    }

    /** Upload chữ ký mới — gán owner là user hiện tại. */
    public ChuKyDTO uploadChuKy(MultipartFile file, String tenNguoiKy, String chucVu,
                                boolean laMacDinh, String ownerUsername, LoaiChuKy loaiChuKy) {
        validateImageFile(file);
        LoaiChuKy loai = loaiChuKy != null ? loaiChuKy : LoaiChuKy.FULL;
        if (laMacDinh) clearDefaultChuKyForOwnerAndLoai(ownerUsername, loai);
        String duongDan = saveImage(file, "chu-ky");
        return toChuKyDTO(chuKyRepository.save(
                ChuKy.builder().tenNguoiKy(tenNguoiKy).chucVu(chucVu)
                        .duongDan(duongDan).laMacDinh(laMacDinh)
                        .ownerUsername(ownerUsername).loaiChuKy(loai).build()));
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

    /** Toàn bộ con dấu — dùng cho màn quản lý (yêu cầu quyền QUAN_LY_CON_DAU). */
    public List<ConDauDTO> getAllConDau() {
        return conDauRepository.findAll().stream().map(this::toConDauDTO).toList();
    }

    /** Con dấu mà 1 user dùng được: dùng chung (owner NULL) hoặc sở hữu riêng. */
    public List<ConDauDTO> getUsableConDau(String username) {
        return conDauRepository.findByOwnerUsernameIsNullOrOwnerUsername(username)
                .stream().map(this::toConDauDTO).toList();
    }

    public ConDauDTO uploadConDau(MultipartFile file, String ten, boolean laMacDinh, String ownerUsername) {
        validateImageFile(file);
        if (laMacDinh) clearDefaultConDau();
        String duongDan = saveImage(file, "con-dau");
        return toConDauDTO(conDauRepository.save(
                ConDau.builder().ten(ten).duongDan(duongDan).laMacDinh(laMacDinh)
                        .ownerUsername(ownerUsername).build()));
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

    /** Kết quả preview: danh sách trang dưới dạng base64 PNG + kích thước trang + edit zones. */
    public record PreviewResult(
            List<String> pages,
            float pageWidthPt, float pageHeightPt,
            int totalStudents,
            float sigBlockTopY,
            float leftColCX,
            float rightColCX,
            List<EditZone> editZones,    // zones cho click-to-edit trên preview
            List<ColConfig> colConfig    // config cột đã dùng để generate
    ) {}

    @Transactional(readOnly = true)
    public PreviewResult generatePreview(String maHoatDong) throws IOException {
        return generatePreview(maHoatDong, null, null, null, null);
    }

    public PreviewResult generatePreview(String maHoatDong,
                                         List<OverrideRow> overrideRows,
                                         String overrideTieuDe,
                                         String overrideNgayStr) throws IOException {
        return generatePreview(maHoatDong, overrideRows, overrideTieuDe, overrideNgayStr, null);
    }

    public PreviewResult generatePreview(String maHoatDong,
                                         List<OverrideRow> overrideRows,
                                         String overrideTieuDe,
                                         String overrideNgayStr,
                                         List<ColConfig> colConfig) throws IOException {
        return generatePreview(maHoatDong, overrideRows, overrideTieuDe, overrideNgayStr, colConfig, null, null);
    }

    public PreviewResult generatePreview(String maHoatDong,
                                         List<OverrideRow> overrideRows,
                                         String overrideTieuDe,
                                         String overrideNgayStr,
                                         List<ColConfig> colConfig,
                                         String loaiKy,
                                         String orgLabel) throws IOException {
        return generatePreview(maHoatDong, overrideRows, overrideTieuDe, overrideNgayStr,
                colConfig, loaiKy, orgLabel, null);
    }

    public PreviewResult generatePreview(String maHoatDong,
                                         List<OverrideRow> overrideRows,
                                         String overrideTieuDe,
                                         String overrideNgayStr,
                                         List<ColConfig> colConfig,
                                         String loaiKy,
                                         String orgLabel,
                                         FormatConfig formatConfig) throws IOException {
        HoatDong hd = loadHoatDong(maHoatDong);

        List<DiemDanhHoatDongDTO> ds;
        if (overrideRows != null && !overrideRows.isEmpty()) {
            ds = overrideRows.stream().map(r -> DiemDanhHoatDongDTO.builder()
                    .hoTenSinhVien(r.hoTen()).maLop(r.maLop()).maSv(r.maSv()).tenKhoa(r.tenKhoa()).build()
            ).toList();
        } else {
            ds = loadDanhSach(maHoatDong);
        }

        String tieuDe  = (overrideTieuDe  != null && !overrideTieuDe.isBlank())  ? overrideTieuDe  : null;
        String ngayStr = (overrideNgayStr != null && !overrideNgayStr.isBlank()) ? overrideNgayStr : null;
        String resolvedLoaiKy = (loaiKy != null && !loaiKy.isBlank()) ? loaiKy : "BÍ THƯ";

        List<ColConfig> resolvedCols = colConfig != null ? colConfig : DEFAULT_COL_CONFIG;
        DraftResult draft = buildDraftPDF(hd, ds, resolvedLoaiKy, "", "", "", null, tieuDe, ngayStr, resolvedCols, orgLabel, formatConfig);

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
                draft.sigBlockTopY(), draft.leftCX(), draft.rightCX(),
                draft.editZones(), resolvedCols);
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
    /**
     * Cấu hình thể thức tài liệu (font, lề) — tất cả nullable = dùng mặc định.
     * marginTopCm / marginBottomCm / marginLeftCm / marginRightCm: lề tính bằng cm.
     * bodyFontSizePt: cỡ chữ nội dung (mặc định 10).
     * rowHeightPt: chiều cao dòng bảng (mặc định 22).
     * fontName: "times" | "arial" | "calibri" — nếu null dùng Times New Roman.
     */
    public record FormatConfig(
            Float marginTopCm,    Float marginBottomCm,
            Float marginLeftCm,   Float marginRightCm,
            Float bodyFontSizePt,
            Float rowHeightPt,
            String fontName
    ) {
        static final float CM_TO_PT = 28.346f;
        float leftPt()   { return marginLeftCm   != null ? marginLeftCm   * CM_TO_PT : MARGIN_L; }
        float rightPt()  { return marginRightCm  != null ? marginRightCm  * CM_TO_PT : MARGIN_R; }
        float topPt()    { return marginTopCm    != null ? marginTopCm    * CM_TO_PT : MARGIN_T; }
        float bottomPt() { return marginBottomCm != null ? marginBottomCm * CM_TO_PT : MARGIN_B; }
        float bodyFs()   { return bodyFontSizePt != null ? bodyFontSizePt : 10f; }
        float rowH()     { return rowHeightPt    != null ? rowHeightPt    : ROW_H;   }
    }

    public record XuatPDFRequest(
            String maHoatDong, String loaiKy,
            Long   chuKyBiThuId, String tenNguoiKy,
            Long   chuKyNguoiLapId, String tenNguoiLap, String chucVuNguoiLap,
            Long   conDauId,
            ElementPos posBiThu, ElementPos posNguoiLap, ElementPos posConDau,
            List<String> customMaSvList,
            List<OverrideRow> overrideRows,
            String overrideTieuDe,
            String overrideNgayStr,
            String nguoiThucHien,
            String ipAddress,
            List<ColConfig> colConfig,   // null = DEFAULT_COL_CONFIG
            String orgLabel,             // null = "TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG"
            FormatConfig formatConfig,   // null = dùng mặc định
            Boolean apDungGiapLai,       // true = đóng dấu giáp lai lên mọi trang
            Long    chuKyNhayId,         // ID ảnh chữ ký nháy (LoaiChuKy.NHAY), áp lên mọi trang trừ trang cuối
            Boolean khoaFilePdf          // true = khóa chỉnh sửa/copy (không mật khẩu mở)
    ) {}

    /** Kết quả buildDraftPDF: PDF bytes + metadata vị trí + edit zones. */
    private record DraftResult(byte[] pdf, float sigBlockTopY, float leftCX, float rightCX,
                                List<EditZone> editZones) {}

    @Transactional
    public byte[] xuatDanhSachPDF(XuatPDFRequest req) throws IOException {
        HoatDong hd = loadHoatDong(req.maHoatDong());
        List<DiemDanhHoatDongDTO> ds = loadDanhSach(req.maHoatDong(), req.customMaSvList());

        byte[] imgBiThu   = loadOptionalImage(req.chuKyBiThuId(),    chuKyRepository);
        byte[] imgNguoiLap = loadOptionalImage(req.chuKyNguoiLapId(), chuKyRepository);
        byte[] imgConDau   = req.conDauId() != null
                ? loadImageFromConDau(req.conDauId()) : null;
        byte[] imgKyNhay   = loadOptionalImage(req.chuKyNhayId(), chuKyRepository);

        // Bước 1: Sinh PDF nháp — dùng override nếu admin đã chỉnh sửa nội dung
        DraftResult draft = buildDraftPDF(hd, ds,
                req.loaiKy(), req.tenNguoiKy(), req.tenNguoiLap(), req.chucVuNguoiLap(),
                req.overrideRows(), req.overrideTieuDe(), req.overrideNgayStr(), req.colConfig(), req.orgLabel(),
                req.formatConfig());

        // Bước 2: Áp ảnh chữ ký / con dấu vào trang cuối
        byte[] pdf = applySignatureImages(draft, req, imgBiThu, imgNguoiLap, imgConDau);

        // Bước 3: Giáp lai — đóng dấu lên mọi trang (chống rút/thay trang)
        if (Boolean.TRUE.equals(req.apDungGiapLai()) && imgConDau != null) {
            pdf = applyGiapLai(pdf, imgConDau);
        }

        // Bước 4: Ký nháy — mọi trang trừ trang cuối
        if (imgKyNhay != null) {
            pdf = applyKyNhay(pdf, imgKyNhay);
        }

        // Bước 5: Khóa chỉnh sửa/copy — PHẢI chạy TRƯỚC bước ký số cryptographic
        //         (xem javadoc applyPdfLock() để biết lý do thứ tự)
        if (Boolean.TRUE.equals(req.khoaFilePdf())) {
            pdf = applyPdfLock(pdf);
        }

        // Bước 6: Ký số cryptographic (X.509 self-signed, SHA256withRSA, CMS/PKCS7 detached)
        //         → text vẫn selectable; Acrobat hiển thị "Document was certified"
        byte[] certifiedPdf;
        try {
            certifiedPdf = signWithCertificate(pdf, req.tenNguoiKy());
        } catch (Exception e) {
            log.warn("Không thể ký số cryptographic, trả PDF thường: {}", e.getMessage());
            certifiedPdf = pdf;
        }

        // Bước 7: Audit log
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
        byte[] imgKyNhay   = loadOptionalImage(req.chuKyNhayId(), chuKyRepository);

        // Bước 1: Sinh PDF — dùng override nếu admin đã chỉnh sửa nội dung
        DraftResult draft = buildDraftPDF(hd, ds,
                req.loaiKy(), req.tenNguoiKy(), req.tenNguoiLap(), req.chucVuNguoiLap(),
                req.overrideRows(), req.overrideTieuDe(), req.overrideNgayStr(), req.colConfig(), req.orgLabel(),
                req.formatConfig());

        // Bước 2: Áp ảnh chữ ký
        byte[] pdf = applySignatureImages(draft, req, imgBiThu, imgNguoiLap, imgConDau);

        // Bước 3: Giáp lai — đóng dấu lên mọi trang (chống rút/thay trang)
        if (Boolean.TRUE.equals(req.apDungGiapLai()) && imgConDau != null) {
            pdf = applyGiapLai(pdf, imgConDau);
        }

        // Bước 4: Ký nháy — mọi trang trừ trang cuối
        if (imgKyNhay != null) {
            pdf = applyKyNhay(pdf, imgKyNhay);
        }

        // Bước 5: Khóa chỉnh sửa/copy — PHẢI chạy TRƯỚC bước ký số cryptographic
        if (Boolean.TRUE.equals(req.khoaFilePdf())) {
            pdf = applyPdfLock(pdf);
        }

        // Bước 6: Ký số cryptographic
        byte[] pdfBytes;
        try {
            pdfBytes = signWithCertificate(pdf, req.tenNguoiKy());
        } catch (Exception e) {
            log.warn("Không thể ký số khi ban hành, dùng PDF thường: {}", e.getMessage());
            pdfBytes = pdf;
        }

        // Bước 7: Lưu file vào disk
        String timestamp = String.valueOf(System.currentTimeMillis());
        String tenFile = "danh_sach_" + req.maHoatDong() + "_" + timestamp + ".pdf";
        Path banHanhDir = Paths.get(uploadBasePath, "ban-hanh");
        Files.createDirectories(banHanhDir);
        Path filePath = banHanhDir.resolve(tenFile);
        Files.write(filePath, pdfBytes);

        // Bước 8: Ghi metadata vào DB
        DanhSachBanHanh entity = DanhSachBanHanh.builder()
                .maHoatDong(req.maHoatDong())
                .tenHoatDong(hd.getTenHoatDong())
                .maKhoa(hd.getKhoa() != null ? hd.getKhoa().getMaKhoa() : null)
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

        // Bước 9: Audit log (dùng lại KySoLichSu)
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
        return banHanhRepository.findTopByMaHoatDongAndTrangThaiOrderByCreatedAtDesc(maHoatDong, "HIEU_LUC");
    }

    /**
     * Hủy ban hành: xóa record DB và xóa file vật lý trên disk.
     */
    @Transactional
    public void huyBanHanh(Long id) {
        huyBanHanh(id, null);
    }

    @Transactional
    public void huyBanHanh(Long id, String nguoiThucHien) {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành id=" + id));

        // Soft-delete: đánh dấu DA_HUY, giữ nguyên file vật lý
        entity.setTrangThai("DA_HUY");
        entity.setNgayHuy(java.time.LocalDateTime.now());
        entity.setNguoiHuy(nguoiThucHien);
        banHanhRepository.save(entity);
        log.info("Đã hủy ban hành (soft-delete) id={}, file={}", id, entity.getTenFile());
    }

    /** Xóa hẳn bản ban hành đã hủy (xóa cả file vật lý). Chỉ dùng khi ban quản trị cần dọn dẹp. */
    @Transactional
    public void xoaHanBanHanh(Long id) {
        DanhSachBanHanh entity = banHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ban hành id=" + id));

        if (entity.getDuongDanFile() != null) {
            try {
                Files.deleteIfExists(Paths.get(entity.getDuongDanFile()));
            } catch (IOException e) {
                log.warn("Không thể xóa file vật lý {}: {}", entity.getDuongDanFile(), e.getMessage());
            }
        }
        banHanhRepository.deleteById(id);
        log.info("Đã xóa hoàn toàn ban hành id={}", id);
    }

    /**
     * Lấy tất cả bản ban hành có phân trang và tìm kiếm.
     * @param includeRevoked nếu true thì bao gồm cả bản đã hủy (DA_HUY)
     */
    public org.springframework.data.domain.Page<DanhSachBanHanh> getAllBanHanh(
            int page, int size, String search, boolean includeRevoked) {
        org.springframework.data.domain.PageRequest pr = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            return includeRevoked
                ? banHanhRepository.findByTenHoatDongContainingIgnoreCaseOrMaHoatDongContainingIgnoreCase(search, search, pr)
                : banHanhRepository.findByTrangThaiAndTenHoatDongContainingIgnoreCaseOrTrangThaiAndMaHoatDongContainingIgnoreCase(
                        "HIEU_LUC", search, "HIEU_LUC", search, pr);
        }
        return includeRevoked
            ? banHanhRepository.findAll(pr)
            : banHanhRepository.findByTrangThai("HIEU_LUC", pr);
    }

    public org.springframework.data.domain.Page<DanhSachBanHanh> getAllBanHanh(int page, int size, String search) {
        return getAllBanHanh(page, size, search, false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BAN HÀNH DANH SÁCH THÀNH VIÊN CLB
    // ═══════════════════════════════════════════════════════════════════════

    /** Cột mặc định cho danh sách thành viên CLB. */
    public static final List<ColConfig> DEFAULT_CLB_COL_CONFIG = List.of(
            new ColConfig("stt",    "STT",       26f,  true),
            new ColConfig("hoTen",  "Họ và Tên", 148f, true),
            new ColConfig("maLop",  "Lớp",        58f, true),
            new ColConfig("maSv",   "MSSV",       75f, true),
            new ColConfig("chucVu", "Chức vụ",    88f, true)
    );

    /** Một dòng thành viên CLB (sinh viên). */
    public record ClbMemberRow(String hoTen, String maLop, String maSv, String chucVu, String tenKhoa) {}

    /** Một dòng thành viên Ban chủ nhiệm (SV/GV/CV). */
    public record ClbBcnRow(String hoTen, String donVi, String chucVu, String loaiNguoi) {}

    /** Toàn bộ tham số yêu cầu ban hành danh sách thành viên CLB. */
    public record ClbBanHanhRequest(
            String maClb, String tenClb,
            String coQuanChuQuan,   // VD: "Hội sinh viên Trường ĐH Kiên Giang / CLB X"
            String tenChuNhiem,     // Tên chủ nhiệm (người ký)
            Long   chuKyChuNhiemId, // ID ảnh chữ ký chủ nhiệm
            Long   conDauId,
            ElementPos posChuNhiem,
            ElementPos posConDau,
            List<ClbBcnRow>    bcnMembers,  // Thành viên Ban chủ nhiệm
            List<ClbMemberRow> members,     // Thành viên (sinh viên)
            String overrideTieuDe,
            String overrideNgayStr,
            List<ColConfig> colConfig,
            FormatConfig formatConfig,
            String nguoiThucHien,
            String ipAddress,
            Boolean apDungGiapLai,       // true = đóng dấu giáp lai lên mọi trang
            Long    chuKyNhayId,         // ID ảnh chữ ký nháy (LoaiChuKy.NHAY)
            Boolean khoaFilePdf          // true = khóa chỉnh sửa/copy (không mật khẩu mở)
    ) {}

    /** Xem trước PDF danh sách thành viên CLB (không ký, trả về ảnh PNG base64). */
    public PreviewResult generatePreviewClb(ClbBanHanhRequest req) throws IOException {
        DraftResult draft = buildDraftPDFForClb(req);
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
        int bcnCount = req.bcnMembers() != null ? req.bcnMembers().size() : 0;
        int memCount = req.members()    != null ? req.members().size()    : 0;
        return new PreviewResult(pages, PAGE_W, PAGE_H, bcnCount + memCount,
                draft.sigBlockTopY(), draft.leftCX(), draft.rightCX(),
                draft.editZones(),
                req.colConfig() != null ? req.colConfig() : DEFAULT_CLB_COL_CONFIG);
    }

    /** Ban hành chính thức danh sách thành viên CLB: tạo PDF ký số + lưu file + ghi DB. */
    @Transactional
    public DanhSachBanHanh banHanhDanhSachClb(ClbBanHanhRequest req) throws IOException {
        DraftResult draft = buildDraftPDFForClb(req);

        byte[] imgChuNhiem = loadOptionalImage(req.chuKyChuNhiemId(), chuKyRepository);
        byte[] imgConDau   = req.conDauId() != null ? loadImageFromConDau(req.conDauId()) : null;
        byte[] imgKyNhay   = loadOptionalImage(req.chuKyNhayId(), chuKyRepository);

        byte[] pdf = applyClbSignatureImages(draft, req, imgChuNhiem, imgConDau);

        // Giáp lai — đóng dấu lên mọi trang (chống rút/thay trang)
        if (Boolean.TRUE.equals(req.apDungGiapLai()) && imgConDau != null) {
            pdf = applyGiapLai(pdf, imgConDau);
        }

        // Ký nháy — mọi trang trừ trang cuối
        if (imgKyNhay != null) {
            pdf = applyKyNhay(pdf, imgKyNhay);
        }

        // Khóa chỉnh sửa/copy — PHẢI chạy TRƯỚC bước ký số cryptographic
        if (Boolean.TRUE.equals(req.khoaFilePdf())) {
            pdf = applyPdfLock(pdf);
        }

        byte[] pdfBytes;
        try {
            pdfBytes = signWithCertificate(pdf, req.tenChuNhiem());
        } catch (Exception e) {
            log.warn("Không thể ký số CLB, dùng PDF thường: {}", e.getMessage());
            pdfBytes = pdf;
        }

        String timestamp = String.valueOf(System.currentTimeMillis());
        String tenFile = "clb_thanh_vien_" + req.maClb() + "_" + timestamp + ".pdf";
        Path banHanhDir = Paths.get(uploadBasePath, "ban-hanh");
        Files.createDirectories(banHanhDir);
        Path filePath = banHanhDir.resolve(tenFile);
        Files.write(filePath, pdfBytes);

        int bcnCount = req.bcnMembers() != null ? req.bcnMembers().size() : 0;
        int memCount = req.members()    != null ? req.members().size()    : 0;
        DanhSachBanHanh entity = DanhSachBanHanh.builder()
                .maHoatDong("CLB_" + req.maClb())
                .tenHoatDong(req.tenClb())
                .loaiKy("CHỦ NHIỆM")
                .tenNguoiKy(req.tenChuNhiem())
                .tenNguoiLap(req.nguoiThucHien())
                .chucVuNguoiLap("Chủ nhiệm CLB")
                .coConDau(req.conDauId() != null)
                .tongSv(bcnCount + memCount)
                .tenFile(tenFile)
                .duongDanFile(filePath.toString())
                .nguoiBanHanh(req.nguoiThucHien())
                .ipAddress(req.ipAddress())
                .createdAt(LocalDateTime.now())
                .build();

        entity = banHanhRepository.save(entity);
        log.info("Ban hành danh sách thành viên CLB {} — file: {}", req.maClb(), tenFile);
        return entity;
    }

    /** Sinh PDF nháp danh sách thành viên CLB (2 phần: BCN + Thành viên). */
    private DraftResult buildDraftPDFForClb(ClbBanHanhRequest req) throws IOException {
        FormatConfig f = (req.formatConfig() != null) ? req.formatConfig()
                : new FormatConfig(null, null, null, null, null, null, null);
        float mL = f.leftPt(), mR = f.rightPt(), mT = f.topPt(), mB = f.bottomPt();
        float rH = f.rowH();

        // Cột BCN (cố định): STT | Họ và Tên | Đơn vị | Chức vụ
        float[] bcnWidths  = {26f, 148f, 120f, 88f};
        String[] bcnHdrs   = {"STT", "Họ và Tên", "Đơn vị", "Chức vụ"};

        // Cột Thành viên (cấu hình được)
        List<ColConfig> activeCols = (req.colConfig() != null ? req.colConfig() : DEFAULT_CLB_COL_CONFIG)
                .stream().filter(ColConfig::visible).toList();
        float[] colWidths = new float[activeCols.size()];
        for (int i = 0; i < activeCols.size(); i++) colWidths[i] = activeCols.get(i).widthPt();
        String[] colHeaders = activeCols.stream().map(ColConfig::header).toArray(String[]::new);
        float tableW = 0; for (float w : colWidths) tableW += w;

        List<ClbBcnRow>    bcnMembers = req.bcnMembers() != null ? req.bcnMembers() : List.of();
        List<ClbMemberRow> members    = req.members()    != null ? req.members()    : List.of();
        List<EditZone> editZones = new ArrayList<>();

        String tieuDe = (req.overrideTieuDe() != null && !req.overrideTieuDe().isBlank())
                ? req.overrideTieuDe()
                : "DANH SÁCH THÀNH VIÊN\n" + (req.tenClb() != null ? req.tenClb().toUpperCase() : "");
        LocalDate today = LocalDate.now();
        String ngayStr = (req.overrideNgayStr() != null && !req.overrideNgayStr().isBlank())
                ? req.overrideNgayStr()
                : String.format("An Giang, ngày %02d tháng %02d năm %d",
                        today.getDayOfMonth(), today.getMonthValue(), today.getYear());

        float midX    = PAGE_W / 2f;
        float rightCX = midX + (PAGE_W - mR - midX) / 2f;
        float leftCX  = mL + (midX - mL) / 2f;
        float minY    = mB + SIG_BLOCK_H + rH + 10f;
        float sigBlockTopY = 0f;

        PDDocument doc = new PDDocument();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PDFont fontReg  = loadFont(doc, false, f.fontName());
        PDFont fontBold = loadFont(doc, true,  f.fontName());

        // ── Trang đầu ─────────────────────────────────────────────────────────
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        PDPageContentStream cs = new PDPageContentStream(doc, page);
        float y = PAGE_H - mT;

        float yBefore = y;
        y = drawClbHeader(cs, fontReg, fontBold, y, ngayStr, req.coQuanChuQuan(), mL, mR);
        editZones.add(new EditZone("date", 0, midX, yBefore - 60f, PAGE_W - midX - mR, 14f, -1));
        y -= 8f;

        float yBeforeTitle = y;
        y = drawTitle(cs, fontBold, tieuDe, y, mL, mR);
        editZones.add(new EditZone("title", 0, mL, y + 4f, PAGE_W - mL - mR, yBeforeTitle - y, -1));
        y -= 8f;

        int currentPage = 0;

        // ── Phần I: Thành viên Ban chủ nhiệm ──────────────────────────────────
        if (!bcnMembers.isEmpty()) {
            cs.setFont(fontBold, 10f);
            drawText(cs, "I. THÀNH VIÊN BAN CHỦ NHIỆM", mL, y - 12f);
            y -= 18f;

            // Kiểm tra còn chỗ cho header + 1 dòng không
            if (y - HEADER_ROW_H - rH < minY) {
                cs.close();
                PDPage np = new PDPage(PDRectangle.A4); doc.addPage(np);
                cs = new PDPageContentStream(doc, np); currentPage++; y = PAGE_H - mT;
            }
            y = drawTableHeader(cs, fontBold, y, bcnWidths, bcnHdrs, mL);
            for (int i = 0; i < bcnMembers.size(); i++) {
                if (y - rH < minY) {
                    cs.close();
                    PDPage np = new PDPage(PDRectangle.A4); doc.addPage(np);
                    cs = new PDPageContentStream(doc, np); currentPage++; y = PAGE_H - mT;
                    y = drawTableHeader(cs, fontBold, y, bcnWidths, bcnHdrs, mL);
                }
                ClbBcnRow row = bcnMembers.get(i);
                boolean even = (i % 2 == 0);
                float x = mL;
                int stt = i + 1;
                String[] vals = {String.valueOf(stt), row.hoTen() != null ? row.hoTen() : "",
                        row.donVi() != null ? row.donVi() : "", row.chucVu() != null ? row.chucVu() : ""};
                for (int c2 = 0; c2 < bcnWidths.length; c2++) {
                    drawCell(cs, x, y - rH, bcnWidths[c2], rH, false, even);
                    cs.setFont(fontReg, 9.5f);
                    boolean center = c2 == 0;
                    String cell = truncate(vals[c2], fontReg, 9.5f, bcnWidths[c2] - 5f);
                    float tw = strWidth(fontReg, 9.5f, cell);
                    float textX = center ? x + (bcnWidths[c2] - tw) / 2f : x + 4f;
                    drawText(cs, cell, textX, y - 14f);
                    x += bcnWidths[c2];
                }
                y -= rH;
            }
            y -= 10f;
        }

        // ── Phần II: Thành viên ────────────────────────────────────────────────
        String sectionLabel = bcnMembers.isEmpty() ? "THÀNH VIÊN" : "II. THÀNH VIÊN";
        if (y - 18f - HEADER_ROW_H - rH < minY) {
            cs.close();
            PDPage np = new PDPage(PDRectangle.A4); doc.addPage(np);
            cs = new PDPageContentStream(doc, np); currentPage++; y = PAGE_H - mT;
        }
        cs.setFont(fontBold, 10f);
        drawText(cs, sectionLabel, mL, y - 12f);
        y -= 18f;

        if (y - HEADER_ROW_H - rH < minY) {
            cs.close();
            PDPage np = new PDPage(PDRectangle.A4); doc.addPage(np);
            cs = new PDPageContentStream(doc, np); currentPage++; y = PAGE_H - mT;
        }
        y = drawTableHeader(cs, fontBold, y, colWidths, colHeaders, mL);

        for (int i = 0; i < members.size(); i++) {
            if (y - rH < minY) {
                cs.close();
                PDPage np = new PDPage(PDRectangle.A4); doc.addPage(np);
                cs = new PDPageContentStream(doc, np); currentPage++; y = PAGE_H - mT;
                y = drawTableHeader(cs, fontBold, y, colWidths, colHeaders, mL);
            }
            ClbMemberRow row = members.get(i);
            boolean even = (i % 2 == 0);
            float x = mL;
            int stt = i + 1;
            editZones.add(new EditZone("row", currentPage, mL, y - rH, tableW, rH, i));
            for (int c2 = 0; c2 < activeCols.size(); c2++) {
                ColConfig col = activeCols.get(c2);
                drawCell(cs, x, y - rH, colWidths[c2], rH, false, even);
                cs.setFont(fontReg, 9.5f);
                boolean center = "stt".equals(col.key()) || "maSv".equals(col.key());
                String val = getClbCellValue(row, col.key(), stt);
                String cell = truncate(val, fontReg, 9.5f, colWidths[c2] - 5f);
                float tw = strWidth(fontReg, 9.5f, cell);
                float textX = center ? x + (colWidths[c2] - tw) / 2f : x + 4f;
                drawText(cs, cell, textX, y - 14f);
                x += colWidths[c2];
            }
            y -= rH;
        }

        // ── Tổng cộng + Ký ────────────────────────────────────────────────────
        y = drawTotalRow(cs, fontBold, fontReg, y, members.size(), colWidths, tableW, mL, rH);
        y -= 14f;
        sigBlockTopY = PAGE_H - y;
        drawClbSignBlock(cs, fontBold, fontReg, y, req.tenChuNhiem(), req.tenClb(), rightCX);

        cs.close();
        doc.save(out);
        doc.close();

        return new DraftResult(out.toByteArray(), sigBlockTopY, leftCX, rightCX, editZones);
    }

    /** Header hành chính cho CLB: trái = cơ quan chủ quản, phải = CHXHCNVN + ngày. */
    private float drawClbHeader(PDPageContentStream cs, PDFont fontReg, PDFont fontBold,
                                 float y, String ngayStr, String coQuanChuQuan,
                                 float mL, float mR) throws IOException {
        float startY = y;
        float midX   = PAGE_W / 2f;
        float leftCX = mL + (midX - mL) / 2f;
        float rightCX = midX + (PAGE_W - mR - midX) / 2f;

        // ── CỘT TRÁI: cơ quan chủ quản ─────────────────────────────────
        cs.setFont(fontBold, 10f);
        String[] orgParts = coQuanChuQuan != null
                ? coQuanChuQuan.split("/", 2)
                : new String[]{"CLB", ""};
        String org1 = orgParts[0].trim().toUpperCase();
        String org2 = orgParts.length > 1 ? orgParts[1].trim().toUpperCase() : "";

        float tw = strWidth(fontBold, 10f, org1);
        drawText(cs, org1, leftCX - tw / 2f, y);
        y -= 14f;
        if (!org2.isBlank()) {
            tw = strWidth(fontBold, 10f, org2);
            drawText(cs, org2, leftCX - tw / 2f, y);
            y -= 14f;
        }
        tw = strWidth(fontBold, 10f, "***");
        drawText(cs, "***", leftCX - tw / 2f, y);

        // Ngày ngang hàng với dấu ***
        cs.setFont(fontReg, 10f);
        float tw2 = strWidth(fontReg, 10f, ngayStr);
        drawText(cs, ngayStr, rightCX - tw2 / 2f, y);
        y -= 10f;

        return y;
    }

    /** Khối chữ ký CLB: chỉ một cột bên phải (Chủ nhiệm). */
    private void drawClbSignBlock(PDPageContentStream cs, PDFont fontBold, PDFont fontReg,
                                   float y, String tenChuNhiem, String tenClb, float rightCX) throws IOException {
        cs.setFont(fontBold, 10f);
        String label = "CHỦ NHIỆM";
        if (tenClb != null && !tenClb.isBlank()) {
            label += " " + tenClb.toUpperCase();
        }
        // Nếu label quá dài (>150pt), tách dòng
        float maxW = 180f;
        if (strWidth(fontBold, 10f, label) > maxW) {
            String[] parts = label.split(" ", 3);
            // Vẽ "CHỦ NHIỆM" dòng đầu, tên CLB dòng hai
            float tw = strWidth(fontBold, 10f, "CHỦ NHIỆM");
            drawText(cs, "CHỦ NHIỆM", rightCX - tw / 2f, y);
            y -= 14f;
            String clbLine = tenClb.toUpperCase();
            tw = strWidth(fontBold, 10f, clbLine);
            drawText(cs, clbLine, rightCX - tw / 2f, y);
            y -= 60f; // space for signature image
        } else {
            float tw = strWidth(fontBold, 10f, label);
            drawText(cs, label, rightCX - tw / 2f, y);
            y -= 60f; // space for signature image
        }
        cs.setFont(fontBold, 10f);
        if (tenChuNhiem != null && !tenChuNhiem.isBlank()) {
            float tw = strWidth(fontBold, 10f, tenChuNhiem);
            drawText(cs, tenChuNhiem, rightCX - tw / 2f, y);
        }
    }

    /** Vẽ các dòng thành viên CLB (có cột chức vụ). */
    private float drawTableRowsClb(PDPageContentStream cs, PDFont font,
                                    List<ClbMemberRow> rows, float y, int startIdx,
                                    List<ColConfig> activeCols, float[] colWidths,
                                    List<EditZone> editZones, int pageIdx,
                                    float startX, float rowH) throws IOException {
        int stt = startIdx + 1;
        for (ClbMemberRow row : rows) {
            float x = startX;
            boolean even = (stt % 2 == 0);
            editZones.add(new EditZone("row", pageIdx, startX, y - rowH,
                    computeTableWidth(colWidths), rowH, stt - 1));
            for (int i = 0; i < activeCols.size(); i++) {
                ColConfig col = activeCols.get(i);
                float w = colWidths[i];
                drawCell(cs, x, y - rowH, w, rowH, false, even);
                String val = getClbCellValue(row, col.key(), stt);
                cs.setFont(font, 9.5f);
                boolean center = "stt".equals(col.key()) || "maSv".equals(col.key());
                String cell = truncate(val, font, 9.5f, w - 5f);
                float tw  = strWidth(font, 9.5f, cell);
                float textX = center ? x + (w - tw) / 2f : x + 4f;
                drawText(cs, cell, textX, y - 14f);
                x += w;
            }
            stt++;
            y -= rowH;
        }
        return y;
    }

    private String getClbCellValue(ClbMemberRow row, String key, int stt) {
        return switch (key) {
            case "stt"    -> String.valueOf(stt);
            case "hoTen"  -> row.hoTen()  != null ? row.hoTen()  : "";
            case "maLop"  -> row.maLop()  != null ? row.maLop()  : "";
            case "maSv"   -> row.maSv()   != null ? row.maSv()   : "";
            case "chucVu" -> row.chucVu() != null ? formatChucVuClb(row.chucVu()) : "";
            case "tenKhoa"-> row.tenKhoa()!= null ? normalizeKhoa(row.tenKhoa()) : "";
            default -> "";
        };
    }

    private String formatChucVuClb(String chucVu) {
        return switch (chucVu) {
            case "CHU_NHIEM"     -> "Chủ nhiệm";
            case "PHO_CHU_NHIEM" -> "P. Chủ nhiệm";
            case "BAN_QUAN_LY"   -> "Ban quản lý";
            case "CO_VAN"        -> "Cố vấn";
            case "THANH_VIEN"    -> "Thành viên";
            default -> chucVu;
        };
    }

    /** Áp ảnh chữ ký chủ nhiệm và con dấu vào trang cuối PDF CLB. */
    private byte[] applyClbSignatureImages(DraftResult draft, ClbBanHanhRequest req,
                                            byte[] imgChuNhiem, byte[] imgConDau) throws IOException {
        try (PDDocument doc = Loader.loadPDF(draft.pdf());
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int lastIdx = doc.getNumberOfPages() - 1;
            PDPage lastPage = doc.getPage(lastIdx);
            float sigW = 90f, sigH = 52f, stW = 95f, stH = 60f;

            float sigTextTopPdfY = PAGE_H - draft.sigBlockTopY();
            float defaultImgY    = sigTextTopPdfY - 14f - 4f - sigH;
            float rightCX = draft.rightCX();
            float leftCX  = draft.leftCX();

            try (PDPageContentStream cs = new PDPageContentStream(doc, lastPage,
                    PDPageContentStream.AppendMode.APPEND, true, true)) {

                // Chữ ký chủ nhiệm (bên phải)
                if (imgChuNhiem != null) {
                    PDImageXObject sig = PDImageXObject.createFromByteArray(doc, imgChuNhiem, "chuky");
                    float nX = resolveX(req.posChuNhiem(), rightCX - sigW / 2f);
                    float nY = resolveY(req.posChuNhiem(), defaultImgY, sigH);
                    cs.drawImage(sig, nX, nY, sigW, sigH);
                }
                // Con dấu (bên trái, chồng lên nhau)
                if (imgConDau != null) {
                    PDImageXObject stamp = PDImageXObject.createFromByteArray(doc, imgConDau, "condau");
                    float dX = resolveX(req.posConDau(), leftCX - stW / 2f);
                    float dY = resolveY(req.posConDau(), defaultImgY - 4f, stH);
                    cs.drawImage(stamp, dX, dY, stW, stH);
                }
            }
            doc.save(out);
            return out.toByteArray();
        }
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
                null, null, null, null, null);
    }

    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap,
                                       List<OverrideRow> overrideRows,
                                       String overrideTieuDe, String overrideNgayStr) throws IOException {
        return buildDraftPDF(hd, ds, loaiKy, tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                overrideRows, overrideTieuDe, overrideNgayStr, null, null);
    }

    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap,
                                       List<OverrideRow> overrideRows,
                                       String overrideTieuDe, String overrideNgayStr,
                                       List<ColConfig> colConfig) throws IOException {
        return buildDraftPDF(hd, ds, loaiKy, tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                overrideRows, overrideTieuDe, overrideNgayStr, colConfig, null, null);
    }

    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap,
                                       List<OverrideRow> overrideRows,
                                       String overrideTieuDe, String overrideNgayStr,
                                       List<ColConfig> colConfig,
                                       String orgLabel) throws IOException {
        return buildDraftPDF(hd, ds, loaiKy, tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                overrideRows, overrideTieuDe, overrideNgayStr, colConfig, orgLabel, null);
    }

    private DraftResult buildDraftPDF(HoatDong hd, List<DiemDanhHoatDongDTO> ds,
                                       String loaiKy, String tenNguoiKy,
                                       String tenNguoiLap, String chucVuNguoiLap,
                                       List<OverrideRow> overrideRows,
                                       String overrideTieuDe, String overrideNgayStr,
                                       List<ColConfig> colConfig,
                                       String orgLabel,
                                       FormatConfig fmt) throws IOException {
        // ── Resolve FormatConfig (dùng giá trị mặc định nếu null) ────────────
        FormatConfig f = (fmt != null) ? fmt : new FormatConfig(null,null,null,null,null,null,null);
        float mL   = f.leftPt();
        float mR   = f.rightPt();
        float mT   = f.topPt();
        float mB   = f.bottomPt();
        float rH   = f.rowH();
        float bFs  = f.bodyFs();

        // ── Resolve column config ──────────────────────────────────────────────
        List<ColConfig> activeCols = (colConfig != null ? colConfig : DEFAULT_COL_CONFIG)
                .stream().filter(ColConfig::visible).toList();
        float[] colWidths = new float[activeCols.size()];
        String[] colHeaders = new String[activeCols.size()];
        for (int i = 0; i < activeCols.size(); i++) {
            colWidths[i] = activeCols.get(i).widthPt();
            colHeaders[i] = activeCols.get(i).header();
        }
        float tableW = 0;
        for (float w : colWidths) tableW += w;

        List<EditZone> editZones = new ArrayList<>();

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDFont fontReg  = loadFont(doc, false, f.fontName());
            PDFont fontBold = loadFont(doc, true,  f.fontName());

            String tieuDe  = (overrideTieuDe  != null && !overrideTieuDe.isBlank())
                    ? overrideTieuDe  : buildTieuDe(hd);
            LocalDate ngayKy = hd.getNgayToChuc() != null ? hd.getNgayToChuc() : LocalDate.now();
            String ngayStr = (overrideNgayStr != null && !overrideNgayStr.isBlank())
                    ? overrideNgayStr
                    : String.format("An Giang, ngày %02d tháng %02d năm %d",
                            ngayKy.getDayOfMonth(), ngayKy.getMonthValue(), ngayKy.getYear());

            float midX    = PAGE_W / 2f;
            float leftCX  = mL + (midX - mL) / 2f;
            float rightCX = midX + (PAGE_W - mR - midX) / 2f;

            // Phân trang — titleH tính từ số dòng thực tế sau khi word-wrap, khớp với drawTitle()
            // bên dưới, tránh trường hợp tiêu đề dài tự xuống dòng nhưng không được chừa đủ chỗ
            // (dẫn tới bảng đè lên/tràn ra ngoài lề trang).
            //
            // Khối ký (SIG_BLOCK_H) + dòng tổng cộng (rH) chỉ thực sự được vẽ ở TRANG CUỐI, nên
            // không trừ chỗ cho nó khi tính sức chứa của mọi trang (trước đây trừ ở mọi trang —
            // khiến các trang không phải trang cuối luôn thừa 1 khoảng trống lớn ở cuối trang dù
            // không hề vẽ gì ở đó). Sau khi phân trang theo sức chứa đầy đủ, kiểm tra riêng trang
            // cuối có đủ chỗ cho khối ký không — nếu không thì đẩy bớt vài dòng cuối sang trang mới.
            float headerH   = 75f;
            float titleH    = estimateTitleHeight(tieuDe, fontBold, mL, mR);
            float availFirst = PAGE_H - mT - headerH - titleH - HEADER_ROW_H - mB;
            float availOther = PAGE_H - mT - HEADER_ROW_H - mB;

            int rowsFirst = Math.max(1, (int)(availFirst / rH));
            int rowsOther = Math.max(1, (int)(availOther / rH));

            List<DiemDanhHoatDongDTO> rows = (overrideRows != null && !overrideRows.isEmpty())
                    ? overrideRows.stream().map(r -> DiemDanhHoatDongDTO.builder()
                            .hoTenSinhVien(r.hoTen()).maLop(r.maLop())
                            .maSv(r.maSv()).tenKhoa(r.tenKhoa()).build()
                    ).collect(java.util.stream.Collectors.toList())
                    : ds;

            List<List<DiemDanhHoatDongDTO>> pages = paginate(rows, rowsFirst, rowsOther);

            // Đảm bảo trang cuối còn đủ chỗ cho dòng tổng cộng + khối ký; nếu không, đẩy bớt
            // các dòng cuối cùng sang một trang mới (trang này chỉ dùng sức chứa "other").
            float sigTailNeeded = SIG_BLOCK_H + rH;
            List<DiemDanhHoatDongDTO> lastPage = pages.get(pages.size() - 1);
            float availOnLastPage = (pages.size() == 1) ? availFirst : availOther;
            List<DiemDanhHoatDongDTO> overflow = new ArrayList<>();
            while (!lastPage.isEmpty() && availOnLastPage - (lastPage.size() * rH) < sigTailNeeded) {
                overflow.add(0, lastPage.remove(lastPage.size() - 1));
            }
            if (!overflow.isEmpty()) {
                pages.add(overflow);
            }

            int total = pages.size();
            float sigBlockTopY = 0f;

            for (int p = 0; p < total; p++) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = PAGE_H - mT;

                    if (p == 0) {
                        float yBeforeHeader = y;
                        String tenKhoa = (hd.getKhoa() != null) ? hd.getKhoa().getTenKhoa() : null;
                        y = drawHeader(cs, fontReg, fontBold, y, ngayStr, tenKhoa, mL, mR);
                        // Date zone: trong header tại startY - 30f, baseline ~10pt
                        editZones.add(new EditZone("date", 0, midX, yBeforeHeader - 44f, PAGE_W - midX - mR, 14f, -1));
                        y -= 8f;

                        float yBeforeTitle = y;
                        y = drawTitle(cs, fontBold, tieuDe, y, mL, mR);
                        // Title zone: từ yBeforeTitle xuống y (y là bottom sau drawTitle)
                        editZones.add(new EditZone("title", 0, mL, y + 4f, PAGE_W - mL - mR, yBeforeTitle - y, -1));
                        y -= 8f;
                    }

                    y = drawTableHeader(cs, fontBold, y, colWidths, colHeaders, mL);
                    y = drawTableRowsFull(cs, fontReg, pages.get(p), y,
                            countOffset(pages, p), activeCols, colWidths, editZones, p, mL, rH);

                    if (p == total - 1) {
                        y = drawTotalRow(cs, fontBold, fontReg, y, rows.size(), colWidths, tableW, mL, rH);
                        y -= 14f;
                        sigBlockTopY = PAGE_H - y;
                        drawSignBlockText(cs, fontBold, fontReg, y, loaiKy,
                                tenNguoiKy, tenNguoiLap, chucVuNguoiLap,
                                leftCX, rightCX, orgLabel);
                    }
                    // Không vẽ số trang
                }
            }

            doc.save(out);
            return new DraftResult(out.toByteArray(), sigBlockTopY, leftCX, rightCX, editZones);
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
                                    float leftCX, float rightCX,
                                    String orgLabel) throws IOException {
        float tw;
        cs.setFont(fontBold, 10f);

        // Dòng 1: tiêu đề cột
        String lbl1 = (orgLabel != null && !orgLabel.isBlank())
                ? orgLabel.toUpperCase()
                : "TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG";
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
            // role line = sigTextTopPdfY - 14; ảnh nằm 4pt dưới role, drawImage y = bottom edge
            float defaultImgY    = sigTextTopPdfY - 14f - 4f - sigH;

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
    // GIÁP LAI — đóng dấu lên mọi trang để chống rút/thay trang
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Đóng dấu giáp lai: vẽ cùng 1 ảnh con dấu tại cùng 1 vị trí (mép phải,
     * giữa trang theo chiều dọc) trên MỌI trang của tài liệu, kèm số trang
     * "Trang X/Y" ở chân trang. Khi in và xếp các trang sát mép phải, vệt dấu
     * thẳng hàng liên tục — nếu 1 trang bị rút hoặc thay, vệt dấu sẽ bị
     * lệch/đứt đoạn, phát hiện được bằng mắt thường.
     */
    private byte[] applyGiapLai(byte[] pdfBytes, byte[] sealImg) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int total = doc.getNumberOfPages();
            PDImageXObject sealXObj = PDImageXObject.createFromByteArray(doc, sealImg, "giaplai");
            PDFont fontReg = loadFont(doc, false, null);

            float size = 36f;
            float x = PAGE_W - size - 6f;
            float y = PAGE_H / 2f - size / 2f;

            for (int i = 0; i < total; i++) {
                PDPage page = doc.getPage(i);
                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.drawImage(sealXObj, x, y, size, size);

                    String label = "Trang " + (i + 1) + "/" + total;
                    cs.setFont(fontReg, 8f);
                    float tw = strWidth(fontReg, 8f, label);
                    drawText(cs, label, (PAGE_W - tw) / 2f, 24f);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Ký nháy: vẽ ảnh chữ ký nháy (nhỏ) ở góc dưới-phải trên MỌI trang TRỪ
     * trang cuối (trang cuối đã có chữ ký đầy đủ + con dấu chính trong khối ký).
     * Tài liệu 1 trang không có gì để ký nháy (không có trang nào "trừ trang cuối").
     */
    private byte[] applyKyNhay(byte[] pdfBytes, byte[] kyNhayImg) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            int total = doc.getNumberOfPages();
            if (total <= 1) {
                doc.save(out);
                return out.toByteArray();
            }

            PDImageXObject sigXObj = PDImageXObject.createFromByteArray(doc, kyNhayImg, "kynhay");
            float w = 40f, h = 22f;
            float x = PAGE_W - MARGIN_R - w;
            float y = MARGIN_B - 10f;

            for (int i = 0; i < total - 1; i++) {
                PDPage page = doc.getPage(i);
                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.drawImage(sigXObj, x, y, w, h);
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KHÓA PDF — hạn chế chỉnh sửa/copy, không mật khẩu để mở/xem/in
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Khóa PDF ở mức "hạn chế chỉnh sửa": ai cũng mở/xem/in được (không mật
     * khẩu mở), nhưng không sửa được nội dung, không copy text, không chèn
     * annotation/chữ ký giả vào file.
     * <p>
     * QUAN TRỌNG — thứ tự gọi: hàm này PHẢI chạy TRƯỚC {@code signWithCertificate()}.
     * {@code signWithCertificate()} dùng {@code saveIncrementalForExternalSigning()}
     * (ghi incremental, chỉ thêm phần chữ ký, giữ nguyên byte gốc để ByteRange hợp lệ),
     * trong khi {@code PDDocument.protect(...)} ghi full rewrite (tạo lại toàn bộ xref
     * + mã hóa stream). Nếu khóa PDF SAU khi ký số, chữ ký số sẽ bị hỏng/không hợp lệ.
     */
    private byte[] applyPdfLock(byte[] pdfBytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            AccessPermission ap = new AccessPermission();
            ap.setCanModify(false);
            ap.setCanModifyAnnotations(false);
            ap.setCanExtractContent(false);
            ap.setCanAssembleDocument(false);
            ap.setCanFillInForm(false);
            ap.setCanPrint(true);
            ap.setCanPrintFaithful(true);
            ap.setCanExtractForAccessibility(true);

            // Owner password ngẫu nhiên, không lưu lại — chỉ dùng để khóa quyền
            // chỉnh sửa, không ai cần biết mật khẩu này. User password để trống
            // = mở/xem/in tự do, không cần mật khẩu.
            String ownerPassword = UUID.randomUUID().toString() + UUID.randomUUID();
            StandardProtectionPolicy policy = new StandardProtectionPolicy(ownerPassword, "", ap);
            policy.setEncryptionKeyLength(128);
            doc.protect(policy);

            doc.save(out);
            return out.toByteArray();
        }
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
                             float y, String ngayStr, String tenKhoa,
                             float mL, float mR) throws IOException {
        float startY = y;
        float midX   = PAGE_W / 2f;

        // ── CỘT TRÁI (mL .. midX) ────────────────────────────────────────
        float leftColW  = midX - mL;
        float leftColCX = mL + leftColW / 2f;

        cs.setFont(fontBold, 10f);
        String org1, org2;
        if (tenKhoa != null && !tenKhoa.isBlank()) {
            org1 = "ĐOÀN TRƯỜNG ĐẠI HỌC KIÊN GIANG";
            org2 = "ĐOÀN KHOA " + tenKhoa.toUpperCase();
        } else {
            org1 = "TỈNH ĐOÀN AN GIANG";
            org2 = "ĐOÀN TRƯỜNG ĐẠI HỌC KIÊN GIANG";
        }
        String sep  = "***";

        float tw;
        tw = strWidth(fontBold, 10f, org1);
        drawText(cs, org1, leftColCX - tw / 2f, y);         y -= 14f;
        tw = strWidth(fontBold, 10f, org2);
        drawText(cs, org2, leftColCX - tw / 2f, y);         y -= 14f;
        tw = strWidth(fontBold, 10f, sep);
        drawText(cs, sep, leftColCX - tw / 2f, y);          y -= 10f;

        // ── CỘT PHẢI (midX .. PAGE_W-mR) ────────────────────────────────
        float rightColW  = PAGE_W - mR - midX;
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

    private float drawTitle(PDPageContentStream cs, PDFont fontBold, String tieuDe, float y,
                             float mL, float mR) throws IOException {
        List<String> lines = wrapTitle(tieuDe, fontBold, mL, mR);
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

    private float drawTableHeader(PDPageContentStream cs, PDFont fontBold, float y,
                                   float[] colWidths, String[] colHeaders, float startX) throws IOException {
        float x = startX;
        cs.setFont(fontBold, 9.5f);
        for (int i = 0; i < colWidths.length; i++) {
            float w = colWidths[i];
            drawCell(cs, x, y - HEADER_ROW_H, w, HEADER_ROW_H, true);
            float tw = strWidth(fontBold, 9.5f, colHeaders[i]);
            drawText(cs, colHeaders[i], x + (w - tw) / 2f, y - 15f);
            x += w;
        }
        return y - HEADER_ROW_H;
    }

    private float drawTableRowsFull(PDPageContentStream cs, PDFont font,
                                     List<DiemDanhHoatDongDTO> rows, float y, int startIdx,
                                     List<ColConfig> activeCols, float[] colWidths,
                                     List<EditZone> editZones, int pageIdx,
                                     float startX, float rowH) throws IOException {
        int stt = startIdx + 1;
        int globalRowIdx = startIdx;
        for (DiemDanhHoatDongDTO row : rows) {
            float x = startX;
            boolean even = (stt % 2 == 0);
            // Row edit zone (Y từ dưới lên: bottom = y - rowH, height = rowH)
            editZones.add(new EditZone("row", pageIdx, startX, y - rowH,
                    computeTableWidth(colWidths), rowH, globalRowIdx));

            for (int i = 0; i < activeCols.size(); i++) {
                ColConfig col = activeCols.get(i);
                float w = colWidths[i];
                drawCell(cs, x, y - rowH, w, rowH, false, even);

                String cellVal = getCellValue(row, col.key(), stt);
                boolean isKhoa = "tenKhoa".equals(col.key());
                boolean center = "stt".equals(col.key()) || "maSv".equals(col.key());

                if (isKhoa) {
                    cs.setFont(font, 8.5f);
                    drawWrappedCellText(cs, font, cellVal, x, y, w - 5f);
                    cs.setFont(font, 9.5f);
                } else {
                    cs.setFont(font, 9.5f);
                    String cell = truncate(cellVal, font, 9.5f, w - 5f);
                    float tw    = strWidth(font, 9.5f, cell);
                    float textX = center ? x + (w - tw) / 2f : x + 4f;
                    drawText(cs, cell, textX, y - 14f);
                }
                x += w;
            }
            stt++;
            globalRowIdx++;
            y -= rowH;
        }
        return y;
    }

    private float computeTableWidth(float[] colWidths) {
        float total = 0;
        for (float w : colWidths) total += w;
        return total;
    }

    /** Giá trị ô theo key cột, tự động strip prefix "Khoa " cho tenKhoa. */
    private String getCellValue(DiemDanhHoatDongDTO row, String key, int stt) {
        return switch (key) {
            case "stt"     -> String.valueOf(stt);
            case "hoTen"   -> row.getHoTenSinhVien() != null ? row.getHoTenSinhVien() : "";
            case "maLop"   -> row.getMaLop()         != null ? row.getMaLop()         : "";
            case "maSv"    -> row.getMaSv()           != null ? row.getMaSv()          : "";
            case "tenKhoa" -> normalizeKhoa(row.getTenKhoa());
            default        -> "";
        };
    }

    private String normalizeKhoa(String tenKhoa) {
        if (tenKhoa == null || tenKhoa.isBlank()) return "";
        String t = tenKhoa.trim();
        if (t.length() > 5 && t.substring(0, 5).equalsIgnoreCase("Khoa ")) return t.substring(5);
        return t;
    }

    /**
     * Vẽ text trong ô có thể xuống dòng (2 dòng) khi quá dài.
     * Y là vị trí TRÊN của ô (hệ toạ độ PDF từ dưới lên).
     */
    private void drawWrappedCellText(PDPageContentStream cs, PDFont font,
                                      String text, float x, float y, float maxW) throws IOException {
        if (text == null || text.isBlank()) return;
        final float fontSize = 8.5f;

        // Thử vừa 1 dòng
        if (strWidth(font, fontSize, text) <= maxW) {
            drawText(cs, text, x + 4f, y - 14f);
            return;
        }

        // Tách từ, tìm điểm gãy dòng
        String[] words = text.split("\\s+");
        StringBuilder line1 = new StringBuilder();
        int splitIdx = words.length;
        for (int i = 0; i < words.length; i++) {
            String candidate = (line1.length() > 0 ? line1 + " " : "") + words[i];
            if (strWidth(font, fontSize, candidate) > maxW) {
                splitIdx = i;
                break;
            }
            if (line1.length() > 0) line1.append(" ");
            line1.append(words[i]);
        }

        String l1 = line1.toString();
        // Nối phần còn lại thành dòng 2, rồi cắt nếu vẫn quá dài
        StringBuilder sb2 = new StringBuilder();
        for (int i = splitIdx; i < words.length; i++) {
            if (sb2.length() > 0) sb2.append(" ");
            sb2.append(words[i]);
        }
        String l2 = truncate(sb2.toString(), font, fontSize, maxW);

        // Dòng 1 cách trên 7pt, dòng 2 cách dưới 6pt (trong row 22pt)
        drawText(cs, l1, x + 4f, y - 8f);
        if (!l2.isBlank()) {
            drawText(cs, l2, x + 4f, y - 18f);
        }
    }

    /** Dòng "Tổng cộng" sau bảng (trang cuối). */
    private float drawTotalRow(PDPageContentStream cs, PDFont fontBold, PDFont fontReg,
                                float y, int total, float[] colWidths, float tableW,
                                float startX, float rowH) throws IOException {
        float x = startX;

        cs.setNonStrokingColor(0.90f, 0.95f, 1.0f);
        cs.addRect(x, y - rowH, tableW, rowH);
        cs.fill();
        cs.setNonStrokingColor(0f, 0f, 0f);

        cs.setLineWidth(0.6f);
        cs.addRect(x, y - rowH, tableW, rowH);
        cs.stroke();

        cs.setFont(fontBold, 9.5f);
        String label = "Tổng cộng: " + total + " sinh viên";
        float tw = strWidth(fontBold, 9.5f, label);
        drawText(cs, label, x + (tableW - tw) / 2f, y - 14f);

        return y - rowH;
    }

    // Không tô nền cho bảng (kể cả header) — chỉ vẽ viền, đúng thể thức văn bản hành chính.
    private void drawCell(PDPageContentStream cs, float x, float y, float w, float h,
                           boolean header, boolean even) throws IOException {
        cs.setLineWidth(0.4f);
        cs.addRect(x, y, w, h);
        cs.stroke();
    }

    // Overload tương thích ngược (header không cần even)
    private void drawCell(PDPageContentStream cs, float x, float y, float w, float h, boolean header) throws IOException {
        drawCell(cs, x, y, w, h, header, false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FONT — Times New Roman ưu tiên, fallback classpath, fallback hệ thống
    // ═══════════════════════════════════════════════════════════════════════

    private PDFont loadFont(PDDocument doc, boolean bold, String fontName) throws IOException {
        // Chọn bộ font theo fontName ("arial", "calibri", hoặc mặc định Times New Roman)
        String fn = (fontName != null) ? fontName.toLowerCase().trim() : "times";

        String windir = System.getenv("WINDIR");
        if (windir == null) windir = "C:/Windows";
        String winFontDir = windir.replace('\\', '/') + "/Fonts/";

        String[] fsPaths;
        String classpathFont;
        if ("arial".equals(fn)) {
            classpathFont = bold ? "/fonts/arialbd.ttf" : "/fonts/arial.ttf";
            fsPaths = bold
                    ? new String[]{ winFontDir + "arialbd.ttf", winFontDir + "arial.ttf",
                                    "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf" }
                    : new String[]{ winFontDir + "arial.ttf",
                                    "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf" };
        } else if ("calibri".equals(fn)) {
            classpathFont = bold ? "/fonts/calibrib.ttf" : "/fonts/calibri.ttf";
            fsPaths = bold
                    ? new String[]{ winFontDir + "calibrib.ttf" }
                    : new String[]{ winFontDir + "calibri.ttf" };
        } else if ("montserrat".equals(fn)) {
            // Không phải font hệ thống Windows — chỉ có sẵn qua classpath (đã bundle sẵn trong /fonts)
            classpathFont = bold ? "/fonts/montserratbd.ttf" : "/fonts/montserrat.ttf";
            fsPaths = new String[0];
        } else {
            // default: Times New Roman
            classpathFont = bold ? "/fonts/timesbd.ttf" : "/fonts/times.ttf";
            fsPaths = bold
                    ? new String[]{ winFontDir + "timesbd.ttf", winFontDir + "times.ttf",
                                    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf",
                                    "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf" }
                    : new String[]{ winFontDir + "times.ttf",
                                    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf",
                                    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf" };
        }

        // 1. Thử classpath resource (bundled trong JAR)
        try (java.io.InputStream is = getClass().getResourceAsStream(classpathFont)) {
            if (is != null) {
                return PDType0Font.load(doc, is, true);
            }
        } catch (IOException e) {
            log.warn("Không tải được font classpath {}: {}", classpathFont, e.getMessage());
        }

        for (String path : fsPaths) {
            File f = new File(path);
            if (f.exists() && f.canRead()) {
                try {
                    return PDType0Font.load(doc, f);
                } catch (IOException e) {
                    log.warn("Không tải được font {}: {}", path, e.getMessage());
                }
            }
        }

        log.warn("Không tìm thấy font Unicode, dùng Times-Roman (built-in, không hỗ trợ tiếng Việt)");
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

    /** Word-wrap 1 dòng (không chứa \n) thành nhiều dòng vừa maxW, tách theo khoảng trắng. */
    private List<String> wrapLine(String line, PDFont font, float size, float maxW) throws IOException {
        List<String> out = new ArrayList<>();
        if (line == null || line.isBlank()) { out.add(line == null ? "" : line); return out; }
        String[] words = line.trim().split("\\s+");
        StringBuilder cur = new StringBuilder();
        for (String w : words) {
            String candidate = cur.length() == 0 ? w : cur + " " + w;
            if (cur.length() == 0 || strWidth(font, size, candidate) <= maxW) {
                cur = new StringBuilder(candidate);
            } else {
                out.add(cur.toString());
                cur = new StringBuilder(w);
            }
        }
        if (cur.length() > 0) out.add(cur.toString());
        return out;
    }

    /**
     * Tách tiêu đề thành các dòng đã word-wrap vừa khổ giấy trừ lề trái/phải.
     * Hỗ trợ cả xuống dòng thủ công (\n, ví dụ do người dùng nhấn Enter trong ô sửa tiêu đề)
     * lẫn tự động ngắt dòng khi 1 dòng quá dài (VD: tên hoạt động dài) — tránh bị tràn/cắt ra
     * ngoài lề trang như trước đây.
     */
    private List<String> wrapTitle(String tieuDe, PDFont fontBold, float mL, float mR) throws IOException {
        float maxW = PAGE_W - mL - mR;
        List<String> result = new ArrayList<>();
        for (String rawLine : tieuDe.split("\n")) {
            result.addAll(wrapLine(rawLine, fontBold, 12f, maxW));
        }
        return result;
    }

    /** Ước lượng chiều cao khối tiêu đề (dùng để tính toán phân trang) — phải khớp với drawTitle(). */
    private float estimateTitleHeight(String tieuDe, PDFont fontBold, float mL, float mR) throws IOException {
        int lineCount = Math.max(1, wrapTitle(tieuDe, fontBold, mL, mR).size());
        return lineCount * 16f + 12f;
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

    private void clearDefaultChuKyForOwnerAndLoai(String ownerUsername, LoaiChuKy loai) {
        chuKyRepository.findByOwnerUsernameAndLoaiChuKyOrderByCreatedAtDesc(ownerUsername, loai).forEach(ck -> {
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
                .laMacDinh(ck.getLaMacDinh()).ownerUsername(ck.getOwnerUsername())
                .loaiChuKy(ck.getLoaiChuKy() != null ? ck.getLoaiChuKy().name() : null)
                .createdAt(ck.getCreatedAt()).build();
    }

    private ConDauDTO toConDauDTO(ConDau cd) {
        return ConDauDTO.builder().id(cd.getId()).ten(cd.getTen())
                .duongDan(cd.getDuongDan()).laMacDinh(cd.getLaMacDinh())
                .ownerUsername(cd.getOwnerUsername())
                .createdAt(cd.getCreatedAt()).build();
    }
}
