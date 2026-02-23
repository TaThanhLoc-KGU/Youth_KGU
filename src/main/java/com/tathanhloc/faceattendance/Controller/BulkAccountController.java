package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.Service.BulkAccountCreationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/accounts/bulk")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tài khoản - Bulk", description = "API tạo tài khoản hàng loạt")
public class BulkAccountController {

    private final BulkAccountCreationService bulkService;

    @PostMapping("/create-all-students")
    @Operation(summary = "Tạo tài khoản cho tất cả sinh viên chưa có")
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createAllStudentAccounts() {
        log.info("POST /api/accounts/bulk/create-all-students");
        Map<String, Object> result = bulkService.createAccountsForAllStudents();
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất tạo tài khoản sinh viên", result));
    }

    @PostMapping("/create-all-lecturers")
    @Operation(summary = "Tạo tài khoản cho tất cả giảng viên chưa có")
    @PreAuthorize("hasPermission(null, 'TAO_TAI_KHOAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createAllLecturerAccounts() {
        log.info("POST /api/accounts/bulk/create-all-lecturers");
        Map<String, Object> result = bulkService.createAccountsForAllLecturers();
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất tạo tài khoản giảng viên", result));
    }
}
