package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.DTO.HoatDongDTO;
import org.springframework.stereotype.Component;

/**
 * Bản resolver cho {@link HoatDongDTO} — dùng khi lọc DANH SÁCH kết quả (service trả về DTO, không phải
 * entity). Cùng logic phạm vi với {@link HoatDongScopeResolver}.
 */
@Component
public class HoatDongDtoScopeResolver implements ResourceScopeResolver {

    @Override
    public Class<?> supports() {
        return HoatDongDTO.class;
    }

    @Override
    public String khoaOf(Object resource) {
        return ((HoatDongDTO) resource).getMaKhoa();
    }

    @Override
    public String clbOf(Object resource) {
        return ((HoatDongDTO) resource).getMaClb();
    }
}
