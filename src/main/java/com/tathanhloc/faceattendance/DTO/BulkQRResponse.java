package com.tathanhloc.faceattendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho export QR hàng loạt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkQRResponse {
    private int totalRequested;
    private int totalSuccess;
    private int totalFailed;
    private java.util.Map<String, String> results; // maQR -> filePath hoặc error
    private java.util.List<String> errors;

    @Builder.Default
    private java.time.LocalDateTime timestamp = java.time.LocalDateTime.now();
}