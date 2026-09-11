package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.TnDeThiCreateRequest;
import com.tathanhloc.youthkgu.DTO.TnDeThiDTO;
import com.tathanhloc.youthkgu.Enum.CheDoDeThiEnum;
import com.tathanhloc.youthkgu.Enum.CheDoHienKetQuaEnum;
import com.tathanhloc.youthkgu.Enum.DoKhoCauHoiEnum;
import com.tathanhloc.youthkgu.Enum.TrangThaiDeThiEnum;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Quản lý đề thi trắc nghiệm (phía Admin). Xử lý logic lưu 2 chế độ:
 *  - CO_DINH   : lưu danh sách câu hỏi + thứ tự vào tn_de_thi_cau_hoi.
 *  - NGAU_NHIEN: lưu cấu hình ma trận vào tn_ma_tran (đề chỉ sinh khi thí sinh bấm "Bắt đầu").
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TnDeThiService {

    private final TnDeThiRepository deThiRepo;
    private final TnDeThiCauHoiRepository deThiCauHoiRepo;
    private final TnMaTranRepository maTranRepo;
    private final TnCauHoiRepository cauHoiRepo;
    private final TnDanhMucRepository danhMucRepo;

    // ==================== TẠO / SỬA ====================

    public TnDeThiDTO create(TnDeThiCreateRequest req, String createdBy) {
        CheDoDeThiEnum cheDo = parseCheDo(req.getCheDo());
        validateCommon(req);

        TnDeThi d = TnDeThi.builder()
                .tieuDe(req.getTieuDe().trim())
                .moTa(req.getMoTa())
                .cheDo(cheDo)
                .maHoatDong(blankToNull(req.getMaHoatDong()))
                .maKhoa(blankToNull(req.getMaKhoa()))
                .thoiLuongPhut(nvl(req.getThoiLuongPhut(), 30))
                .moLuc(req.getMoLuc())
                .dongLuc(req.getDongLuc())
                .soLanLamToiDa(nvl(req.getSoLanLamToiDa(), 1))
                .tronCauHoi(nvl(req.getTronCauHoi(), true))
                .tronDapAn(nvl(req.getTronDapAn(), true))
                .chamDiemTungPhan(nvl(req.getChamDiemTungPhan(), false))
                .thangDiem(nvl(req.getThangDiem(), new BigDecimal("10.00")))
                .diemDat(req.getDiemDat())
                .cheDoHienKetQua(parseHienKetQua(req.getCheDoHienKetQua()))
                .choXemLaiBai(nvl(req.getChoXemLaiBai(), true))
                .hienDapAnDung(nvl(req.getHienDapAnDung(), true))
                .trangThai(TrangThaiDeThiEnum.NHAP)
                .isActive(true)
                .createdBy(createdBy)
                .build();
        d = deThiRepo.save(d);

        int tongSoCau = persistCauTrucDe(d, cheDo, req);
        d.setTongSoCau(tongSoCau);
        deThiRepo.save(d);

        log.info("Tạo đề thi TN id={} cheDo={} tongSoCau={} bởi {}", d.getId(), cheDo, tongSoCau, createdBy);
        return getDetail(d.getId());
    }

    public TnDeThiDTO update(Long id, TnDeThiCreateRequest req) {
        TnDeThi d = findById(id);
        if (d.getTrangThai() == TrangThaiDeThiEnum.DA_XUAT_BAN)
            throw new BusinessException("DE_DA_XUAT_BAN",
                    "Đề đã xuất bản — hãy đóng đề trước khi sửa cấu trúc câu hỏi");

        CheDoDeThiEnum cheDo = parseCheDo(req.getCheDo());
        validateCommon(req);

        d.setTieuDe(req.getTieuDe().trim());
        d.setMoTa(req.getMoTa());
        d.setCheDo(cheDo);
        d.setMaHoatDong(blankToNull(req.getMaHoatDong()));
        d.setMaKhoa(blankToNull(req.getMaKhoa()));
        d.setThoiLuongPhut(nvl(req.getThoiLuongPhut(), 30));
        d.setMoLuc(req.getMoLuc());
        d.setDongLuc(req.getDongLuc());
        d.setSoLanLamToiDa(nvl(req.getSoLanLamToiDa(), 1));
        d.setTronCauHoi(nvl(req.getTronCauHoi(), true));
        d.setTronDapAn(nvl(req.getTronDapAn(), true));
        d.setChamDiemTungPhan(nvl(req.getChamDiemTungPhan(), false));
        d.setThangDiem(nvl(req.getThangDiem(), new BigDecimal("10.00")));
        d.setDiemDat(req.getDiemDat());
        d.setCheDoHienKetQua(parseHienKetQua(req.getCheDoHienKetQua()));
        d.setChoXemLaiBai(nvl(req.getChoXemLaiBai(), true));
        d.setHienDapAnDung(nvl(req.getHienDapAnDung(), true));

        deThiCauHoiRepo.deleteByDeThiId(id);
        maTranRepo.deleteByDeThiId(id);
        int tongSoCau = persistCauTrucDe(d, cheDo, req);
        d.setTongSoCau(tongSoCau);
        deThiRepo.save(d);
        return getDetail(id);
    }

    /** Lưu cấu trúc đề theo chế độ → trả tổng số câu 1 lượt thi sẽ có. */
    private int persistCauTrucDe(TnDeThi d, CheDoDeThiEnum cheDo, TnDeThiCreateRequest req) {
        if (cheDo == CheDoDeThiEnum.CO_DINH) {
            List<TnDeThiCreateRequest.CauHoiCoDinhItem> items = req.getCauHoiCoDinh();
            if (items == null || items.isEmpty())
                throw new BusinessException("THIEU_CAU_HOI", "Đề cố định phải chọn ít nhất 1 câu hỏi");

            Set<Long> ids = items.stream().map(TnDeThiCreateRequest.CauHoiCoDinhItem::getCauHoiId)
                    .collect(Collectors.toSet());
            long tonTai = cauHoiRepo.findAllById(ids).stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsActive())).count();
            if (tonTai != ids.size())
                throw new BusinessException("CAU_HOI_KHONG_HOP_LE",
                        "Có câu hỏi không tồn tại hoặc đã bị ẩn trong danh sách");

            int i = 0;
            List<TnDeThiCauHoi> rows = new ArrayList<>();
            for (TnDeThiCreateRequest.CauHoiCoDinhItem it : items) {
                rows.add(TnDeThiCauHoi.builder()
                        .deThiId(d.getId())
                        .cauHoiId(it.getCauHoiId())
                        .thuTu(it.getThuTu() != null ? it.getThuTu() : i)
                        .diemGhiDe(it.getDiemGhiDe())
                        .build());
                i++;
            }
            deThiCauHoiRepo.saveAll(rows);
            return rows.size();

        } else { // NGAU_NHIEN
            List<TnDeThiCreateRequest.MaTranItem> items = req.getMaTran();
            if (items == null || items.isEmpty())
                throw new BusinessException("THIEU_MA_TRAN", "Đề ngẫu nhiên phải có ít nhất 1 dòng ma trận");

            int tong = 0;
            List<TnMaTran> rows = new ArrayList<>();
            int i = 0;
            for (TnDeThiCreateRequest.MaTranItem it : items) {
                if (it.getSoLuong() == null || it.getSoLuong() < 1)
                    throw new BusinessException("MA_TRAN_SO_LUONG", "Số lượng câu mỗi rổ phải >= 1");
                DoKhoCauHoiEnum dk = parseDoKho(it.getDoKho());
                // validate: ngân hàng có đủ câu cho rổ này không
                long khaDung = cauHoiRepo.demKhaDung(
                        it.getDanhMucId() != null ? it.getDanhMucId() : 0L,
                        dk != null ? dk.name() : "");
                if (khaDung < it.getSoLuong())
                    throw new BusinessException("MA_TRAN_KHONG_DU",
                            "Rổ [" + moTaRo(it.getDanhMucId(), dk) + "] cần " + it.getSoLuong()
                                    + " câu nhưng ngân hàng chỉ có " + khaDung);
                rows.add(TnMaTran.builder()
                        .deThiId(d.getId())
                        .danhMucId(it.getDanhMucId())
                        .doKho(dk)
                        .soLuong(it.getSoLuong())
                        .diemMoiCau(it.getDiemMoiCau())
                        .thuTu(i++)
                        .build());
                tong += it.getSoLuong();
            }
            maTranRepo.saveAll(rows);
            return tong;
        }
    }

    // ==================== XUẤT BẢN / ĐÓNG / XOÁ ====================

    public TnDeThiDTO doiTrangThai(Long id, String trangThai) {
        TnDeThi d = findById(id);
        TrangThaiDeThiEnum tt;
        try { tt = TrangThaiDeThiEnum.valueOf(trangThai.trim().toUpperCase()); }
        catch (Exception e) { throw new BusinessException("TRANG_THAI_SAI", "Trạng thái không hợp lệ"); }

        if (tt == TrangThaiDeThiEnum.DA_XUAT_BAN && d.getTongSoCau() == 0)
            throw new BusinessException("DE_RONG", "Đề chưa có câu hỏi/ma trận — không thể xuất bản");
        d.setTrangThai(tt);
        deThiRepo.save(d);
        log.info("Đề thi TN id={} -> {}", id, tt);
        return getDetail(id);
    }

    public void softDelete(Long id) {
        TnDeThi d = findById(id);
        d.setIsActive(false);
        deThiRepo.save(d);
    }

    // ==================== ĐỌC ====================

    @Transactional(readOnly = true)
    public Page<TnDeThiDTO> list(String maKhoa, Pageable pageable) {
        Page<TnDeThi> page = (maKhoa == null)
                ? deThiRepo.findByIsActiveTrueOrderByCreatedAtDesc(pageable)
                : deThiRepo.findScoped(maKhoa, pageable);
        return page.map(d -> toDTO(d, false));
    }

    @Transactional(readOnly = true)
    public TnDeThiDTO getDetail(Long id) {
        return toDTO(findById(id), true);
    }

    // ==================== helpers ====================

    private TnDeThi findById(Long id) {
        return deThiRepo.findById(id)
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi: " + id));
    }

    private void validateCommon(TnDeThiCreateRequest req) {
        if (req.getTieuDe() == null || req.getTieuDe().isBlank())
            throw new BusinessException("TIEU_DE_TRONG", "Tiêu đề đề thi không được trống");
        if (req.getThoiLuongPhut() != null && req.getThoiLuongPhut() < 1)
            throw new BusinessException("THOI_LUONG_SAI", "Thời lượng phải >= 1 phút");
        if (req.getMoLuc() != null && req.getDongLuc() != null && req.getDongLuc().isBefore(req.getMoLuc()))
            throw new BusinessException("CUA_SO_SAI", "Thời gian đóng đề phải sau thời gian mở đề");
    }

    private TnDeThiDTO toDTO(TnDeThi d, boolean full) {
        TnDeThiDTO.TnDeThiDTOBuilder b = TnDeThiDTO.builder()
                .id(d.getId()).tieuDe(d.getTieuDe()).moTa(d.getMoTa())
                .cheDo(d.getCheDo().name())
                .maHoatDong(d.getMaHoatDong()).maKhoa(d.getMaKhoa())
                .thoiLuongPhut(d.getThoiLuongPhut())
                .moLuc(d.getMoLuc()).dongLuc(d.getDongLuc())
                .soLanLamToiDa(d.getSoLanLamToiDa())
                .tronCauHoi(d.getTronCauHoi()).tronDapAn(d.getTronDapAn())
                .chamDiemTungPhan(d.getChamDiemTungPhan())
                .thangDiem(d.getThangDiem()).diemDat(d.getDiemDat())
                .cheDoHienKetQua(d.getCheDoHienKetQua().name())
                .choXemLaiBai(d.getChoXemLaiBai()).hienDapAnDung(d.getHienDapAnDung())
                .tongSoCau(d.getTongSoCau())
                .trangThai(d.getTrangThai().name())
                .createdAt(d.getCreatedAt());

        if (full) {
            if (d.getCheDo() == CheDoDeThiEnum.CO_DINH) {
                List<TnDeThiCauHoi> map = deThiCauHoiRepo.findByDeThiIdOrderByThuTuAsc(d.getId());
                Map<Long, String> noiDung = cauHoiRepo.findAllById(
                        map.stream().map(TnDeThiCauHoi::getCauHoiId).toList()).stream()
                        .collect(Collectors.toMap(TnCauHoi::getId, TnCauHoi::getNoiDung, (a, x) -> a));
                b.cauHoiCoDinh(map.stream().map(m -> TnDeThiDTO.TnDeThiCauHoiDTO.builder()
                        .cauHoiId(m.getCauHoiId()).thuTu(m.getThuTu()).diemGhiDe(m.getDiemGhiDe())
                        .noiDung(noiDung.get(m.getCauHoiId())).build()).toList());
            } else {
                Map<Long, String> tenDm = danhMucRepo.findAll().stream()
                        .collect(Collectors.toMap(TnDanhMuc::getId, TnDanhMuc::getTen, (a, x) -> a));
                b.maTran(maTranRepo.findByDeThiIdOrderByThuTuAsc(d.getId()).stream()
                        .map(m -> TnDeThiDTO.TnMaTranDTO.builder()
                                .danhMucId(m.getDanhMucId())
                                .danhMucTen(m.getDanhMucId() != null ? tenDm.get(m.getDanhMucId()) : null)
                                .doKho(m.getDoKho() != null ? m.getDoKho().name() : null)
                                .soLuong(m.getSoLuong()).diemMoiCau(m.getDiemMoiCau())
                                .soCauKhaDung(cauHoiRepo.demKhaDung(
                                        m.getDanhMucId() != null ? m.getDanhMucId() : 0L,
                                        m.getDoKho() != null ? m.getDoKho().name() : ""))
                                .build())
                        .toList());
            }
        }
        return b.build();
    }

    private String moTaRo(Long danhMucId, DoKhoCauHoiEnum dk) {
        String dm = danhMucId == null ? "mọi danh mục"
                : danhMucRepo.findById(danhMucId).map(TnDanhMuc::getTen).orElse("DM#" + danhMucId);
        return dm + " / " + (dk == null ? "mọi mức độ" : dk.getTenHienThi());
    }

    private CheDoDeThiEnum parseCheDo(String s) {
        try { return CheDoDeThiEnum.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { throw new BusinessException("CHE_DO_SAI", "Chế độ đề phải là CO_DINH hoặc NGAU_NHIEN"); }
    }

    private CheDoHienKetQuaEnum parseHienKetQua(String s) {
        if (s == null || s.isBlank()) return CheDoHienKetQuaEnum.NGAY;
        try { return CheDoHienKetQuaEnum.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { return CheDoHienKetQuaEnum.NGAY; }
    }

    private DoKhoCauHoiEnum parseDoKho(String s) {
        if (s == null || s.isBlank()) return null;
        try { return DoKhoCauHoiEnum.valueOf(s.trim().toUpperCase()); }
        catch (Exception e) { return null; }
    }

    private static <T> T nvl(T v, T def) { return v != null ? v : def; }
    private static String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }
}
