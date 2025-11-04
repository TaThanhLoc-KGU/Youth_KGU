package com.tathanhloc.faceattendance.DataLoader;

import com.tathanhloc.faceattendance.Model.Ban;
import com.tathanhloc.faceattendance.Model.ChucVu;
import com.tathanhloc.faceattendance.Repository.BanRepository;
import com.tathanhloc.faceattendance.Repository.ChucVuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final BanRepository banRepository;
    private final ChucVuRepository chucVuRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Initializing sample data...");

        initializeBan();
        initializeChucVu();

        log.info("Sample data initialization completed!");
    }

    private void initializeBan() {
        // Check if data already exists
        if (banRepository.count() > 0) {
            log.info("Ban data already exists, skipping initialization");
            return;
        }

        log.info("Initializing Ban data...");

        // Đoàn bans
        banRepository.save(Ban.builder()
                .maBan("BAN001")
                .tenBan("Ban Chấp hành Đoàn")
                .loaiBan("DOAN")
                .moTa("Ban chấp hành của Đoàn Thanh niên")
                .isActive(true)
                .build());

        banRepository.save(Ban.builder()
                .maBan("BAN002")
                .tenBan("Ban Truyền thông")
                .loaiBan("DOAN")
                .moTa("Ban truyền thông Đoàn Thanh niên")
                .isActive(true)
                .build());

        banRepository.save(Ban.builder()
                .maBan("BAN003")
                .tenBan("Ban Tổ chức")
                .loaiBan("DOAN")
                .moTa("Ban tổ chức Đoàn Thanh niên")
                .isActive(true)
                .build());

        // Hội bans
        banRepository.save(Ban.builder()
                .maBan("BAN004")
                .tenBan("Hội Sinh viên")
                .loaiBan("HOI")
                .moTa("Hội Sinh viên trường")
                .isActive(true)
                .build());

        banRepository.save(Ban.builder()
                .maBan("BAN005")
                .tenBan("Hội Liên hiệp Thanh niên")
                .loaiBan("HOI")
                .moTa("Hội Liên hiệp Thanh niên trường")
                .isActive(true)
                .build());

        // Đội bans
        banRepository.save(Ban.builder()
                .maBan("BAN006")
                .tenBan("Đội Tình nguyện")
                .loaiBan("DOI")
                .moTa("Đội Tình nguyện sinh viên")
                .isActive(true)
                .build());

        // CLB bans
        banRepository.save(Ban.builder()
                .maBan("BAN007")
                .tenBan("CLB Thể thao")
                .loaiBan("CLB")
                .moTa("CLB Thể thao sinh viên")
                .isActive(true)
                .build());

        // Ban
        banRepository.save(Ban.builder()
                .maBan("BAN008")
                .tenBan("Ban Phục vụ")
                .loaiBan("BAN")
                .moTa("Ban Phục vụ sự kiện")
                .isActive(true)
                .build());

        log.info("Ban data initialized successfully");
    }

    private void initializeChucVu() {
        // Check if data already exists
        if (chucVuRepository.count() > 0) {
            log.info("ChucVu data already exists, skipping initialization");
            return;
        }

        log.info("Initializing ChucVu data...");

        // Đoàn positions
        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV001")
                .tenChucVu("Bí thư Đoàn")
                .thuocBan("DOAN")
                .moTa("Bí thư Đoàn Thanh niên trường")
                .thuTu(1)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV002")
                .tenChucVu("Phó Bí thư Đoàn")
                .thuocBan("DOAN")
                .moTa("Phó Bí thư Đoàn Thanh niên trường")
                .thuTu(2)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV003")
                .tenChucVu("Trưởng Ban Truyền thông")
                .thuocBan("DOAN")
                .moTa("Trưởng Ban Truyền thông Đoàn")
                .thuTu(3)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV004")
                .tenChucVu("Trưởng Ban Tổ chức")
                .thuocBan("DOAN")
                .moTa("Trưởng Ban Tổ chức Đoàn")
                .thuTu(4)
                .isActive(true)
                .build());

        // Hội positions
        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV005")
                .tenChucVu("Chủ tịch Hội Sinh viên")
                .thuocBan("HOI")
                .moTa("Chủ tịch Hội Sinh viên trường")
                .thuTu(1)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV006")
                .tenChucVu("Phó Chủ tịch Hội Sinh viên")
                .thuocBan("HOI")
                .moTa("Phó Chủ tịch Hội Sinh viên trường")
                .thuTu(2)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV007")
                .tenChucVu("Tổng thư ký Hội")
                .thuocBan("HOI")
                .moTa("Tổng thư ký Hội Sinh viên")
                .thuTu(3)
                .isActive(true)
                .build());

        // Đội positions
        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV008")
                .tenChucVu("Trưởng Đội")
                .thuocBan("DOI")
                .moTa("Trưởng Đội Tình nguyện")
                .thuTu(1)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV009")
                .tenChucVu("Thành viên Đội")
                .thuocBan("DOI")
                .moTa("Thành viên Đội Tình nguyện")
                .thuTu(2)
                .isActive(true)
                .build());

        // CLB positions
        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV010")
                .tenChucVu("Chủ tịch CLB")
                .thuocBan("CLB")
                .moTa("Chủ tịch CLB Thể thao")
                .thuTu(1)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV011")
                .tenChucVu("Thành viên CLB")
                .thuocBan("CLB")
                .moTa("Thành viên CLB Thể thao")
                .thuTu(2)
                .isActive(true)
                .build());

        // Ban positions (Ban Phục vụ)
        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV012")
                .tenChucVu("Trưởng Ban Phục vụ")
                .thuocBan("BAN")
                .moTa("Trưởng Ban Phục vụ")
                .thuTu(1)
                .isActive(true)
                .build());

        chucVuRepository.save(ChucVu.builder()
                .maChucVu("CV013")
                .tenChucVu("Thành viên Ban Phục vụ")
                .thuocBan("BAN")
                .moTa("Thành viên Ban Phục vụ")
                .thuTu(2)
                .isActive(true)
                .build());

        log.info("ChucVu data initialized successfully");
    }
}
