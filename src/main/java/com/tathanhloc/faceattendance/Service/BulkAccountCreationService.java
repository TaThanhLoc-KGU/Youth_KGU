package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Model.GiangVien;
import com.tathanhloc.faceattendance.Model.SinhVien;
import com.tathanhloc.faceattendance.Model.TaiKhoan;
import com.tathanhloc.faceattendance.Repository.GiangVienRepository;
import com.tathanhloc.faceattendance.Repository.SinhVienRepository;
import com.tathanhloc.faceattendance.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkAccountCreationService {

    private final SinhVienRepository sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Tạo tài khoản cho tất cả sinh viên chưa có tài khoản
     */
    @Transactional
    public Map<String, Object> createAccountsForAllStudents() {
        log.info("Bắt đầu tạo tài khoản hàng loạt cho sinh viên");
        
        // Lấy danh sách mã SV đã có tài khoản
        List<String> existingIds = taiKhoanRepository.findAllLinkedSinhVienIds();
        
        // Lấy danh sách sinh viên chưa có tài khoản
        List<SinhVien> studentsWithoutAccount = sinhVienRepository.findAll().stream()
                .filter(sv -> !existingIds.contains(sv.getMaSv()))
                .collect(Collectors.toList());
        
        int successCount = 0;
        int failCount = 0;
        
        for (SinhVien sv : studentsWithoutAccount) {
            try {
                // Kiểm tra username trùng lặp (dùng mã SV làm username)
                if (taiKhoanRepository.existsByUsername(sv.getMaSv())) {
                    log.warn("Username {} đã tồn tại, bỏ qua sinh viên này", sv.getMaSv());
                    failCount++;
                    continue;
                }
                
                TaiKhoan taiKhoan = new TaiKhoan();
                taiKhoan.setUsername(sv.getMaSv());
                // Mật khẩu mặc định là mã SV
                taiKhoan.setPasswordHash(passwordEncoder.encode(sv.getMaSv()));
                taiKhoan.setHoTen(sv.getHoTen());
                taiKhoan.setEmail(sv.getEmail());
                taiKhoan.setVaiTro(VaiTroEnum.SINH_VIEN);
                taiKhoan.setSinhVien(sv);
                taiKhoan.setIsActive(true);
                taiKhoan.setTrangThaiPheDuyet("DA_PHE_DUYET");
                taiKhoan.setCreatedAt(LocalDateTime.now());
                
                taiKhoanRepository.save(taiKhoan);
                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi tạo tài khoản cho SV {}: {}", sv.getMaSv(), e.getMessage());
                failCount++;
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalProcessed", studentsWithoutAccount.size());
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        
        log.info("Hoàn tất tạo tài khoản SV: {} thành công, {} thất bại", successCount, failCount);
        return result;
    }

    /**
     * Tạo tài khoản cho tất cả giảng viên chưa có tài khoản
     */
    @Transactional
    public Map<String, Object> createAccountsForAllLecturers() {
        log.info("Bắt đầu tạo tài khoản hàng loạt cho giảng viên");
        
        // Lấy danh sách mã GV đã có tài khoản
        List<String> existingIds = taiKhoanRepository.findAllLinkedGiangVienIds();
        
        // Lấy danh sách giảng viên chưa có tài khoản
        List<GiangVien> lecturersWithoutAccount = giangVienRepository.findAll().stream()
                .filter(gv -> !existingIds.contains(gv.getMaGv()))
                .collect(Collectors.toList());
        
        int successCount = 0;
        int failCount = 0;
        
        for (GiangVien gv : lecturersWithoutAccount) {
            try {
                // Kiểm tra username trùng lặp (dùng mã GV làm username)
                if (taiKhoanRepository.existsByUsername(gv.getMaGv())) {
                    log.warn("Username {} đã tồn tại, bỏ qua giảng viên này", gv.getMaGv());
                    failCount++;
                    continue;
                }
                
                TaiKhoan taiKhoan = new TaiKhoan();
                taiKhoan.setUsername(gv.getMaGv());
                // Mật khẩu mặc định là mã GV
                taiKhoan.setPasswordHash(passwordEncoder.encode(gv.getMaGv()));
                taiKhoan.setHoTen(gv.getHoTen());
                taiKhoan.setEmail(gv.getEmail());
                taiKhoan.setVaiTro(VaiTroEnum.GIANG_VIEN);
                taiKhoan.setGiangVien(gv);
                taiKhoan.setIsActive(true);
                taiKhoan.setTrangThaiPheDuyet("DA_PHE_DUYET");
                taiKhoan.setCreatedAt(LocalDateTime.now());
                
                taiKhoanRepository.save(taiKhoan);
                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi tạo tài khoản cho GV {}: {}", gv.getMaGv(), e.getMessage());
                failCount++;
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalProcessed", lecturersWithoutAccount.size());
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        
        log.info("Hoàn tất tạo tài khoản GV: {} thành công, {} thất bại", successCount, failCount);
        return result;
    }
}
