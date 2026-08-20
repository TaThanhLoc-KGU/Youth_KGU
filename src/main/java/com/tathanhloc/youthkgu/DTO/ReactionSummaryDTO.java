package com.tathanhloc.youthkgu.DTO;

import lombok.*;

/** Tổng hợp trạng thái tương tác của 1 bài viết — dùng cho LikeShareBar. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionSummaryDTO {
    private Integer luotThich;
    private Integer luotBinhLuan;
    private Integer luotChiaSe;
    private boolean daThich;
    private boolean khoaBinhLuan;
}
