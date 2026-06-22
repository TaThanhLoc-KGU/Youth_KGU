package com.tathanhloc.youthkgu.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service xử lý QR Code cho điểm danh hoạt động
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QRCodeService {

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    // qrStoragePath = {uploadBasePath}/qrcodes — luôn nằm cùng thư mục uploads với tin tức/văn bản
    private String getQrStoragePath() {
        return uploadBasePath + "/qrcodes";
    }

    @Value("${qr.code.width:300}")
    private int qrWidth;

    @Value("${qr.code.height:300}")
    private int qrHeight;

    private static final String QR_FORMAT = "PNG";
    private static final DateTimeFormatter FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * Sinh QR Code dạng BufferedImage
     */
    public BufferedImage generateQRCodeImage(String content) throws WriterException, IOException {
        log.debug("Generating QR code for content: {}", content);

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, qrWidth, qrHeight, hints);

        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }

    /**
     * Sinh QR Code và lưu vào file
     */
    public String generateAndSaveQRCode(String maQR, String maHoatDong) throws WriterException, IOException {
        log.info("Generating and saving QR code: {} for activity: {}", maQR, maHoatDong);

        // Tạo thư mục nếu chưa tồn tại — sanitize tên folder (thay / và \ bằng _)
        String safeDir = maHoatDong.replaceAll("[/\\\\]", "_");
        Path directory = Paths.get(getQrStoragePath(), safeDir);
        Files.createDirectories(directory);

        // Tên file: {maQR}_{timestamp}.png
        String timestamp = LocalDateTime.now().format(FILE_TIMESTAMP);
        String fileName = String.format("%s_%s.%s", maQR, timestamp, QR_FORMAT.toLowerCase());
        Path filePath = directory.resolve(fileName);

        // Sinh QR code
        BufferedImage qrImage = generateQRCodeImage(maQR);

        // Lưu file
        ImageIO.write(qrImage, QR_FORMAT, filePath.toFile());

        log.info("QR code saved successfully: {}", filePath);
        return filePath.toString();
    }

    /**
     * Sinh QR Code dạng Base64 (để hiển thị trực tiếp trên web)
     */
    public String generateQRCodeBase64(String content) throws WriterException, IOException {
        log.debug("Generating QR code as Base64 for content: {}", content);

        BufferedImage qrImage = generateQRCodeImage(content);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qrImage, QR_FORMAT, baos);
        byte[] imageBytes = baos.toByteArray();

        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Sinh QR Code hàng loạt cho nhiều sinh viên
     */
    public Map<String, String> generateBulkQRCodes(List<String> maQRList, String maHoatDong) {
        log.info("Generating bulk QR codes for {} students in activity: {}", maQRList.size(), maHoatDong);

        Map<String, String> results = new HashMap<>();

        for (String maQR : maQRList) {
            try {
                String filePath = generateAndSaveQRCode(maQR, maHoatDong);
                results.put(maQR, filePath);
            } catch (Exception e) {
                log.error("Failed to generate QR code for: {}", maQR, e);
                results.put(maQR, "ERROR: " + e.getMessage());
            }
        }

        log.info("Bulk QR code generation completed. Success: {}/{}",
                results.values().stream().filter(v -> !v.startsWith("ERROR")).count(),
                maQRList.size());

        return results;
    }

    /**
     * Sinh mã QR tự phục vụ (dynamic) chứa thông tin hoạt động và hạn sử dụng
     */
    public String generateDynamicAttendanceToken(String maHoatDong) {
        long expireTime = System.currentTimeMillis() + (30 * 1000); // 30 seconds expiration
        String data = maHoatDong + "|" + expireTime;
        // In a real production scenario with high security requirements, you would encrypt
        // or sign this data using AES or HMAC to prevent forgery.
        // For this implementation, Base64 encoding suffices as a proof of concept,
        // combined with the short expiration window.
        return Base64.getEncoder().encodeToString(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /**
     * Parse and validate a dynamic attendance token
     * @return maHoatDong if valid, null if expired or invalid format
     */
    public String parseAndValidateDynamicToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token), java.nio.charset.StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|");
            if (parts.length != 2) return null;

            String maHoatDong = parts[0];
            long expireTime = Long.parseLong(parts[1]);

            if (System.currentTimeMillis() > expireTime) {
                log.warn("Dynamic QR token expired for activity: {}", maHoatDong);
                return null;
            }

            return maHoatDong;
        } catch (Exception e) {
            log.error("Invalid dynamic QR token format", e);
            return null;
        }
    }

    /**
     * Validate format mã QR (phải có đúng cấu trúc maHoatDong + maSinhVien)
     */
    public boolean validateQRFormat(String maQR) {
        if (maQR == null || maQR.isEmpty()) {
            return false;
        }

        // Format: TN2025001 + 21072006095 = TN202500121072006095 (tối thiểu 15 ký tự)
        if (maQR.length() < 15) {
            return false;
        }

        // Kiểm tra prefix (2-3 chữ cái đầu)
        String prefix = maQR.substring(0, 2);
        return prefix.matches("[A-Z]{2}");
    }

    /**
     * Trích xuất thông tin từ mã QR
     */
    public Map<String, String> parseQRCode(String maQR) {
        Map<String, String> info = new HashMap<>();

        if (!validateQRFormat(maQR)) {
            info.put("valid", "false");
            return info;
        }

        // Extract maHoatDong (8-10 ký tự đầu, VD: TN2025001)
        String maHoatDong = maQR.substring(0, Math.min(10, maQR.length() - 11));
        String maSinhVien = maQR.substring(maHoatDong.length());

        info.put("valid", "true");
        info.put("maHoatDong", maHoatDong);
        info.put("maSinhVien", maSinhVien);

        return info;
    }

    /**
     * Xóa QR code file
     */
    public boolean deleteQRCodeFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
            log.info("Deleted QR code file: {}", filePath);
            return true;
        } catch (IOException e) {
            log.error("Failed to delete QR code file: {}", filePath, e);
            return false;
        }
    }

    /**
     * Xóa tất cả QR codes của một hoạt động
     */
    public int deleteActivityQRCodes(String maHoatDong) {
        Path directory = Paths.get(getQrStoragePath(), maHoatDong);
        int deletedCount = 0;

        try {
            if (Files.exists(directory)) {
                deletedCount = (int) Files.list(directory)
                        .filter(path -> path.toString().endsWith(".png"))
                        .peek(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                log.error("Failed to delete: {}", path, e);
                            }
                        })
                        .count();

                // Xóa thư mục nếu rỗng
                if (Files.list(directory).count() == 0) {
                    Files.delete(directory);
                }
            }

            log.info("Deleted {} QR code files for activity: {}", deletedCount, maHoatDong);
        } catch (IOException e) {
            log.error("Error deleting QR codes for activity: {}", maHoatDong, e);
        }

        return deletedCount;
    }

    // ========== BARCODE (Code128 — dành cho máy quét 1D như Zebex Z3151HS) ==========

    /**
     * Sinh mã vạch Code128 dạng BufferedImage.
     */
    public BufferedImage generateBarcodeImage(String content) throws WriterException {
        MultiFormatWriter writer = new MultiFormatWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.CODE_128, 500, 120);
        return MatrixToImageWriter.toBufferedImage(matrix);
    }

    /**
     * Sinh mã vạch và lưu file PNG vào cùng thư mục với QR code.
     * Tên file: {maQR}_barcode.png
     */
    public String generateAndSaveBarcode(String maQR, String maHoatDong) throws WriterException, IOException {
        String safeDir = maHoatDong.replaceAll("[/\\\\]", "_");
        Path directory = Paths.get(getQrStoragePath(), safeDir);
        Files.createDirectories(directory);

        String fileName = maQR + "_barcode.png";
        Path filePath = directory.resolve(fileName);

        BufferedImage barcodeImage = generateBarcodeImage(maQR);
        ImageIO.write(barcodeImage, QR_FORMAT, filePath.toFile());

        log.info("Barcode saved: {}", filePath);
        return filePath.toString();
    }

    /**
     * Sinh mã vạch dạng Base64 (để nhúng vào HTML trang in).
     */
    public String generateBarcodeBase64(String content) throws WriterException, IOException {
        BufferedImage img = generateBarcodeImage(content);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, QR_FORMAT, baos);
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    /**
     * Lấy đường dẫn file QR
     */
    public String getQRCodePath(String maQR, String maHoatDong) {
        Path directory = Paths.get(getQrStoragePath(), maHoatDong);

        try {
            if (Files.exists(directory)) {
                Optional<Path> qrFile = Files.list(directory)
                        .filter(path -> path.getFileName().toString().startsWith(maQR))
                        .findFirst();

                return qrFile.map(Path::toString).orElse(null);
            }
        } catch (IOException e) {
            log.error("Error finding QR code file for: {}", maQR, e);
        }

        return null;
    }
}