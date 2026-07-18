package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.FileUploadResult;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

/**
 * Xử lý upload / download / xóa file vật lý cho module eNews.
 * Thư mục gốc lấy từ app.upload.path (mặc định ./uploads).
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    private static final Set<String> ALLOWED_DOC_TYPES = Set.of("pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt");
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_DOC_SIZE  = 50L * 1024 * 1024;   // 50 MB
    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;  // 10 MB

    // ── Văn bản ────────────────────────────────────────────────────────────────

    /**
     * Lưu file đính kèm văn bản vào /uploads/van-ban/yyyy/MM/{uuid}.ext
     */
    public FileUploadResult saveVanBanFile(MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE,
                "Chỉ chấp nhận: PDF, Word, Excel, PowerPoint");

        String ext = getExtension(file.getOriginalFilename());
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "van-ban", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/van-ban/" + yearMonth + "/" + storedName;
            log.info("Saved van-ban file: {}", relativePath);
            return FileUploadResult.builder()
                    .duongDan(relativePath)
                    .loaiFile(ext)
                    .build();
        } catch (IOException e) {
            throw new BusinessException("FILE_SAVE_ERROR", "Lỗi lưu file: " + e.getMessage());
        }
    }

    // ── Quyết định hoạt động ─────────────────────────────────────────────────────

    /**
     * Lưu file quyết định đính kèm hoạt động vào /uploads/hoat-dong/yyyy/MM/{uuid}.ext
     */
    public FileUploadResult saveHoatDongQuyetDinhFile(MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE,
                "Chỉ chấp nhận: PDF, Word, Excel, PowerPoint");

        String ext = getExtension(file.getOriginalFilename());
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "hoat-dong", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/hoat-dong/" + yearMonth + "/" + storedName;
            log.info("Saved hoat-dong quyet-dinh file: {}", relativePath);
            return FileUploadResult.builder()
                    .duongDan(relativePath)
                    .loaiFile(ext)
                    .build();
        } catch (IOException e) {
            throw new BusinessException("FILE_SAVE_ERROR", "Lỗi lưu file: " + e.getMessage());
        }
    }

    // ── Ảnh media (slider, banner, ...) ────────────────────────────────────────

    /**
     * Lưu ảnh media (slider, banner) vào /uploads/media/yyyy/MM/{uuid}.jpg
     * Tự động nén về JPEG quality=75%, max width=1920px.
     */
    public String saveMediaImage(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE,
                "Chỉ chấp nhận: JPG, PNG, GIF, WebP");

        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "media", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + ".jpg";
            Path dest = dir.resolve(storedName);
            byte[] compressed = compressImage(file.getInputStream(), 1920, 0.75f);
            Files.write(dest, compressed);

            String relativePath = "/uploads/media/" + yearMonth + "/" + storedName;
            log.info("Saved media image (compressed): {} ({} KB)", relativePath, compressed.length / 1024);
            return relativePath;
        } catch (IOException e) {
            throw new BusinessException("FILE_SAVE_ERROR", "Lỗi lưu ảnh: " + e.getMessage());
        }
    }

    /**
     * Liệt kê tất cả ảnh trong /uploads/media/ (đệ quy).
     * Trả về danh sách relative path.
     */
    public java.util.List<String> listMediaImages() {
        Path mediaDir = Paths.get(uploadBasePath, "media");
        if (!Files.exists(mediaDir)) return java.util.Collections.emptyList();
        try (java.util.stream.Stream<Path> stream = Files.walk(mediaDir)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String n = p.getFileName().toString().toLowerCase();
                        return n.endsWith(".jpg") || n.endsWith(".jpeg")
                                || n.endsWith(".png") || n.endsWith(".gif") || n.endsWith(".webp");
                    })
                    .map(p -> {
                        String rel = Paths.get(uploadBasePath).relativize(p).toString().replace("\\", "/");
                        return "/uploads/" + rel;
                    })
                    .sorted(java.util.Comparator.reverseOrder())
                    .collect(java.util.stream.Collectors.toList());
        } catch (IOException e) {
            log.warn("Lỗi liệt kê media images: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Liệt kê tất cả ảnh trong /uploads/tin-tuc/ (đệ quy), mới nhất trước.
     */
    public java.util.List<String> listNewsImages() {
        Path newsDir = Paths.get(uploadBasePath, "tin-tuc");
        if (!Files.exists(newsDir)) return java.util.Collections.emptyList();
        try (java.util.stream.Stream<Path> stream = Files.walk(newsDir)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String n = p.getFileName().toString().toLowerCase();
                        return n.endsWith(".jpg") || n.endsWith(".jpeg")
                                || n.endsWith(".png") || n.endsWith(".gif") || n.endsWith(".webp");
                    })
                    .map(p -> {
                        String rel = Paths.get(uploadBasePath).relativize(p).toString().replace("\\", "/");
                        return "/uploads/" + rel;
                    })
                    .sorted(java.util.Comparator.reverseOrder())
                    .collect(java.util.stream.Collectors.toList());
        } catch (IOException e) {
            log.warn("Lỗi liệt kê news images: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    // ── Biểu mẫu (form files) ──────────────────────────────────────────────────

    /**
     * Lưu file biểu mẫu vào /uploads/bieu-mau/yyyy/MM/{uuid}.ext
     * Trả về relative path.
     */
    public String saveBieuMauFile(MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE,
                "Chỉ chấp nhận: PDF, Word, Excel, PowerPoint");

        String ext = getExtension(file.getOriginalFilename());
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "bieu-mau", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/bieu-mau/" + yearMonth + "/" + storedName;
            log.info("Saved bieu-mau file: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            throw new BusinessException("FILE_SAVE_ERROR", "Lỗi lưu file biểu mẫu: " + e.getMessage());
        }
    }

    // ── Ảnh bài viết ───────────────────────────────────────────────────────────

    /**
     * Lưu ảnh bài viết vào /uploads/tin-tuc/yyyy/MM/{uuid}.jpg
     * Tự động nén về JPEG quality=75%, max width=1200px để giảm dung lượng.
     */
    public String saveNewsImage(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE,
                "Chỉ chấp nhận: JPG, PNG, GIF, WebP");

        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "tin-tuc", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + ".jpg";
            Path dest = dir.resolve(storedName);
            byte[] compressed = compressImage(file.getInputStream(), 1200, 0.75f);
            Files.write(dest, compressed);

            String relativePath = "/uploads/tin-tuc/" + yearMonth + "/" + storedName;
            log.info("Saved news image (compressed): {} ({} KB)", relativePath, compressed.length / 1024);
            return relativePath;
        } catch (IOException e) {
            throw new BusinessException("FILE_SAVE_ERROR", "Lỗi lưu ảnh: " + e.getMessage());
        }
    }

    // ── Load & Delete ───────────────────────────────────────────────────────────

    /**
     * Load file từ đường dẫn tương đối để phục vụ download/xem.
     */
    public Resource loadAsResource(String relativePath) {
        try {
            // relativePath ví dụ: /uploads/van-ban/2025/03/{uuid}.pdf
            // Bỏ dấu "/" đầu → "uploads/van-ban/..."
            // Bỏ tiếp "uploads/" vì uploadBasePath đã trỏ vào thư mục uploads/
            String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
            String subPath   = cleanPath.startsWith("uploads/") ? cleanPath.substring("uploads/".length()) : cleanPath;
            Path filePath = Paths.get(uploadBasePath).resolve(subPath).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new BusinessException("FILE_NOT_FOUND", "File không tồn tại: " + relativePath);
        } catch (MalformedURLException e) {
            throw new BusinessException("FILE_URL_ERROR", "Đường dẫn file không hợp lệ");
        }
    }

    /**
     * Xóa file vật lý — không throw nếu file không tồn tại.
     */
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
            String subPath   = cleanPath.startsWith("uploads/") ? cleanPath.substring("uploads/".length()) : cleanPath;
            Path filePath = Paths.get(uploadBasePath).resolve(subPath).normalize();
            Files.deleteIfExists(filePath);
            log.info("Deleted file: {}", relativePath);
        } catch (IOException e) {
            log.warn("Không thể xóa file {}: {}", relativePath, e.getMessage());
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file, Set<String> allowedTypes, long maxSize, String typeError) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_EMPTY", "File không được rỗng");
        }
        String ext = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!allowedTypes.contains(ext)) {
            throw new BusinessException("FILE_TYPE_INVALID", typeError);
        }
        if (file.getSize() > maxSize) {
            throw new BusinessException("FILE_TOO_LARGE",
                    "File không được vượt quá " + (maxSize / 1024 / 1024) + "MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1).toLowerCase() : "";
    }

    public String getOriginalFilename(String relativePath) {
        if (relativePath == null) return "";
        return Paths.get(relativePath).getFileName().toString();
    }

    // ── Image compression ─────────────────────────────────────────────────────

    /**
     * Nén ảnh sang JPEG với quality cho trước, thu nhỏ về maxWidth nếu lớn hơn.
     * Hỗ trợ PNG có alpha channel (tự fill nền trắng trước khi sang JPEG).
     *
     * @param inputStream  InputStream của ảnh gốc
     * @param maxWidth     Chiều rộng tối đa (px); nếu ảnh nhỏ hơn thì giữ nguyên
     * @param quality      JPEG quality 0.0–1.0 (ví dụ: 0.75f)
     * @return byte[] JPEG đã nén
     */
    private byte[] compressImage(InputStream inputStream, int maxWidth, float quality) throws IOException {
        BufferedImage original = ImageIO.read(inputStream);
        if (original == null) {
            throw new BusinessException("IMAGE_READ_ERROR", "Không thể đọc file ảnh");
        }

        // Scale down nếu quá rộng
        int origWidth  = original.getWidth();
        int origHeight = original.getHeight();
        BufferedImage resized;
        if (origWidth > maxWidth) {
            int newHeight = (int) Math.round((double) origHeight * maxWidth / origWidth);
            Image scaled = original.getScaledInstance(maxWidth, newHeight, Image.SCALE_SMOOTH);
            resized = new BufferedImage(maxWidth, newHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = resized.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.drawImage(scaled, 0, 0, null);
            g2d.dispose();
        } else {
            // Chỉ chuyển sang RGB (loại bỏ alpha để JPEG hóa được)
            resized = new BufferedImage(origWidth, origHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = resized.createGraphics();
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, origWidth, origHeight);
            g2d.drawImage(original, 0, 0, null);
            g2d.dispose();
        }

        // Ghi ra JPEG với quality tùy chỉnh
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new BusinessException("IMAGE_WRITE_ERROR", "Không tìm thấy JPEG writer");
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(resized, null, null), param);
        } finally {
            writer.dispose();
        }

        return baos.toByteArray();
    }
}
