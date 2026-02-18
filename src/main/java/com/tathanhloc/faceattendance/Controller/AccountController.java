package com.tathanhloc.faceattendance.Controller; // Đã đổi thành Controller

import com.tathanhloc.faceattendance.DTO.ApiResponse; // Đã đổi thành DTO
import com.tathanhloc.faceattendance.DTO.AccountDTO;
import com.tathanhloc.faceattendance.DTO.RegisterRequest;
import com.tathanhloc.faceattendance.DTO.CreateAccountRequest;
import com.tathanhloc.faceattendance.Exception.ResourceNotFoundException; // Đã đổi thành Exception
import com.tathanhloc.faceattendance.Service.AccountService;
import com.tathanhloc.faceattendance.Service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * Controller quản lý tài khoản người dùng
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;
    private final StatisticsService statisticsService;

    /**
     * Đăng ký tài khoản mới (public endpoint)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AccountDTO>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/accounts/register - Đăng ký tài khoản mới: {}", request.getUsername());

        try {
            AccountDTO newAccount = accountService.registerNewAccount(request);
            log.info("Đăng ký tài khoản thành công: {}", newAccount.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Đăng ký tài khoản thành công. Vui lòng đợi phê duyệt từ quản trị viên.")
                            .data(newAccount)
                            .build()
                    );
        } catch (IllegalArgumentException e) {
            log.error("Lỗi đăng ký tài khoản: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        } catch (Exception e) {
            log.error("Lỗi đăng ký tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Lỗi đăng ký tài khoản: " + e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Phê duyệt tài khoản (admin only)
     */
    @PostMapping("/{accountId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> approveAccount(
            @PathVariable Long accountId,
            @RequestParam(required = false) String ghiChu) {
        log.info("POST /api/accounts/{}/approve - Phê duyệt tài khoản", accountId);

        try {
            AccountDTO approved = accountService.approveAccount(accountId, ghiChu);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Phê duyệt tài khoản thành công")
                            .data(approved)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi phê duyệt tài khoản", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Cập nhật thông tin tài khoản (Admin only)
     */
    @PutMapping("/{accountId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> updateAccount(
            @PathVariable Long accountId,
            @RequestBody AccountDTO request) {
        log.info("PUT /api/accounts/{} - Cập nhật tài khoản", accountId);

        try {
            AccountDTO updated = accountService.updateAccount(accountId, request);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Cập nhật tài khoản thành công")
                            .data(updated)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            log.error("Không tìm thấy tài khoản ID: {}", accountId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        } catch (Exception e) {
            log.error("Lỗi cập nhật tài khoản", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Xóa tài khoản (Admin only)
     */
    @DeleteMapping("/{accountId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable Long accountId) {
        log.info("DELETE /api/accounts/{} - Xóa tài khoản", accountId);

        try {
            accountService.deleteAccount(accountId);
            return ResponseEntity.ok(
                    ApiResponse.<Void>builder()
                            .success(true)
                            .message("Xóa tài khoản thành công")
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }
}