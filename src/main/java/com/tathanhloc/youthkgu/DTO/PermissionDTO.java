package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO {
    private Long id;
    private String category;
    private String description;
    private String name;
}
