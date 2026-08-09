package com.tathanhloc.youthkgu.Exception;

/** Tài khoản Zalo hợp lệ nhưng chưa liên kết mã số sinh viên nào — cần yêu cầu FE hỏi MSSV để liên kết. */
public class ZaloNotLinkedException extends RuntimeException {
    public ZaloNotLinkedException(String message) {
        super(message);
    }
}
