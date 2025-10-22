package com.tathanhloc.faceattendance.Config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "admin@1234";
        String hash = "$2a$10$N9qo8uLOickgx2ZMRZoMye7I4VqICkJ/kzJ8E8T5XoYDe0KBLmzGu";

        boolean matches = encoder.matches(password, hash);
        System.out.println("Password matches: " + matches);

        // Tạo hash mới để so sánh
        String newHash = encoder.encode(password);
        System.out.println("New hash: " + newHash);
    }
}
