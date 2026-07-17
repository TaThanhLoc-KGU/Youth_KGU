package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * API quản lý media (ảnh cho slider, banner, ...).
 * Chỉ ADMIN và BCH mới được dùng.
 */
@RestController
@RequestMapping("/api/admin/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final FileStorageService fileStorageService;

    /**
     * Upload một ảnh media (admin/BCH).
     * POST /api/admin/media/upload
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        log.info("Upload media image: {}", file.getOriginalFilename());
        String url = fileStorageService.saveMediaImage(file);
        return ResponseEntity.ok(ApiResponse.success("Uploaded", Map.of("url", url)));
    }


    /**
     * Lấy danh sách ảnh media đã upload.
     * GET /api/admin/media/images
     */
    @GetMapping("/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'BCH')")
    public ResponseEntity<ApiResponse<List<String>>> listImages() {
        List<String> images = fileStorageService.listMediaImages();
        return ResponseEntity.ok(ApiResponse.success(images));
    }
}
