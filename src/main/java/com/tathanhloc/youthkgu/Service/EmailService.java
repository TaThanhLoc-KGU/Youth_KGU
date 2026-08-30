package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Model.HoatDong;
import com.tathanhloc.youthkgu.Model.SinhVien;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service để gửi email thông báo.
 * Kiểm tra CauHinhEmailService.isEmailEnabled() trước khi gửi:
 *   false → chỉ log console (mock), true → gửi thật qua SMTP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender              mailSender;
    private final CauHinhEmailService         cauHinhEmailService;
    private final DiemRenLuyenCriteriaService criteriaService;
    private final ZaloService                 zaloService;

    @Value("${app.name:Hệ thống Quản lý Hoạt động Đoàn - Hội}")
    private String appName;

    /**
     * Gửi email đăng ký thành công
     * @param email Email người dùng
     * @param username Tên đăng nhập
     * @param hoTen Họ tên
     */
    public void sendRegistrationSuccessEmail(String email, String username, String hoTen) {
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email đăng ký thành công → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email phê duyệt tài khoản → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email từ chối tài khoản → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email reset mật khẩu → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email thay đổi mật khẩu → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email thay đổi vai trò → {} ({})", hoTen, email);
            return;
        }
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
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email vô hiệu tài khoản → {} ({})", hoTen, email);
            return;
        }
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
     * Gửi thông báo hoạt động đến sinh viên.
     */
    public void sendHoatDongNotification(String email, String hoTen, HoatDong hoatDong) {
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Thông báo hoạt động '{}' → {} ({})", hoatDong.getTenHoatDong(), hoTen, email);
            return;
        }
        String subject = "📢 Hoạt động mới: " + hoatDong.getTenHoatDong();
        String html = buildHoatDongNotificationTemplate(hoTen, hoatDong);
        try {
            sendHtmlEmail(email, subject, html);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo hoạt động cho {}: {}", email, e.getMessage());
        }
    }

    /**
     * Gửi danh sách tham gia (PDF đính kèm) sau khi ban hành.
     */
    public void sendDanhSachBanHanh(String email, String hoTen,
                                     String tenHoatDong, byte[] pdfBytes, String tenFile) {
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Gửi danh sách ban hành '{}' → {} ({})", tenHoatDong, hoTen, email);
            return;
        }
        String subject = "Danh sách tham gia hoạt động: " + tenHoatDong;
        String html = buildDanhSachBanHanhTemplate(hoTen, tenHoatDong);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(cauHinhEmailService.getFromAddress(), cauHinhEmailService.getFromName());
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.addAttachment(tenFile, new ByteArrayResource(pdfBytes));
            mailSender.send(message);
            log.info("Gửi danh sách ban hành cho: {}", email);
        } catch (Exception e) {
            log.error("Lỗi gửi danh sách ban hành cho {}: {}", email, e.getMessage());
        }
    }

    /**
     * Gửi 1 email nội dung HTML TỰ DO (subject/body do người gọi truyền vào nguyên văn) —
     * dùng cho tính năng soạn & gửi email hàng loạt (EmailBroadcastService), khác với các
     * hàm sendXxxEmail() ở trên vốn build sẵn nội dung theo template cố định.
     * Trả về true/false thay vì nuốt exception, để caller đếm được số gửi thành công/thất bại.
     */
    public boolean sendCustomEmail(String to, String subject, String htmlBody) {
        if (!cauHinhEmailService.isEmailEnabled()) {
            log.info("[MOCK] Email tùy chỉnh '{}' → {}", subject, to);
            return true;
        }
        try {
            sendHtmlEmail(to, subject, htmlBody);
            return true;
        } catch (Exception e) {
            log.error("Lỗi gửi email tùy chỉnh cho {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Gửi email HTML — dùng from address/name từ DB config.
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(cauHinhEmailService.getFromAddress(), cauHinhEmailService.getFromName());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    // ─── HTML Templates ───────────────────────────────────────────────────────

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

    private String buildHoatDongNotificationTemplate(String hoTen, HoatDong hd) {
        // Ngày & giờ
        String ngay = hd.getNgayToChuc() != null
                ? hd.getNgayToChuc().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—";
        String ngayKetThuc = hd.getNgayKetThuc() != null
                ? " – " + hd.getNgayKetThuc().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
        String gio = hd.getGioToChuc() != null
                ? hd.getGioToChuc().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) : "—";
        String diaDiem = hd.getDiaDiem() != null && !hd.getDiaDiem().isBlank() ? hd.getDiaDiem() : "—";
        String moTa    = hd.getMoTa()    != null && !hd.getMoTa().isBlank()    ? hd.getMoTa()    : "—";

        // Điểm rèn luyện
        String diemRLBlock = "";
        if (hd.getDiemRenLuyen() != null && hd.getDiemRenLuyen() > 0) {
            String tenDanhMuc = "";
            String tenTieuChi = "";
            if (hd.getMaDanhMucRenLuyen() != null) {
                tenDanhMuc = criteriaService.findDanhMuc(hd.getMaDanhMucRenLuyen())
                        .map(dm -> "Mục " + dm.get("id") + " — " + dm.get("danh_muc"))
                        .orElse("Mục " + hd.getMaDanhMucRenLuyen());
            }
            if (hd.getMaTieuChiRenLuyen() != null) {
                tenTieuChi = criteriaService.findTieuChi(hd.getMaTieuChiRenLuyen())
                        .map(tc -> "Tiêu chí " + tc.get("id") + ": " + tc.get("noi_dung"))
                        .orElse("Tiêu chí " + hd.getMaTieuChiRenLuyen());
            }
            diemRLBlock = """
                <tr style="background:#f0fdf4;">
                  <td style="padding:10px 12px;font-weight:600;color:#166534;white-space:nowrap;">🏆 Điểm rèn luyện</td>
                  <td style="padding:10px 12px;">
                    <span style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:18px;padding:4px 14px;border-radius:20px;margin-right:8px;">+%s điểm</span>
                    %s
                    %s
                  </td>
                </tr>
                """.formatted(
                        hd.getDiemRenLuyen(),
                        tenDanhMuc.isBlank() ? "" : "<br><span style='font-size:13px;color:#15803d;'>" + tenDanhMuc + "</span>",
                        tenTieuChi.isBlank() ? "" : "<br><span style='font-size:12px;color:#6b7280;'>" + tenTieuChi + "</span>"
                );
        }

        String soLuong = hd.getSoLuongToiDa() != null
                ? "<tr><td style='padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;'>👥 Số lượng</td>"
                  + "<td style='padding:10px 12px;'>" + hd.getSoLuongToiDa() + " sinh viên</td></tr>"
                : "";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:620px;margin:32px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

              <!-- Header -->
              <div style="background:linear-gradient(135deg,#1d4ed8 0%%,#2563eb 50%%,#0284c7 100%%);padding:32px 28px 24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="background:rgba(255,255,255,0.2);border-radius:50%%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:24px;text-align:center;line-height:48px;">📢</div>
                  <div>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Đoàn Trường ĐH Kiên Giang</p>
                    <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700;">Hoạt động mới mở đăng ký!</h1>
                  </div>
                </div>
              </div>

              <!-- Greeting -->
              <div style="background:#fff;padding:24px 28px 0;">
                <p style="margin:0 0 4px;color:#374151;font-size:15px;">Kính gửi <strong style="color:#1d4ed8;">%s</strong>,</p>
                <p style="margin:0;color:#6b7280;font-size:14px;">Có một hoạt động Đoàn - Hội mới dành cho bạn. Hãy đăng ký tham gia ngay!</p>
              </div>

              <!-- Activity name banner -->
              <div style="background:#fff;padding:16px 28px 0;">
                <div style="background:linear-gradient(90deg,#eff6ff,#dbeafe);border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Tên hoạt động</p>
                  <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#1e40af;">%s</p>
                </div>
              </div>

              <!-- Details table -->
              <div style="background:#fff;padding:20px 28px;">
                <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;width:38%%;">📅 Ngày tổ chức</td>
                    <td style="padding:10px 12px;color:#111827;"><strong>%s%s</strong></td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;">⏰ Giờ bắt đầu</td>
                    <td style="padding:10px 12px;color:#111827;"><strong>%s</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;">📍 Địa điểm</td>
                    <td style="padding:10px 12px;color:#111827;">%s</td>
                  </tr>
                  %s
                  %s
                </table>
              </div>

              <!-- Mô tả -->
              <div style="background:#fff;padding:0 28px 20px;">
                <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">📝 Mô tả hoạt động</p>
                  <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7;">%s</p>
                </div>
              </div>

              <!-- CTA -->
              <div style="background:#fff;padding:4px 28px 28px;text-align:center;">
                <a href="%s"
                   style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(37,99,235,0.35);">
                  🚀 Mở Zalo Mini App để đăng ký ngay
                </a>
                <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Hoặc truy cập: tuoitre.vnkgu.edu.vn/login</p>
              </div>

              <!-- Footer -->
              <div style="background:#1e293b;padding:20px 28px;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">Email này được gửi tự động từ hệ thống Đoàn Trường ĐH Kiên Giang.</p>
                <p style="margin:6px 0 0;color:#64748b;font-size:11px;">Vui lòng không trả lời email này.</p>
              </div>

            </div>
            </body></html>
            """.formatted(hoTen, hd.getTenHoatDong(), ngay, ngayKetThuc, gio, diaDiem, diemRLBlock, soLuong, moTa,
                zaloService.miniAppLink("activities/" + hd.getMaHoatDong()));
    }

    /**
     * Gửi email thông báo hoạt động mới đến danh sách sinh viên (async, không block thread tạo HĐ).
     */
    @Async
    public void sendBulkHoatDongNotification(List<SinhVien> sinhViens, HoatDong hoatDong) {
        if (sinhViens == null || sinhViens.isEmpty()) return;
        int sent = 0;
        for (SinhVien sv : sinhViens) {
            String target = sv.getEmail();
            if (target == null || target.isBlank()) continue;
            try {
                sendHoatDongNotification(target, sv.getHoTen(), hoatDong);
                sent++;
            } catch (Exception e) {
                log.warn("Không gửi được email HĐ cho {}: {}", target, e.getMessage());
            }
        }
        log.info("Đã gửi thông báo hoạt động '{}' đến {}/{} sinh viên", hoatDong.getTenHoatDong(), sent, sinhViens.size());
    }

    private String buildDanhSachBanHanhTemplate(String hoTen, String tenHoatDong) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:24px;border-radius:8px 8px 0 0;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Danh sách tham gia đã ban hành</h1>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
                <p>Kính gửi <strong>%s</strong>,</p>
                <p>Danh sách sinh viên tham gia hoạt động <strong>"%s"</strong> đã được ký số và ban hành chính thức.</p>
                <p>Vui lòng xem file PDF đính kèm.</p>
                <p style="color:#6b7280;font-size:12px;margin-top:24px;">Email này được gửi tự động từ hệ thống Đoàn Trường ĐH Kiên Giang.</p>
              </div>
            </div>
            """.formatted(hoTen, tenHoatDong);
    }
}
