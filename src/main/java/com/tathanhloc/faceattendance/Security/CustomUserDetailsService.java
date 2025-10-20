package com.tathanhloc.faceattendance.Security;

import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;

/**
 * Custom UserDetailsService cho hệ thống
 * Support: SinhVien, GiangVien, BCHDoanHoi
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final SinhVienRepository sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final BCHDoanHoiRepository bchRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try Sinh Vien
        var sinhVien = sinhVienRepository.findByEmail(username);
        if (sinhVien.isPresent()) {
            return buildUserDetails(
                    sinhVien.get().getEmail(),
                    sinhVien.get().getMaSv(), // Use maSv as password (or integrate with User table)
                    "ROLE_SINHVIEN"
            );
        }

        // Try BCH
        var bch = bchRepository.findByEmail(username);
        if (bch.isPresent()) {
            return buildUserDetails(
                    bch.get().getEmail(),
                    bch.get().getMaBch(),
                    "ROLE_BCH"
            );
        }

        // Try Giang Vien (as ADMIN)
        var giangVien = giangVienRepository.findByEmail(username);
        if (giangVien.isPresent()) {
            return buildUserDetails(
                    giangVien.get().getEmail(),
                    giangVien.get().getMaGv(),
                    "ROLE_ADMIN"
            );
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }

    private UserDetails buildUserDetails(String username, String password, String role) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(role));

        return User.builder()
                .username(username)
                .password(password) // Should be encrypted
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}