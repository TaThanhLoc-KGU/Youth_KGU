package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.Model.HoatDong;
import org.springframework.stereotype.Component;

/** Phạm vi của 1 HoatDong = khoa (nếu có) hoặc CLB (nếu có); không có cả hai = hoạt động cấp trường. */
@Component
public class HoatDongScopeResolver implements ResourceScopeResolver {

    @Override
    public Class<?> supports() {
        return HoatDong.class;
    }

    @Override
    public String khoaOf(Object resource) {
        HoatDong hd = (HoatDong) resource;
        return hd.getKhoa() != null ? hd.getKhoa().getMaKhoa() : null;
    }

    @Override
    public String clbOf(Object resource) {
        HoatDong hd = (HoatDong) resource;
        return hd.getCauLacBo() != null ? hd.getCauLacBo().getMaClb() : null;
    }
}
