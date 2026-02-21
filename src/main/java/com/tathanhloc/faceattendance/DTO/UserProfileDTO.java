package com.tathanhloc.faceattendance.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User profile information returned after login")
public class UserProfileDTO {

    @Schema(description = "User account ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "admin")
    private String username;

    @Schema(
            description = "User role",
            example = "ADMIN",
            allowableValues = {"ADMIN", "BCH_DOAN_HOI", "SINH_VIEN"}
    )
    private String vaiTro;

    @Schema(description = "Account active status", example = "true")
    private Boolean isActive;

    @Schema(
            description = "Full name from linked entity (SinhVien or GiangVien)",
            example = "Nguyen Van A",
            nullable = true
    )
    private String hoTen;

    @Schema(
            description = "Student ID (ma_sv) or Lecturer ID (ma_gv)",
            example = "SV001",
            nullable = true
    )
    private String maSo;

    @Schema(
            description = "Email from linked entity",
            example = "nguyenvana@example.com",
            nullable = true
    )
    private String email;
}
