package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lưu Web Push Subscription của từng thiết bị trình duyệt.
 * Mỗi user có thể có nhiều subscription (laptop, điện thoại, Chrome, Firefox…).
 * Chỉ những user có ít nhất 1 subscription active mới nhận được push notification.
 */
@Entity
@Table(name = "push_subscriptions",
        uniqueConstraints = @UniqueConstraint(columnNames = "endpoint"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Username / maSv — khớp với Notification.userId */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /** Push endpoint URL do trình duyệt cấp (duy nhất per device+browser) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    /** Encryption key p256dh (Base64url) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    /** Auth secret (Base64url) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String auth;

    /** User-Agent tóm tắt để admin nhận biết thiết bị */
    @Column(name = "device_info")
    private String deviceInfo;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Cập nhật mỗi lần gửi thành công */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
}
