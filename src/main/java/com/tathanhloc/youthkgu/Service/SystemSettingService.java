package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.SystemSettingDTO;
import com.tathanhloc.youthkgu.Enum.KieuSettingEnum;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.SystemSetting;
import com.tathanhloc.youthkgu.Repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cấu hình / feature-flag chung của hệ thống. Theo đúng khuôn {@link CauHinhEmailService}:
 * <ul>
 *   <li>{@code @PostConstruct} nạp toàn bộ dòng vào 1 {@link ConcurrentHashMap} trong RAM.</li>
 *   <li>Các getter {@link #getBoolean}/{@link #getString}/{@link #getLong} CHỈ đọc cache — service khác
 *       gọi thoải mái, không phát sinh query.</li>
 *   <li>{@link #set} ghi DB + refresh cache (không cần restart).</li>
 *   <li>{@link #seedDefault} idempotent — {@code DataInitializer} gọi mỗi lần khởi động.</li>
 * </ul>
 * Hạn chế (giống CauHinhEmailService): {@code set()} chỉ refresh cache của instance hiện tại —
 * chỉ đúng khi deploy 1 instance. Đủ dùng cho hệ thống này.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {

    private final SystemSettingRepository repository;

    /** thứ tự nhóm hiển thị trên trang admin */
    private static final List<String> NHOM_ORDER = List.of("HOAT_DONG", "TIN_TUC", "GOP_Y", "HE_THONG");

    private final Map<String, SystemSetting> cache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        repository.findAll().forEach(s -> cache.put(s.getKhoaSetting(), s));
        log.info("System settings loaded: {} khoá", cache.size());
    }

    // ─── Getter (chỉ đọc cache) ─────────────────────────────────────────────────

    public boolean getBoolean(String key, boolean def) {
        SystemSetting s = cache.get(key);
        if (s == null || s.getGiaTri() == null) return def;
        String v = s.getGiaTri().trim();
        return "true".equalsIgnoreCase(v) || "1".equals(v);
    }

    public String getString(String key, String def) {
        SystemSetting s = cache.get(key);
        return (s == null || s.getGiaTri() == null) ? def : s.getGiaTri();
    }

    public long getLong(String key, long def) {
        SystemSetting s = cache.get(key);
        if (s == null || s.getGiaTri() == null) return def;
        try {
            return Long.parseLong(s.getGiaTri().trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    // ─── Seed (idempotent) ─────────────────────────────────────────────────────

    /** Chèn dòng mặc định nếu KHÓA chưa tồn tại. Ghi vào CÙNG instance cache. */
    @Transactional
    public void seedDefault(String key, String giaTri, KieuSettingEnum kieu,
                            String nhom, String moTa, boolean congKhai) {
        if (cache.containsKey(key) || repository.existsById(key)) return;
        SystemSetting s = SystemSetting.builder()
                .khoaSetting(key)
                .giaTri(giaTri)
                .kieu(kieu)
                .nhom(nhom)
                .moTa(moTa)
                .congKhai(congKhai)
                .updatedAt(LocalDateTime.now())
                .updatedBy("system")
                .build();
        SystemSetting saved = repository.save(s);
        cache.put(key, saved);
        log.debug("Seed system setting: {} = {}", key, giaTri);
    }

    // ─── Admin API ─────────────────────────────────────────────────────────────

    public Map<String, List<SystemSettingDTO>> getAllGrouped() {
        Map<String, List<SystemSettingDTO>> byNhom = new HashMap<>();
        for (SystemSetting s : repository.findAll()) {
            byNhom.computeIfAbsent(s.getNhom() == null ? "KHAC" : s.getNhom(), k -> new ArrayList<>())
                  .add(toDTO(s));
        }
        byNhom.values().forEach(list -> list.sort(Comparator.comparing(SystemSettingDTO::key)));

        Map<String, List<SystemSettingDTO>> ordered = new LinkedHashMap<>();
        for (String nhom : NHOM_ORDER) {
            if (byNhom.containsKey(nhom)) ordered.put(nhom, byNhom.remove(nhom));
        }
        byNhom.forEach(ordered::put); // các nhóm còn lại (nếu có) xếp cuối
        return ordered;
    }

    public List<SystemSettingDTO> getPublic() {
        return repository.findByCongKhaiTrue().stream().map(this::toDTO).toList();
    }

    @Transactional
    public SystemSettingDTO set(String key, String giaTri, String updatedBy) {
        SystemSetting s = repository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cài đặt: " + key));
        s.setGiaTri(giaTri);
        s.setUpdatedAt(LocalDateTime.now());
        s.setUpdatedBy(updatedBy);
        SystemSetting saved = repository.save(s);
        cache.put(key, saved);
        log.info("System setting cập nhật bởi {}: {} = {}", updatedBy, key, giaTri);
        return toDTO(saved);
    }

    private SystemSettingDTO toDTO(SystemSetting s) {
        return new SystemSettingDTO(
                s.getKhoaSetting(), s.getGiaTri(), s.getKieu(), s.getNhom(), s.getMoTa(),
                Boolean.TRUE.equals(s.getCongKhai()), s.getUpdatedAt(), s.getUpdatedBy());
    }
}
