package com.tathanhloc.faceattendance.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemDanhQRResponse {
    private boolean success;
    private String message;
    private DiemDanhHoatDongDTO data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // Explicit getter cho success (nếu Lombok không tạo)
    public boolean isSuccess() {
        return success;
    }

    public static DiemDanhQRResponse success(String message, DiemDanhHoatDongDTO data) {
        return DiemDanhQRResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static DiemDanhQRResponse failed(String message) {
        return DiemDanhQRResponse.builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}