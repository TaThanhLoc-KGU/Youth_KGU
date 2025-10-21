package com.tathanhloc.faceattendance.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reset password for a user")
public class ResetPasswordRequest {

    @Schema(
            description = "Username of account to reset",
            example = "admin",
            required = true
    )
    @NotBlank(message = "Username không được để trống")
    private String username;

    @Schema(
            description = "New password (min 6 characters)",
            example = "newpass123",
            required = true,
            format = "password",
            minLength = 6
    )
    @NotBlank(message = "New password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String newPassword;
}
