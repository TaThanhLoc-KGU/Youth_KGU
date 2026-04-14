package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cau_hinh_email")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CauHinhEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "smtp_host", nullable = false)
    private String smtpHost;

    @Column(name = "smtp_port", nullable = false)
    private Integer smtpPort;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "mat_khau", nullable = false)
    private String matKhau;

    @Column(name = "from_address", nullable = false)
    private String fromAddress;

    @Column(name = "from_name", nullable = false)
    private String fromName;

    @Column(name = "tls_enabled")
    private Boolean tlsEnabled;

    @Column(name = "ssl_enabled")
    private Boolean sslEnabled;

    @Column(name = "kich_hoat")
    private Boolean kichHoat;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;
}
