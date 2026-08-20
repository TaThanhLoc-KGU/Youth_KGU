package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Đăng ký nhận Web Push (chuẩn RFC 8030/8291/8292 — VAPID) của một thiết bị/trình duyệt.
 * Một username có thể có nhiều subscription (nhiều thiết bị/trình duyệt khác nhau).
 * endpoint là duy nhất — mỗi thiết bị/trình duyệt chỉ có 1 endpoint tại 1 thời điểm,
 * nếu user đăng nhập tài khoản khác trên cùng thiết bị thì upsert lại username cho endpoint đó.
 */
@Entity
@Table(name = "push_subscription")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Username (tai_khoan.username) sở hữu subscription này — FK mềm, không ràng buộc cứng. */
    @Column(name = "username", nullable = false, length = 50)
    private String username;

    /** URL endpoint duy nhất do trình duyệt cấp (FCM/Mozilla/Apple Push...). */
    @Column(name = "endpoint", nullable = false, unique = true, length = 1000)
    private String endpoint;

    /** Khóa công khai P-256 của client (base64url) — dùng để mã hóa payload theo RFC 8291. */
    @Column(name = "p256dh", nullable = false, length = 255)
    private String p256dh;

    /** Auth secret của client (base64url) — dùng để mã hóa payload theo RFC 8291. */
    @Column(name = "auth", nullable = false, length = 255)
    private String auth;

    /** User-Agent của trình duyệt tại thời điểm đăng ký — chỉ để tham khảo/debug. */
    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
