package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_log")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SystemLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String action;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "duration_ms") private Long durationMs;
    @Column(name = "entity_id") private String entityId;
    @Column(name = "entity_type") private String entityType;
    @Column(name = "error_details", columnDefinition = "TEXT") private String errorDetails;
    @Column(name = "ip_address") private String ipAddress;
    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", nullable = false)
    private LogLevel logLevel;
    @Column(nullable = false, columnDefinition = "TEXT") private String message;
    @Column(nullable = false) private String module;
    @Column(name = "new_value", columnDefinition = "TEXT") private String newValue;
    @Column(name = "old_value", columnDefinition = "TEXT") private String oldValue;
    @Column(name = "request_method") private String requestMethod;
    @Column(name = "request_url") private String requestUrl;
    @Column(name = "session_id") private String sessionId;
    private String status;
    @Column(name = "user_agent") private String userAgent;
    @Column(name = "user_id") private String userId;
    @Column(name = "user_name") private String userName;

    public enum LogLevel { TRACE, DEBUG, INFO, WARN, ERROR, FATAL }
}
