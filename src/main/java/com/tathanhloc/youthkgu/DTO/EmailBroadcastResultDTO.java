package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailBroadcastResultDTO {
    private int tongSoNguoiNhan;
    private int guiThanhCong;
    private int guiThatBai;
    private List<String> diaChiThatBai;
}
