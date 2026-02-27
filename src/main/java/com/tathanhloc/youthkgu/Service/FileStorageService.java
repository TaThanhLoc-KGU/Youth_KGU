package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.FileUploadResult;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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

    // ── Ảnh bài viết ───────────────────────────────────────────────────────────

    /**
     * Lưu ảnh bài viết vào /uploads/tin-tuc/yyyy/MM/{uuid}.ext
     * Trả về relative path.
     */
    public String saveNewsImage(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE,
                "Chỉ chấp nhận: JPG, PNG, GIF, WebP");

        String ext = getExtension(file.getOriginalFilename());
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "tin-tuc", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/tin-tuc/" + yearMonth + "/" + storedName;
            log.info("Saved news image: {}", relativePath);
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
            String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
            Path filePath = Paths.get(uploadBasePath).resolve(
                    cleanPath.replace("/uploads/", "")).normalize();
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
            Path filePath = Paths.get(uploadBasePath).resolve(
                    cleanPath.replace("/uploads/", "")).normalize();
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
}
