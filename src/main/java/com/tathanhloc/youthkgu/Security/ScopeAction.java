package com.tathanhloc.youthkgu.Security;

/** Loại thao tác trên 1 tài nguyên có phạm vi (khoa / CLB) — xem {@link AccessPolicyService}. */
public enum ScopeAction {
    /** Xem / liệt kê — khoa được thấy tài nguyên khoa mình + tài nguyên chung (global). */
    READ,
    /** Tạo / sửa / xoá / công khai / gửi thông báo — chỉ trong đúng phạm vi của mình. */
    WRITE,
    /** Duyệt / từ chối — chỉ trong đúng phạm vi của mình. */
    APPROVE
}
