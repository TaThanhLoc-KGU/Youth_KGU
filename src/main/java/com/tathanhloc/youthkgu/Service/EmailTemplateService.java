package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.EmailTemplateDTO;
import com.tathanhloc.youthkgu.DTO.EmailTemplateRequest;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.EmailTemplate;
import com.tathanhloc.youthkgu.Repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Mẫu email hàng loạt đặt tên, tái sử dụng được — xem javadoc Model.EmailTemplate.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailTemplateService {

    private final EmailTemplateRepository repo;

    @Transactional(readOnly = true)
    public List<EmailTemplateDTO> getAll() {
        return repo.findByIsActiveTrueOrderByTenMauAsc().stream().map(this::toDTO).toList();
    }

    public EmailTemplateDTO create(EmailTemplateRequest req, String nguoiTao) {
        validate(req);
        EmailTemplate template = EmailTemplate.builder()
                .tenMau(req.getTenMau().trim())
                .tieuDe(req.getTieuDe().trim())
                .noiDung(req.getNoiDung())
                .nguoiTao(nguoiTao)
                .isActive(true)
                .build();
        EmailTemplate saved = repo.save(template);
        log.info("Tạo mẫu email id={} tenMau={} bởi {}", saved.getId(), saved.getTenMau(), nguoiTao);
        return toDTO(saved);
    }

    public EmailTemplateDTO update(Long id, EmailTemplateRequest req, String nguoiSua) {
        validate(req);
        EmailTemplate template = findById(id);
        template.setTenMau(req.getTenMau().trim());
        template.setTieuDe(req.getTieuDe().trim());
        template.setNoiDung(req.getNoiDung());
        template.setNguoiTao(nguoiSua);
        repo.save(template);
        log.info("Cập nhật mẫu email id={} bởi {}", id, nguoiSua);
        return toDTO(template);
    }

    public void delete(Long id) {
        EmailTemplate template = findById(id);
        template.setIsActive(false);
        repo.save(template);
        log.info("Xóa (mềm) mẫu email id={}", id);
    }

    private void validate(EmailTemplateRequest req) {
        if (req.getTenMau() == null || req.getTenMau().isBlank()) {
            throw new BusinessException("TEN_MAU_TRONG", "Vui lòng nhập tên mẫu");
        }
        if (req.getTieuDe() == null || req.getTieuDe().isBlank()) {
            throw new BusinessException("TIEU_DE_TRONG", "Vui lòng nhập tiêu đề email");
        }
        if (req.getNoiDung() == null || req.getNoiDung().isBlank()) {
            throw new BusinessException("NOI_DUNG_TRONG", "Vui lòng nhập nội dung email");
        }
    }

    private EmailTemplate findById(Long id) {
        return repo.findById(id)
                .filter(t -> !Boolean.FALSE.equals(t.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mẫu email: " + id));
    }

    private EmailTemplateDTO toDTO(EmailTemplate t) {
        return EmailTemplateDTO.builder()
                .id(t.getId())
                .tenMau(t.getTenMau())
                .tieuDe(t.getTieuDe())
                .noiDung(t.getNoiDung())
                .nguoiTao(t.getNguoiTao())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
