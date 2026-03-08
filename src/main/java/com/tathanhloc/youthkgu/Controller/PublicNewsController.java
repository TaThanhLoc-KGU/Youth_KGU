package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Model.VanBanFile;
import com.tathanhloc.youthkgu.Service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Public API — không yêu cầu JWT.
 * Dùng cho frontend render bài viết, văn bản, cây danh mục và resolve URL.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicNewsController {

    private final TinTucService tinTucService;
    private final VanBanService vanBanService;
    private final ChuyenMucService chuyenMucService;
    private final SliderItemService sliderItemService;
    private final TickerItemService tickerItemService;
    private final AdBannerService adBannerService;

    // ── Resolve URL ───────────────────────────────────────────────────────────

    /**
     * GET /api/public/resolve?path=doan-thanh-nien/ba-chuong-trinh/bai-viet
     * Trả về type = "POST" | "CATEGORY" | "REDIRECT" | "NOT_FOUND"
     */
    @GetMapping("/resolve")
    public ResponseEntity<ResolveResultDTO> resolve(@RequestParam String path) {
        log.info("Resolving path: {}", path);
        ResolveResultDTO result = tinTucService.resolve(path);
        return ResponseEntity.ok(result);
    }

    // ── Tin Tức ───────────────────────────────────────────────────────────────

    /**
     * GET /api/public/news?page=0&size=10&chuyenMucId=&keyword=
     * Danh sách bài viết đã PUBLISHED cho public.
     */
    @GetMapping("/news")
    public ResponseEntity<Page<TinTucDTO>> getDanhSach(
            @RequestParam(required = false) Long chuyenMucId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Public news list - chuyenMucId={}, keyword={}", chuyenMucId, keyword);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(tinTucService.getDanhSachPublic(chuyenMucId, keyword, pageable));
    }

    // ── Văn Bản ───────────────────────────────────────────────────────────────

    /**
     * GET /api/public/van-ban?page=0&size=10&loai=KE_HOACH
     * Danh sách văn bản đã PUBLISHED cho public.
     */
    @GetMapping("/van-ban")
    public ResponseEntity<Page<VanBanDTO>> getDanhSachVanBan(
            @RequestParam(required = false) String loai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Public van-ban list - loai={}", loai);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(vanBanService.getDanhSachPublic(loai, pageable));
    }

    /**
     * GET /api/public/van-ban/{id}/tai-ve
     * Download file văn bản, tăng luotTai.
     */
    @GetMapping("/van-ban/{id}/tai-ve")
    public ResponseEntity<Resource> taiVe(@PathVariable Long id) {
        log.info("Download file for VanBan id={}", id);
        Resource resource = vanBanService.getFileForDownload(id, true);
        VanBanFile fileEntity = vanBanService.getFileEntity(id);
        String encodedName = URLEncoder.encode(fileEntity.getTenHienThi(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileEntity.getTenHienThi() +
                        "\"; filename*=UTF-8''" + encodedName)
                .contentType(MediaType.parseMediaType(resolveContentType(fileEntity.getLoaiFile())))
                .body(resource);
    }

    /**
     * GET /api/public/van-ban/{id}/xem
     * Xem online (inline — không download), tăng luotXem.
     */
    @GetMapping("/van-ban/{id}/xem")
    public ResponseEntity<Resource> xemOnline(@PathVariable Long id) {
        log.info("View online file for VanBan id={}", id);
        Resource resource = vanBanService.getFileForDownload(id, false);
        VanBanFile fileEntity = vanBanService.getFileEntity(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentType(MediaType.parseMediaType(resolveContentType(fileEntity.getLoaiFile())))
                .body(resource);
    }

    // ── Chuyên Mục ────────────────────────────────────────────────────────────

    /**
     * GET /api/public/chuyen-muc/tree
     * Toàn bộ cây danh mục dùng cho menu navigation.
     */
    @GetMapping("/chuyen-muc/tree")
    public ResponseEntity<List<ChuyenMucTreeDTO>> getCayDanhMuc() {
        log.info("Get chuyen muc tree");
        return ResponseEntity.ok(chuyenMucService.getTree());
    }

    // ── Slider, Ticker, Banners ───────────────────────────────────────────────

    /**
     * GET /api/public/slider
     * Danh sách slide đang active.
     */
    @GetMapping("/slider")
    public ResponseEntity<ApiResponse<List<SliderItemDTO>>> getSlider() {
        log.info("Public get active slider items");
        return ResponseEntity.ok(ApiResponse.success(sliderItemService.getActive()));
    }

    /**
     * GET /api/public/ticker
     * Danh sách tin chạy chữ đang active.
     */
    @GetMapping("/ticker")
    public ResponseEntity<ApiResponse<List<TickerItemDTO>>> getTicker() {
        log.info("Public get active ticker items");
        return ResponseEntity.ok(ApiResponse.success(tickerItemService.getActive()));
    }

    /**
     * GET /api/public/ad-banners
     * Danh sách banner đang active.
     */
    @GetMapping("/ad-banners")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getAdBanners() {
        log.info("Public get active ad banners");
        return ResponseEntity.ok(ApiResponse.success(adBannerService.getActive()));
    }

    /**
     * GET /api/public/ad-banners/loai/{loai}
     * Danh sách banner đang active theo loại (MAIN/SIDEBAR).
     */
    @GetMapping("/ad-banners/loai/{loai}")
    public ResponseEntity<ApiResponse<List<AdBannerDTO>>> getAdBannersByLoai(@PathVariable String loai) {
        log.info("Public get active ad banners by loai: {}", loai);
        return ResponseEntity.ok(ApiResponse.success(
            adBannerService.getActiveByLoai(loai.toUpperCase())));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveContentType(String loaiFile) {
        if (loaiFile == null) return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return switch (loaiFile.toLowerCase()) {
            case "pdf"  -> MediaType.APPLICATION_PDF_VALUE;
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "doc"  -> "application/msword";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "xls"  -> "application/vnd.ms-excel";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "ppt"  -> "application/vnd.ms-powerpoint";
            default     -> MediaType.APPLICATION_OCTET_STREAM_VALUE;
        };
    }
}
