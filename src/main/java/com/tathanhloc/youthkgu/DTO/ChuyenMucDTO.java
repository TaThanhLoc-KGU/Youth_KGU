package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChuyenMucDTO {
    private Long id;
    private String ten;
    private String slug;
    private String fullPathSlug;
    private String duongDan;
    private Long parentId;
    private String tenParent;
    private Integer cap;
    private String moTa;
    private String mauSac;
    private String icon;
    private String toChuc;
    private String banId;
    private String tenBan;
    private Integer thuTu;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
