package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.AccountDTO;
import com.tathanhloc.youthkgu.DTO.RegisterRequest;
import com.tathanhloc.youthkgu.DTO.CreateAccountRequest;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.Ban;
import com.tathanhloc.youthkgu.Model.SystemLog;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.BanRepository;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import com.tathanhloc.youthkgu.Repository.GiangVienRepository;
import com.tathanhloc.youthkgu.Repository.ChuyenVienRepository;
import com.tathanhloc.youthkgu.Repository.KhoaRepository;
import com.tathanhloc.youthkgu.Repository.CauLacBoRepository;
import com.tathanhloc.youthkgu.Repository.LopRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final BanRepository banRepository;
    private final EmailValidationService emailValidationService;
    private final PasswordEncoder passwordEncoder;
    private final SinhVienRepository sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final ChuyenVienRepository chuyenVienRepository;
    private final KhoaRepository khoaRepository;
    private final CauLacBoRepository cauLacBoRepository;
    private final LopRepository lopRepository;
    private final SystemLogService systemLogService;
    private final HttpServletRequest request;

    @Autowired
    @Lazy
    private AccountService accountServiceSelf;

    @Autowired
    @Lazy
    private PermissionService permissionService;

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

        // Kiểm tra email đã tồn tại (chỉ khi có nhập email)
        String emailRegister = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!emailRegister.isEmpty() && taiKhoanRepository.existsByEmail(emailRegister)) {
            log.error("Email đã tồn tại: {}", emailRegister);
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        // Validate mật khẩu
        validatePassword(request.getPassword());

        // Tạo tài khoản mới
        TaiKhoan taiKhoan = TaiKhoan.builder()
                .username(request.getUsername())
                .email(emailRegister.isEmpty() ? null : emailRegister)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .hoTen(request.getHoTen())
                .soDienThoai(request.getSoDienThoai())
                .ngaySinh(request.getNgaySinh())
                .gioiTinh(request.getGioiTinh())
                .vaiTro(VaiTroEnum.DOAN_VIEN) // Default role cho đăng ký tự
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
        systemLogService.log("TAI_KHOAN", "APPROVE_ACCOUNT", String.valueOf(updated.getId()), updated.getUsername(), "TaiKhoan", String.valueOf(updated.getId()), "Phê duyệt tài khoản", SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);

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
        systemLogService.log("TAI_KHOAN", "REJECT_ACCOUNT", String.valueOf(updated.getId()), updated.getUsername(), "TaiKhoan", String.valueOf(updated.getId()), "Từ chối tài khoản", SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);

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

        if (request.getBanChuyenMon() != null && !request.getBanChuyenMon().isEmpty()) {
            Ban ban = banRepository.findById(request.getBanChuyenMon())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ban chuyên môn: " + request.getBanChuyenMon()));
            account.setBanChuyenMon(ban);
        } else if (request.getBanChuyenMon() == null) {
            account.setBanChuyenMon(null);
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
    public List<AccountDTO> getPendingApprovalAccounts() {
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
     * Logic lõi để tạo tài khoản — không ghi SystemLog.
     * Dùng nội bộ bởi createAccountManually() và createSingleAccountForBulk()
     * để tránh ghi log N+1 khi tạo hàng loạt.
     */
    private TaiKhoan createAccountManuallyCore(CreateAccountRequest request) {
        // Validate email format
        String emailValidationError = emailValidationService.validateEmailWithMessage(request.getEmail());
        if (!emailValidationError.isEmpty()) {
            log.error("Email không hợp lệ: {}", request.getEmail());
            throw new IllegalArgumentException(emailValidationError);
        }

        // Kiểm tra username đã tồn tại
        if (taiKhoanRepository.existsByUsername(request.getUsername())) {
            log.error("Username đã tồn tại: {}", request.getUsername());
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        // Kiểm tra email đã tồn tại (chỉ khi có nhập email)
        String emailCreate = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!emailCreate.isEmpty() && taiKhoanRepository.existsByEmail(emailCreate)) {
            log.error("Email đã tồn tại: {}", emailCreate);
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        // Tạo tài khoản mới
        TaiKhoan newAccount = TaiKhoan.builder()
                .username(request.getUsername())
                .email(emailCreate.isEmpty() ? null : emailCreate)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .hoTen(request.getHoTen())
                .soDienThoai(request.getSoDienThoai())
                .ngaySinh(request.getNgaySinh())
                .gioiTinh(request.getGioiTinh())
                .avatar(request.getAvatar())
                .vaiTro(request.getVaiTro())
                .laAdmin(Boolean.TRUE.equals(request.getLaAdmin()))
                .isActive(true)
                .trangThaiPheDuyet("DA_PHE_DUYET") // Tài khoản thủ công được phê duyệt ngay
                .ngayPheDuyet(LocalDateTime.now())
                .build();

        if (request.getMaKhoa() != null && !request.getMaKhoa().isEmpty()) {
            khoaRepository.findById(request.getMaKhoa()).ifPresent(newAccount::setKhoa);
        }

        if (request.getMaClb() != null && !request.getMaClb().isEmpty()) {
            cauLacBoRepository.findById(request.getMaClb()).ifPresent(newAccount::setClb);
        }

        if (request.getMaLop() != null && !request.getMaLop().isEmpty()) {
            lopRepository.findById(request.getMaLop()).ifPresent(newAccount::setLop);
        }

        if (request.getBanChuyenMon() != null && !request.getBanChuyenMon().isEmpty()) {
            Ban ban = banRepository.findById(request.getBanChuyenMon())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ban chuyên môn: " + request.getBanChuyenMon()));
            newAccount.setBanChuyenMon(ban);
        }

        // Liên kết với đối tượng người dùng (GiangVien / SinhVien / ChuyenVien)
        if (request.getMaGv() != null && !request.getMaGv().isEmpty()) {
            giangVienRepository.findById(request.getMaGv()).ifPresent(newAccount::setGiangVien);
        }
        if (request.getMaSv() != null && !request.getMaSv().isEmpty()) {
            sinhVienRepository.findById(request.getMaSv()).ifPresent(newAccount::setSinhVien);
        }
        if (request.getMaChuyenVien() != null && !request.getMaChuyenVien().isEmpty()) {
            chuyenVienRepository.findById(request.getMaChuyenVien()).ifPresent(newAccount::setChuyenVien);
        }

        TaiKhoan saved = taiKhoanRepository.save(newAccount);
        log.info("Tạo tài khoản thành công: {}", saved.getUsername());

        // Gán quyền tùy chỉnh (override role defaults) nếu có
        if (saved.getVaiTro() != VaiTroEnum.ADMIN
                && request.getPermissionIds() != null
                && !request.getPermissionIds().isEmpty()) {
            permissionService.setAccountPermissions(saved.getId(), request.getPermissionIds(), null);
        }

        return saved;
    }

    /**
     * Tạo tài khoản thủ công (Admin only)
     * @param request Thông tin tài khoản mới
     * @return AccountDTO của tài khoản mới tạo
     */
    @Transactional
    public AccountDTO createAccountManually(CreateAccountRequest request) {
        log.info("Tạo tài khoản thủ công: {}", request.getUsername());
        TaiKhoan saved = createAccountManuallyCore(request);
        systemLogService.log("TAI_KHOAN", "CREATE_ACCOUNT_MANUALLY", String.valueOf(saved.getId()), saved.getUsername(), "TaiKhoan", String.valueOf(saved.getId()), "Tạo tài khoản thủ công", SystemLog.LogLevel.INFO, "SUCCESS", null, null, this.request);
        return toDTO(saved);
    }

    /**
     * Convert TaiKhoan entity to AccountDTO
     */
    private AccountDTO toDTO(TaiKhoan taiKhoan) {
        Ban ban = null;
        try {
            ban = taiKhoan.getBanChuyenMon();
            // Force initialize nếu cần
            if (ban != null) {
                Hibernate.initialize(ban);
            }
        } catch (Exception e) {
            log.warn("Cannot initialize banChuyenMon for account {}", taiKhoan.getId());
        }

        VaiTroEnum vaiTro = taiKhoan.getVaiTro();
        return AccountDTO.builder()
                .id(taiKhoan.getId())
                .username(taiKhoan.getUsername())
                .email(taiKhoan.getEmail())
                .hoTen(taiKhoan.getHoTen())
                .soDienThoai(taiKhoan.getSoDienThoai())
                .ngaySinh(taiKhoan.getNgaySinh())
                .gioiTinh(taiKhoan.getGioiTinh())
                .avatar(taiKhoan.getAvatar())
                .vaiTro(vaiTro)
                .tenVaiTro(vaiTro != null ? vaiTro.getLabel() : null)
                .banChuyenMon(ban != null ? ban.getMaBan() : null)
                .tenBanChuyenMon(ban != null ? ban.getTenBan() : null)
                .trangThaiPheDuyet(taiKhoan.getTrangThaiPheDuyet())
                .ngayPheDuyet(taiKhoan.getNgayPheDuyet())
                .ghiChu(taiKhoan.getGhiChu())
                .isActive(taiKhoan.getIsActive())
                .createdAt(taiKhoan.getCreatedAt())
                .updatedAt(taiKhoan.getUpdatedAt())
                .laAdmin(taiKhoan.getLaAdmin())
                .maKhoa(taiKhoan.getKhoa() != null ? taiKhoan.getKhoa().getMaKhoa() : null)
                .tenKhoa(taiKhoan.getKhoa() != null ? taiKhoan.getKhoa().getTenKhoa() : null)
                .maClb(taiKhoan.getClb() != null ? taiKhoan.getClb().getMaClb() : null)
                .tenClb(taiKhoan.getClb() != null ? taiKhoan.getClb().getTenClb() : null)
                .maLop(taiKhoan.getLop() != null ? taiKhoan.getLop().getMaLop() : null)
                .tenLop(taiKhoan.getLop() != null ? taiKhoan.getLop().getTenLop() : null)
                .maSv(taiKhoan.getSinhVien() != null ? taiKhoan.getSinhVien().getMaSv() : null)
                .maGv(taiKhoan.getGiangVien() != null ? taiKhoan.getGiangVien().getMaGv() : null)
                .build();
    }

    /**
     * Lấy danh sách tất cả tài khoản
     */
    public List<AccountDTO> getAllAccounts() {
        log.info("Lấy danh sách tất cả tài khoản");
        return taiKhoanRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật thông tin tài khoản
     */
    @Transactional
    public AccountDTO updateAccount(Long accountId, AccountDTO request) {
        log.info("Cập nhật tài khoản ID: {}", accountId);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        // Cập nhật các trường được phép
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
        if (request.getVaiTro() != null) {
            account.setVaiTro(request.getVaiTro());
        }
        if (request.getBanChuyenMon() != null && !request.getBanChuyenMon().isEmpty()) {
            Ban ban = banRepository.findById(request.getBanChuyenMon())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ban chuyên môn: " + request.getBanChuyenMon()));
            account.setBanChuyenMon(ban);
        } else if (request.getBanChuyenMon() == null) {
            account.setBanChuyenMon(null);
        }

        if (request.getMaKhoa() != null && !request.getMaKhoa().isEmpty()) {
            account.setKhoa(khoaRepository.findById(request.getMaKhoa()).orElse(null));
        } else {
            // empty string hoặc null → Đoàn trường, xóa ràng buộc khoa
            account.setKhoa(null);
        }

        if (request.getMaClb() != null && !request.getMaClb().isEmpty()) {
            account.setClb(cauLacBoRepository.findById(request.getMaClb()).orElse(null));
        } else {
            account.setClb(null);
        }

        if (request.getMaLop() != null && !request.getMaLop().isEmpty()) {
            account.setLop(lopRepository.findById(request.getMaLop()).orElse(null));
        } else {
            account.setLop(null);
        }

        account.setUpdatedAt(LocalDateTime.now());
        TaiKhoan updated = taiKhoanRepository.save(account);
        log.info("Cập nhật tài khoản thành công: {}", updated.getUsername());

        return toDTO(updated);
    }

    /**
     * Xóa tài khoản
     */
    @Transactional
    public void deleteAccount(Long accountId) {
        log.info("Xóa tài khoản ID: {}", accountId);

        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy tài khoản ID: {}", accountId);
                    return new ResourceNotFoundException("Tài khoản không tồn tại");
                });

        taiKhoanRepository.delete(account);
        log.info("Xóa tài khoản thành công: {}", account.getUsername());
        systemLogService.log("TAI_KHOAN", "DELETE_ACCOUNT", String.valueOf(account.getId()), account.getUsername(), "TaiKhoan", String.valueOf(account.getId()), "Xóa tài khoản", SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
    }

    /**
     * Reset mật khẩu tài khoản về mật khẩu mặc định: KGU@123456
     */
    @Transactional
    public String resetPassword(Long accountId) {
        TaiKhoan account = taiKhoanRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        final String DEFAULT_PASSWORD = "KGU@123456";
        account.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
        taiKhoanRepository.save(account);

        log.info("Reset mật khẩu tài khoản: {} (ID={})", account.getUsername(), accountId);
        systemLogService.log("TAI_KHOAN", "RESET_PASSWORD",
                String.valueOf(account.getId()), account.getUsername(),
                "TaiKhoan", String.valueOf(account.getId()),
                "Reset mật khẩu về mặc định cho: " + account.getUsername(),
                SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);

        return account.getUsername();
    }

    /**
     * Lấy danh sách sinh viên / giảng viên / chuyên viên chưa có tài khoản.
     * type: SINH_VIEN | GIANG_VIEN | CHUYEN_VIEN
     */
    public List<Map<String, Object>> getWithoutAccount(String type) {
        switch (type.toUpperCase()) {
            case "SINH_VIEN": {
                Set<String> linked = new HashSet<>(taiKhoanRepository.findAllLinkedSinhVienIds());
                return sinhVienRepository.findAll().stream()
                        .filter(sv -> !linked.contains(sv.getMaSv()))
                        .map(sv -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("ma", sv.getMaSv());
                            m.put("hoTen", sv.getHoTen());
                            m.put("email", sv.getEmail());
                            return m;
                        }).collect(Collectors.toList());
            }
            case "GIANG_VIEN": {
                Set<String> linked = new HashSet<>(taiKhoanRepository.findAllLinkedGiangVienIds());
                return giangVienRepository.findAll().stream()
                        .filter(gv -> !linked.contains(gv.getMaGv()))
                        .map(gv -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("ma", gv.getMaGv());
                            m.put("hoTen", gv.getHoTen());
                            m.put("email", gv.getEmail());
                            return m;
                        }).collect(Collectors.toList());
            }
            case "CHUYEN_VIEN": {
                Set<String> linked = new HashSet<>(taiKhoanRepository.findAllLinkedChuyenVienIds());
                return chuyenVienRepository.findAll().stream()
                        .filter(cv -> !linked.contains(cv.getMaChuyenVien()))
                        .map(cv -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("ma", cv.getMaChuyenVien());
                            m.put("hoTen", cv.getHoTen());
                            m.put("email", cv.getEmail());
                            return m;
                        }).collect(Collectors.toList());
            }
            default:
                throw new IllegalArgumentException("Loại không hợp lệ: " + type);
        }
    }

    /**
     * Tạo một tài khoản đơn lẻ trong transaction riêng biệt (REQUIRES_NEW).
     * Được gọi từ bulkCreateAccounts thông qua proxy để tách transaction.
     * Không ghi SystemLog riêng — bulkCreateAccounts sẽ ghi 1 log tổng hợp.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AccountDTO createSingleAccountForBulk(CreateAccountRequest request) {
        return toDTO(createAccountManuallyCore(request));
    }

    /**
     * Tạo hàng loạt tài khoản — bỏ qua các bản ghi lỗi, trả về kết quả tổng hợp.
     * Mỗi account được tạo trong transaction riêng biệt.
     */
    @Transactional
    public Map<String, Object> bulkCreateAccounts(List<CreateAccountRequest> requests) {
        int created = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        for (CreateAccountRequest req : requests) {
            try {
                accountServiceSelf.createSingleAccountForBulk(req);
                created++;
            } catch (Exception e) {
                errors++;
                errorMessages.add((req.getUsername() != null ? req.getUsername() : "?") + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("created", created);
        result.put("errors", errors);
        result.put("errorMessages", errorMessages);
        systemLogService.log("TAI_KHOAN", "BULK_CREATE_ACCOUNTS", null, null, "TaiKhoan", null, "Tạo hàng loạt " + created + " tài khoản, lỗi " + errors, SystemLog.LogLevel.INFO, "SUCCESS", null, null, request);
        return result;
    }
}
