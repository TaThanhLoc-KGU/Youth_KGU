package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho QR Code image
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QRCodeImageResponse {
    private String maQR;
    private String base64Image;
    private String filePath;
    private String mimeType;
    private Integer width;
    private Integer height;

    @Builder.Default
    private java.time.LocalDateTime generatedAt = java.time.LocalDateTime.now();
}