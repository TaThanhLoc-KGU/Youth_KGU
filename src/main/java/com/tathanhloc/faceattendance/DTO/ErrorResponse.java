package com.tathanhloc.faceattendance.DTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Error response for failed operations")
public class ErrorResponse {

    @Schema(description = "Error message", example = "Invalid credentials")
    private String message;

    @Schema(description = "Success status (always false for errors)", example = "false")
    private boolean success;

    @Schema(description = "Timestamp of error", example = "2024-01-15T10:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "HTTP status code", example = "401")
    private int status;

    public ErrorResponse(String message) {
        this.message = message;
        this.success = false;
        this.timestamp = LocalDateTime.now();
    }
}