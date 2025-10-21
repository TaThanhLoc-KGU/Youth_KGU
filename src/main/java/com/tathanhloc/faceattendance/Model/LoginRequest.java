package com.tathanhloc.faceattendance.Model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login request with username and password")
public class LoginRequest {

    @Schema(
            description = "Username for authentication",
            example = "admin",
            required = true
    )
    @NotBlank(message = "Username không được để trống")
    private String username;

    @Schema(
            description = "User password",
            example = "admin123",
            required = true,
            format = "password"
    )
    @NotBlank(message = "Password không được để trống")
    private String password;
}