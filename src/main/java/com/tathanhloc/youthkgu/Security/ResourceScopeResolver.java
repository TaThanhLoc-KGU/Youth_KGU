package com.tathanhloc.youthkgu.Security;

/**
 * Trích phạm vi (khoa / CLB) của 1 loại tài nguyên. Mỗi loại tài nguyên có phạm vi (HoatDong, và sau
 * này có thể thêm TinTuc, DiemDanh...) đăng ký 1 bean implements interface này —
 * {@link AccessPolicyService} tự chọn resolver theo {@link #supports()}.
 */
public interface ResourceScopeResolver {

    /** Lớp tài nguyên mà resolver này xử lý. */
    Class<?> supports();

    /** Mã khoa sở hữu tài nguyên; {@code null} = tài nguyên cấp trường / chung (global). */
    String khoaOf(Object resource);

    /** Mã CLB sở hữu tài nguyên; {@code null} = không thuộc CLB nào. */
    String clbOf(Object resource);
}
