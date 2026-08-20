package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lượt thích bài viết eNews — dedup theo username (đã đăng nhập)
 * hoặc device_id (ẩn danh, UUID sinh phía client lưu localStorage).
 */
@Entity
@Table(name = "tin_tuc_luot_thich")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinTucLuotThich {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tin_tuc_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TinTuc tinTuc;

    /** FK mềm -> tai_khoan.username. NULL = thích ẩn danh. */
    @Column(name = "username", length = 50)
    private String username;

    /** UUID sinh phía client (localStorage). NULL nếu đã đăng nhập. */
    @Column(name = "device_id", length = 100)
    private String deviceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
