package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.util.List;

/**
 * DTO dạng cây để render Tree Picker và menu điều hướng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChuyenMucTreeDTO {
    private Long id;
    private String ten;
    private String slug;
    private String fullPathSlug;
    private String mauSac;
    private String icon;
    private String toChuc;
    private Integer cap;
    private Integer thuTu;
    private Boolean isActive;
    private List<ChuyenMucTreeDTO> children;
}
