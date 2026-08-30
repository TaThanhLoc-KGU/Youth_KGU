package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.EmailGroupDTO;
import com.tathanhloc.youthkgu.DTO.EmailGroupRequest;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.EmailGroup;
import com.tathanhloc.youthkgu.Model.Khoa;
import com.tathanhloc.youthkgu.Repository.EmailGroupRepository;
import com.tathanhloc.youthkgu.Repository.KhoaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Quản lý nhóm mail (mail group) dùng cho tính năng gửi email hàng loạt.
 * Mỗi khoa tự quản lý nhóm mail của khoa mình (khoa scoping giống HoatDongService.getAll());
 * Đoàn trường/ADMIN thấy và quản lý được tất cả các nhóm.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailGroupService {

    private final EmailGroupRepository repo;
    private final KhoaRepository khoaRepository;
    private final KhoaScopeService khoaScopeService;

    @Transactional(readOnly = true)
    public List<EmailGroupDTO> getAll() {
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        List<EmailGroup> list = maKhoa != null
                ? repo.findByKhoaScopeOrGlobal(maKhoa)
                : repo.findByIsActiveTrueOrderByTenNhomAsc();
        return list.stream().map(this::toDTO).toList();
    }

    public EmailGroupDTO create(EmailGroupRequest req) {
        validate(req);
        EmailGroup group = EmailGroup.builder()
                .tenNhom(req.getTenNhom().trim())
                .diaChiEmail(req.getDiaChiEmail().trim())
                .khoa(resolveKhoa(req.getMaKhoa()))
                .isActive(true)
                .build();
        EmailGroup saved = repo.save(group);
        log.info("Tạo nhóm mail id={} tenNhom={}", saved.getId(), saved.getTenNhom());
        return toDTO(saved);
    }

    public EmailGroupDTO update(Long id, EmailGroupRequest req) {
        validate(req);
        EmailGroup group = findById(id);
        group.setTenNhom(req.getTenNhom().trim());
        group.setDiaChiEmail(req.getDiaChiEmail().trim());
        group.setKhoa(resolveKhoa(req.getMaKhoa()));
        repo.save(group);
        log.info("Cập nhật nhóm mail id={}", id);
        return toDTO(group);
    }

    public void delete(Long id) {
        EmailGroup group = findById(id);
        group.setIsActive(false);
        repo.save(group);
        log.info("Xóa (mềm) nhóm mail id={}", id);
    }

    private void validate(EmailGroupRequest req) {
        if (req.getTenNhom() == null || req.getTenNhom().isBlank()) {
            throw new BusinessException("TEN_NHOM_TRONG", "Vui lòng nhập tên nhóm mail");
        }
        if (req.getDiaChiEmail() == null || req.getDiaChiEmail().isBlank()) {
            throw new BusinessException("DIA_CHI_TRONG", "Vui lòng nhập địa chỉ email của nhóm");
        }
        if (!req.getDiaChiEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BusinessException("DIA_CHI_KHONG_HOP_LE", "Địa chỉ email không hợp lệ: " + req.getDiaChiEmail());
        }
    }

    private Khoa resolveKhoa(String maKhoa) {
        if (maKhoa == null || maKhoa.isBlank()) return null;
        return khoaRepository.findById(maKhoa)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa: " + maKhoa));
    }

    private EmailGroup findById(Long id) {
        return repo.findById(id)
                .filter(g -> !Boolean.FALSE.equals(g.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mail: " + id));
    }

    private EmailGroupDTO toDTO(EmailGroup g) {
        return EmailGroupDTO.builder()
                .id(g.getId())
                .tenNhom(g.getTenNhom())
                .diaChiEmail(g.getDiaChiEmail())
                .maKhoa(g.getKhoa() != null ? g.getKhoa().getMaKhoa() : null)
                .tenKhoa(g.getKhoa() != null ? g.getKhoa().getTenKhoa() : null)
                .isActive(g.getIsActive())
                .build();
    }
}
