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
@Schema(description = "Success response for successful operations")
public class SuccessResponse {

    @Schema(description = "Success message", example = "Operation completed successfully")
    private String message;

    @Schema(description = "Success status (always true)", example = "true")
    private boolean success;

    @Schema(description = "Timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "Optional data payload")
    private Object data;

    public SuccessResponse(String message) {
        this.message = message;
        this.success = true;
        this.timestamp = LocalDateTime.now();
    }

    public SuccessResponse(String message, Object data) {
        this.message = message;
        this.success = true;
        this.timestamp = LocalDateTime.now();
        this.data = data;
    }
}