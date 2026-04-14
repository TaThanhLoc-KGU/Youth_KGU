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
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final HoatDongService hoatDongService;
    private final DangKyHoatDongService dangKyHoatDongService;

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

    // ── Hoạt Động (Public) ────────────────────────────────────────────────────

    /**
     * GET /api/public/hoat-dong
     * Toàn bộ hoạt động, sắp xếp:
     *   1. Ưu tiên trạng thái: đang diễn ra → đang mở đăng ký → sắp diễn ra → khác
     *   2. Cùng nhóm trạng thái: ngày tổ chức mới nhất lên trước (ngayToChuc DESC)
     *   3. Cùng ngày: hoạt động mới tạo nhất lên trước (createdAt DESC)
     */
    @GetMapping("/hoat-dong")
    public ResponseEntity<ApiResponse<List<HoatDongDTO>>> getPublicHoatDong() {
        log.info("Public get all activities");
        List<HoatDongDTO> list = hoatDongService.getAll().stream()
                .sorted((a, b) -> {
                    // 1. Ưu tiên trạng thái (hoạt động "đang chạy" lên đầu)
                    int pa = statusPriority(a.getTrangThai());
                    int pb = statusPriority(b.getTrangThai());
                    if (pa != pb) return Integer.compare(pa, pb);

                    // 2. Cùng nhóm → ngày tổ chức mới nhất trước
                    if (a.getNgayToChuc() != null && b.getNgayToChuc() != null) {
                        int cmp = b.getNgayToChuc().compareTo(a.getNgayToChuc());
                        if (cmp != 0) return cmp;
                    } else if (a.getNgayToChuc() == null && b.getNgayToChuc() != null) return 1;
                    else if (a.getNgayToChuc() != null) return -1;

                    // 3. Cùng ngày → mới tạo nhất trước
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null)
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    if (a.getCreatedAt() == null) return 1;
                    return -1;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** Thứ tự ưu tiên trạng thái (số nhỏ = lên trên): đang diễn ra → mở đăng ký → sắp → còn lại */
    private int statusPriority(com.tathanhloc.youthkgu.Enum.TrangThaiHoatDongEnum trangThai) {
        if (trangThai == null) return 9;
        return switch (trangThai) {
            case DANG_DIEN_RA     -> 1;
            case DANG_MO_DANG_KY  -> 2;
            case SAP_DIEN_RA      -> 3;
            case DA_KET_THUC      -> 4;
            case DA_HOAN_THANH    -> 5;
            case DA_HUY           -> 7;
        };
    }

    /**
     * GET /api/public/hoat-dong/tham-gia?ma={maHoatDong}
     * Danh sách sinh viên đã tham gia (chỉ trả về tên + lớp, không lộ MSSV/email).
     * Dùng @RequestParam thay @PathVariable để tránh lỗi khi maHoatDong chứa dấu '/'
     */
    @GetMapping("/hoat-dong/tham-gia")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getThamGia(
            @RequestParam String ma) {
        String maHoatDong = ma;
        log.info("Public get participants for activity: {}", maHoatDong);
        List<Map<String, Object>> result = dangKyHoatDongService.getByActivity(maHoatDong)
                .stream()
                .filter(dk -> !Boolean.FALSE.equals(dk.getIsActive())) // loại bỏ người đã hủy
                .map(dk -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("hoTen", dk.getHoTenSinhVien());
                    item.put("tenLop", dk.getTenLop());
                    item.put("daDiemDanh", Boolean.TRUE.equals(dk.getDaDiemDanh()));
                    return item;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Hoạt Động — Đăng ký (Sinh viên, cần đăng nhập) ─────────────────────

    /**
     * POST /api/public/hoat-dong/dang-ky?ma={maHoatDong}
     * Sinh viên đăng ký hoạt động từ trang public (phải đăng nhập với ROLE_USER).
     */
    @PostMapping("/hoat-dong/dang-ky")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DangKyHoatDongDTO>> dangKyPublic(
            @RequestParam String ma,
            Authentication authentication) {
        com.tathanhloc.youthkgu.Security.CustomUserDetails userDetails =
                (com.tathanhloc.youthkgu.Security.CustomUserDetails) authentication.getPrincipal();
        String maSv = userDetails.getTaiKhoan().getSinhVien().getMaSv();
        log.info("Public dang-ky hoat-dong: maSv={}, maHoatDong={}", maSv, ma);
        DangKyHoatDongRequest request = DangKyHoatDongRequest.builder()
                .maSv(maSv)
                .maHoatDong(ma)
                .build();
        DangKyHoatDongDTO result = dangKyHoatDongService.registerActivity(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * DELETE /api/public/hoat-dong/huy-dang-ky?ma={maHoatDong}
     * Sinh viên hủy đăng ký hoạt động từ trang public.
     */
    @DeleteMapping("/hoat-dong/huy-dang-ky")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> huyDangKyPublic(
            @RequestParam String ma,
            Authentication authentication) {
        com.tathanhloc.youthkgu.Security.CustomUserDetails userDetails =
                (com.tathanhloc.youthkgu.Security.CustomUserDetails) authentication.getPrincipal();
        String maSv = userDetails.getTaiKhoan().getSinhVien().getMaSv();
        log.info("Public huy-dang-ky hoat-dong: maSv={}, maHoatDong={}", maSv, ma);
        dangKyHoatDongService.cancelRegistration(maSv, ma);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * GET /api/public/hoat-dong/trang-thai-dang-ky?ma={maHoatDong}
     * Kiểm tra sinh viên đã đăng ký hoạt động chưa.
     */
    @GetMapping("/hoat-dong/trang-thai-dang-ky")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> kiemTraDangKy(
            @RequestParam String ma,
            Authentication authentication) {
        com.tathanhloc.youthkgu.Security.CustomUserDetails userDetails =
                (com.tathanhloc.youthkgu.Security.CustomUserDetails) authentication.getPrincipal();
        String maSv = userDetails.getTaiKhoan().getSinhVien().getMaSv();
        List<DangKyHoatDongDTO> list = dangKyHoatDongService.getByStudent(maSv);
        boolean daDangKy = list.stream().anyMatch(dk -> ma.equals(dk.getMaHoatDong()));
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("daDangKy", daDangKy);
        result.put("maSv", maSv);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Tin Tức theo Khoa (Public) ────────────────────────────────────────────

    /**
     * GET /api/public/tin-tuc/khoa/{maKhoa}
     * Danh sách tin tức đã PUBLISHED của một khoa cụ thể.
     */
    @GetMapping("/tin-tuc/khoa/{maKhoa}")
    public ResponseEntity<?> getTinTucByKhoa(
            @PathVariable String maKhoa,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Public tin-tuc by khoa: {}", maKhoa);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TinTucDTO> result = tinTucService.getTinTucByKhoa(maKhoa, pageable);
        return ResponseEntity.ok(result);
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
