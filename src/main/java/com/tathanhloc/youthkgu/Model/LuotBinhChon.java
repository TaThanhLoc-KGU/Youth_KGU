package com.tathanhloc.youthkgu.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "luot_binh_chon")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuotBinhChon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thi_sinh_id", nullable = false)
    private ThiSinh thiSinh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuoc_thi_id", nullable = false)
    private CuocThi cuocThi;

    @Column(name = "nguoi_vote_ma", length = 50)
    private String nguoiVoteMa;

    @Column(name = "nguoi_vote_ip", length = 45)
    private String nguoiVoteIp;

    @Column(name = "nguoi_vote_device_id", length = 100)
    private String nguoiVoteDeviceId;

    @Column(name = "ngay_vote", nullable = false)
    private LocalDate ngayVote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
