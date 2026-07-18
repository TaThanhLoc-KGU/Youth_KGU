package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.DrlDanhMucDTO;
import com.tathanhloc.youthkgu.DTO.DrlMauDanhGiaDTO;
import com.tathanhloc.youthkgu.DTO.DrlTieuChiDTO;
import com.tathanhloc.youthkgu.Model.DrlDanhMuc;
import com.tathanhloc.youthkgu.Model.DrlMauDanhGia;
import com.tathanhloc.youthkgu.Model.DrlTieuChi;
import com.tathanhloc.youthkgu.Repository.DrlMauDanhGiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DrlMauDanhGiaService {

    private final DrlMauDanhGiaRepository mauRepo;

    // ── Lấy tất cả ───────────────────────────────────────────────────────────

    public List<DrlMauDanhGiaDTO> getAll() {
        return mauRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(m -> toDTO(m, false)).collect(Collectors.toList());
    }

    public List<DrlMauDanhGiaDTO> getActive() {
        return mauRepo.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream().map(m -> toDTO(m, false)).collect(Collectors.toList());
    }

    public DrlMauDanhGiaDTO getById(Long id) {
        DrlMauDanhGia mau = findOrThrow(id);
        return toDTO(mau, true);
    }

    // ── Tạo mới ──────────────────────────────────────────────────────────────

    @Transactional
    public DrlMauDanhGiaDTO create(DrlMauDanhGiaDTO req, String actor) {
        DrlMauDanhGia mau = DrlMauDanhGia.builder()
                .tenMau(req.getTenMau())
                .moTa(req.getMoTa())
                .namHoc(req.getNamHoc())
                .phienBan(1)
                .mauChaId(null)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .createdBy(actor)
                .build();
        mau = mauRepo.save(mau);
        if (req.getDanhMucList() != null) {
            saveDanhMucList(mau, req.getDanhMucList());
        }
        return toDTO(mauRepo.findById(mau.getId()).orElseThrow(), true);
    }

    // ── Cập nhật (tạo phiên bản mới — clone + bump version) ──────────────────

    @Transactional
    public DrlMauDanhGiaDTO createNewVersion(Long fromId, DrlMauDanhGiaDTO req, String actor) {
        DrlMauDanhGia parent = findOrThrow(fromId);

        DrlMauDanhGia newMau = DrlMauDanhGia.builder()
                .tenMau(req.getTenMau() != null ? req.getTenMau() : parent.getTenMau())
                .moTa(req.getMoTa() != null ? req.getMoTa() : parent.getMoTa())
                .namHoc(req.getNamHoc() != null ? req.getNamHoc() : parent.getNamHoc())
                .phienBan(parent.getPhienBan() + 1)
                .mauChaId(parent.getId())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .createdBy(actor)
                .build();
        newMau = mauRepo.save(newMau);

        List<DrlDanhMucDTO> danhMucSrc = req.getDanhMucList() != null
                ? req.getDanhMucList()
                : (parent.getDanhMucList() != null
                    ? parent.getDanhMucList().stream().map(dm -> toDTO(dm, true)).collect(Collectors.toList())
                    : List.of());
        saveDanhMucList(newMau, danhMucSrc);

        log.info("DrlMauDanhGia: new version {} from parent id={} by {}", newMau.getPhienBan(), fromId, actor);
        return toDTO(mauRepo.findById(newMau.getId()).orElseThrow(), true);
    }

    // ── Kích hoạt / Tắt ──────────────────────────────────────────────────────

    @Transactional
    public DrlMauDanhGiaDTO setActive(Long id, boolean active) {
        DrlMauDanhGia mau = findOrThrow(id);
        mau.setIsActive(active);
        mauRepo.save(mau);
        return toDTO(mau, false);
    }

    // ── Xóa ──────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        mauRepo.deleteById(id);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private void saveDanhMucList(DrlMauDanhGia mau, List<DrlDanhMucDTO> dtoList) {
        List<DrlDanhMuc> saved = new ArrayList<>();
        for (DrlDanhMucDTO dmDTO : dtoList) {
            DrlDanhMuc dm = DrlDanhMuc.builder()
                    .mau(mau)
                    .maDanhMuc(dmDTO.getMaDanhMuc())
                    .tenDanhMuc(dmDTO.getTenDanhMuc())
                    .diemToiDa(dmDTO.getDiemToiDa() != null ? dmDTO.getDiemToiDa() : 0)
                    .thuTu(dmDTO.getThuTu() != null ? dmDTO.getThuTu() : 0)
                    .build();

            if (dmDTO.getTieuChiList() != null) {
                List<DrlTieuChi> tcList = new ArrayList<>();
                for (DrlTieuChiDTO tcDTO : dmDTO.getTieuChiList()) {
                    tcList.add(DrlTieuChi.builder()
                            .danhMuc(dm)
                            .maTieuChi(tcDTO.getMaTieuChi())
                            .noiDung(tcDTO.getNoiDung())
                            .diemToiDa(tcDTO.getDiemToiDa() != null ? tcDTO.getDiemToiDa() : 0)
                            .chiTiet(tcDTO.getChiTiet())
                            .thuTu(tcDTO.getThuTu() != null ? tcDTO.getThuTu() : 0)
                            .build());
                }
                dm.setTieuChiList(tcList);
            }
            saved.add(dm);
        }
        mau.setDanhMucList(saved);
        mauRepo.save(mau);
    }

    private DrlMauDanhGia findOrThrow(Long id) {
        return mauRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mẫu đánh giá id=" + id));
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    DrlMauDanhGiaDTO toDTO(DrlMauDanhGia e, boolean withChildren) {
        List<DrlDanhMucDTO> dmList = null;
        if (withChildren && e.getDanhMucList() != null) {
            dmList = e.getDanhMucList().stream()
                    .map(dm -> toDTO(dm, true))
                    .collect(Collectors.toList());
        }
        return DrlMauDanhGiaDTO.builder()
                .id(e.getId())
                .tenMau(e.getTenMau())
                .moTa(e.getMoTa())
                .namHoc(e.getNamHoc())
                .phienBan(e.getPhienBan())
                .mauChaId(e.getMauChaId())
                .isActive(e.getIsActive())
                .createdBy(e.getCreatedBy())
                .createdAt(e.getCreatedAt())
                .danhMucList(dmList)
                .build();
    }

    DrlDanhMucDTO toDTO(DrlDanhMuc e, boolean withChildren) {
        List<DrlTieuChiDTO> tcList = null;
        if (withChildren && e.getTieuChiList() != null) {
            tcList = e.getTieuChiList().stream().map(this::toDTO).collect(Collectors.toList());
        }
        return DrlDanhMucDTO.builder()
                .id(e.getId())
                .mauId(e.getMau() != null ? e.getMau().getId() : null)
                .maDanhMuc(e.getMaDanhMuc())
                .tenDanhMuc(e.getTenDanhMuc())
                .diemToiDa(e.getDiemToiDa())
                .thuTu(e.getThuTu())
                .tieuChiList(tcList)
                .build();
    }

    DrlTieuChiDTO toDTO(DrlTieuChi e) {
        return DrlTieuChiDTO.builder()
                .id(e.getId())
                .danhMucId(e.getDanhMuc() != null ? e.getDanhMuc().getId() : null)
                .maTieuChi(e.getMaTieuChi())
                .noiDung(e.getNoiDung())
                .diemToiDa(e.getDiemToiDa())
                .chiTiet(e.getChiTiet())
                .thuTu(e.getThuTu())
                .build();
    }
}
