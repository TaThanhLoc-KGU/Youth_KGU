package com.tathanhloc.faceattendance.Util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // 🔑 Tạo password cho tài khoản admin
        String plainPassword = "admin1234";  // ← Password gốc để ĐĂNG NHẬP
        String hashedPassword = encoder.encode(plainPassword);

        System.out.println("===================================");
        System.out.println("📝 THÔNG TIN TẠO TÀI KHOẢN");
        System.out.println("===================================");
        System.out.println("Username: admin");
        System.out.println("Password gốc (để login): " + plainPassword);
        System.out.println("Password hash (để insert DB): " + hashedPassword);
        System.out.println();

        // ✅ SQL để XÓA tài khoản cũ (nếu có)
        System.out.println("--- BƯỚC 1: XÓA TÀI KHOẢN CŨ (nếu có) ---");
        System.out.println("DELETE FROM taikhoan WHERE username = 'admin';");
        System.out.println();

        // ✅ SQL để TẠO TÀI KHOẢN MỚI
        System.out.println("--- BƯỚC 2: TẠO TÀI KHOẢN MỚI ---");
        System.out.println("INSERT INTO taikhoan (username, password_hash, vai_tro, is_active, created_at, ma_sv, ma_gv)");
        System.out.println("VALUES ('admin', '" + hashedPassword + "', 'ADMIN', 1, NOW(), NULL, NULL);");
        System.out.println();

        System.out.println("--- KIỂM TRA TÀI KHOẢN ĐÃ TẠO ---");
        System.out.println("SELECT id, username, vai_tro, is_active FROM taikhoan WHERE username = 'admin';");
        System.out.println();

        System.out.println("===================================");
        System.out.println("✅ CÁCH ĐĂNG NHẬP:");
        System.out.println("===================================");
        System.out.println("Username: admin");
        System.out.println("Password: " + plainPassword);  // ← ĐĂNG NHẬP BẰNG PASSWORD NÀY
    }
}