package com.tathanhloc.faceattendance.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Mail Service for Face Attendance System
 * Handles all email operations with fallback support
 */
@Service
@Slf4j
public class MailService {

    @Autowired(required = false) // Important: required = false
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@faceattendance.com}")
    private String fromEmail;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    /**
     * Send simple email
     */
    public boolean sendSimpleEmail(String to, String subject, String text) {
        if (!mailEnabled || mailSender == null) {
            log.info("📧 MOCK EMAIL - To: {}, Subject: {}, Text: {}", to, subject, text);
            return true; // Return success for development
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
            return true;

        } catch (Exception e) {
            log.error("❌ Failed to send email to: {} - Error: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Send verification email
     */
    public boolean sendVerificationEmail(String to, String verificationCode) {
        String subject = "Face Attendance - Mã xác thực";
        String text = String.format(
                "Mã xác thực của bạn là: %s\n\n" +
                        "Mã này sẽ hết hạn sau 10 phút.\n\n" +
                        "Hệ thống điểm danh khuôn mặt",
                verificationCode
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send password reset email - THE MISSING METHOD!
     */
    public boolean sendResetPasswordEmail(String to, String tempPassword) {
        String subject = "Face Attendance - Mật khẩu tạm thời";
        String text = String.format(
                "Xin chào,\n\n" +
                        "Mật khẩu tạm thời của bạn là: %s\n\n" +
                        "Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.\n\n" +
                        "Lưu ý: Mật khẩu tạm thời này chỉ có hiệu lực trong 24 giờ.\n\n" +
                        "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ quản trị viên.\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                tempPassword
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send password reset token email (alternative method)
     */
    public boolean sendResetPasswordTokenEmail(String to, String resetToken) {
        String subject = "Face Attendance - Đặt lại mật khẩu";
        String resetUrl = "http://localhost:8080/reset-password?token=" + resetToken;

        String text = String.format(
                "Xin chào,\n\n" +
                        "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để đặt lại mật khẩu:\n\n" +
                        "%s\n\n" +
                        "Link này sẽ hết hạn sau 1 giờ.\n\n" +
                        "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                resetUrl
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send welcome email for new users
     */
    public boolean sendWelcomeEmail(String to, String username, String tempPassword) {
        String subject = "Face Attendance - Chào mừng bạn đến với hệ thống";
        String text = String.format(
                "Xin chào,\n\n" +
                        "Tài khoản của bạn đã được tạo thành công!\n\n" +
                        "Thông tin đăng nhập:\n" +
                        "- Tên đăng nhập: %s\n" +
                        "- Mật khẩu tạm thời: %s\n\n" +
                        "Vui lòng đăng nhập và đổi mật khẩu ngay lần đăng nhập đầu tiên.\n\n" +
                        "Link đăng nhập: http://localhost:8080/login\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                username, tempPassword
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send notification email
     */
    public boolean sendNotificationEmail(String to, String title, String message) {
        String subject = "Face Attendance - " + title;
        String text = String.format(
                "%s\n\n" +
                        "Thời gian: %s\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                message,
                java.time.LocalDateTime.now().format(
                        java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
                )
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send attendance report email
     */
    public boolean sendAttendanceReportEmail(String to, String reportData) {
        String subject = "Face Attendance - Báo cáo điểm danh";
        String text = String.format(
                "Xin chào,\n\n" +
                        "Đính kèm là báo cáo điểm danh của bạn:\n\n" +
                        "%s\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                reportData
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Send system maintenance notification
     */
    public boolean sendMaintenanceNotification(String to, String maintenanceInfo) {
        String subject = "Face Attendance - Thông báo bảo trì hệ thống";
        String text = String.format(
                "Xin chào,\n\n" +
                        "Hệ thống sẽ được bảo trì theo thông tin sau:\n\n" +
                        "%s\n\n" +
                        "Chúng tôi xin lỗi vì sự bất tiện này.\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống điểm danh khuôn mặt",
                maintenanceInfo
        );

        return sendSimpleEmail(to, subject, text);
    }

    /**
     * Check if email service is available
     */
    public boolean isEmailEnabled() {
        return mailEnabled && mailSender != null;
    }

    /**
     * Get email service status
     */
    public String getEmailStatus() {
        if (!mailEnabled) {
            return "Email service disabled in configuration";
        }
        if (mailSender == null) {
            return "Email service not configured properly";
        }
        return "Email service ready";
    }

    /**
     * Test email functionality
     */
    public boolean testEmail(String to) {
        return sendSimpleEmail(to,
                "Face Attendance - Test Email",
                "Đây là email test từ hệ thống điểm danh khuôn mặt. Nếu bạn nhận được email này, hệ thống email đang hoạt động bình thường.");
    }
}