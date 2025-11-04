package com.tathanhloc.faceattendance.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service để gửi email thông báo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@vnkgu.edu.vn}")
    private String fromEmail;

    @Value("${app.name:Hệ thống Quản lý Hoạt động Đoàn - Hội}")
    private String appName;

    /**
     * Gửi email đăng ký thành công
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     */
    public void sendRegistrationSuccessEmail(String email, String username, String hoTen) {
        log.info("Gửi email đăng ký thành công đến: {}", email);

        String subject = "Đăng ký tài khoản thành công - " + appName;
        String htmlContent = buildRegistrationSuccessTemplate(username, hoTen);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email đăng ký thành công cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email đăng ký cho {}", email, e);
        }
    }

    /**
     * Gửi email phê duyệt tài khoản
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     */
    public void sendAccountApprovedEmail(String email, String username, String hoTen) {
        log.info("Gửi email phê duyệt tài khoản đến: {}", email);

        String subject = "Tài khoản đã được phê duyệt - " + appName;
        String htmlContent = buildAccountApprovedTemplate(username, hoTen);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email phê duyệt cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email phê duyệt cho {}", email, e);
        }
    }

    /**
     * Gửi email từ chối tài khoản
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     * @param lyDo Lý do từ chối
     */
    public void sendAccountRejectedEmail(String email, String username, String hoTen, String lyDo) {
        log.info("Gửi email từ chối tài khoản đến: {}", email);

        String subject = "Tài khoản bị từ chối - " + appName;
        String htmlContent = buildAccountRejectedTemplate(username, hoTen, lyDo);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email từ chối cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email từ chối cho {}", email, e);
        }
    }

    /**
     * Gửi email quên mật khẩu
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     * @param resetToken Token để reset mật khẩu
     */
    public void sendPasswordResetEmail(String email, String username, String hoTen, String resetToken) {
        log.info("Gửi email reset mật khẩu đến: {}", email);

        String subject = "Reset mật khẩu - " + appName;
        String htmlContent = buildPasswordResetTemplate(username, hoTen, resetToken);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email reset mật khẩu cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email reset mật khẩu cho {}", email, e);
        }
    }

    /**
     * Gửi email thông báo thay đổi mật khẩu
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     */
    public void sendPasswordChangedEmail(String email, String username, String hoTen) {
        log.info("Gửi email thay đổi mật khẩu đến: {}", email);

        String subject = "Mật khẩu đã được thay đổi - " + appName;
        String htmlContent = buildPasswordChangedTemplate(username, hoTen);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email thay đổi mật khẩu cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email thay đổi mật khẩu cho {}", email, e);
        }
    }

    /**
     * Gửi email thông báo vai trò thay đổi
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     * @param vaiTro Vai trò mới
     */
    public void sendRoleChangeEmail(String email, String username, String hoTen, String vaiTro) {
        log.info("Gửi email thay đổi vai trò đến: {}", email);

        String subject = "Vai trò tài khoản đã thay đổi - " + appName;
        String htmlContent = buildRoleChangeTemplate(username, hoTen, vaiTro);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email thay đổi vai trò cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email thay đổi vai trò cho {}", email, e);
        }
    }

    /**
     * Gửi email thông báo tài khoản bị vô hiệu
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     */
    public void sendAccountDeactivatedEmail(String email, String username, String hoTen) {
        log.info("Gửi email tài khoản bị vô hiệu đến: {}", email);

        String subject = "Tài khoản đã bị vô hiệu hóa - " + appName;
        String htmlContent = buildAccountDeactivatedTemplate(username, hoTen);

        try {
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Gửi email vô hiệu tài khoản cho: {}", email);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi gửi email vô hiệu tài khoản cho {}", email, e);
        }
    }

    /**
     * Gửi email HTML
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, appName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Template: Đăng ký thành công
     */
    private String buildRegistrationSuccessTemplate(String username, String hoTen) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #007bff;\">Chào " + hoTen + "!</h2>" +
                "<p>Đăng ký tài khoản của bạn đã thành công.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p>Tài khoản của bạn hiện đang ở trạng thái <strong>chờ phê duyệt</strong>. " +
                "Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn.</p>" +
                "<p>Nếu bạn không thực hiện đăng ký này, vui lòng liên hệ với quản trị viên.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Phê duyệt tài khoản
     */
    private String buildAccountApprovedTemplate(String username, String hoTen) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #28a745;\">Chào " + hoTen + "!</h2>" +
                "<p>Tài khoản của bạn đã được <strong>phê duyệt</strong>.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p>Bạn hiện có thể đăng nhập vào hệ thống và sử dụng tất cả các tính năng.</p>" +
                "<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Từ chối tài khoản
     */
    private String buildAccountRejectedTemplate(String username, String hoTen, String lyDo) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #dc3545;\">Chào " + hoTen + "!</h2>" +
                "<p>Tài khoản đăng ký của bạn đã bị <strong>từ chối</strong>.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p><strong>Lý do:</strong> " + (lyDo != null && !lyDo.isEmpty() ? lyDo : "Không được cung cấp") + "</p>" +
                "<p>Nếu bạn muốn thử lại, vui lòng liên hệ với quản trị viên để biết thêm chi tiết.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Reset mật khẩu
     */
    private String buildPasswordResetTemplate(String username, String hoTen, String resetToken) {
        String resetLink = "https://vnkgu.edu.vn/reset-password?token=" + resetToken;
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #007bff;\">Chào " + hoTen + "!</h2>" +
                "<p>Chúng tôi nhận được yêu cầu reset mật khẩu cho tài khoản của bạn.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p><a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 3px;\">Reset mật khẩu</a></p>" +
                "<p style=\"color: #666; font-size: 12px;\">Link này sẽ hết hạn trong 1 giờ. Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Mật khẩu đã thay đổi
     */
    private String buildPasswordChangedTemplate(String username, String hoTen) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #28a745;\">Chào " + hoTen + "!</h2>" +
                "<p>Mật khẩu của tài khoản đã được <strong>thay đổi</strong> thành công.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với quản trị viên ngay lập tức.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Vai trò thay đổi
     */
    private String buildRoleChangeTemplate(String username, String hoTen, String vaiTro) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #007bff;\">Chào " + hoTen + "!</h2>" +
                "<p>Vai trò của tài khoản đã được <strong>thay đổi</strong>.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p><strong>Vai trò mới:</strong> " + vaiTro + "</p>" +
                "<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Template: Tài khoản bị vô hiệu
     */
    private String buildAccountDeactivatedTemplate(String username, String hoTen) {
        return "<html>" +
                "<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;\">" +
                "<h2 style=\"color: #dc3545;\">Chào " + hoTen + "!</h2>" +
                "<p>Tài khoản của bạn đã bị <strong>vô hiệu hóa</strong>.</p>" +
                "<p><strong>Tên đăng nhập:</strong> " + username + "</p>" +
                "<p>Bạn không thể đăng nhập vào hệ thống cho đến khi tài khoản được kích hoạt lại. " +
                "Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.</p>" +
                "<hr />" +
                "<p style=\"color: #666; font-size: 12px;\">" +
                "Ngày gửi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                "</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
