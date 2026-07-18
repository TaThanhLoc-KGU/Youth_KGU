package com.tathanhloc.youthkgu.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.DTO.DiemRenLuyenDTO;
import com.tathanhloc.youthkgu.DTO.DiemRenLuyenLichSuDTO;
import com.tathanhloc.youthkgu.Model.DiemRenLuyen;
import com.tathanhloc.youthkgu.Model.DiemRenLuyenLichSu;
import com.tathanhloc.youthkgu.Repository.DiemRenLuyenLichSuRepository;
import com.tathanhloc.youthkgu.Repository.DiemRenLuyenRepository;
import com.tathanhloc.youthkgu.Repository.DrlMauDanhGiaRepository;
import com.tathanhloc.youthkgu.Repository.HocKyRepository;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiemRenLuyenService {

    private final DiemRenLuyenRepository drlRepo;
    private final DiemRenLuyenLichSuRepository lichSuRepo;
    private final DrlMauDanhGiaRepository mauRepo;
    private final SinhVienRepository sinhVienRepo;
    private final HocKyRepository hocKyRepo;
    private final ObjectMapper objectMapper;

    /** Trả về mauId mặc định (active + mới nhất) nếu không truyền vào */
    private Long resolveDefaultMauId() {
        return mauRepo.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                .map(m -> m.getId())
                .orElseThrow(() -> new RuntimeException("Chưa có mẫu đánh giá nào được kích hoạt"));
    }

    // ── Xếp loại ───────────────────────────────────────────────────────────────

    public static String tinhXepLoai(int tongDiem) {
        if (tongDiem >= 90) return "XUAT_SAC";
        if (tongDiem >= 80) return "TOT";
        if (tongDiem >= 65) return "KHA";
        if (tongDiem >= 50) return "TRUNG_BINH";
        if (tongDiem >= 35) return "YEU";
        return "KEM";
    }

    // ── Lưu / cập nhật điểm ─────────────────────────────────────────────────

    /**
     * Tạo mới hoặc cập nhật điểm rèn luyện.
     * Mỗi lần gọi = 1 version mới được ghi vào lich_su.
     */
    @Transactional
    public DiemRenLuyenDTO upsert(String maSv, String maHocKy,
                                   Long mauId,
                                   Map<String, Integer> scores,
                                   String ghiChu, String lyDoThayDoi,
                                   String nguoiThucHien) {
        if (mauId == null) mauId = resolveDefaultMauId();
        String scoresJson = toJson(scores);
        int tongDiem = scores.values().stream().mapToInt(v -> v == null ? 0 : v).sum();
        tongDiem = Math.min(tongDiem, 100); // điểm tối đa 100
        String xepLoai = tinhXepLoai(tongDiem);

        Optional<DiemRenLuyen> existing = drlRepo.findByMaSvAndMaHocKy(maSv, maHocKy);
        DiemRenLuyen drl;

        final Long resolvedMauId = mauId;
        if (existing.isPresent()) {
            drl = existing.get();
            if ("KHOA".equals(drl.getTrangThai())) {
                throw new IllegalStateException("Điểm rèn luyện đã bị khóa, không thể chỉnh sửa");
            }
            drl.setMauId(resolvedMauId);
            drl.setScores(scoresJson);
            drl.setTongDiem(tongDiem);
            drl.setXepLoai(xepLoai);
            drl.setGhiChu(ghiChu);
            drl.setNguoiCapNhat(nguoiThucHien);
            drl.setVersion(drl.getVersion() + 1);
            drl.setUpdatedAt(LocalDateTime.now());
        } else {
            drl = DiemRenLuyen.builder()
                    .maSv(maSv)
                    .maHocKy(maHocKy)
                    .mauId(resolvedMauId)
                    .scores(scoresJson)
                    .tongDiem(tongDiem)
                    .xepLoai(xepLoai)
                    .ghiChu(ghiChu)
                    .nguoiTao(nguoiThucHien)
                    .nguoiCapNhat(nguoiThucHien)
                    .trangThai("NHAP")
                    .version(1)
                    .build();
        }

        drl = drlRepo.save(drl);

        // Ghi lịch sử
        lichSuRepo.save(DiemRenLuyenLichSu.builder()
                .drlId(drl.getId())
                .maSv(maSv)
                .maHocKy(maHocKy)
                .mauId(resolvedMauId)
                .version(drl.getVersion())
                .scores(scoresJson)
                .tongDiem(tongDiem)
                .xepLoai(xepLoai)
                .ghiChu(ghiChu)
                .lyDoThayDoi(lyDoThayDoi)
                .nguoiThucHien(nguoiThucHien)
                .build());

        log.info("DiemRenLuyen upsert: maSv={} maHocKy={} version={} tongDiem={} by={}",
                maSv, maHocKy, drl.getVersion(), tongDiem, nguoiThucHien);

        return toDTO(drl);
    }

    // ── Phê duyệt / Khóa ────────────────────────────────────────────────────

    @Transactional
    public DiemRenLuyenDTO duyet(Long id, String nguoiDuyet) {
        DiemRenLuyen drl = drlRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy điểm rèn luyện id=" + id));
        drl.setTrangThai("DA_DUYET");
        drl.setNguoiCapNhat(nguoiDuyet);
        drl.setUpdatedAt(LocalDateTime.now());
        drlRepo.save(drl);

        lichSuRepo.save(DiemRenLuyenLichSu.builder()
                .drlId(drl.getId())
                .maSv(drl.getMaSv()).maHocKy(drl.getMaHocKy())
                .mauId(drl.getMauId())
                .version(drl.getVersion())
                .scores(drl.getScores())
                .tongDiem(drl.getTongDiem())
                .xepLoai(drl.getXepLoai())
                .lyDoThayDoi("PHÊ DUYỆT")
                .nguoiThucHien(nguoiDuyet)
                .build());
        return toDTO(drl);
    }

    @Transactional
    public DiemRenLuyenDTO khoa(Long id, String nguoiKhoa) {
        DiemRenLuyen drl = drlRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy điểm rèn luyện id=" + id));
        drl.setTrangThai("KHOA");
        drl.setNguoiCapNhat(nguoiKhoa);
        drl.setUpdatedAt(LocalDateTime.now());
        drlRepo.save(drl);

        lichSuRepo.save(DiemRenLuyenLichSu.builder()
                .drlId(drl.getId())
                .maSv(drl.getMaSv()).maHocKy(drl.getMaHocKy())
                .mauId(drl.getMauId())
                .version(drl.getVersion())
                .scores(drl.getScores())
                .tongDiem(drl.getTongDiem())
                .xepLoai(drl.getXepLoai())
                .lyDoThayDoi("KHÓA")
                .nguoiThucHien(nguoiKhoa)
                .build());
        return toDTO(drl);
    }

    // ── Đọc ─────────────────────────────────────────────────────────────────

    public Optional<DiemRenLuyenDTO> get(String maSv, String maHocKy) {
        return drlRepo.findByMaSvAndMaHocKy(maSv, maHocKy).map(this::toDTO);
    }

    public List<DiemRenLuyenDTO> getByMaSv(String maSv) {
        return drlRepo.findByMaSvOrderByMaHocKyDesc(maSv).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public Page<DiemRenLuyenDTO> getByHocKy(String maHocKy, String trangThai, int page, int size) {
        return drlRepo.findByHocKyPaged(maHocKy, trangThai,
                PageRequest.of(page, size)).map(this::toDTO);
    }

    public List<DiemRenLuyenLichSuDTO> getLichSu(String maSv, String maHocKy) {
        return lichSuRepo.findByMaSvAndMaHocKyOrderByVersionDesc(maSv, maHocKy)
                .stream().map(this::toLichSuDTO).collect(Collectors.toList());
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private DiemRenLuyenDTO toDTO(DiemRenLuyen e) {
        String tenSv = sinhVienRepo.findById(e.getMaSv())
                .map(sv -> sv.getHoTen()).orElse(null);
        String tenHocKy = hocKyRepo.findById(e.getMaHocKy())
                .map(hk -> hk.getTenHocKy()).orElse(null);
        String tenMau = e.getMauId() != null
                ? mauRepo.findById(e.getMauId()).map(m -> m.getTenMau()).orElse(null)
                : null;
        return DiemRenLuyenDTO.builder()
                .id(e.getId())
                .maSv(e.getMaSv())
                .tenSv(tenSv)
                .maHocKy(e.getMaHocKy())
                .tenHocKy(tenHocKy)
                .mauId(e.getMauId())
                .tenMau(tenMau)
                .scores(fromJson(e.getScores()))
                .tongDiem(e.getTongDiem())
                .xepLoai(e.getXepLoai())
                .trangThai(e.getTrangThai())
                .version(e.getVersion())
                .ghiChu(e.getGhiChu())
                .nguoiTao(e.getNguoiTao())
                .nguoiCapNhat(e.getNguoiCapNhat())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private DiemRenLuyenLichSuDTO toLichSuDTO(DiemRenLuyenLichSu e) {
        return DiemRenLuyenLichSuDTO.builder()
                .id(e.getId())
                .drlId(e.getDrlId())
                .maSv(e.getMaSv())
                .maHocKy(e.getMaHocKy())
                .mauId(e.getMauId())
                .version(e.getVersion())
                .scores(fromJson(e.getScores()))
                .tongDiem(e.getTongDiem())
                .xepLoai(e.getXepLoai())
                .ghiChu(e.getGhiChu())
                .lyDoThayDoi(e.getLyDoThayDoi())
                .nguoiThucHien(e.getNguoiThucHien())
                .thoiGian(e.getThoiGian())
                .build();
    }

    private String toJson(Map<String, Integer> map) {
        try {
            return objectMapper.writeValueAsString(map == null ? Map.of() : map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Integer> fromJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
