package com.tathanhloc.faceattendance.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho request refresh token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}