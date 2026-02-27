package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.util.List;

/**
 * DTO trả về từ endpoint GET /api/public/resolve?path=...
 * type: "POST" | "CATEGORY" | "REDIRECT" | "NOT_FOUND"
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveResultDTO {
    private String type;                    // POST | CATEGORY | REDIRECT | NOT_FOUND
    private TinTucDetailDTO post;           // nếu type = POST
    private ChuyenMucDTO category;          // nếu type = CATEGORY
    private List<TinTucDTO> posts;          // nếu type = CATEGORY — trang đầu bài viết
    private long totalPosts;               // tổng số bài nếu CATEGORY
    private String redirectTo;             // nếu type = REDIRECT
}
