package com.tathanhloc.youthkgu.DataLoader;

import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import com.tathanhloc.youthkgu.Util.AcademicCalendarUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final BanRepository banRepository;
    private final ChucVuRepository chucVuRepository;
    private final PermissionRepository permissionRepository;
    private final NamHocRepository namHocRepository;
    private final HocKyRepository hocKyRepository;
    private final HocKyNamHocRepository hocKyNamHocRepository;
    private final SliderItemRepository sliderItemRepository;
    private final TickerItemRepository tickerItemRepository;
    private final AdBannerRepository adBannerRepository;
    private final TinTucRepository tinTucRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Initializing system data...");

        initializeBan();
        initializeChucVu();
        initializePermissions();
        initializeNamHocAndHocKy();
        initializeSampleENewsData();
        backfillTinTucTuongTacCounters();

        log.info("System data initialization completed!");
    }

    /** Xem javadoc TinTucRepository.backfillNullTuongTacCounters(). */
    private void backfillTinTucTuongTacCounters() {
        int updated = tinTucRepository.backfillNullTuongTacCounters();
        if (updated > 0) {
            log.info("Backfill {} bài viết có cột tương tác (thích/bình luận/chia sẻ) NULL -> 0", updated);
        }
    }

    private void initializeBan() {
        if (banRepository.count() > 0) {
            log.info("Ban data already exists, skipping initialization");
            return;
        }

        log.info("Initializing Ban data...");

        // Đoàn bans
        banRepository.save(Ban.builder().maBan("BAN001").tenBan("Ban Chấp hành Đoàn").loaiBan("DOAN").moTa("Ban chấp hành của Đoàn Thanh niên").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN002").tenBan("Ban Truyền thông").loaiBan("DOAN").moTa("Ban truyền thông Đoàn Thanh niên").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN003").tenBan("Ban Tổ chức").loaiBan("DOAN").moTa("Ban tổ chức Đoàn Thanh niên").isActive(true).build());

        // Hội bans
        banRepository.save(Ban.builder().maBan("BAN004").tenBan("Hội Sinh viên").loaiBan("HOI").moTa("Hội Sinh viên trường").isActive(true).build());
        banRepository.save(Ban.builder().maBan("BAN005").tenBan("Hội Liên hiệp Thanh niên").loaiBan("HOI").moTa("Hội Liên hiệp Thanh niên trường").isActive(true).build());

        // Đội bans
        banRepository.save(Ban.builder().maBan("BAN006").tenBan("Đội Tình nguyện").loaiBan("DOI").moTa("Đội Tình nguyện sinh viên").isActive(true).build());

        // CLB bans
        banRepository.save(Ban.builder().maBan("BAN007").tenBan("CLB Thể thao").loaiBan("CLB").moTa("CLB Thể thao sinh viên").isActive(true).build());

        // Ban
        banRepository.save(Ban.builder().maBan("BAN008").tenBan("Ban Phục vụ").loaiBan("BAN").moTa("Ban Phục vụ sự kiện").isActive(true).build());

        log.info("Ban data initialized successfully");
    }

    private void initializeChucVu() {
        if (chucVuRepository.count() > 0) {
            log.info("ChucVu data already exists, skipping initialization");
            return;
        }

        log.info("Initializing ChucVu data...");

        // Đoàn positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV001").tenChucVu("Bí thư Đoàn").thuocBan("DOAN").moTa("Bí thư Đoàn Thanh niên trường").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV002").tenChucVu("Phó Bí thư Đoàn").thuocBan("DOAN").moTa("Phó Bí thư Đoàn Thanh niên trường").thuTu(2).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV003").tenChucVu("Trưởng Ban Truyền thông").thuocBan("DOAN").moTa("Trưởng Ban Truyền thông Đoàn").thuTu(3).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV004").tenChucVu("Trưởng Ban Tổ chức").thuocBan("DOAN").moTa("Trưởng Ban Tổ chức Đoàn").thuTu(4).isActive(true).build());

        // Hội positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV005").tenChucVu("Chủ tịch Hội Sinh viên").thuocBan("HOI").moTa("Chủ tịch Hội Sinh viên trường").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV006").tenChucVu("Phó Chủ tịch Hội Sinh viên").thuocBan("HOI").moTa("Phó Chủ tịch Hội Sinh viên trường").thuTu(2).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV007").tenChucVu("Tổng thư ký Hội").thuocBan("HOI").moTa("Tổng thư ký Hội Sinh viên").thuTu(3).isActive(true).build());

        // Đội positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV008").tenChucVu("Trưởng Đội").thuocBan("DOI").moTa("Trưởng Đội Tình nguyện").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV009").tenChucVu("Thành viên Đội").thuocBan("DOI").moTa("Thành viên Đội Tình nguyện").thuTu(2).isActive(true).build());

        // CLB positions
        chucVuRepository.save(ChucVu.builder().maChucVu("CV010").tenChucVu("Chủ tịch CLB").thuocBan("CLB").moTa("Chủ tịch CLB Thể thao").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV011").tenChucVu("Thành viên CLB").thuocBan("CLB").moTa("Thành viên CLB Thể thao").thuTu(2).isActive(true).build());

        // Ban positions (Ban Phục vụ)
        chucVuRepository.save(ChucVu.builder().maChucVu("CV012").tenChucVu("Trưởng Ban Phục vụ").thuocBan("BAN").moTa("Trưởng Ban Phục vụ").thuTu(1).isActive(true).build());
        chucVuRepository.save(ChucVu.builder().maChucVu("CV013").tenChucVu("Thành viên Ban Phục vụ").thuocBan("BAN").moTa("Thành viên Ban Phục vụ").thuTu(2).isActive(true).build());

        log.info("ChucVu data initialized successfully");
    }

    private void initializePermissions() {
        log.info("Initializing Permissions (idempotent)...");
        // eNews
        createPermissionIfNotExists("DANG_TIN_TUC",       "Tạo và đăng bài viết eNews",           "NEWS");
        createPermissionIfNotExists("SUA_TIN_TUC",        "Sửa bài viết eNews",                   "NEWS");
        createPermissionIfNotExists("XOA_TIN_TUC",        "Xóa bài viết eNews",                   "NEWS");
        createPermissionIfNotExists("DUYET_TIN_TUC",      "Duyệt bài viết trước khi publish",     "NEWS");
        createPermissionIfNotExists("QUAN_LY_CHUYEN_MUC", "Thêm sửa xóa danh mục eNews",         "NEWS");
        createPermissionIfNotExists("QUAN_LY_VAN_BAN",    "Upload và quản lý văn bản/kế hoạch",   "NEWS");
        createPermissionIfNotExists("XOA_VAN_BAN",        "Xóa văn bản khỏi kho",                 "NEWS");
        createPermissionIfNotExists("KIEM_DUYET_BINH_LUAN", "Khóa bình luận bài viết; chặn/bỏ chặn/xóa bình luận vi phạm", "NEWS");

        // Ký số
        createPermissionIfNotExists("QUAN_LY_CON_DAU", "Upload, xóa và gán quyền sở hữu (scoping) con dấu", "KY_SO");

        // Thùng thư góp ý
        createPermissionIfNotExists("XEM_GOP_Y",  "Xem danh sách/chi tiết góp ý-phản ánh (danh tính người gửi được ẩn)", "GOP_Y");
        createPermissionIfNotExists("XU_LY_GOP_Y", "Cập nhật trạng thái và phản hồi góp ý-phản ánh", "GOP_Y");
        log.info("Permissions initialized successfully");
    }

    /**
     * Tạo permission nếu chưa tồn tại (idempotent — an toàn khi restart).
     * Khác với createPermission(): không dùng guard count() > 0.
     */
    private void createPermissionIfNotExists(String name, String description, String category) {
        if (permissionRepository.findByName(name).isEmpty()) {
            permissionRepository.save(Permission.builder()
                    .name(name)
                    .description(description)
                    .category(category)
                    .build());
            log.debug("Created permission: {}", name);
        }
    }

    // assignPermissionsToRole đã bị xóa theo thiết kế mới: quyền gán trực tiếp cho từng tài khoản

    /**
     * Khởi tạo dữ liệu Năm học và Học kỳ theo lịch của trường KGU.
     * Chỉ thêm dữ liệu nếu chưa tồn tại để tránh lỗi trùng lặp.
     */
    private void initializeNamHocAndHocKy() {
        // Khởi tạo năm học 2024-2025
        initSingleNamHoc(2024);
        // Khởi tạo năm học 2025-2026 (năm hiện tại)
        initSingleNamHoc(2025);
        // Khởi tạo năm học 2026-2027 (năm tới)
        initSingleNamHoc(2026);
        log.info("NamHoc & HocKy data initialized successfully");
    }

    private void initSingleNamHoc(int startYear) {
        int endYear = startYear + 1;
        String maNamHoc = "NH" + startYear + "-" + endYear;
        String tenNamHoc = "Năm học " + startYear + "-" + endYear;

        // Bỏ qua nếu đã tồn tại
        if (namHocRepository.existsById(maNamHoc)) {
            log.info("NamHoc {} already exists, skipping", maNamHoc);
            return;
        }

        log.info("Initializing NamHoc {} ...", maNamHoc);

        // Tính ngày của các học kỳ
        LocalDate hk1Start = AcademicCalendarUtil.getNgayBatDauHK1(startYear);
        LocalDate hk1End   = AcademicCalendarUtil.getNgayKetThucHK1(startYear);
        LocalDate hk2Start = AcademicCalendarUtil.getNgayBatDauHK2(startYear);
        LocalDate hk2End   = AcademicCalendarUtil.getNgayKetThucHK2(startYear);
        LocalDate hk3Start = AcademicCalendarUtil.getNgayBatDauHK3(startYear);
        LocalDate hk3End   = AcademicCalendarUtil.getNgayKetThucHK3(startYear);

        // Xác định năm học hiện tại để đánh dấu isCurrent
        boolean isCurrentYear = maNamHoc.equals(AcademicCalendarUtil.getCurrentMaNamHoc());

        // Lưu NamHoc
        NamHoc namHoc = NamHoc.builder()
                .maNamHoc(maNamHoc)
                .tenNamHoc(tenNamHoc)
                .ngayBatDau(hk1Start)
                .ngayKetThuc(hk3End)
                .moTa("Năm học " + startYear + "-" + endYear + " của trường KGU (3 học kỳ)")
                .isActive(true)
                .isCurrent(isCurrentYear)
                .build();
        namHocRepository.save(namHoc);

        // Lưu 3 HocKy
        String[] maHKs = {
            "HK1-" + startYear + "-" + endYear,
            "HK2-" + startYear + "-" + endYear,
            "HK3-" + startYear + "-" + endYear
        };
        String[] tenHKs = {"Học kỳ 1", "Học kỳ 2", "Học kỳ 3"};
        LocalDate[] starts = {hk1Start, hk2Start, hk3Start};
        LocalDate[] ends   = {hk1End,   hk2End,   hk3End};
        String[] moTas = {
            "HK1 " + tenNamHoc + ": 15 tuần (14 tuần học+thi, 1 tuần nghỉ)",
            "HK2 " + tenNamHoc + ": 17 tuần (15 tuần học+thi, 2 tuần nghỉ Tết)",
            "HK3 " + tenNamHoc + ": 14 tuần (13 tuần học+thi)"
        };

        for (int i = 0; i < 3; i++) {
            int soHocKy = i + 1;
            String maHocKy = maHKs[i];

            // Bỏ qua nếu đã tồn tại
            if (hocKyRepository.existsById(maHocKy)) {
                continue;
            }

            // Xác định học kỳ hiện tại
            boolean isCurrentHK = isCurrentYear
                    && (soHocKy == AcademicCalendarUtil.getCurrentSoHocKy());

            HocKy hocKy = HocKy.builder()
                    .maHocKy(maHocKy)
                    .tenHocKy(tenHKs[i])
                    .ngayBatDau(starts[i])
                    .ngayKetThuc(ends[i])
                    .moTa(moTas[i])
                    .isActive(true)
                    .isCurrent(isCurrentHK)
                    .build();
            hocKyRepository.save(hocKy);

            // Lưu bảng trung gian HocKyNamHoc
            hocKyNamHocRepository.save(HocKyNamHoc.builder()
                    .hocKy(hocKy)
                    .namHoc(namHoc)
                    .thuTu(soHocKy)
                    .isActive(true)
                    .build());
        }

        log.info("NamHoc {} initialized: HK1={}->{}, HK2={}->{}, HK3={}->{}",
                maNamHoc, hk1Start, hk1End, hk2Start, hk2End, hk3Start, hk3End);
    }

    private void initializeSampleENewsData() {
        if (sliderItemRepository.count() == 0) {
            log.info("Seeding sample Slider items...");
            sliderItemRepository.save(SliderItem.builder()
                    .tieuDe("Chào mừng bạn đến với eNews")
                    .moTa("Cổng thông tin chính thức của Đoàn - Hội trường Đại học Kiên Giang")
                    .hinhAnh("https://images.unsplash.com/photo-1523050335392-9ae38d19a09e?q=80&w=2070&auto=format&fit=crop")
                    .thuTu(0)
                    .isActive(true)
                    .build());
            sliderItemRepository.save(SliderItem.builder()
                    .tieuDe("Hệ thống điểm danh thông minh")
                    .moTa("Tham gia hoạt động và tích lũy điểm rèn luyện dễ dàng")
                    .hinhAnh("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop")
                    .thuTu(1)
                    .isActive(true)
                    .build());
        }

        if (tickerItemRepository.count() == 0) {
            log.info("Seeding sample Ticker items...");
            tickerItemRepository.save(TickerItem.builder()
                    .noiDung("Chào mừng năm học mới 2025-2026! Chúc các bạn sinh viên một học kỳ thành công rực rỡ.")
                    .isActive(true)
                    .thuTu(0)
                    .build());
            tickerItemRepository.save(TickerItem.builder()
                    .noiDung("Thông báo: Hạn chót đăng ký tham gia Chiến dịch Mùa hè xanh là ngày 15/03/2026.")
                    .isActive(true)
                    .thuTu(1)
                    .build());
        }

        if (adBannerRepository.count() == 0) {
            log.info("Seeding sample Ad Banners...");
            adBannerRepository.save(AdBanner.builder()
                    .tieuDe("Banner chính 1")
                    .hinhAnh("https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop")
                    .loai("MAIN")
                    .isActive(true)
                    .thuTu(0)
                    .build());
            adBannerRepository.save(AdBanner.builder()
                    .tieuDe("Widget Sidebar 1")
                    .hinhAnh("https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1932&auto=format&fit=crop")
                    .loai("SIDEBAR")
                    .isActive(true)
                    .thuTu(0)
                    .build());
        }
    }
}
