package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Model.SystemLog;
import com.tathanhloc.youthkgu.Repository.SystemLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service @Slf4j @RequiredArgsConstructor
public class SystemLogService {
    private final SystemLogRepository repo;

    @Async
    public void log(String module, String action, String userId, String userName,
                    String entityType, String entityId, String message,
                    SystemLog.LogLevel level, String status,
                    String oldValue, String newValue,
                    HttpServletRequest request) {
        try {
            String ipAddress = null;
            String userAgent = null;
            String requestMethod = null;
            String requestUrl = null;

            // Request access may fail in async threads - always wrap with try-catch
            try {
                if (request != null) {
                    ipAddress = getClientIp(request);
                    userAgent = request.getHeader("User-Agent");
                    requestMethod = request.getMethod();
                    requestUrl = request.getRequestURI();
                } else {
                    ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                    if (attributes != null) {
                        HttpServletRequest currentRequest = attributes.getRequest();
                        ipAddress = getClientIp(currentRequest);
                        userAgent = currentRequest.getHeader("User-Agent");
                        requestMethod = currentRequest.getMethod();
                        requestUrl = currentRequest.getRequestURI();
                    }
                }
            } catch (IllegalStateException e) {
                // HttpServletRequest proxy is not accessible from async thread - skip request info
            }

            SystemLog entry = SystemLog.builder()
                .module(module).action(action)
                .userId(userId).userName(userName)
                .entityType(entityType).entityId(entityId)
                .message(message).logLevel(level).status(status)
                .oldValue(oldValue).newValue(newValue)
                .createdAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestMethod(requestMethod)
                .requestUrl(requestUrl)
                .build();
            repo.save(entry);
        } catch (Exception e) {
            log.error("Lỗi ghi system log", e);
        }
    }

    // Overload cho 8 tham số (thường dùng cho login/logout)
    @Async
    public void log(String module, String action, String userId, String userName,
                    String message, SystemLog.LogLevel level, String status,
                    HttpServletRequest request) {
        log(module, action, userId, userName, null, null, message, level, status, null, null, request);
    }

    // Overload không có request (dùng cho background job)
    @Async
    public void log(String module, String action, String userId, String userName,
                    String message, SystemLog.LogLevel level, String status) {
        log(module, action, userId, userName, null, null, message, level, status, null, null, null);
    }

    // --- CÁC PHƯƠNG THỨC TƯƠNG THÍCH VỚI AutoLogUtil VÀ LoggingAspect ---

    @Async
    public void logUserAction(String module, String action, String message, String userId, String userName) {
        log(module, action, userId, userName, message, SystemLog.LogLevel.INFO, "SUCCESS");
    }

    @Async
    public void logError(String module, String action, String errorMessage, String userId) {
        log(module, action, userId, null, errorMessage, SystemLog.LogLevel.ERROR, "FAILED");
    }

    @Async
    public void logSystemEvent(String action, String message, SystemLog.LogLevel level) {
        log("SYSTEM", action, "SYSTEM", "SYSTEM", message, level, "INFO");
    }

    @Async
    public void logAuthentication(String action, String userId, String userName, boolean success, String message) {
        log("AUTHENTICATION", action, userId, userName, message,
                success ? SystemLog.LogLevel.INFO : SystemLog.LogLevel.WARN,
                success ? "SUCCESS" : "FAILED");
    }

    // --------------------------------------------------

    public Page<SystemLog> search(String module, String action, String userId,
                                  String logLevel, String status,
                                  String from, String to, int page, int size) {
        // Convert empty strings to null so JPQL IS NULL checks work correctly
        module = (module != null && !module.isBlank()) ? module : null;
        action = (action != null && !action.isBlank()) ? action : null;
        userId = (userId != null && !userId.isBlank()) ? userId : null;
        status = (status != null && !status.isBlank()) ? status : null;
        SystemLog.LogLevel level = (logLevel != null && !logLevel.isBlank()) ? SystemLog.LogLevel.valueOf(logLevel) : null;
        LocalDateTime fromDt = (from != null && !from.isBlank()) ? LocalDateTime.parse(from) : null;
        LocalDateTime toDt = (to != null && !to.isBlank()) ? LocalDateTime.parse(to) : null;
        return repo.search(module, action, userId, level, status, fromDt, toDt,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String ip = request.getHeader("X-Forwarded-For");
        return (ip != null && !ip.isEmpty()) ? ip.split(",")[0] : request.getRemoteAddr();
    }
}
