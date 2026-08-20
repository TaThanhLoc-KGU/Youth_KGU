package com.tathanhloc.youthkgu.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GopYCreateRequest {
    private String tieuDe;
    private String noiDung;
    private String loai; // PHAN_ANH | GOP_Y | KHAC — null = GOP_Y
}
