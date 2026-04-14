package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.AccountPermissionDTO;
import com.tathanhloc.youthkgu.DTO.PermissionDTO;
import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.Permission;
import com.tathanhloc.youthkgu.Model.TaiKhoan;
import com.tathanhloc.youthkgu.Repository.PermissionRepository;
import com.tathanhloc.youthkgu.Repository.TaiKhoanRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private final PermissionRepository permissionRepository;
    private final TaiKhoanRepository taiKhoanRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Lấy tất cả quyền, nhóm theo category
     */
    @Transactional(readOnly = true)
    public Map<String, List<PermissionDTO>> getAllPermissions() {
        List<Permission> all = permissionRepository.findAll();
        return all.stream()
                .map(this::toDTO)
                .collect(Collectors.groupingBy(PermissionDTO::getCategory,
                        LinkedHashMap::new, Collectors.toList()));
    }

    /**
     * Lấy danh sách tài khoản quản lý (không phải ADMIN, không phải SINH_VIEN)
     */
    @Transactional(readOnly = true)
    public List<AccountPermissionDTO> getManagementAccounts() {
        List<TaiKhoan> allAccounts = taiKhoanRepository.findAll();
        return allAccounts.stream()
                .filter(tk -> tk.getVaiTro() == VaiTroEnum.QUAN_LY)
                .map(tk -> {
                    List<Long> assignedIds = getAccountPermissions(tk.getId());
                    return AccountPermissionDTO.builder()
                            .accountId(tk.getId())
                            .username(tk.getUsername())
                            .hoTen(tk.getHoTen())
                            .vaiTro(tk.getVaiTro() != null ? tk.getVaiTro().name() : "")
                            .tenVaiTro(tk.getVaiTro() != null ? tk.getVaiTro().getTenHienThi() : "")
                            .laAdmin(Boolean.TRUE.equals(tk.getLaAdmin()))
                            .quyenIds(new java.util.HashSet<>(assignedIds))
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách ID quyền đã gán cho 1 tài khoản
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<Long> getAccountPermissions(Long taikhoanId) {
        List<Object> result = entityManager.createNativeQuery(
                "SELECT quyen_id FROM tai_khoan_quyen WHERE tai_khoan_id = :taikhoanId"
        ).setParameter("taikhoanId", taikhoanId).getResultList();
        return result.stream()
                .map(o -> ((Number) o).longValue())
                .collect(Collectors.toList());
    }

    /**
     * Gán quyền mới cho tài khoản (replace all)
     */
    @Transactional
    public void assignPermissions(Long taikhoanId, List<Long> permissionIds) {
        // Xóa tất cả quyền cũ
        entityManager.createNativeQuery(
                "DELETE FROM tai_khoan_quyen WHERE tai_khoan_id = :taikhoanId"
        ).setParameter("taikhoanId", taikhoanId).executeUpdate();

        // Thêm quyền mới
        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (Long permId : permissionIds) {
                entityManager.createNativeQuery(
                        "INSERT INTO tai_khoan_quyen (tai_khoan_id, quyen_id, created_at) VALUES (:taikhoanId, :permId, NOW())"
                ).setParameter("taikhoanId", taikhoanId)
                 .setParameter("permId", permId)
                 .executeUpdate();
            }
        }
    }

    /**
     * Seed dữ liệu permissions nếu bảng rỗng
     */
    @Transactional
    public int initDefaultPermissions() {
        long count = permissionRepository.count();
        if (count > 0) {
            log.info("Bảng permissions đã có {} bản ghi, bỏ qua seed.", count);
            return 0;
        }

        List<Permission> defaults = Arrays.asList(
                Permission.builder().category("HOAT_DONG").name("VIEW_HOAT_DONG").description("Xem hoạt động").build(),
                Permission.builder().category("HOAT_DONG").name("CREATE_HOAT_DONG").description("Tạo hoạt động").build(),
                Permission.builder().category("HOAT_DONG").name("EDIT_HOAT_DONG").description("Chỉnh sửa hoạt động").build(),
                Permission.builder().category("HOAT_DONG").name("DELETE_HOAT_DONG").description("Xóa hoạt động").build(),
                Permission.builder().category("DIEM_DANH").name("DO_DIEM_DANH").description("Thực hiện điểm danh").build(),
                Permission.builder().category("DIEM_DANH").name("QUET_QR").description("Quét QR check-in/out").build(),
                Permission.builder().category("DIEM_DANH").name("VIEW_DIEM_DANH").description("Xem báo cáo điểm danh").build(),
                Permission.builder().category("SINH_VIEN").name("VIEW_SINH_VIEN").description("Xem danh sách sinh viên").build(),
                Permission.builder().category("SINH_VIEN").name("MANAGE_SINH_VIEN").description("Quản lý sinh viên").build(),
                Permission.builder().category("TAI_KHOAN").name("VIEW_TAI_KHOAN").description("Xem tài khoản").build(),
                Permission.builder().category("TAI_KHOAN").name("APPROVE_TAI_KHOAN").description("Duyệt tài khoản").build(),
                Permission.builder().category("BAO_CAO").name("VIEW_BAO_CAO").description("Xem thống kê/báo cáo").build(),
                Permission.builder().category("BAO_CAO").name("EXPORT_BAO_CAO").description("Xuất báo cáo").build()
        );

        permissionRepository.saveAll(defaults);
        log.info("Đã seed {} quyền vào bảng permissions.", defaults.size());
        return defaults.size();
    }

    private PermissionDTO toDTO(Permission p) {
        return PermissionDTO.builder()
                .id(p.getId())
                .category(p.getCategory())
                .description(p.getDescription())
                .name(p.getName())
                .build();
    }
}
