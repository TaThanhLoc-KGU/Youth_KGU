package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.CauHinhEmailDTO;
import com.tathanhloc.youthkgu.Model.CauHinhEmail;
import com.tathanhloc.youthkgu.Repository.CauHinhEmailRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Properties;

/**
 * Service quản lý cấu hình SMTP email.
 * Cho phép admin thay đổi cài đặt email trong runtime (không cần restart server).
 *
 * Flow:
 * 1. Khi app khởi động, @PostConstruct đọc config từ DB và apply vào JavaMailSenderImpl.
 * 2. Admin gọi PUT /api/cau-hinh-email → saveCauHinh() → lưu DB + apply vào sender.
 * 3. EmailService kiểm tra kichHoat trước khi gửi: false → chỉ log, true → gửi thật.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CauHinhEmailService {

    private final CauHinhEmailRepository repository;
    private final JavaMailSenderImpl      mailSender;

    // ─── Khởi tạo ────────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        repository.findFirstByOrderByIdAsc().ifPresentOrElse(
                config -> {
                    applyToMailSender(config);
                    log.info("Email config loaded from DB: host={}, port={}, enabled={}",
                            config.getSmtpHost(), config.getSmtpPort(), config.getKichHoat());
                },
                () -> log.info("No email config in DB — using application.properties defaults")
        );
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public CauHinhEmailDTO getCauHinh() {
        CauHinhEmail config = repository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefault);
        return toDTO(config);
    }

    @Transactional
    public CauHinhEmailDTO saveCauHinh(CauHinhEmailDTO dto, String updatedBy) {
        CauHinhEmail config = repository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefault);

        config.setSmtpHost(dto.smtpHost());
        config.setSmtpPort(dto.smtpPort());
        config.setUsername(dto.username());
        // Chỉ cập nhật mật khẩu nếu người dùng nhập (khác "••••••••")
        if (dto.matKhau() != null && !dto.matKhau().isBlank() && !dto.matKhau().startsWith("•")) {
            config.setMatKhau(dto.matKhau());
        }
        config.setFromAddress(dto.fromAddress());
        config.setFromName(dto.fromName());
        config.setTlsEnabled(dto.tlsEnabled());
        config.setSslEnabled(dto.sslEnabled());
        config.setKichHoat(dto.kichHoat());
        config.setGhiChu(dto.ghiChu());
        config.setUpdatedAt(LocalDateTime.now());
        config.setUpdatedBy(updatedBy);

        config = repository.save(config);
        applyToMailSender(config);

        log.info("Email config updated by {} — host={}, port={}, enabled={}",
                updatedBy, config.getSmtpHost(), config.getSmtpPort(), config.getKichHoat());
        return toDTO(config);
    }

    /**
     * Gửi email kiểm tra kết nối SMTP.
     * @return true nếu kết nối thành công
     */
    public boolean testConnection() {
        try {
            mailSender.testConnection();
            log.info("Email SMTP connection test PASSED");
            return true;
        } catch (Exception e) {
            log.warn("Email SMTP connection test FAILED: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra xem email có đang được kích hoạt không.
     */
    public boolean isEmailEnabled() {
        return repository.findFirstByOrderByIdAsc()
                .map(c -> Boolean.TRUE.equals(c.getKichHoat()))
                .orElse(false);
    }

    public String getFromAddress() {
        return repository.findFirstByOrderByIdAsc()
                .map(CauHinhEmail::getFromAddress)
                .orElse("noreply@kgu.edu.vn");
    }

    public String getFromName() {
        return repository.findFirstByOrderByIdAsc()
                .map(CauHinhEmail::getFromName)
                .orElse("Đoàn Trường ĐH Kiên Giang");
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    private void applyToMailSender(CauHinhEmail config) {
        mailSender.setHost(config.getSmtpHost());
        mailSender.setPort(config.getSmtpPort());
        mailSender.setUsername(config.getUsername());
        mailSender.setPassword(config.getMatKhau());

        Properties props = new Properties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", String.valueOf(Boolean.TRUE.equals(config.getTlsEnabled())));
        props.put("mail.smtp.ssl.enable", String.valueOf(Boolean.TRUE.equals(config.getSslEnabled())));
        props.put("mail.smtp.ssl.trust", config.getSmtpHost());
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.debug", "false");
        mailSender.setJavaMailProperties(props);
    }

    private CauHinhEmail createDefault() {
        CauHinhEmail def = CauHinhEmail.builder()
                .smtpHost("smtp.gmail.com").smtpPort(587)
                .username("").matKhau("")
                .fromAddress("noreply@kgu.edu.vn")
                .fromName("Đoàn Trường ĐH Kiên Giang")
                .tlsEnabled(true).sslEnabled(false).kichHoat(false)
                .updatedAt(LocalDateTime.now())
                .build();
        return repository.save(def);
    }

    private CauHinhEmailDTO toDTO(CauHinhEmail c) {
        return new CauHinhEmailDTO(
                c.getId(), c.getSmtpHost(), c.getSmtpPort(), c.getUsername(),
                "••••••••",   // never expose real password
                c.getFromAddress(), c.getFromName(),
                Boolean.TRUE.equals(c.getTlsEnabled()),
                Boolean.TRUE.equals(c.getSslEnabled()),
                Boolean.TRUE.equals(c.getKichHoat()),
                c.getGhiChu(), c.getUpdatedAt(), c.getUpdatedBy()
        );
    }
}
