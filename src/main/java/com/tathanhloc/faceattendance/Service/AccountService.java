package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.AccountDTO;
import com.tathanhloc.faceattendance.DTO.RegisterRequest;
import com.tathanhloc.faceattendance.Enum.VaiTroEnum;
import com.tathanhloc.faceattendance.Enum.BanChuyenMonEnum;
import com.tathanhloc.faceattendance.Exception.ResourceNotFoundException;
import com.tathanhloc.faceattendance.Model.TaiKhoan;
import com.tathanhloc.faceattendance.Repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service để quản lý tài khoản người dùng
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AccountService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final EmailValidationService emailValidationService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Đăng ký tài khoản mới
     * @param request Thông tin đăng ký
     * @return AccountDTO của tài khoản mới tạo
     */
    @Transactional
    public AccountDTO registerNewAccount(RegisterRequest request) {
        log.info("Đăng ký tài khoản mới: {}", request.getUsername());

        // Validate email format
        String emailValidationError = emailValidationService.validateEmailWithMessage(request.getEmail());
        if (!emailValidationError.isEmpty()) {
            log.error("Email không hợp lệ: {}", request.getEmail());
            throw new IllegalArgumentException(emailValidationError);
        }

        // Kiểm tra username đã tồn tại
        if (taiKhoanRepository.existsByUsername(request.getUsername())) {
            log.error("Username đã tồn tại: {}", request.getUsername());
            throw new IllegalArgumentException("Username đã tồn tại");
        }

        // Kiểm tra email đã tồn tại
        if (taiKhoanRepository.existsByEmail(request.getEmail())) {
            log.error("Email đã tồn tại: {}", request.getEmail());
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        // Validate mật khẩu
        validatePassword(request.getPassword());

        // Tạo tài khoản mới
        TaiKhoan taiKhoan = TaiKhoan.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .hoTen(request.getHoTen())
                .soDienThoai(request.getSoDienThoai())
                .ngaySinh(request.getNgaySinh())
                .gioiTinh(request.getGioiTinh())
                .vaiTro(VaiTroEnum.THANH_VIEN_DOAN) // Default role
                .trangThaiPheDuyet("CHO_PHE_DUYET") // Pending approval
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        TaiKhoan savedAccount = taiKhoanRepository.save(taiKhoan);
        log.info("Tạo tài khoản mới thành công: {}", savedAccount.getUsername());

        return toDTO(savedAccount);
    }

    /**
     * Phê duyệt tài khoản
     * @param accountId ID tài khoản cần phê duyệt
     * @param ghiChu Ghi chú phê duyệt (optional)
     * @return AccountDTO của tài khoản sau khi phê duyệt
     */
    @Transactional
    public AccountDTO approveAccount(Long accountId, String ghiChu) {
        log.info("Phê duyệt tài khoản ID: {}", accountId);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        account.setTrangThaiPheDuyet("DA_PHE_DUYET");
        account.setNgayPheDuyet(LocalDateTime.now());
        account.setGhiChu(ghiChu);

        TaiKhoan updated = taiKhoanRepository.save(account);
        log.info("Phê duyệt tài khoản thành công: {}", updated.getUsername());

        return toDTO(updated);
    }

    /**
     * Từ chối tài khoản
     * @param accountId ID tài khoản cần từ chối
     * @param lyDo Lý do từ chối
     * @return AccountDTO của tài khoản sau khi từ chối
     */
    @Transactional
    public AccountDTO rejectAccount(Long accountId, String lyDo) {
        log.info("Từ chối tài khoản ID: {}", accountId);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        account.setTrangThaiPheDuyet("TU_CHOI");
        account.setNgayPheDuyet(LocalDateTime.now());
        account.setGhiChu(lyDo);

        TaiKhoan updated = taiKhoanRepository.save(account);
        log.info("Từ chối tài khoản thành công: {}", updated.getUsername());

        return toDTO(updated);
    }

    /**
     * Cập nhật thông tin hồ sơ tài khoản
     * @param accountId ID tài khoản
     * @param request Thông tin cần cập nhật
     * @return AccountDTO của tài khoản sau khi cập nhật
     */
    @Transactional
    public AccountDTO updateProfile(Long accountId, AccountDTO request) {
        log.info("Cập nhật thông tin tài khoản ID: {}", accountId);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        // Cập nhật thông tin cá nhân
        if (request.getHoTen() != null && !request.getHoTen().isBlank()) {
            account.setHoTen(request.getHoTen());
        }

        if (request.getSoDienThoai() != null && !request.getSoDienThoai().isBlank()) {
            account.setSoDienThoai(request.getSoDienThoai());
        }

        if (request.getNgaySinh() != null) {
            account.setNgaySinh(request.getNgaySinh());
        }

        if (request.getGioiTinh() != null && !request.getGioiTinh().isBlank()) {
            account.setGioiTinh(request.getGioiTinh());
        }

        if (request.getAvatar() != null && !request.getAvatar().isBlank()) {
            account.setAvatar(request.getAvatar());
        }

        if (request.getBanChuyenMon() != null) {
            account.setBanChuyenMon(request.getBanChuyenMon());
        }

        TaiKhoan updated = taiKhoanRepository.save(account);
        log.info("Cập nhật thông tin tài khoản thành công: {}", updated.getUsername());

        return toDTO(updated);
    }

    /**
     * Thay đổi vai trò người dùng
     * @param accountId ID tài khoản
     * @param vaiTro Vai trò mới
     * @return AccountDTO của tài khoản sau khi thay đổi
     */
    @Transactional
    public AccountDTO changeRole(Long accountId, VaiTroEnum vaiTro) {
        log.info("Thay đổi vai trò tài khoản ID: {} thành {}", accountId, vaiTro);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        account.setVaiTro(vaiTro);
        TaiKhoan updated = taiKhoanRepository.save(account);

        log.info("Thay đổi vai trò tài khoản thành công: {}", updated.getUsername());
        return toDTO(updated);
    }

    /**
     * Kích hoạt/Vô hiệu hóa tài khoản
     * @param accountId ID tài khoản
     * @param isActive Trạng thái hoạt động
     * @return AccountDTO của tài khoản sau khi cập nhật
     */
    @Transactional
    public AccountDTO setAccountActive(Long accountId, boolean isActive) {
        log.info("Cập nhật trạng thái hoạt động tài khoản ID: {} = {}", accountId, isActive);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        account.setIsActive(isActive);
        TaiKhoan updated = taiKhoanRepository.save(account);

        log.info("Cập nhật trạng thái tài khoản thành công: {}", updated.getUsername());
        return toDTO(updated);
    }

    /**
     * Lấy thông tin tài khoản theo ID
     * @param accountId ID tài khoản
     * @return AccountDTO
     */
    public AccountDTO getAccountById(Long accountId) {
        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        return toDTO(account);
    }

    /**
     * Lấy thông tin tài khoản theo username
     * @param username Username
     * @return AccountDTO
     */
    public AccountDTO getAccountByUsername(String username) {
        TaiKhoan account = taiKhoanRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản username: {}", username);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        return toDTO(account);
    }

    /**
     * Lấy danh sách tài khoản chờ phê duyệt
     * @return List<AccountDTO>
     */
    public List<AccountDTO> getAccountsPendingApproval() {
        log.info("Lấy danh sách tài khoản chờ phê duyệt");

        return taiKhoanRepository.findByTrangThaiPheDuyetAndIsActiveTrue("CHO_PHE_DUYET")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tài khoản theo vai trò
     * @param vaiTro Vai trò cần tìm
     * @return List<AccountDTO>
     */
    public List<AccountDTO> getAccountsByRole(VaiTroEnum vaiTro) {
        log.info("Lấy danh sách tài khoản theo vai trò: {}", vaiTro);

        return taiKhoanRepository.findByVaiTroAndIsActiveTrue(vaiTro)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm tài khoản theo keyword
     * @param keyword Từ khóa tìm kiếm
     * @return List<AccountDTO>
     */
    public List<AccountDTO> searchAccounts(String keyword) {
        log.info("Tìm kiếm tài khoản theo keyword: {}", keyword);

        return taiKhoanRepository.searchByKeywordAndActive(keyword)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tất cả tài khoản hoạt động
     * @return List<AccountDTO>
     */
    public List<AccountDTO> getAllActiveAccounts() {
        log.info("Lấy danh sách tất cả tài khoản hoạt động");

        return taiKhoanRepository.findAll()
                .stream()
                .filter(tk -> tk.getIsActive() != null && tk.getIsActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Validate mật khẩu có đủ yêu cầu không
     * @param password Mật khẩu cần validate
     */
    private void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
        }

        // Có thể thêm các yêu cầu khác như:
        // - Chứa chữ hoa
        // - Chứa chữ thường
        // - Chứa số
        // - Chứa ký tự đặc biệt
    }

    /**
     * Convert TaiKhoan entity to AccountDTO
     */
    private AccountDTO toDTO(TaiKhoan taiKhoan) {
        return AccountDTO.builder()
                .id(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .email(taiKhoan.getEmail())
                .hoTen(taiKhoan.getHoTen())
                .soDienThoai(taiKhoan.getSoDienThoai())
                .ngaySinh(taiKhoan.getNgaySinh())
                .gioiTinh(taiKhoan.getGioiTinh())
                .avatar(taiKhoan.getAvatar())
                .vaiTro(taiKhoan.getVaiTro())
                .banChuyenMon(taiKhoan.getBanChuyenMon())
                .trangThaiPheDuyet(taiKhoan.getTrangThaiPheDuyet())
                .ngayPheDuyet(taiKhoan.getNgayPheDuyet())
                .ghiChu(taiKhoan.getGhiChu())
                .isActive(taiKhoan.getIsActive())
                .createdAt(taiKhoan.getCreatedAt())
                .updatedAt(taiKhoan.getUpdatedAt())
                .build();
    }
}
