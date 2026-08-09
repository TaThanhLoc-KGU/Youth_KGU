package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChungNhanTemplateFieldDTO;
import com.tathanhloc.youthkgu.Model.ChuKy;
import com.tathanhloc.youthkgu.Model.ChungNhanTemplate;
import com.tathanhloc.youthkgu.Repository.ChuKyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.font.FontRenderContext;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Render 1 chứng nhận thật: ảnh nền mẫu + text các trường (thay dữ liệu sinh viên/hoạt động
 * thật vào) → 1 ảnh PNG được compose → đóng gói thành PDF 1 trang mà nội dung HOÀN TOÀN LÀ ẢNH
 * (không có text chọn/copy/sửa được) — "khoá dưới dạng ảnh" theo đúng yêu cầu, chống sửa giả mạo.
 *
 * Toạ độ x/y/width/height/fontSizePt của từng trường (ChungNhanTemplateFieldDTO) dùng chung 1 đơn
 * vị: pixel của ảnh nền gốc — khớp với hệ toạ độ trình thiết kế (Konva canvas) ở frontend, nên
 * không cần quy đổi gì khi vẽ lên BufferedImage (1 canvas unit = 1 pixel ảnh nền = 1 đơn vị Graphics2D).
 * Chỉ quy đổi sang pt (72dpi) khi đóng gói trang PDF cuối cùng, vì PDF dùng point làm đơn vị khổ giấy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChungNhanRenderService {

    private final ChuKyRepository chuKyRepository;

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    private static final float ASSUMED_IMAGE_DPI = 96f;
    private static final float PDF_DPI = 72f;

    /** Dữ liệu thật dùng để thay vào các trường có key khi render — key khớp ChungNhanTemplateFieldDTO.key */
    public record CertData(
            String hoTenSinhVien, String maSv, String tenLop, String tenKhoa,
            String tenHoatDong, String ngayCap, String maChungNhan) {
    }

    public byte[] render(ChungNhanTemplate template, List<ChungNhanTemplateFieldDTO> fields, CertData data) throws IOException {
        BufferedImage composed = compose(template, fields, data);
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        ImageIO.write(composed, "png", pngOut);
        return wrapAsPdf(pngOut.toByteArray(), composed.getWidth(), composed.getHeight());
    }

    /** Dùng cho xem trước — trả PNG thẳng (nhẹ, không cần đóng gói PDF). */
    public byte[] renderToPng(ChungNhanTemplate template, List<ChungNhanTemplateFieldDTO> fields, CertData data) throws IOException {
        BufferedImage composed = compose(template, fields, data);
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        ImageIO.write(composed, "png", pngOut);
        return pngOut.toByteArray();
    }

    private BufferedImage compose(ChungNhanTemplate template, List<ChungNhanTemplateFieldDTO> fields, CertData data) throws IOException {
        BufferedImage bg = loadImage(template.getHinhNen());
        BufferedImage composed = new BufferedImage(bg.getWidth(), bg.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = composed.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(bg, 0, 0, null);

            if (fields != null) {
                for (ChungNhanTemplateFieldDTO f : fields) {
                    if ("signature".equals(f.getType())) {
                        drawSignatureField(g, f);
                    } else {
                        String text = resolveValue(f, data);
                        if (text == null || text.isBlank()) continue;
                        drawField(g, f, text);
                    }
                }
            }
        } finally {
            g.dispose();
        }
        return composed;
    }

    /** Vẽ ảnh chữ ký (lấy từ thư viện Ký số) vào khung field — giữ tỉ lệ, canh giữa khung. */
    private void drawSignatureField(Graphics2D g, ChungNhanTemplateFieldDTO f) {
        if (f.getChuKyId() == null) return;
        ChuKy chuKy = chuKyRepository.findById(f.getChuKyId()).orElse(null);
        if (chuKy == null) {
            log.warn("Không tìm thấy chữ ký id={} cho trường trong mẫu chứng nhận", f.getChuKyId());
            return;
        }
        try {
            BufferedImage sig = loadImage(chuKy.getDuongDan());
            float boxW = f.getWidth(), boxH = f.getHeight();
            float scale = Math.min(boxW / sig.getWidth(), boxH / sig.getHeight());
            int drawW = Math.round(sig.getWidth() * scale);
            int drawH = Math.round(sig.getHeight() * scale);
            int drawX = Math.round(f.getX() + (boxW - drawW) / 2f);
            int drawY = Math.round(f.getY() + (boxH - drawH) / 2f);
            g.drawImage(sig, drawX, drawY, drawW, drawH, null);
        } catch (IOException e) {
            log.warn("Không vẽ được ảnh chữ ký id={}: {}", f.getChuKyId(), e.getMessage());
        }
    }

    private String resolveValue(ChungNhanTemplateFieldDTO f, CertData d) {
        if (f.getKey() == null || f.getKey().isBlank()) return f.getLabel();
        return switch (f.getKey()) {
            case "hoTenSinhVien" -> d.hoTenSinhVien();
            case "maSv"          -> d.maSv();
            case "tenLop"        -> d.tenLop();
            case "tenKhoa"       -> d.tenKhoa();
            case "tenHoatDong"   -> d.tenHoatDong();
            case "ngayCap"       -> d.ngayCap();
            case "maChungNhan"   -> d.maChungNhan();
            default -> f.getLabel();
        };
    }

    private void drawField(Graphics2D g, ChungNhanTemplateFieldDTO f, String text) {
        Font font = loadAwtFont(f.isBold(), f.getFontName(), f.getFontSizePt());
        g.setFont(font);
        g.setColor(parseColor(f.getColor()));

        FontRenderContext frc = g.getFontRenderContext();
        Rectangle2D bounds = font.getStringBounds(text, frc);
        float textW = (float) bounds.getWidth();
        float ascent = font.getLineMetrics(text, frc).getAscent();

        String align = f.getAlign() != null ? f.getAlign() : "left";
        float x = switch (align) {
            case "center" -> f.getX() + (f.getWidth() - textW) / 2f;
            case "right"  -> f.getX() + f.getWidth() - textW;
            default       -> f.getX();
        };
        float y = f.getY() + (f.getHeight() + ascent) / 2f;

        g.drawString(text, x, y);
    }

    private Color parseColor(String hex) {
        try {
            if (hex == null || hex.isBlank()) return Color.BLACK;
            return Color.decode(hex.startsWith("#") ? hex : "#" + hex);
        } catch (Exception e) {
            return Color.BLACK;
        }
    }

    private BufferedImage loadImage(String relativePath) throws IOException {
        String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        String subPath = cleanPath.startsWith("uploads/") ? cleanPath.substring("uploads/".length()) : cleanPath;
        Path filePath = Paths.get(uploadBasePath).resolve(subPath).normalize();
        BufferedImage img = ImageIO.read(filePath.toFile());
        if (img == null) throw new IOException("Không đọc được ảnh: " + relativePath);
        return img;
    }

    private byte[] wrapAsPdf(byte[] pngBytes, int widthPx, int heightPx) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            float widthPt = widthPx * PDF_DPI / ASSUMED_IMAGE_DPI;
            float heightPt = heightPx * PDF_DPI / ASSUMED_IMAGE_DPI;
            PDPage page = new PDPage(new PDRectangle(widthPt, heightPt));
            doc.addPage(page);
            PDImageXObject img = PDImageXObject.createFromByteArray(doc, pngBytes, "chungnhan");
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.drawImage(img, 0, 0, widthPt, heightPt);
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    private Font loadAwtFont(boolean bold, String fontName, float sizePt) {
        String fn = (fontName != null) ? fontName.toLowerCase().trim() : "times";
        String classpathFont;
        if ("arial".equals(fn)) {
            classpathFont = bold ? "/fonts/arialbd.ttf" : "/fonts/arial.ttf";
        } else if ("calibri".equals(fn)) {
            classpathFont = bold ? "/fonts/calibrib.ttf" : "/fonts/calibri.ttf";
        } else if ("montserrat".equals(fn)) {
            classpathFont = bold ? "/fonts/montserratbd.ttf" : "/fonts/montserrat.ttf";
        } else {
            classpathFont = bold ? "/fonts/timesbd.ttf" : "/fonts/times.ttf";
        }

        float size = sizePt > 0 ? sizePt : 14f;
        try (InputStream is = getClass().getResourceAsStream(classpathFont)) {
            if (is != null) {
                Font base = Font.createFont(Font.TRUETYPE_FONT, is);
                return base.deriveFont(size);
            }
        } catch (Exception e) {
            log.warn("Không tải được font {} cho chứng nhận: {}", classpathFont, e.getMessage());
        }
        log.warn("Dùng font hệ thống fallback cho chứng nhận (không đảm bảo đủ dấu tiếng Việt)");
        return new Font("Serif", bold ? Font.BOLD : Font.PLAIN, (int) size);
    }
}
