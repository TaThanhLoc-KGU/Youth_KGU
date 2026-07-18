package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.Service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Upload ảnh/video cho sinh viên khi nộp bài cuộc thi.
 * Yêu cầu đăng nhập (bất kỳ role nào).
 */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Slf4j
public class StudentUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) {
        log.info("Student file upload: {}", file.getOriginalFilename());
        String url = fileStorageService.saveMediaImage(file);
        return ResponseEntity.ok(ApiResponse.success("Uploaded", Map.of("url", url)));
    }
}
