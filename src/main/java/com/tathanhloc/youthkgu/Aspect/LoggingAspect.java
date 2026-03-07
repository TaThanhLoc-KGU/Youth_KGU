package com.tathanhloc.youthkgu.Aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.Service.SystemLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
// Authentication và JoinPoint vẫn dùng cho getCurrentUserInfo() và logDataOperation()
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LoggingAspect {

    private final SystemLogService logService;
    private final ObjectMapper objectMapper;

    // Mapping tên Service → mã module dùng trong log
    private static final Map<String, String> MODULE_CODES = new HashMap<>();
    // Mapping tên Service → tên tiếng Việt để hiển thị trong message
    private static final Map<String, String> MODULE_LABELS = new HashMap<>();

    static {
        MODULE_CODES.put("HoatDong",            "HOAT_DONG");
        MODULE_CODES.put("SinhVien",             "SINH_VIEN");
        MODULE_CODES.put("TaiKhoan",             "TAI_KHOAN");
        MODULE_CODES.put("GiangVien",            "GIANG_VIEN");
        MODULE_CODES.put("ChucVu",               "CHUC_VU");
        MODULE_CODES.put("Khoa",                 "KHOA");
        MODULE_CODES.put("Lop",                  "LOP");
        MODULE_CODES.put("Ban",                  "BAN");
        MODULE_CODES.put("BCHDoanHoi",           "BCH");
        MODULE_CODES.put("DiemDanh",             "DIEM_DANH");
        MODULE_CODES.put("DiemDanhHoatDong",     "DIEM_DANH");
        MODULE_CODES.put("DangKyHoatDong",       "DANG_KY");
        MODULE_CODES.put("ChungNhan",            "CHUNG_NHAN");
        MODULE_CODES.put("ChungNhanHoatDong",    "CHUNG_NHAN");
        MODULE_CODES.put("PhanCong",             "PHAN_CONG");
        MODULE_CODES.put("PhanCongDiemDanh",     "PHAN_CONG");
        MODULE_CODES.put("NamHoc",               "NAM_HOC");
        MODULE_CODES.put("HocKy",                "HOC_KY");
        MODULE_CODES.put("HocKyNamHoc",          "HOC_KY");
        MODULE_CODES.put("KhoaHoc",              "KHOA_HOC");
        MODULE_CODES.put("Nganh",                "NGANH");
        MODULE_CODES.put("PhongHoc",             "PHONG_HOC");
        MODULE_CODES.put("ChuyenVien",           "CHUYEN_VIEN");
        MODULE_CODES.put("Settings",             "SETTINGS");
        MODULE_CODES.put("RefreshToken",         "AUTHENTICATION");

        MODULE_LABELS.put("HoatDong",            "hoạt động");
        MODULE_LABELS.put("SinhVien",            "sinh viên");
        MODULE_LABELS.put("TaiKhoan",            "tài khoản");
        MODULE_LABELS.put("GiangVien",           "giảng viên");
        MODULE_LABELS.put("ChucVu",              "chức vụ");
        MODULE_LABELS.put("Khoa",                "khoa");
        MODULE_LABELS.put("Lop",                 "lớp");
        MODULE_LABELS.put("Ban",                 "ban");
        MODULE_LABELS.put("BCHDoanHoi",          "BCH Đoàn - Hội");
        MODULE_LABELS.put("DiemDanh",            "điểm danh");
        MODULE_LABELS.put("DiemDanhHoatDong",    "điểm danh hoạt động");
        MODULE_LABELS.put("DangKyHoatDong",      "đăng ký hoạt động");
        MODULE_LABELS.put("ChungNhan",           "chứng nhận");
        MODULE_LABELS.put("ChungNhanHoatDong",   "chứng nhận hoạt động");
        MODULE_LABELS.put("PhanCong",            "phân công");
        MODULE_LABELS.put("PhanCongDiemDanh",    "phân công điểm danh");
        MODULE_LABELS.put("NamHoc",              "năm học");
        MODULE_LABELS.put("HocKy",               "học kỳ");
        MODULE_LABELS.put("HocKyNamHoc",         "học kỳ - năm học");
        MODULE_LABELS.put("KhoaHoc",             "khóa học");
        MODULE_LABELS.put("Nganh",               "ngành");
        MODULE_LABELS.put("PhongHoc",            "phòng học");
        MODULE_LABELS.put("ChuyenVien",          "chuyên viên");
        MODULE_LABELS.put("Settings",            "phân quyền");
    }

    // =================== Annotation @LogActivity ===================

    /**
     * Đặt trên method cụ thể để log thao tác người dùng một cách tường minh.
     * Ví dụ: @LogActivity(module = "HOAT_DONG", action = "DUYET", description = "Duyệt hoạt động")
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface LogActivity {
        String module() default "";
        String action() default "";
        String description() default "";
        boolean logParameters() default false;
    }

    // =================== AOP: Explicit annotation logging ===================

    @Around("@annotation(logActivity)")
    public Object logAnnotatedMethods(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {
        String className  = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String module      = logActivity.module().isEmpty() ? className : logActivity.module();
        String action      = logActivity.action().isEmpty() ? methodName.toUpperCase() : logActivity.action();
        String baseDesc    = logActivity.description().isEmpty()
                ? String.format("Thực hiện %s", methodName) : logActivity.description();

        String[] userInfo  = getCurrentUserInfo();
        String userId      = userInfo[0];
        String userName    = userInfo[1];
        String displayName = resolveDisplayName(userId, userName);

        String description = baseDesc;
        if (logActivity.logParameters() && joinPoint.getArgs().length > 0) {
            description += " | Tham số: " + serializeParameters(joinPoint.getArgs());
        }

        try {
            Object result = joinPoint.proceed();
            logService.logUserAction(module, action, displayName + " — " + description, userId, userName);
            return result;
        } catch (Exception e) {
            logService.logError(module, action,
                    displayName + " — " + description + " thất bại: " + e.getMessage(),
                    truncateStackTrace(e));
            throw e;
        }
    }

    // NOTE: Authentication logging (LOGIN_SUCCESS / LOGIN_FAILED) được xử lý trực tiếp
    // trong AuthService.login() qua systemLogService.log(...) — không dùng AOP ở đây
    // để tránh ghi trùng log 2–3 lần mỗi lần đăng nhập.

    // =================== AOP: CRUD trên Service layer ===================

    @AfterReturning("execution(* com.tathanhloc.youthkgu.Service.*.create(..))")
    public void logCreateOperations(JoinPoint joinPoint) {
        logDataOperation(joinPoint, "CREATE", "tạo mới");
    }

    @AfterReturning("execution(* com.tathanhloc.youthkgu.Service.*.update(..))")
    public void logUpdateOperations(JoinPoint joinPoint) {
        logDataOperation(joinPoint, "UPDATE", "cập nhật");
    }

    @AfterReturning("execution(* com.tathanhloc.youthkgu.Service.*.delete(..))")
    public void logDeleteOperations(JoinPoint joinPoint) {
        logDataOperation(joinPoint, "DELETE", "xóa");
    }

    /**
     * Tạo log thao tác dữ liệu dạng: "Nguyễn Văn A đã tạo mới hoạt động [ABC123]"
     */
    private void logDataOperation(JoinPoint joinPoint, String operation, String actionLabel) {
        String className   = joinPoint.getTarget().getClass().getSimpleName();
        String entityType  = className.replace("Service", "");

        // Bỏ qua các service nội bộ không cần log
        if (entityType.equalsIgnoreCase("SystemLog")
                || entityType.equalsIgnoreCase("RefreshToken")
                || entityType.equalsIgnoreCase("Mail")) {
            return;
        }

        String moduleCode  = MODULE_CODES.getOrDefault(entityType, entityType.toUpperCase());
        String entityLabel = MODULE_LABELS.getOrDefault(entityType, entityType.toLowerCase());

        String[] userInfo  = getCurrentUserInfo();
        String userId      = userInfo[0];
        String userName    = userInfo[1];
        String displayName = resolveDisplayName(userId, userName);

        String entityId    = extractEntityId(joinPoint.getArgs());
        String message     = (entityId != null)
                ? displayName + " đã " + actionLabel + " " + entityLabel + " [" + entityId + "]"
                : displayName + " đã " + actionLabel + " " + entityLabel;

        logService.logUserAction(moduleCode, operation, message, userId, userName);
    }

    // =================== Helper methods ===================

    private String[] getCurrentUserInfo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equals(auth.getPrincipal())) {
                return new String[]{auth.getName(), auth.getName()};
            }
        } catch (Exception e) {
            log.debug("Cannot get current user: {}", e.getMessage());
        }
        return new String[]{null, null};
    }

    private String resolveDisplayName(String userId, String userName) {
        if (userName != null && !userName.isBlank()) return userName;
        if (userId  != null && !userId.isBlank())   return userId;
        return "Hệ thống";
    }

    /**
     * Lấy ID thực thể từ tham số đầu tiên của method (String/Number trực tiếp, hoặc qua getter).
     */
    private String extractEntityId(Object[] args) {
        if (args == null || args.length == 0) return null;
        Object first = args[0];
        if (first == null) return null;
        if (first instanceof String)  return (String) first;
        if (first instanceof Number)  return first.toString();
        // Thử các getter phổ biến
        for (String getter : new String[]{
                "getId", "getMaHoatDong", "getMaSv", "getMaGv", "getMaChucVu",
                "getMaKhoa", "getMaLop", "getMaBan", "getMaNganh", "getMaPhong",
                "getMaKhoaHoc", "getMaHocKy", "getMaNamHoc"}) {
            try {
                Object val = first.getClass().getMethod(getter).invoke(first);
                if (val != null) return val.toString();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String serializeParameters(Object[] args) {
        try {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < args.length; i++) {
                if (i > 0) sb.append(", ");
                if (args[i] == null) { sb.append("null"); continue; }
                if (args[i] instanceof String || args[i] instanceof Number || args[i] instanceof Boolean) {
                    sb.append(args[i]);
                } else {
                    String json = objectMapper.writeValueAsString(args[i]);
                    sb.append(json.length() > 80 ? json.substring(0, 80) + "..." : json);
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "...";
        }
    }

    private String truncateStackTrace(Exception e) {
        StringBuilder sb = new StringBuilder();
        sb.append(e.getMessage()).append("\n");
        for (StackTraceElement el : e.getStackTrace()) {
            sb.append(el.toString()).append("\n");
            if (sb.length() > 2000) { sb.append("... (truncated)"); break; }
        }
        return sb.toString();
    }
}
