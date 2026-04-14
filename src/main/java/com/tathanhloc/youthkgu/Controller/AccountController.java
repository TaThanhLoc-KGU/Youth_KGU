package com.tathanhloc.youthkgu.Controller; // Đã đổi thành Controller

import com.tathanhloc.youthkgu.DTO.ApiResponse; // Đã đổi thành DTO
import com.tathanhloc.youthkgu.DTO.AccountDTO;
import com.tathanhloc.youthkgu.DTO.RegisterRequest;
import com.tathanhloc.youthkgu.DTO.CreateAccountRequest;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException; // Đã đổi thành Exception
import com.tathanhloc.youthkgu.Security.CustomUserDetails;
import com.tathanhloc.youthkgu.Service.AccountService;
import com.tathanhloc.youthkgu.Service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

/**
 * Controller quản lý tài khoản người dùng
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class AccountController {

    private final AccountService accountService;
    private final StatisticsService statisticsService;

    /**
     * Lấy thông tin tài khoản của chính mình (mọi user đã đăng nhập)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AccountDTO>> getMyAccount(Authentication authentication) {
        log.info("GET /api/accounts/me - User: {}", authentication.getName());
        try {
            AccountDTO account = accountService.getAccountByUsername(authentication.getName());
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Lấy thông tin tài khoản thành công")
                            .data(account)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin tài khoản bản thân", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Lỗi lấy thông tin tài khoản: " + e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách tất cả tài khoản (Admin only)
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getAllAccounts() {
        log.info("GET /api/accounts - Lấy danh sách tất cả tài khoản");
        try {
            List<AccountDTO> accounts = accountService.getAllAccounts();
            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách tài khoản thành công")
                            .data(accounts)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message("Lỗi lấy danh sách tài khoản: " + e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Tìm kiếm tài khoản (Admin only)
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> searchAccounts(@RequestParam String keyword) {
        log.info("GET /api/accounts/search?keyword={}", keyword);
        try {
            List<AccountDTO> accounts = accountService.searchAccounts(keyword);
            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Tìm kiếm tài khoản thành công")
                            .data(accounts)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi tìm kiếm tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message("Lỗi tìm kiếm tài khoản: " + e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy thông tin tài khoản theo ID
     */
    @GetMapping("/{accountId}")
    @PreAuthorize("hasPermission(null, 'XEM_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<AccountDTO>> getAccountById(@PathVariable Long accountId) {
        log.info("GET /api/accounts/{} - Lấy thông tin tài khoản", accountId);
        try {
            AccountDTO account = accountService.getAccountById(accountId);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Lấy thông tin tài khoản thành công")
                            .data(account)
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
            log.error("Lỗi lấy thông tin tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Lỗi lấy thông tin tài khoản: " + e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách tài khoản chờ phê duyệt (Admin only)
     */
    @GetMapping("/pending-approval")
    @PreAuthorize("hasPermission(null, 'DUYET_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getPendingApprovalAccounts() {
        log.info("GET /api/accounts/pending-approval - Lấy danh sách tài khoản chờ phê duyệt");
        try {
            List<AccountDTO> pendingAccounts = accountService.getPendingApprovalAccounts();
            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách tài khoản chờ phê duyệt thành công")
                            .data(pendingAccounts)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách tài khoản chờ phê duyệt", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message("Lỗi lấy danh sách tài khoản chờ phê duyệt: " + e.getMessage())
                            .build()
                    );
        }
    }

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
    @PreAuthorize("hasPermission(null, 'DUYET_TAI_KHOAN')")
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
    @PreAuthorize("hasPermission(null, 'SUA_TAI_KHOAN')")
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
     * Cập nhật hồ sơ cá nhân (User tự cập nhật hoặc Admin)
     * - User thường: chỉ được cập nhật hồ sơ của chính mình
     * - Admin / người có quyền SUA_THONG_TIN_CA_NHAN: cập nhật được bất kỳ ai
     */
    @PutMapping("/{accountId}/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AccountDTO>> updateProfile(
            @PathVariable Long accountId,
            @RequestBody AccountDTO request,
            Authentication authentication) {
        log.info("PUT /api/accounts/{}/profile - Cập nhật hồ sơ cá nhân", accountId);

        // Kiểm tra ownership: user thường chỉ được sửa hồ sơ của chính mình
        try {
            CustomUserDetails ud = (CustomUserDetails) authentication.getPrincipal();
            Long currentId = ud.getTaiKhoan().getId();
            boolean isAdminOrManager = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));
            if (!isAdminOrManager && !accountId.equals(currentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.<AccountDTO>builder()
                                .success(false)
                                .message("Bạn chỉ có thể cập nhật hồ sơ của chính mình")
                                .build());
            }
        } catch (Exception e) {
            log.warn("Không thể xác minh quyền sở hữu hồ sơ: {}", e.getMessage());
        }

        try {
            AccountDTO updated = accountService.updateProfile(accountId, request);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Cập nhật hồ sơ thành công")
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
            log.error("Lỗi cập nhật hồ sơ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Tạo tài khoản thủ công (Admin only) — POST /api/accounts/create-manual
     */
    @PostMapping("/create-manual")
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<AccountDTO>> createAccountManually(
            @Valid @RequestBody CreateAccountRequest request) {
        log.info("POST /api/accounts/create-manual - Tạo tài khoản thủ công: {}", request.getUsername());
        try {
            AccountDTO created = accountService.createAccountManually(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Tạo tài khoản thành công")
                            .data(created)
                            .build());
        } catch (IllegalArgumentException e) {
            log.error("Lỗi tạo tài khoản thủ công: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Lỗi tạo tài khoản thủ công", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Lỗi tạo tài khoản: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Lấy danh sách sinh viên / giảng viên / chuyên viên chưa có tài khoản
     * type: SINH_VIEN | GIANG_VIEN | CHUYEN_VIEN
     */
    @GetMapping("/without-account/{type}")
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWithoutAccount(
            @PathVariable String type) {
        log.info("GET /api/accounts/without-account/{}", type);
        List<Map<String, Object>> result = accountService.getWithoutAccount(type);
        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .success(true)
                .message("Lấy danh sách thành công")
                .data(result)
                .build());
    }

    /**
     * Tạo hàng loạt tài khoản — POST /api/accounts/bulk-create
     */
    @PostMapping("/bulk-create")
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkCreate(
            @RequestBody List<CreateAccountRequest> requests) {
        log.info("POST /api/accounts/bulk-create - {} accounts", requests.size());
        Map<String, Object> result = accountService.bulkCreateAccounts(requests);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Tạo hàng loạt hoàn tất")
                .data(result)
                .build());
    }

    /**
     * Xóa tài khoản (Admin only)
     */
    @DeleteMapping("/{accountId}")
    @PreAuthorize("hasPermission(null, 'XOA_TAI_KHOAN')")
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

    /**
     * Reset mật khẩu về mặc định KGU@123456
     * Yêu cầu quyền SUA_TAI_KHOAN (Admin hoặc BCH Level 1)
     */
    @PostMapping("/{accountId}/reset-password")
    @PreAuthorize("hasPermission(null, 'SUA_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable Long accountId) {
        log.info("POST /api/accounts/{}/reset-password - Reset mật khẩu", accountId);
        try {
            String username = accountService.resetPassword(accountId);
            return ResponseEntity.ok(
                    ApiResponse.<Void>builder()
                            .success(true)
                            .message("Đã reset mật khẩu của \"" + username + "\" về KGU@123456")
                            .build());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder().success(false).message(e.getMessage()).build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>builder().success(false).message(e.getMessage()).build());
        }
    }

    /**
     * Kích hoạt/Vô hiệu hóa tài khoản (Admin only)
     */
    @PatchMapping("/{accountId}/active")
    @PreAuthorize("hasPermission(null, 'SUA_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<AccountDTO>> setAccountActive(
            @PathVariable Long accountId,
            @RequestBody Map<String, Boolean> body) {
        Boolean isActive = body.get("isActive");
        log.info("PATCH /api/accounts/{}/active - Body: {}", accountId, body);

        if (isActive == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Tham số isActive không được để trống")
                            .build()
                    );
        }

        try {
            AccountDTO updated = accountService.setAccountActive(accountId, isActive);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message(isActive ? "Kích hoạt tài khoản thành công" : "Vô hiệu hóa tài khoản thành công")
                            .data(updated)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái tài khoản", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message("Lỗi cập nhật trạng thái: " + e.getMessage())
                            .build()
                    );
        }
    }
}
