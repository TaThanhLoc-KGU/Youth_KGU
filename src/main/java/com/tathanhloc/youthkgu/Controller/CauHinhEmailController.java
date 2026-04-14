package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.CauHinhEmailDTO;
import com.tathanhloc.youthkgu.Service.CauHinhEmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cau-hinh-email")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cấu hình Email", description = "API quản lý cấu hình SMTP email")
public class CauHinhEmailController {

    private final CauHinhEmailService cauHinhEmailService;

    @GetMapping
    @Operation(summary = "Lấy cấu hình email hiện tại")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<CauHinhEmailDTO>> getCauHinh() {
        return ResponseEntity.ok(ApiResponse.success(cauHinhEmailService.getCauHinh()));
    }

    @PutMapping
    @Operation(summary = "Cập nhật cấu hình email (runtime, không cần restart)")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<CauHinhEmailDTO>> saveCauHinh(
            @RequestBody CauHinhEmailDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        String updatedBy = userDetails != null ? userDetails.getUsername() : "anonymous";
        CauHinhEmailDTO saved = cauHinhEmailService.saveCauHinh(dto, updatedBy);
        return ResponseEntity.ok(ApiResponse.success("Lưu cấu hình email thành công", saved));
    }

    @PostMapping("/test")
    @Operation(summary = "Kiểm tra kết nối SMTP")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_HE_THONG')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection() {
        boolean ok = cauHinhEmailService.testConnection();
        if (ok) {
            return ResponseEntity.ok(ApiResponse.success("Kết nối SMTP thành công",
                    Map.of("connected", true)));
        } else {
            return ResponseEntity.ok(ApiResponse.error("Không thể kết nối SMTP — kiểm tra lại thông tin cấu hình"));
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in CauHinhEmailController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
