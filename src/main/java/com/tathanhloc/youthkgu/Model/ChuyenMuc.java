package com.tathanhloc.youthkgu.Model;

import com.tathanhloc.youthkgu.Enum.ToChucEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chuyen_muc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChuyenMuc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String ten;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(name = "full_path_slug", nullable = false, unique = true, length = 1000)
    private String fullPathSlug;

    @Column(name = "duong_dan", nullable = false, length = 1000)
    private String duongDan;   // "1/2/3" — dùng LIKE query để lấy toàn subtree

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ChuyenMuc parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @OrderBy("thuTu ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ChuyenMuc> children;

    @Column(nullable = false)
    @Builder.Default
    private Integer cap = 1;

    @Column(length = 500)
    private String moTa;

    @Column(name = "mau_sac", length = 20)
    private String mauSac;

    @Column(length = 50)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_chuc", length = 20)
    private ToChucEnum toChuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ban_id", referencedColumnName = "ma_ban")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Ban ban;

    @Column(name = "thu_tu")
    @Builder.Default
    private Integer thuTu = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
