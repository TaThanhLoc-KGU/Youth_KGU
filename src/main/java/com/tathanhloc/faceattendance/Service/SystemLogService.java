package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.SystemLogDTO;
import com.tathanhloc.faceattendance.Model.SystemLog;
import com.tathanhloc.faceattendance.Repository.SystemLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemLogService {

    private final SystemLogRepository logRepository;

    // =================== Truy vấn ===================

    public Page<SystemLogDTO> getAllLogs(Pageable pageable) {
        return logRepository.findAll(pageable).map(this::toDTO);
    }

    public SystemLogDTO getLogById(Long id) {
        return logRepository.findById(id).map(this::toDTO).orElse(null);
    }

    /**
     * Tìm kiếm nhật ký theo module, loại thao tác (action), người thực hiện, khoảng thời gian, từ khóa.
     */
    public Page<SystemLogDTO> searchLogs(String module, String action, String userId,
                                         LocalDateTime startTime, LocalDateTime endTime,
                                         String keyword, Pageable pageable) {
        return logRepository.findWithFilters(module, action, userId, startTime, endTime, keyword, pageable)
                            .map(this::toDTO);
    }

    // =================== Ghi log (Async) ===================

    @Async
    public void logInfo(String module, String action, String message) {
        saveLog(SystemLog.LogLevel.INFO, module, action, message, null, null, "SUCCESS");
    }

    @Async
    public void logInfo(String module, String action, String message, String userId, String userName) {
        saveLog(SystemLog.LogLevel.INFO, module, action, message, userId, userName, "SUCCESS");
    }

    @Async
    public void logWarning(String module, String action, String message) {
        saveLog(SystemLog.LogLevel.WARN, module, action, message, null, null, "WARNING");
    }

    @Async
    public void logError(String module, String action, String message, String errorDetails) {
        SystemLog entity = buildBaseLog(SystemLog.LogLevel.ERROR, module, action, message, null, null);
        entity.setErrorDetails(errorDetails);
        entity.setStatus("FAILED");
        logRepository.save(entity);
    }

    @Async
    public void logUserAction(String module, String action, String message,
                              String userId, String userName) {
        saveLog(SystemLog.LogLevel.INFO, module, action, message, userId, userName, "SUCCESS");
    }

    @Async
    public void logAuthentication(String action, String userId, String userName,
                                  boolean success, String details) {
        SystemLog entity = buildBaseLog(
                success ? SystemLog.LogLevel.INFO : SystemLog.LogLevel.WARN,
                "AUTHENTICATION", action, details, userId, userName);
        entity.setStatus(success ? "SUCCESS" : "FAILED");
        logRepository.save(entity);
    }

    @Async
    public void logSystemEvent(String action, String message, SystemLog.LogLevel level) {
        saveLog(level, "SYSTEM", action, message, null, null, "SUCCESS");
    }

    // =================== Thống kê ===================

    public Map<String, Object> getLogStatistics() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime last24h   = now.minus(24, ChronoUnit.HOURS);
        LocalDateTime lastWeek  = now.minus(7,  ChronoUnit.DAYS);
        LocalDateTime lastMonth = now.minus(30, ChronoUnit.DAYS);
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

        stats.put("totalLogs",      logRepository.count());
        stats.put("logsLast24h",    logRepository.countSince(last24h));
        stats.put("logsLastWeek",   logRepository.countSince(lastWeek));
        stats.put("logsLastMonth",  logRepository.countSince(lastMonth));
        stats.put("logsToday",      logRepository.countSince(todayStart));
        stats.put("failedLast24h",  logRepository.countFailedSince(last24h));

        // Phân loại theo module (top 10)
        List<Object[]> moduleRaw = logRepository.countByModule();
        Map<String, Long> moduleStats = moduleRaw.stream()
                .limit(10)
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));
        stats.put("moduleStats", moduleStats);

        // Phân loại theo loại thao tác
        List<Object[]> actionRaw = logRepository.countByAction();
        Map<String, Long> actionStats = actionRaw.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));
        stats.put("actionStats", actionStats);

        // Top 5 người dùng hoạt động nhất
        List<Object[]> topUsersRaw = logRepository.getTopUsers(PageRequest.of(0, 5));
        List<Map<String, Object>> topUsers = topUsersRaw.stream().map(r -> {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("userId",   r[0]);
            u.put("userName", r[1]);
            u.put("count",    r[2]);
            return u;
        }).collect(Collectors.toList());
        stats.put("topUsers", topUsers);

        return stats;
    }

    // =================== Bảo trì ===================

    public void cleanupOldLogs(int daysToKeep) {
        LocalDateTime cutoff = LocalDateTime.now().minus(daysToKeep, ChronoUnit.DAYS);
        logRepository.deleteOldLogs(cutoff);
        logInfo("SYSTEM", "LOG_CLEANUP",
                "Đã xóa nhật ký cũ hơn " + daysToKeep + " ngày");
    }

    // =================== Private helpers ===================

    private void saveLog(SystemLog.LogLevel level, String module, String action, String message,
                         String userId, String userName, String status) {
        SystemLog entity = buildBaseLog(level, module, action, message, userId, userName);
        entity.setStatus(status);
        logRepository.save(entity);
    }

    private SystemLog buildBaseLog(SystemLog.LogLevel level, String module, String action,
                                   String message, String userId, String userName) {
        SystemLog entity = SystemLog.builder()
                .logLevel(level)
                .module(module)
                .action(action)
                .message(message)
                .userId(userId)
                .userName(userName)
                .build();

        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                entity.setIpAddress(getClientIp(req));
            }
        } catch (Exception ignored) {}

        return entity;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp;
        return request.getRemoteAddr();
    }

    // =================== DTO Conversion ===================

    private SystemLogDTO toDTO(SystemLog entity) {
        SystemLogDTO dto = SystemLogDTO.builder()
                .id(entity.getId())
                .logLevel(entity.getLogLevel())
                .module(entity.getModule())
                .action(entity.getAction())
                .message(entity.getMessage())
                .userId(entity.getUserId())
                .userName(entity.getUserName())
                .ipAddress(entity.getIpAddress())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .errorDetails(entity.getErrorDetails())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();

        dto.setLogLevelDisplay(entity.getLogLevel() != null ? entity.getLogLevel().name() : "INFO");
        dto.setStatusDisplay(entity.getStatus() != null ? entity.getStatus() : "SUCCESS");
        dto.setTimeAgo(buildTimeAgo(entity.getCreatedAt()));
        dto.setShortMessage(entity.getMessage() != null && entity.getMessage().length() > 120
                ? entity.getMessage().substring(0, 120) + "..."
                : entity.getMessage());
        return dto;
    }

    private String buildTimeAgo(LocalDateTime dt) {
        if (dt == null) return "";
        long minutes = ChronoUnit.MINUTES.between(dt, LocalDateTime.now());
        if (minutes < 1)    return "Vừa xong";
        if (minutes < 60)   return minutes + " phút trước";
        if (minutes < 1440) return (minutes / 60) + " giờ trước";
        return (minutes / 1440) + " ngày trước";
    }
}
