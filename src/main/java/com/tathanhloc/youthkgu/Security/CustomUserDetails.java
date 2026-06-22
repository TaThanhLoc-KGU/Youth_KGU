package com.tathanhloc.youthkgu.Security;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import lombok.AllArgsConstructor;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final TaiKhoan taiKhoan;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return switch (taiKhoan.getVaiTro()) {
            case ADMIN -> List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
            case QUAN_LY_KHOA, PHO_QUAN_LY_KHOA -> List.of(new SimpleGrantedAuthority("ROLE_MANAGER_KHOA"));
            case QUAN_LY_CHI_DOAN, PHO_CHI_DOAN -> List.of(new SimpleGrantedAuthority("ROLE_MANAGER_CHI_DOAN"));
            case QUAN_LY_CLB -> List.of(new SimpleGrantedAuthority("ROLE_MANAGER_CLB"));
            case DOAN_VIEN, DIEM_DANH_VIEN -> List.of(new SimpleGrantedAuthority("ROLE_USER"));
        };
    }

    @Override public String getPassword() { return taiKhoan.getPasswordHash(); }
    @Override public String getUsername()  { return taiKhoan.getUsername(); }
    @Override public boolean isAccountNonExpired()   { return true; }
    @Override public boolean isAccountNonLocked()    { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return Boolean.TRUE.equals(taiKhoan.getIsActive()); }

    public TaiKhoan getTaiKhoan() { return taiKhoan; }

    /** Trả về true nếu role có quyền quản trị (không phải đoàn viên thường) */
    public boolean isQuanLy() {
        return taiKhoan.getVaiTro() != null && taiKhoan.getVaiTro().isQuanLy();
    }
}
