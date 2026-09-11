package com.tathanhloc.youthkgu.Exception;

import org.springframework.security.access.AccessDeniedException;

/**
 * Bị từ chối vì NGOÀI PHẠM VI (khoa / CLB) — khác với thiếu permission string.
 * Kế thừa {@link AccessDeniedException} để đi vào đúng handler 403 sẵn có; kèm lý do người-đọc-được.
 */
public class ScopeAccessDeniedException extends AccessDeniedException {
    public ScopeAccessDeniedException(String message) {
        super(message);
    }
}
