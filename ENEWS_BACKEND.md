# eNews — Backend Implementation

> **Claude Code:** Tạo tất cả file Java theo đúng cấu trúc package hiện tại.
> Package gốc: `com.tathanhloc.faceattendance`
> Convention: xem các file hiện có như `HoatDong`, `TaiKhoan` để viết cùng style.

---

## Cấu trúc package cần tạo

```
com.tathanhloc.faceattendance/
├── Model/
│   ├── ChuyenMuc.java
│   ├── TinTuc.java
│   ├── VanBan.java
│   ├── VanBanFile.java
│   ├── TinTucAnh.java
│   └── UrlRedirect.java
├── DTO/
│   ├── ChuyenMucDTO.java
│   ├── ChuyenMucTreeDTO.java      ← DTO dạng cây để render Tree Picker
│   ├── TinTucDTO.java
│   ├── TinTucDetailDTO.java       ← DTO chi tiết kèm breadcrumb
│   ├── VanBanDTO.java
│   ├── VanBanSearchResultDTO.java ← DTO gọn cho ô search khi tạo bài
│   └── ResolveResultDTO.java      ← DTO trả về từ endpoint resolve URL
├── Repository/
│   ├── ChuyenMucRepository.java
│   ├── TinTucRepository.java
│   ├── VanBanRepository.java
│   ├── VanBanFileRepository.java
│   └── UrlRedirectRepository.java
├── Service/
│   ├── ChuyenMucService.java
│   ├── TinTucService.java
│   ├── VanBanService.java
│   ├── FileStorageService.java    ← Service upload/download file
│   └── SlugService.java          ← Tiện ích sinh slug tiếng Việt
├── Controller/
│   ├── PublicNewsController.java  ← /api/public/** — không cần JWT
│   ├── NewsManageController.java  ← /api/news/** — cần JWT + permission
│   └── VanBanController.java     ← /api/van-ban/** — cần JWT + permission
└── Enum/
    ├── TrangThaiTinTuc.java       ← DRAFT, PUBLISHED, ARCHIVED
    ├── TrangThaiVanBan.java       ← DRAFT, PUBLISHED, ARCHIVED
    ├── LoaiVanBan.java            ← KE_HOACH, CONG_VAN, QUYET_DINH...
    └── HieuLucVanBan.java         ← CON_HIEU_LUC, HET_HIEU_LUC, CHUA_HIEU_LUC
```

---

## Model/Entity

### `ChuyenMuc.java`

```java
@Entity
@Table(name = "chuyen_muc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChuyenMuc {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ten;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "full_path_slug", nullable = false, unique = true)
    private String fullPathSlug;

    @Column(name = "duong_dan", nullable = false)
    private String duongDan;       // "1/2/3" — dùng LIKE query

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ChuyenMuc parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @OrderBy("thuTu ASC")
    private List<ChuyenMuc> children;

    @Column(nullable = false)
    private Integer cap;           // 1, 2, 3...

    private String moTa;
    private String mauSac;
    private String icon;

    @Enumerated(EnumType.STRING)
    private ToChucEnum toChuc;     // DOAN, HOI, BAN_DOI_CLB, CHUNG

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ban_id")
    private Ban ban;

    @Column(name = "thu_tu")
    private Integer thuTu = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

### `TinTuc.java`

```java
@Entity
@Table(name = "tin_tuc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TinTuc {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tieuDe;

    @Column(nullable = false)
    private String slug;

    @Column(name = "full_url_path", nullable = false, unique = true)
    private String fullUrlPath;

    @Column(columnDefinition = "TEXT")
    private String tomTat;

    @Column(name = "noi_dung", columnDefinition = "LONGTEXT")
    private String noiDung;

    @Column(name = "anh_dai_dien")
    private String anhDaiDien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuyen_muc_id", nullable = false)
    private ChuyenMuc chuyenMuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "van_ban_id")
    private VanBan vanBan;         // nullable

    @Column(name = "hoat_dong_id")
    private String hoatDongId;    // nullable, FK logic handled in Service

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiTinTuc trangThai = TrangThaiTinTuc.DRAFT;

    @Column(name = "is_ghim")
    private Boolean isGhim = false;

    @Column(name = "nguoi_tao", nullable = false)
    private String nguoiTao;

    @Column(name = "don_vi_dang")
    private String donViDang;

    @Column(name = "luot_xem")
    private Integer luotXem = 0;

    @Column(name = "ngay_xuat_ban")
    private LocalDateTime ngayXuatBan;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "tinTuc", fetch = FetchType.LAZY)
    @OrderBy("thuTu ASC")
    private List<TinTucAnh> anhList;
}
```

### `VanBan.java`

```java
@Entity
@Table(name = "van_ban")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VanBan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "so_hieu")
    private String soHieu;

    @Column(name = "trich_yeu", nullable = false)
    private String trichYeu;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "full_url_path", nullable = false, unique = true)
    private String fullUrlPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_van_ban", nullable = false)
    private LoaiVanBan loaiVanBan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuyen_muc_id")
    private ChuyenMuc chuyenMuc;

    @Column(name = "co_quan_ban_hanh")
    private String coQuanBanHanh;

    @Column(name = "nguoi_ky")
    private String nguoiKy;

    @Column(name = "ngay_ban_hanh")
    private LocalDate ngayBanHanh;

    @Column(name = "ngay_hieu_luc")
    private LocalDate ngayHieuLuc;

    @Column(name = "ngay_het_han")
    private LocalDate ngayHetHan;

    @Column(name = "hoat_dong_id")
    private String hoatDongId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiVanBan trangThai = TrangThaiVanBan.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "hieu_luc", nullable = false)
    private HieuLucVanBan hieuLuc = HieuLucVanBan.CON_HIEU_LUC;

    @Column(name = "nguoi_dang", nullable = false)
    private String nguoiDang;

    @Column(name = "don_vi_dang")
    private String donViDang;

    @Column(name = "luot_xem")
    private Integer luotXem = 0;

    @Column(name = "luot_tai")
    private Integer luotTai = 0;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @OneToOne(mappedBy = "vanBan", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private VanBanFile file;       // 1 văn bản = 1 file duy nhất
}
```

---

## Service — Logic nghiệp vụ quan trọng

### `SlugService.java` — sinh slug tiếng Việt

```java
@Service
public class SlugService {

    // Map đầy đủ ký tự tiếng Việt → Latin
    private static final Map<Character, String> CHAR_MAP = new LinkedHashMap<>();
    static {
        "àáạảãâầấậẩẫăằắặẳẵ".chars().forEach(c -> CHAR_MAP.put((char)c, "a"));
        "ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ".chars().forEach(c -> CHAR_MAP.put((char)c, "a"));
        "èéẹẻẽêềếệểễ".chars().forEach(c -> CHAR_MAP.put((char)c, "e"));
        "ÈÉẸẺẼÊỀẾỆỂỄ".chars().forEach(c -> CHAR_MAP.put((char)c, "e"));
        "ìíịỉĩ".chars().forEach(c -> CHAR_MAP.put((char)c, "i"));
        "ÌÍỊỈĨ".chars().forEach(c -> CHAR_MAP.put((char)c, "i"));
        "òóọỏõôồốộổỗơờớợởỡ".chars().forEach(c -> CHAR_MAP.put((char)c, "o"));
        "ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ".chars().forEach(c -> CHAR_MAP.put((char)c, "o"));
        "ùúụủũưừứựửữ".chars().forEach(c -> CHAR_MAP.put((char)c, "u"));
        "ÙÚỤỦŨƯỪỨỰỬỮ".chars().forEach(c -> CHAR_MAP.put((char)c, "u"));
        "ỳýỵỷỹ".chars().forEach(c -> CHAR_MAP.put((char)c, "y"));
        "ỲÝỴỶỸ".chars().forEach(c -> CHAR_MAP.put((char)c, "y"));
        CHAR_MAP.put('đ', "d"); CHAR_MAP.put('Đ', "d");
    }

    public String toSlug(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            String mapped = CHAR_MAP.get(c);
            if (mapped != null) sb.append(mapped);
            else sb.append(c);
        }
        return sb.toString()
            .toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .trim()
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    }

    // Rút gọn slug nếu quá dài (max 80 ký tự, cắt tại word boundary)
    public String truncateSlug(String slug, int maxLen) {
        if (slug.length() <= maxLen) return slug;
        String truncated = slug.substring(0, maxLen);
        int lastDash = truncated.lastIndexOf('-');
        return lastDash > 20 ? truncated.substring(0, lastDash) : truncated;
    }

    // Đảm bảo unique bằng cách thêm -2, -3...
    public String ensureUnique(String baseSlug, Function<String, Boolean> existsCheck) {
        String candidate = baseSlug;
        int counter = 2;
        while (existsCheck.apply(candidate)) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }
}
```

### `ChuyenMucService.java` — Cascade update khi đổi tên

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ChuyenMucService {

    // Khi đổi tên → recalculate slug và full_path_slug toàn bộ subtree
    public ChuyenMucDTO update(Long id, ChuyenMucDTO dto) {
        ChuyenMuc cm = repo.findById(id).orElseThrow();
        String oldFullPath = cm.getFullPathSlug();

        cm.setTen(dto.getTen());
        String newSlug = slugService.ensureUnique(
            slugService.truncateSlug(slugService.toSlug(dto.getTen()), 80),
            s -> repo.existsBySlugAndIdNot(s, id)
        );
        cm.setSlug(newSlug);

        // Recalculate full_path_slug
        String newFullPath = cm.getParent() != null
            ? cm.getParent().getFullPathSlug() + "/" + newSlug
            : newSlug;
        cm.setFullPathSlug(newFullPath);

        repo.save(cm);

        // Nếu full_path thay đổi → insert redirect + cascade update toàn bộ con cháu
        if (!oldFullPath.equals(newFullPath)) {
            redirectRepo.save(UrlRedirect.builder()
                .urlCu(oldFullPath).urlMoi(newFullPath).kieu(301)
                .lyDo("Đổi tên chuyên mục id=" + id).build());

            // Cascade update children recursively
            cascadeUpdateChildren(cm, newFullPath, cm.getDuongDan());
        }

        return toDTO(cm);
    }

    private void cascadeUpdateChildren(ChuyenMuc parent, String parentFullPath, String parentDuongDan) {
        List<ChuyenMuc> children = repo.findByParentIdOrderByThuTuAsc(parent.getId());
        for (ChuyenMuc child : children) {
            String oldChildPath = child.getFullPathSlug();
            String newChildPath = parentFullPath + "/" + child.getSlug();
            String newDuongDan = parentDuongDan + "/" + child.getId();

            child.setFullPathSlug(newChildPath);
            child.setDuongDan(newDuongDan);
            repo.save(child);

            // Insert redirect cho child
            redirectRepo.save(UrlRedirect.builder()
                .urlCu(oldChildPath).urlMoi(newChildPath).kieu(301).build());

            // Cập nhật full_url_path của tất cả bài viết thuộc child
            tinTucRepo.updateFullUrlPathByChuyenMucId(child.getId(), oldChildPath, newChildPath);

            // Đệ quy
            cascadeUpdateChildren(child, newChildPath, newDuongDan);
        }
    }
}
```

### `VanBanService.java` — Enforce immutability sau khi PUBLISHED

```java
@Service
@RequiredArgsConstructor
@Transactional
public class VanBanService {

    public VanBanDTO update(Long id, VanBanDTO dto) {
        VanBan vb = repo.findByIdAndIsDeletedFalse(id).orElseThrow();

        // QUAN TRỌNG: Không cho sửa văn bản đã ban hành
        if (vb.getTrangThai() == TrangThaiVanBan.PUBLISHED) {
            throw new BusinessException("Văn bản đã ban hành không thể chỉnh sửa. " +
                "Nếu cần sửa đổi, hãy tạo văn bản mới.");
        }
        // ... update fields
    }

    public void uploadFile(Long vanBanId, MultipartFile file) {
        VanBan vb = repo.findByIdAndIsDeletedFalse(vanBanId).orElseThrow();

        if (vb.getTrangThai() == TrangThaiVanBan.PUBLISHED) {
            throw new BusinessException("Không thể thay thế file của văn bản đã ban hành.");
        }

        // Xóa file cũ nếu có
        fileRepo.findByVanBanId(vanBanId).ifPresent(oldFile -> {
            fileStorageService.deleteFile(oldFile.getDuongDan());
            fileRepo.delete(oldFile);
        });

        // Upload file mới
        FileUploadResult result = fileStorageService.saveVanBanFile(file);
        VanBanFile newFile = VanBanFile.builder()
            .vanBan(vb)
            .tenFileGoc(file.getOriginalFilename())
            .tenHienThi(file.getOriginalFilename())
            .duongDan(result.getDuongDan())
            .loaiFile(result.getLoaiFile())
            .kichThuoc(file.getSize())
            .nguoiUpload(getCurrentUsername())
            .build();
        fileRepo.save(newFile);
    }

    // Search cho ô autocomplete khi tạo bài đăng
    public List<VanBanSearchResultDTO> search(String keyword) {
        return repo.searchForAutocomplete(keyword).stream()
            .map(vb -> VanBanSearchResultDTO.builder()
                .id(vb.getId())
                .soHieu(vb.getSoHieu())
                .trichYeu(vb.getTrichYeu())
                .ngayBanHanh(vb.getNgayBanHanh())
                .loaiVanBan(vb.getLoaiVanBan().name())
                .tenFile(vb.getFile() != null ? vb.getFile().getTenHienThi() : null)
                .kichThuocFile(vb.getFile() != null ? vb.getFile().getKichThuoc() : null)
                .build())
            .collect(Collectors.toList());
    }
}
```

---

## Controller — API Endpoints

### `PublicNewsController.java` — Không cần JWT

```java
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicNewsController {

    // GET /api/public/resolve?path=doan-thanh-nien/ba-chuong-trinh/bai-viet
    // Trả về { type: "POST"|"CATEGORY"|"NOT_FOUND", data: {...} }
    @GetMapping("/resolve")
    public ResponseEntity<ResolveResultDTO> resolve(@RequestParam String path) { ... }

    // GET /api/public/news?page=0&size=10&chuyenMucId=&keyword=
    @GetMapping("/news")
    public ResponseEntity<Page<TinTucDTO>> getDanhSach(...) { ... }

    // GET /api/public/van-ban?page=0&size=10&loai=&keyword=
    @GetMapping("/van-ban")
    public ResponseEntity<Page<VanBanDTO>> getDanhSachVanBan(...) { ... }

    // GET /api/public/van-ban/{id}/tai-ve  → download file, đếm luotTai
    @GetMapping("/van-ban/{id}/tai-ve")
    public ResponseEntity<Resource> taiVe(@PathVariable Long id) { ... }

    // GET /api/public/van-ban/{id}/xem    → xem online (Content-Type PDF, không attachment)
    @GetMapping("/van-ban/{id}/xem")
    public ResponseEntity<Resource> xemOnline(@PathVariable Long id) { ... }

    // GET /api/public/chuyen-muc/tree     → toàn bộ cây danh mục (cho menu nav)
    @GetMapping("/chuyen-muc/tree")
    public ResponseEntity<List<ChuyenMucTreeDTO>> getCayDanhMuc() { ... }
}
```

### `NewsManageController.java` — Cần JWT

```java
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsManageController {

    // POST   /api/news          — tạo bài đăng mới (DANG_TIN_TUC)
    // GET    /api/news          — danh sách bài của đơn vị mình
    // GET    /api/news/{id}     — chi tiết bài
    // PUT    /api/news/{id}     — sửa bài (SUA_TIN_TUC)
    // DELETE /api/news/{id}     — xóa mềm (XOA_TIN_TUC)
    // POST   /api/news/{id}/publish   — publish bài (SUA_TIN_TUC)
    // POST   /api/news/{id}/archive   — archive bài (SUA_TIN_TUC)
    // POST   /api/news/{id}/upload-image  — upload ảnh

    // GET /api/news/van-ban/search?keyword=  — search văn bản cho ô autocomplete
    @GetMapping("/van-ban/search")
    @PreAuthorize("hasPermission(null, 'DANG_TIN_TUC')")
    public ResponseEntity<List<VanBanSearchResultDTO>> searchVanBan(@RequestParam String keyword) { ... }
}
```

### `VanBanController.java` — Cần JWT

```java
@RestController
@RequestMapping("/api/van-ban")
@RequiredArgsConstructor
public class VanBanController {

    // POST   /api/van-ban              — tạo văn bản mới + upload file (multipart)
    // GET    /api/van-ban              — danh sách
    // GET    /api/van-ban/{id}         — chi tiết
    // PUT    /api/van-ban/{id}         — sửa (chỉ khi DRAFT)
    // DELETE /api/van-ban/{id}         — xóa mềm (XOA_VAN_BAN)
    // POST   /api/van-ban/{id}/publish — ban hành chính thức (sau đó bất biến)
    // PUT    /api/van-ban/{id}/file    — thay file (chỉ khi DRAFT)
}
```

---

## Repository — Query cần implement

### `ChuyenMucRepository.java`

```java
public interface ChuyenMucRepository extends JpaRepository<ChuyenMuc, Long> {

    // Lấy tất cả node gốc (cấp 1)
    List<ChuyenMuc> findByParentIsNullAndIsDeletedFalseOrderByThuTuAsc();

    // Lấy con trực tiếp
    List<ChuyenMuc> findByParentIdAndIsDeletedFalseOrderByThuTuAsc(Long parentId);

    // Tìm theo full_path_slug (để resolve URL)
    Optional<ChuyenMuc> findByFullPathSlugAndIsDeletedFalse(String fullPathSlug);

    // Lấy tất cả node thuộc subtree (dùng cho query bài viết theo cây)
    @Query("SELECT c FROM ChuyenMuc c WHERE c.duongDan LIKE :pathPrefix% AND c.isDeleted = false")
    List<ChuyenMuc> findAllInSubtree(@Param("pathPrefix") String pathPrefix);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
```

### `TinTucRepository.java`

```java
public interface TinTucRepository extends JpaRepository<TinTuc, Long> {

    // Resolve URL → tìm bài theo full_url_path
    Optional<TinTuc> findByFullUrlPathAndTrangThaiAndIsDeletedFalse(
        String fullUrlPath, TrangThaiTinTuc trangThai);

    // Lấy bài theo chuyên mục (kể cả con cháu — dùng JOIN với chuyen_muc.duong_dan LIKE)
    @Query("""
        SELECT t FROM TinTuc t
        JOIN t.chuyenMuc c
        WHERE c.duongDan LIKE :pathPrefix%
          AND t.trangThai = 'PUBLISHED'
          AND t.isDeleted = false
        ORDER BY t.isGhim DESC, t.ngayXuatBan DESC
        """)
    Page<TinTuc> findByChuyenMucSubtree(@Param("pathPrefix") String pathPrefix, Pageable pageable);

    // Cascade update full_url_path khi danh mục đổi slug
    @Modifying
    @Query("""
        UPDATE TinTuc t SET t.fullUrlPath = REPLACE(t.fullUrlPath, :oldPath, :newPath)
        WHERE t.chuyenMuc.id = :chuyenMucId
        """)
    void updateFullUrlPathByChuyenMucId(
        @Param("chuyenMucId") Long chuyenMucId,
        @Param("oldPath") String oldPath,
        @Param("newPath") String newPath);
}
```

### `VanBanRepository.java`

```java
public interface VanBanRepository extends JpaRepository<VanBan, Long> {

    // Search cho autocomplete — tìm theo số hiệu hoặc trích yếu, sắp xếp ngày mới nhất
    @Query("""
        SELECT v FROM VanBan v
        WHERE (v.soHieu LIKE %:keyword% OR v.trichYeu LIKE %:keyword%)
          AND v.trangThai = 'PUBLISHED'
          AND v.isDeleted = false
        ORDER BY v.ngayBanHanh DESC, v.createdAt DESC
        """)
    List<VanBan> searchForAutocomplete(@Param("keyword") String keyword, Pageable pageable);
}
```

---

## `FileStorageService.java` — Upload file

```java
@Service
public class FileStorageService {

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    private final Set<String> ALLOWED_TYPES = Set.of("pdf","docx","doc","xlsx","xls","pptx");
    private final long MAX_SIZE = 50 * 1024 * 1024; // 50MB

    public FileUploadResult saveVanBanFile(MultipartFile file) {
        validateFile(file);

        String ext = getExtension(file.getOriginalFilename());
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path dir = Paths.get(uploadBasePath, "van-ban", yearMonth);

        try {
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            return FileUploadResult.builder()
                .duongDan("/uploads/van-ban/" + yearMonth + "/" + storedName)
                .loaiFile(ext)
                .build();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi lưu file: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new BadRequestException("File rỗng");
        String ext = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_TYPES.contains(ext))
            throw new BadRequestException("Chỉ chấp nhận: PDF, Word, Excel, PowerPoint");
        if (file.getSize() > MAX_SIZE)
            throw new BadRequestException("File không được vượt quá 50MB");
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1) : "";
    }
}
```

---

## `ResolveResultDTO.java` — DTO trả về từ resolve endpoint

```java
@Data @Builder
public class ResolveResultDTO {
    private String type;           // "POST" | "CATEGORY" | "REDIRECT" | "NOT_FOUND"
    private TinTucDetailDTO post;  // nếu type = POST
    private ChuyenMucDTO category; // nếu type = CATEGORY
    private Page<TinTucDTO> posts; // nếu type = CATEGORY
    private String redirectTo;     // nếu type = REDIRECT
}
```

## `TinTucDetailDTO.java` — DTO chi tiết kèm breadcrumb

```java
@Data @Builder
public class TinTucDetailDTO {
    private Long id;
    private String tieuDe;
    private String tomTat;
    private String noiDung;
    private String anhDaiDien;
    private String trangThai;
    private LocalDateTime ngayXuatBan;
    private String nguoiTao;
    private String donViDang;
    private Integer luotXem;
    private String fullUrlPath;

    private ChuyenMucDTO chuyenMuc;
    private List<ChuyenMucDTO> breadcrumb; // [root, ..., chuyenMuc hiện tại]

    private VanBanDTO vanBan;       // nullable — văn bản đính kèm
    private String hoatDongId;      // nullable — link đến hoạt động

    // Thông tin hoạt động (join từ bảng hoat_dong nếu hoatDongId != null)
    private String tenHoatDong;
    private String trangThaiHoatDong; // để biết enable/disable nút đăng ký
    private LocalDateTime hanDangKy;
    private Integer soChoConLai;

    private List<TinTucAnhDTO> anhList;
}
```
