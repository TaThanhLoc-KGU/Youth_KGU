package com.tathanhloc.youthkgu.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.DTO.ChungNhanTemplateDTO;
import com.tathanhloc.youthkgu.DTO.ChungNhanTemplateFieldDTO;
import com.tathanhloc.youthkgu.DTO.ChungNhanTemplateImageResult;
import com.tathanhloc.youthkgu.Model.ChungNhanTemplate;
import com.tathanhloc.youthkgu.Repository.ChungNhanTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Quản lý mẫu chứng nhận (CRUD). Việc render chứng nhận thật cho từng sinh viên nằm ở
 * ChungNhanRenderService — service này chỉ quản lý dữ liệu mẫu (ảnh nền + vị trí trường).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChungNhanTemplateService {

    private final ChungNhanTemplateRepository templateRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ChungNhanTemplateDTO> getAllActive() {
        return templateRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChungNhanTemplateDTO getById(Long id) {
        ChungNhanTemplate entity = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mẫu chứng nhận: " + id));
        return toDTO(entity);
    }

    /** Entity thô — dùng nội bộ bởi ChungNhanRenderService (cần hinhNen tuyệt đối để load ảnh). */
    @Transactional(readOnly = true)
    public ChungNhanTemplate getEntityById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mẫu chứng nhận: " + id));
    }

    @Transactional
    public ChungNhanTemplateDTO create(String ten, MultipartFile hinhNen, List<ChungNhanTemplateFieldDTO> fields) {
        if (hinhNen == null || hinhNen.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ảnh nền cho mẫu chứng nhận");
        }
        ChungNhanTemplateImageResult img = fileStorageService.saveChungNhanTemplateImage(hinhNen);

        ChungNhanTemplate entity = ChungNhanTemplate.builder()
                .ten(ten)
                .hinhNen(img.getDuongDan())
                .chieuRongPx(img.getChieuRongPx())
                .chieuCaoPx(img.getChieuCaoPx())
                .fieldsJson(toJson(fields))
                .isActive(true)
                .build();
        entity = templateRepository.save(entity);
        log.info("Created chung-nhan template: id={}, ten={}", entity.getId(), entity.getTen());
        return toDTO(entity);
    }

    @Transactional
    public ChungNhanTemplateDTO update(Long id, String ten, MultipartFile hinhNenMoi, List<ChungNhanTemplateFieldDTO> fields) {
        ChungNhanTemplate entity = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mẫu chứng nhận: " + id));

        if (ten != null && !ten.isBlank()) entity.setTen(ten);
        if (fields != null) entity.setFieldsJson(toJson(fields));

        if (hinhNenMoi != null && !hinhNenMoi.isEmpty()) {
            String oldPath = entity.getHinhNen();
            ChungNhanTemplateImageResult img = fileStorageService.saveChungNhanTemplateImage(hinhNenMoi);
            entity.setHinhNen(img.getDuongDan());
            entity.setChieuRongPx(img.getChieuRongPx());
            entity.setChieuCaoPx(img.getChieuCaoPx());
            fileStorageService.deleteFile(oldPath);
        }

        entity = templateRepository.save(entity);
        log.info("Updated chung-nhan template: id={}", id);
        return toDTO(entity);
    }

    @Transactional
    public void delete(Long id) {
        ChungNhanTemplate entity = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mẫu chứng nhận: " + id));
        entity.setIsActive(false);
        templateRepository.save(entity);
        log.info("Soft-deleted chung-nhan template: id={}", id);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private String toJson(List<ChungNhanTemplateFieldDTO> fields) {
        try {
            return objectMapper.writeValueAsString(fields != null ? fields : Collections.emptyList());
        } catch (Exception e) {
            throw new RuntimeException("Không thể lưu cấu hình trường nội dung: " + e.getMessage());
        }
    }

    List<ChungNhanTemplateFieldDTO> parseFields(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ChungNhanTemplateFieldDTO>>() {});
        } catch (Exception e) {
            log.error("Lỗi parse fieldsJson của mẫu chứng nhận: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private ChungNhanTemplateDTO toDTO(ChungNhanTemplate entity) {
        return ChungNhanTemplateDTO.builder()
                .id(entity.getId())
                .ten(entity.getTen())
                .hinhNen(entity.getHinhNen())
                .chieuRongPx(entity.getChieuRongPx())
                .chieuCaoPx(entity.getChieuCaoPx())
                .fields(parseFields(entity.getFieldsJson()))
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
