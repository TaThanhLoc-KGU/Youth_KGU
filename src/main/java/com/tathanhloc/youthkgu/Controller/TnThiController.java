package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TnAutoSaveRequest;
import com.tathanhloc.youthkgu.DTO.TnKetQuaResponse;
import com.tathanhloc.youthkgu.DTO.TnLamBaiResponse;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Service.TnThiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Luồng làm bài của thí sinh (đoàn viên đã đăng nhập).
 *  POST   /api/tn/thi/de/{deThiId}/bat-dau                 — bắt đầu / khôi phục lượt thi
 *  PUT    /api/tn/thi/luot/{luotThiId}/cau-hoi/{cauHoiId}  — auto-save 1 câu
 *  POST   /api/tn/thi/luot/{luotThiId}/nop                 — nộp bài + tự chấm
 *  GET    /api/tn/thi/luot/{luotThiId}/ket-qua             — xem kết quả / reload
 *  GET    /api/tn/thi/lich-su                              — lịch sử làm bài của tôi
 */
@RestController
@RequestMapping("/api/tn/thi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TN — Làm bài")
@PreAuthorize("isAuthenticated()")
public class TnThiController {

    private final TnThiService service;
    private final TaiKhoanRepository taiKhoanRepo;

    private String maSv(Authentication auth) {
        return taiKhoanRepo.findMaSvByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException(
                        "Tài khoản chưa gắn hồ sơ đoàn viên — không thể dự thi"));
    }

    @PostMapping("/de/{deThiId}/bat-dau")
    @Operation(summary = "Bắt đầu thi (sinh đề nếu mode ngẫu nhiên; F5 trả lại đúng đề đang dở)")
    public ResponseEntity<ApiResponse<TnLamBaiResponse>> batDau(
            @PathVariable Long deThiId, Authentication auth, HttpServletRequest http) {
        String ip = http.getHeader("X-Forwarded-For");
        if (ip == null) ip = http.getRemoteAddr();
        TnLamBaiResponse res = service.batDau(deThiId, maSv(auth), ip, http.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success(res.getTiepTuc() ? "Khôi phục lượt thi đang làm dở" : "Bắt đầu làm bài", res));
    }

    @PutMapping("/luot/{luotThiId}/cau-hoi/{cauHoiId}")
    @Operation(summary = "Auto-save đáp án 1 câu")
    public ResponseEntity<ApiResponse<Map<String, Object>>> autoSave(
            @PathVariable Long luotThiId, @PathVariable Long cauHoiId,
            @RequestBody TnAutoSaveRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.autoSave(luotThiId, cauHoiId, req, maSv(auth))));
    }

    @PostMapping("/luot/{luotThiId}/nop")
    @Operation(summary = "Nộp bài và tự động chấm điểm")
    public ResponseEntity<ApiResponse<TnKetQuaResponse>> nop(
            @PathVariable Long luotThiId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Đã nộp bài",
                service.nopBai(luotThiId, maSv(auth))));
    }

    @GetMapping("/luot/{luotThiId}/ket-qua")
    public ResponseEntity<ApiResponse<TnKetQuaResponse>> ketQua(
            @PathVariable Long luotThiId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getKetQua(luotThiId, maSv(auth))));
    }

    @GetMapping("/de-thi")
    @Operation(summary = "Danh sách đề thi tôi có thể làm")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> deThiKhaDung(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getDeThiKhaDung(maSv(auth))));
    }

    @GetMapping("/lich-su")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> lichSu(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getLichSu(maSv(auth))));
    }

    @ExceptionHandler({ BusinessException.class, IllegalArgumentException.class })
    public ResponseEntity<ApiResponse<Void>> handleBusiness(RuntimeException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), 400));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleDenied(AccessDeniedException e) {
        return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage(), 403));
    }
}
