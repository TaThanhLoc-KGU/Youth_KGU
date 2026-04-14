package com.tathanhloc.youthkgu;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import java.time.LocalDateTime;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableWebSocketMessageBroker
public class YouthKGUApplication {

    public static void main(String[] args) {
        // Cho phép %2F (encoded slash) trong URL path — cần thiết khi mã hoạt động có dấu /
        System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");
        SpringApplication.run(YouthKGUApplication.class, args);
    }


    @Bean
    CommandLineRunner initAdmin(TaiKhoanRepository taiKhoanRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            TaiKhoan admin = taiKhoanRepository.findByUsername("admin").orElse(null);

            if (admin == null) {
                admin = TaiKhoan.builder()
                        .username("admin")
                        .vaiTro(VaiTroEnum.QUAN_LY)
                        .laAdmin(true)
                        .createdAt(LocalDateTime.now())
                        .build();
            }
            // Luôn cập nhật mật khẩu và trạng thái hoạt động
            admin.setPasswordHash(passwordEncoder.encode("admin@123"));
            admin.setIsActive(true);
            // Đảm bảo email không trống để tránh lỗi validation
            if (admin.getEmail() == null || admin.getEmail().isEmpty()) {
                admin.setEmail("admin@gmail.com");
            }
            taiKhoanRepository.save(admin);
            System.out.println("✅ Admin account created/updated successfully!");
        };
    }


}
