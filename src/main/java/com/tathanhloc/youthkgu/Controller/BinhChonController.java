package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Service.BinhChonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/binh-chon")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Bình Chọn", description = "API vote (hỗ trợ cả anonymous và đã đăng nhập)")
public class BinhChonController {

    private final BinhChonService binhChonService;

    @PostMapping
    @Operation(summary = "Thực hiện vote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> vote(
            @Valid @RequestBody VoteRequest req,
            Authentication auth,
            HttpServletRequest httpRequest) {

        String nguoiVoteMa = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        String ip = getClientIp(httpRequest);

        log.info("Vote: cuocThi={}, thiSinh={}, user={}, ip={}", req.getCuocThiId(), req.getThiSinhId(), nguoiVoteMa, ip);
        Map<String, Object> result = binhChonService.vote(req, nguoiVoteMa, ip);
        return ResponseEntity.ok(ApiResponse.success("Bình chọn thành công", result));
    }

    @GetMapping("/kiem-tra")
    @Operation(summary = "Kiểm tra đã vote chưa")
    public ResponseEntity<ApiResponse<Map<String, Object>>> kiemTra(
            @RequestParam Long cuocThiId,
            Authentication auth,
            HttpServletRequest httpRequest) {

        String nguoiVoteMa = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        String ip = getClientIp(httpRequest);

        Map<String, Object> result = binhChonService.kiemTraVote(cuocThiId, nguoiVoteMa, ip);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
