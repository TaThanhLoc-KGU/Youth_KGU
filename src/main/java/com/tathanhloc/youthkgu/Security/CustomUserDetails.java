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
        // QUAN_LY + laAdmin=true → ROLE_ADMIN (vào được mọi endpoint bảo vệ bằng hasRole('ADMIN'))
        // QUAN_LY + laAdmin=false → ROLE_MANAGER
        // SINH_VIEN → ROLE_USER
        if (taiKhoan.getVaiTro() == VaiTroEnum.QUAN_LY && Boolean.TRUE.equals(taiKhoan.getLaAdmin())) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        if (taiKhoan.getVaiTro() == VaiTroEnum.QUAN_LY) {
            return List.of(new SimpleGrantedAuthority("ROLE_MANAGER"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }


    @Override
    public String getPassword() {
        return taiKhoan.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return taiKhoan.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return taiKhoan.getIsActive();
    }

    public TaiKhoan getTaiKhoan() {
        return taiKhoan;
    }
}
