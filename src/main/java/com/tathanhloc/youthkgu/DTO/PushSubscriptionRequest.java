package com.tathanhloc.youthkgu.DTO;

import lombok.Data;

/**
 * Payload từ frontend khi đăng ký Web Push.
 * Frontend lấy từ PushSubscription.toJSON() của Push API.
 */
@Data
public class PushSubscriptionRequest {
    private String endpoint;
    private String p256dh;   // keys.p256dh
    private String auth;     // keys.auth
    private String deviceInfo;
}
