package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.TnCauHoiDTO;
import com.tathanhloc.youthkgu.DTO.TnCauHoiRequest;
import com.tathanhloc.youthkgu.Enum.DoKhoCauHoiEnum;
import com.tathanhloc.youthkgu.Enum.LoaiCauHoiEnum;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.TnCauHoi;
import com.tathanhloc.youthkgu.Model.TnDapAn;
import com.tathanhloc.youthkgu.Repository.TnCauHoiRepository;
import com.tathanhloc.youthkgu.Repository.TnDanhMucRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** CRUD ngân hàng câu hỏi trắc nghiệm. */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TnCauHoiService {

    private final TnCauHoiRepository cauHoiRepo;
    private final TnDanhMucRepository danhMucRepo;

    @Transactional(readOnly = true)
    public Page<TnCauHoiDTO> search(Long danhMucId, String doKho, String kw, Pageable pageable) {
        DoKhoEnumOrNull dk = parseDoKho(doKho);
        Page<TnCauHoi> page = cauHoiRepo.search(danhMucId, dk.value, blankToNull(kw), pageable);
        Map<Long, String> tenDanhMuc = danhMucRepo.findAll().stream()
                .collect(Collectors.toMap(d -> d.getId(), d -> d.getTen(), (a, b) -> a));
        return page.map(c -> toDTO(c, tenDanhMuc));
    }

    @Transactional(readOnly = true)
    public TnCauHoiDTO getById(Long id) {
        TnCauHoi c = findById(id);
        Map<Long, String> ten = c.getDanhMucId() == null ? Map.of()
                : danhMucRepo.findById(c.getDanhMucId()).map(d -> Map.of(d.getId(), d.getTen())).orElse(Map.of());
        return toDTO(c, ten);
    }

    public TnCauHoiDTO create(TnCauHoiRequest req, String createdBy) {
        validate(req);
        TnCauHoi c = TnCauHoi.builder()
                .noiDung(req.getNoiDung().trim())
                .loai(parseLoai(req.getLoai()))
                .doKho(parseDoKho(req.getDoKho()).valueOrDefault())
                .danhMucId(req.getDanhMucId())
                .diem(req.getDiem() != null ? req.getDiem() : BigDecimal.ONE)
                .giaiThich(req.getGiaiThich())
                .hinhAnh(req.getHinhAnh())
                .maKhoa(req.getMaKhoa())
                .isActive(true)
                .createdBy(createdBy)
                .build();
        applyDapAns(c, req);
        c = cauHoiRepo.save(c);
        log.info("Tạo câu hỏi TN id={} bởi {}", c.getId(), createdBy);
        return getById(c.getId());
    }

    public TnCauHoiDTO update(Long id, TnCauHoiRequest req) {
        validate(req);
        TnCauHoi c = findById(id);
        c.setNoiDung(req.getNoiDung().trim());
        c.setLoai(parseLoai(req.getLoai()));
        c.setDoKho(parseDoKho(req.getDoKho()).valueOrDefault());
        c.setDanhMucId(req.getDanhMucId());
        if (req.getDiem() != null) c.setDiem(req.getDiem());
        c.setGiaiThich(req.getGiaiThich());
        c.setHinhAnh(req.getHinhAnh());
        c.setMaKhoa(req.getMaKhoa());
        c.getDapAns().clear();      // orphanRemoval xoá đáp án cũ
        applyDapAns(c, req);
        cauHoiRepo.save(c);
        return getById(id);
    }

    /** Soft-delete — câu hỏi đã dùng trong đề/lượt thi KHÔNG được xoá cứng. */
    public void softDelete(Long id) {
        TnCauHoi c = findById(id);
        c.setIsActive(false);
        cauHoiRepo.save(c);
        log.info("Ẩn câu hỏi TN id={}", id);
    }

    // ================= helpers =================

    private void applyDapAns(TnCauHoi c, TnCauHoiRequest req) {
        int i = 0;
        for (TnCauHoiRequest.DapAnItem it : req.getDapAns()) {
            TnDapAn da = TnDapAn.builder()
                    .cauHoi(c)
                    .noiDung(it.getNoiDung() != null ? it.getNoiDung().trim() : "")
                    .dung(Boolean.TRUE.equals(it.getDung()))
                    .thuTu(it.getThuTu() != null ? it.getThuTu() : i)
                    .hinhAnh(it.getHinhAnh())
                    .build();
            c.getDapAns().add(da);
            i++;
        }
    }

    private void validate(TnCauHoiRequest req) {
        if (req.getNoiDung() == null || req.getNoiDung().isBlank())
            throw new BusinessException("NOI_DUNG_TRONG", "Nội dung câu hỏi không được trống");
        if (req.getDapAns() == null || req.getDapAns().size() < 2)
            throw new BusinessException("THIEU_DAP_AN", "Câu hỏi phải có ít nhất 2 đáp án");
        long soDung = req.getDapAns().stream().filter(d -> Boolean.TRUE.equals(d.getDung())).count();
        if (soDung == 0)
            throw new BusinessException("THIEU_DAP_AN_DUNG", "Phải chọn ít nhất 1 đáp án đúng");
        LoaiCauHoiEnum loai = parseLoai(req.getLoai());
        if (loai == LoaiCauHoiEnum.MOT_DAP_AN && soDung != 1)
            throw new BusinessException("SAI_SO_DAP_AN_DUNG", "Câu 'một đáp án' chỉ được có đúng 1 đáp án đúng");
        if (loai == LoaiCauHoiEnum.DUNG_SAI && req.getDapAns().size() != 2)
            throw new BusinessException("SAI_DUNG_SAI", "Câu 'Đúng/Sai' phải có đúng 2 đáp án");
    }

    private TnCauHoi findById(Long id) {
        return cauHoiRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi: " + id));
    }

    private LoaiCauHoiEnum parseLoai(String s) {
        if (s == null || s.isBlank()) return LoaiCauHoiEnum.MOT_DAP_AN;
        try { return LoaiCauHoiEnum.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return LoaiCauHoiEnum.MOT_DAP_AN; }
    }

    private DoKhoEnumOrNull parseDoKho(String s) {
        if (s == null || s.isBlank()) return new DoKhoEnumOrNull(null);
        try { return new DoKhoEnumOrNull(DoKhoCauHoiEnum.valueOf(s.trim().toUpperCase())); }
        catch (IllegalArgumentException e) { return new DoKhoEnumOrNull(null); }
    }

    private String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    private TnCauHoiDTO toDTO(TnCauHoi c, Map<Long, String> tenDanhMuc) {
        List<TnCauHoiDTO.DapAn> das = new ArrayList<>();
        c.getDapAns().forEach(d -> das.add(TnCauHoiDTO.DapAn.builder()
                .id(d.getId()).noiDung(d.getNoiDung()).dung(d.getDung())
                .thuTu(d.getThuTu()).hinhAnh(d.getHinhAnh()).build()));
        return TnCauHoiDTO.builder()
                .id(c.getId())
                .noiDung(c.getNoiDung())
                .loai(c.getLoai() != null ? c.getLoai().name() : null)
                .doKho(c.getDoKho() != null ? c.getDoKho().name() : null)
                .danhMucId(c.getDanhMucId())
                .danhMucTen(c.getDanhMucId() != null ? tenDanhMuc.get(c.getDanhMucId()) : null)
                .diem(c.getDiem())
                .giaiThich(c.getGiaiThich())
                .hinhAnh(c.getHinhAnh())
                .isActive(c.getIsActive())
                .dapAns(das)
                .build();
    }

    /** Wrapper cho phép doKho = null (nghĩa là "mọi mức độ"). */
    private record DoKhoEnumOrNull(DoKhoCauHoiEnum value) {
        DoKhoCauHoiEnum valueOrDefault() { return value != null ? value : DoKhoCauHoiEnum.TRUNG_BINH; }
    }
}
