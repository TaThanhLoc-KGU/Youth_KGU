package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.PhanCongDiemDanhDTO;
import com.tathanhloc.faceattendance.DTO.PhanCongDiemDanhRequest;
import com.tathanhloc.faceattendance.Exception.ResourceNotFoundException;
import com.tathanhloc.faceattendance.Model.BCHDoanHoi;
import com.tathanhloc.faceattendance.Model.HoatDong;
import com.tathanhloc.faceattendance.Model.PhanCongDiemDanh;
import com.tathanhloc.faceattendance.Repository.BCHDoanHoiRepository;
import com.tathanhloc.faceattendance.Repository.HoatDongRepository;
import com.tathanhloc.faceattendance.Repository.PhanCongDiemDanhRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý phân công điểm danh cho các hoạt động
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PhanCongDiemDanhService {

    private final PhanCongDiemDanhRepository phanCongRepository;
    private final HoatDongRepository hoatDongRepository;
    private final BCHDoanHoiRepository bchRepository;

    /**
     * Phân công người điểm danh cho hoạt động
     * @param request Thông tin phân công
     * @return List của PhanCongDiemDanhDTO
     */
    @Transactional
    public List<PhanCongDiemDanhDTO> phanCongNguoiDiemDanh(PhanCongDiemDanhRequest request) {
        log.info("Phân công người điểm danh cho hoạt động: {}", request.getMaHoatDong());

        // Validate hoạt động tồn tại
        HoatDong hoatDong = hoatDongRepository.findById(request.getMaHoatDong())
                .orElseThrow(() -> {
                    log.error("Không tìm thấy hoạt động: {}", request.getMaHoatDong());
                    return new ResourceNotFoundException("Hoạt động không tồn tại");
                });

        // Validate danh sách BCH không trống
        if (request.getDanhSachMaBch() == null || request.getDanhSachMaBch().isEmpty()) {
            log.error("Danh sách BCH trống");
            throw new IllegalArgumentException("Danh sách BCH không được để trống");
        }

        List<PhanCongDiemDanh> phanCongs = request.getDanhSachMaBch().stream()
                .map(maBch -> {
                    // Validate BCH tồn tại
                    BCHDoanHoi bch = bchRepository.findById(maBch)
                            .orElseThrow(() -> {
                                log.error("Không tìm thấy BCH: {}", maBch);
                                return new ResourceNotFoundException("BCH không tồn tại: " + maBch);
                            });

                    // Kiểm tra không trùng lặp
                    if (phanCongRepository.existsByHoatDongAndBch(request.getMaHoatDong(), maBch)) {
                        log.warn("BCH {} đã được phân công cho hoạt động {}", maBch, request.getMaHoatDong());
                        throw new IllegalArgumentException("BCH " + maBch + " đã được phân công cho hoạt động này");
                    }

                    // Tạo phân công mới
                    return PhanCongDiemDanh.builder()
                            .hoatDong(hoatDong)
                            .bchPhuTrach(bch)
                            .vaiTro(request.getVaiTro() != null ? request.getVaiTro() : "CHINH")
                            .ghiChu(request.getGhiChu())
                            .isActive(true)
                            .build();
                })
                .collect(Collectors.toList());

        // Lưu tất cả phân công
        List<PhanCongDiemDanh> saved = phanCongRepository.saveAll(phanCongs);
        log.info("Đã phân công {} người điểm danh cho hoạt động {}", saved.size(), request.getMaHoatDong());

        return saved.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách người được phân công điểm danh cho một hoạt động
     * @param maHoatDong Mã hoạt động
     * @return List của PhanCongDiemDanhDTO
     */
    public List<PhanCongDiemDanhDTO> getDanhSachNguoiDiemDanh(String maHoatDong) {
        log.info("Lấy danh sách người điểm danh cho hoạt động: {}", maHoatDong);

        return phanCongRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Xóa phân công (soft delete)
     * @param maHoatDong Mã hoạt động
     * @param maBch Mã BCH
     */
    @Transactional
    public void xoaPhanCong(String maHoatDong, String maBch) {
        log.info("Xóa phân công hoạt động {} - BCH {}", maHoatDong, maBch);

        PhanCongDiemDanh phanCong = phanCongRepository.findByHoatDongAndBch(maHoatDong, maBch)
                .orElseThrow(() -> {
                    log.error("Không tìm thấy phân công: {} - {}", maHoatDong, maBch);
                    return new ResourceNotFoundException("Phân công không tồn tại");
                });

        phanCong.setIsActive(false);
        phanCongRepository.save(phanCong);
        log.info("Đã xóa phân công hoạt động {} - BCH {}", maHoatDong, maBch);
    }

    /**
     * Lấy danh sách hoạt động được phân công cho một BCH
     * @param maBch Mã BCH
     * @return List của PhanCongDiemDanhDTO
     */
    public List<PhanCongDiemDanhDTO> getDanhSachHoatDongCuaBCH(String maBch) {
        log.info("Lấy danh sách hoạt động được phân công cho BCH: {}", maBch);

        return phanCongRepository.findByBchMaBchAndIsActiveTrue(maBch)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert PhanCongDiemDanh entity to DTO
     */
    private PhanCongDiemDanhDTO toDTO(PhanCongDiemDanh phanCong) {
        String tenBch = "N/A";
        String hoTenSinhVien = "N/A";

        BCHDoanHoi bch = phanCong.getBchPhuTrach();
        if (bch != null) {
            // Lấy tên từ relationship
            if (bch.getSinhVien() != null) {
                hoTenSinhVien = bch.getSinhVien().getHoTen();
                tenBch = bch.getMaBch();
            } else if (bch.getGiangVien() != null) {
                hoTenSinhVien = bch.getGiangVien().getHoTen();
                tenBch = bch.getMaBch();
            } else if (bch.getChuyenVien() != null) {
                hoTenSinhVien = bch.getChuyenVien().getHoTen();
                tenBch = bch.getMaBch();
            }
        }

        return PhanCongDiemDanhDTO.builder()
                .id(phanCong.getId())
                .maHoatDong(phanCong.getHoatDong().getMaHoatDong())
                .tenHoatDong(phanCong.getHoatDong().getTenHoatDong())
                .maBch(phanCong.getBchPhuTrach().getMaBch())
                .tenBch(tenBch)
                .hoTenSinhVien(hoTenSinhVien)
                .vaiTro(phanCong.getVaiTro())
                .ghiChu(phanCong.getGhiChu())
                .ngayPhanCong(phanCong.getNgayPhanCong())
                .isActive(phanCong.getIsActive())
                .build();
    }
}
