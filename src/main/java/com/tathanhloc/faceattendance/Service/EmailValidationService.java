package com.tathanhloc.faceattendance.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Service để validate email và kiểm tra domain @vnkgu.edu.vn
 */
@Service
@Slf4j
public class EmailValidationService {

    private static final String VALID_EMAIL_DOMAIN = "vnkgu.edu.vn";
    private static final String EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@vnkgu\\.edu\\.vn$";
    private static final Pattern pattern = Pattern.compile(EMAIL_PATTERN);

    /**
     * Kiểm tra email có hợp lệ không (phải là @vnkgu.edu.vn)
     * @param email Email cần kiểm tra
     * @return true nếu email hợp lệ, false nếu không
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.warn("Email trống");
            return false;
        }

        boolean isValid = pattern.matcher(email.toLowerCase()).matches();

        if (!isValid) {
            log.warn("Email không hợp lệ: {}", email);
        }

        return isValid;
    }

    /**
     * Kiểm tra email có thuộc domain @vnkgu.edu.vn không
     * @param email Email cần kiểm tra
     * @return true nếu email có domain @vnkgu.edu.vn
     */
    public boolean isVNKGUEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String domain = extractDomain(email);
        return VALID_EMAIL_DOMAIN.equalsIgnoreCase(domain);
    }

    /**
     * Trích xuất domain từ email
     * @param email Email cần trích xuất
     * @return Domain của email
     */
    public String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }

        return email.substring(email.indexOf("@") + 1).toLowerCase();
    }

    /**
     * Trích xuất phần tên người dùng từ email
     * @param email Email cần trích xuất
     * @return Phần tên người dùng (trước @)
     */
    public String extractUsername(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }

        return email.substring(0, email.indexOf("@")).toLowerCase();
    }

    /**
     * Kiểm tra xem email có phải là sinh viên không (nếu có định dạng sinh viên)
     * Giả sử email sinh viên có định dạng như: sv_mssv@vnkgu.edu.vn hoặc sv+mssv@vnkgu.edu.vn
     * @param email Email cần kiểm tra
     * @return true nếu là email sinh viên
     */
    public boolean isStudentEmail(String email) {
        if (!isValidEmail(email)) {
            return false;
        }

        String username = extractUsername(email);
        return username.startsWith("sv_") || username.startsWith("sv+");
    }

    /**
     * Kiểm tra xem email có phải là giảng viên không
     * @param email Email cần kiểm tra
     * @return true nếu là email giảng viên
     */
    public boolean isTeacherEmail(String email) {
        if (!isValidEmail(email)) {
            return false;
        }

        String username = extractUsername(email);
        return username.startsWith("gv_") || username.startsWith("gv+");
    }

    /**
     * Trích xuất mã số (nếu có) từ email
     * @param email Email cần trích xuất
     * @return Mã số từ email (ví dụ: nếu email là sv_12345@vnkgu.edu.vn thì trả về 12345)
     */
    public String extractStudentId(String email) {
        if (!isValidEmail(email)) {
            return "";
        }

        String username = extractUsername(email);

        // Tìm các ký tự số trong username
        String digits = username.replaceAll("\\D", "");
        return digits.isEmpty() ? "" : digits;
    }

    /**
     * Validate email format với thông báo lỗi chi tiết
     * @param email Email cần kiểm tra
     * @return Thông báo lỗi (rỗng nếu không có lỗi)
     */
    public String validateEmailWithMessage(String email) {
        if (email == null || email.trim().isEmpty()) {
            return "Email không được để trống";
        }

        if (!email.contains("@")) {
            return "Email phải chứa ký tự @";
        }

        String domain = extractDomain(email);
        if (!VALID_EMAIL_DOMAIN.equalsIgnoreCase(domain)) {
            return "Email phải sử dụng domain @vnkgu.edu.vn";
        }

        if (!pattern.matcher(email.toLowerCase()).matches()) {
            return "Định dạng email không hợp lệ";
        }

        return ""; // Không có lỗi
    }
}
