package com.tathanhloc.youthkgu.Controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 🔧 Custom Error Controller - Thay thế cho Spring Boot BasicErrorController
 * ✅ Xử lý cả API errors (JSON) và Web errors (HTML)
 */
@Controller
@Slf4j
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        // Lấy thông tin lỗi
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String requestURI = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String errorMessage = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Throwable exception = (Throwable) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        Integer statusCode = status != null ? Integer.valueOf(status.toString()) : 500;

        log.error("🚨 Custom Error Handler - Status: {} | Path: {} | Message: {}",
                statusCode, requestURI, errorMessage);

        if (exception != null) {
            log.error("Exception details: ", exception);
        }

        // Kiểm tra loại request
        if (isApiRequest(request)) {
            log.info("📱 Handling as API request");
            return handleApiError(request, statusCode, requestURI, errorMessage);
        } else {
            log.info("🌐 Handling as Web request");
            // For web requests, we can return a view name or redirect
            // Since this controller method returns Object, we can return String for view name
            // or ResponseEntity for API response.
            // However, to keep it simple and consistent with the original code structure,
            // let's assume we want to return a view name for web requests.
            // But the original code had `Model model` in the signature which is not compatible with `Object` return type if we want to return ResponseEntity for API.
            // So we removed `Model model` from signature and will handle web error differently or just return API error for now as this is mainly an API backend.
            // If web views are needed, we should split this into two methods or use @ControllerAdvice.
            // For now, let's return API error for everything to be safe, or redirect to a generic error page.
            
            return handleApiError(request, statusCode, requestURI, errorMessage);
        }
    }

    /**
     * 📱 Xử lý API errors - Trả về JSON
     */
    private ResponseEntity<Map<String, Object>> handleApiError(HttpServletRequest request,
                                                               Integer statusCode,
                                                               String requestURI,
                                                               String errorMessage) {
        Map<String, Object> errorResponse = new HashMap<>();

        // Thông tin cơ bản
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", statusCode);
        errorResponse.put("path", requestURI);
        errorResponse.put("method", request.getMethod());

        // Thông điệp lỗi theo mã lỗi
        switch (statusCode) {
            case 400:
                errorResponse.put("error", "Bad Request");
                errorResponse.put("message", "Yêu cầu không hợp lệ");
                break;
            case 401:
                errorResponse.put("error", "Unauthorized");
                errorResponse.put("message", "Chưa được xác thực. Vui lòng đăng nhập.");
                break;
            case 403:
                errorResponse.put("error", "Forbidden");
                errorResponse.put("message", "Không có quyền truy cập tài nguyên này");
                break;
            case 404:
                errorResponse.put("error", "Not Found");
                errorResponse.put("message", "API endpoint không tồn tại: " + request.getMethod() + " " + requestURI);
                break;
            case 405:
                errorResponse.put("error", "Method Not Allowed");
                errorResponse.put("message", "Phương thức " + request.getMethod() + " không được hỗ trợ");
                break;
            case 500:
                errorResponse.put("error", "Internal Server Error");
                errorResponse.put("message", "Lỗi hệ thống. Vui lòng thử lại sau.");
                break;
            default:
                errorResponse.put("error", "Error");
                errorResponse.put("message", "Đã xảy ra lỗi: " + statusCode);
        }

        log.info("📤 API Error Response: {}", errorResponse);

        return ResponseEntity.status(statusCode)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse);
    }

    /**
     * 🔍 Kiểm tra xem đây có phải API request không
     */
    private boolean isApiRequest(HttpServletRequest request) {
        String acceptHeader = request.getHeader("Accept");
        String contentType = request.getHeader("Content-Type");
        String requestURI = request.getRequestURI();
        String xRequestedWith = request.getHeader("X-Requested-With");

        boolean isApi = (acceptHeader != null && acceptHeader.contains("application/json")) ||
                (contentType != null && contentType.contains("application/json")) ||
                (requestURI != null && (requestURI.startsWith("/api/") || requestURI.startsWith("/rest/"))) ||
                "XMLHttpRequest".equals(xRequestedWith);

        log.debug("🔍 Request Analysis: URI={}, Accept={}, ContentType={}, IsAPI={}",
                requestURI, acceptHeader, contentType, isApi);

        return isApi;
    }
}
