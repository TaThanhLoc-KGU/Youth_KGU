package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.AccountDTO;
import com.tathanhloc.faceattendance.DTO.RegisterRequest;
import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
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
     * POST /api/accounts/register
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
     * POST /api/accounts/{accountId}/approve
     */
    @PostMapping("/{accountId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> approveAccount(
            @PathVariable Long accountId,
            @RequestParam(required = false) String ghiChu) {
        log.info("POST /api/accounts/{}/approve - Phê duyệt tài khoản", accountId);

        try {
            AccountDTO approved = accountService.approveAccount(accountId, ghiChu);
            log.info("Phê duyệt tài khoản thành công: {}", approved.getUsername());

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
     * Từ chối tài khoản (admin only)
     * POST /api/accounts/{accountId}/reject
     */
    @PostMapping("/{accountId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> rejectAccount(
            @PathVariable Long accountId,
            @RequestParam String lyDo) {
        log.info("POST /api/accounts/{}/reject - Từ chối tài khoản", accountId);

        try {
            AccountDTO rejected = accountService.rejectAccount(accountId, lyDo);
            log.info("Từ chối tài khoản thành công: {}", rejected.getUsername());

            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Từ chối tài khoản thành công")
                            .data(rejected)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi từ chối tài khoản", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách tài khoản chờ phê duyệt (admin only)
     * GET /api/accounts/pending-approval
     */
    @GetMapping("/pending-approval")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getPendingApprovals() {
        log.info("GET /api/accounts/pending-approval - Lấy danh sách tài khoản chờ phê duyệt");

        try {
            List<AccountDTO> pendingAccounts = accountService.getAccountsPendingApproval();
            log.info("Tìm thấy {} tài khoản chờ phê duyệt", pendingAccounts.size());

            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách thành công")
                            .data(pendingAccounts)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách tài khoản chờ phê duyệt", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy thông tin tài khoản theo ID
     * GET /api/accounts/{accountId}
     */
    @GetMapping("/{accountId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AccountDTO>> getAccount(@PathVariable Long accountId) {
        log.info("GET /api/accounts/{} - Lấy thông tin tài khoản", accountId);

        try {
            AccountDTO account = accountService.getAccountById(accountId);
            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Lấy thông tin thành công")
                            .data(account)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin tài khoản", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Cập nhật thông tin hồ sơ
     * PUT /api/accounts/{accountId}/profile
     */
    @PutMapping("/{accountId}/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AccountDTO>> updateProfile(
            @PathVariable Long accountId,
            @RequestBody AccountDTO request) {
        log.info("PUT /api/accounts/{}/profile - Cập nhật thông tin hồ sơ", accountId);

        try {
            AccountDTO updated = accountService.updateProfile(accountId, request);
            log.info("Cập nhật hồ sơ thành công: {}", updated.getUsername());

            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Cập nhật hồ sơ thành công")
                            .data(updated)
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
     * Thay đổi vai trò người dùng (admin only)
     * PATCH /api/accounts/{accountId}/role
     */
    @PatchMapping("/{accountId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> changeRole(
            @PathVariable Long accountId,
            @RequestParam VaiTroEnum vaiTro) {
        log.info("PATCH /api/accounts/{}/role - Thay đổi vai trò thành {}", accountId, vaiTro);

        try {
            AccountDTO updated = accountService.changeRole(accountId, vaiTro);
            log.info("Thay đổi vai trò thành công: {}", updated.getUsername());

            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Thay đổi vai trò thành công")
                            .data(updated)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi thay đổi vai trò", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Kích hoạt/Vô hiệu hóa tài khoản (admin only)
     * PATCH /api/accounts/{accountId}/active
     */
    @PatchMapping("/{accountId}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> setAccountActive(
            @PathVariable Long accountId,
            @RequestParam boolean isActive) {
        log.info("PATCH /api/accounts/{}/active - Cập nhật trạng thái: {}", accountId, isActive);

        try {
            AccountDTO updated = accountService.setAccountActive(accountId, isActive);
            log.info("Cập nhật trạng thái tài khoản thành công: {}", updated.getUsername());

            return ResponseEntity.ok(
                    ApiResponse.<AccountDTO>builder()
                            .success(true)
                            .message("Cập nhật trạng thái thành công")
                            .data(updated)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi cập nhật trạng thái", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<AccountDTO>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Tìm kiếm tài khoản (admin only)
     * GET /api/accounts/search
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> searchAccounts(
            @RequestParam String keyword) {
        log.info("GET /api/accounts/search - Tìm kiếm theo keyword: {}", keyword);

        try {
            List<AccountDTO> results = accountService.searchAccounts(keyword);
            log.info("Tìm thấy {} tài khoản", results.size());

            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Tìm kiếm thành công")
                            .data(results)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi tìm kiếm tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách tài khoản theo vai trò (admin only)
     * GET /api/accounts/by-role/{vaiTro}
     */
    @GetMapping("/by-role/{vaiTro}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getAccountsByRole(
            @PathVariable VaiTroEnum vaiTro) {
        log.info("GET /api/accounts/by-role/{} - Lấy tài khoản theo vai trò", vaiTro);

        try {
            List<AccountDTO> accounts = accountService.getAccountsByRole(vaiTro);
            log.info("Tìm thấy {} tài khoản với vai trò {}", accounts.size(), vaiTro);

            return ResponseEntity.ok(
                    ApiResponse.<List<AccountDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách thành công")
                            .data(accounts)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách tài khoản", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<AccountDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy thống kê toàn bộ hệ thống (admin only)
     * GET /api/accounts/statistics/system
     */
    @GetMapping("/statistics/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> getSystemStatistics() {
        log.info("GET /api/accounts/statistics/system - Lấy thống kê toàn bộ hệ thống");

        try {
            var statistics = statisticsService.getSystemStatistics();
            return ResponseEntity.ok(
                    ApiResponse.builder()
                            .success(true)
                            .message("Lấy thống kê thành công")
                            .data(statistics)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy thống kê", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy số tài khoản chờ phê duyệt (admin only)
     * GET /api/accounts/statistics/pending-count
     */
    @GetMapping("/statistics/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getPendingApprovalsCount() {
        log.info("GET /api/accounts/statistics/pending-count");

        try {
            long count = statisticsService.getPendingApprovalsCount();
            return ResponseEntity.ok(
                    ApiResponse.<Long>builder()
                            .success(true)
                            .message("Lấy dữ liệu thành công")
                            .data(count)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy số tài khoản chờ phê duyệt", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Long>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy thống kê tài khoản theo vai trò (admin only)
     * GET /api/accounts/statistics/by-role
     */
    @GetMapping("/statistics/by-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAccountsByRoleStatistics() {
        log.info("GET /api/accounts/statistics/by-role");

        try {
            Map<String, Long> statistics = statisticsService.getAccountsByRoleStatistics();
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Long>>builder()
                            .success(true)
                            .message("Lấy thống kê thành công")
                            .data(statistics)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy thống kê", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Map<String, Long>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy thống kê tài khoản theo tổ chức (admin only)
     * GET /api/accounts/statistics/by-organization
     */
    @GetMapping("/statistics/by-organization")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAccountsByOrganization() {
        log.info("GET /api/accounts/statistics/by-organization");

        try {
            Map<String, Long> statistics = statisticsService.getAccountsByOrganization();
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Long>>builder()
                            .success(true)
                            .message("Lấy thống kê thành công")
                            .data(statistics)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy thống kê", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Map<String, Long>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }
}
