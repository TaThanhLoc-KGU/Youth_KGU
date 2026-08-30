package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.EmailBroadcastRequest;
import com.tathanhloc.youthkgu.DTO.EmailBroadcastResultDTO;
import com.tathanhloc.youthkgu.Service.EmailBroadcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Soạn & gửi email hàng loạt tới các nhóm mail đã lưu và/hoặc địa chỉ gõ tay thêm.
 * CHỈ gửi khi bấm nút — xem javadoc EmailBroadcastService.
 */
@RestController
@RequestMapping("/api/email-broadcast")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Gửi Email Hàng Loạt", description = "Soạn & gửi email tới các nhóm mail")
public class EmailBroadcastController {

    private final EmailBroadcastService service;

    @PostMapping("/send")
    @Operation(summary = "Gửi email tới các nhóm/địa chỉ đã chọn")
    @PreAuthorize("hasPermission(null, 'GUI_EMAIL_HANG_LOAT')")
    public ResponseEntity<ApiResponse<EmailBroadcastResultDTO>> send(@RequestBody EmailBroadcastRequest req, Authentication auth) {
        log.info("POST /api/email-broadcast/send by {} — subject=\"{}\", groups={}, extra={}",
                auth.getName(), req.getSubject(),
                req.getGroupIds() != null ? req.getGroupIds().size() : 0,
                req.getExtraEmails() != null ? req.getExtraEmails().size() : 0);
        EmailBroadcastResultDTO result = service.send(req);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi " + result.getGuiThanhCong() + "/" + result.getTongSoNguoiNhan() + " người nhận", result));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Error in EmailBroadcastController", e);
        return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
    }
}
