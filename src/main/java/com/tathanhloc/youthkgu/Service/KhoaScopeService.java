package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KhoaScopeService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final SinhVienRepository sinhVienRepository;

    /**
     * Trả về maKhoa của user đang đăng nhập.
     * null  = Đoàn trường (không giới hạn).
     * non-null = chỉ được thấy dữ liệu của khoa đó.
     *
     * - QUAN_LY: lấy trực tiếp từ TaiKhoan.khoa
     * - SINH_VIEN: lấy gián tiếp qua sinhVien → lop → nganh → khoa
     */
    @Transactional(readOnly = true)
    public String getCurrentMaKhoa() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = auth.getName();

        // 1. Thử lấy maKhoa trực tiếp (QUAN_LY có FK khoa trên TaiKhoan)
        Optional<String> direct = taiKhoanRepository.findMaKhoaByUsername(username);
        if (direct.isPresent()) {
            return direct.get();
        }

        // 2. SINH_VIEN — traverse qua TaiKhoan.sinhVien → lop → nganh → khoa
        Optional<String> viaLink = taiKhoanRepository.findMaKhoaBySinhVienUsername(username);
        if (viaLink.isPresent()) {
            return viaLink.get();
        }

        // 3. Fallback cuối: username của sinh viên thường = maSv — lookup trực tiếp qua SinhVien
        //    Dùng khi TaiKhoan.sinhVien chưa được link (tài khoản tạo thủ công)
        return sinhVienRepository.findMaKhoaByMaSv(username).orElse(null);
    }

    /** true nếu user hiện tại bị giới hạn theo khoa */
    public boolean isKhoaScoped() {
        return getCurrentMaKhoa() != null;
    }
}
