package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.Service.SystemLogService;
import com.tathanhloc.faceattendance.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/admin/logs")
@RequiredArgsConstructor @Slf4j
public class SystemLogController {
    private final SystemLogService service;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_SYSTEM_LOG')")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String logLevel,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true).data(service.search(module, action, userId, logLevel, status, from, to, page, size))
            .build());
    }
}
