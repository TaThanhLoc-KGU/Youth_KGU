package com.tathanhloc.youthkgu.DTO;

import lombok.*;

import java.util.List;

/**
 * Yêu cầu gửi email hàng loạt — người nhận là các NHÓM MAIL đã lưu (groupIds) và/hoặc
 * địa chỉ email gõ tay thêm (extraEmails, cho trường hợp gửi một lần không muốn lưu nhóm).
 * Mỗi địa chỉ (nhóm hoặc lẻ) nhận 1 email riêng — xem EmailBroadcastService.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailBroadcastRequest {
    private List<Long> groupIds;
    private List<String> extraEmails;
    private String subject;
    private String body;
}
