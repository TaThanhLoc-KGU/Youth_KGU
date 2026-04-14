package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.time.LocalDate;

/**
 * DTO gọn cho ô autocomplete khi tạo/sửa bài đăng — tìm và gắn văn bản vào bài.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VanBanSearchResultDTO {
    private Long id;
    private String soHieu;
    private String trichYeu;
    private LocalDate ngayBanHanh;
    private String loaiVanBan;
    private String tenFile;
    private Long kichThuocFile;
}
