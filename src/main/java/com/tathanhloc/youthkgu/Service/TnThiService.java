package com.tathanhloc.youthkgu.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tathanhloc.youthkgu.DTO.TnAutoSaveRequest;
import com.tathanhloc.youthkgu.DTO.TnKetQuaResponse;
import com.tathanhloc.youthkgu.DTO.TnLamBaiResponse;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Exception.ResourceNotFoundException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Luồng làm bài của thí sinh: Bắt đầu thi → Auto-save → Nộp bài (tự chấm).
 *
 * Bất biến quan trọng (yêu cầu nghiệp vụ):
 *  - Đề của một lượt thi được GHI CỨNG vào tn_luot_thi_cau_hoi ngay khi lượt được tạo.
 *  - F5 / mất mạng / đổi thiết bị → luôn load lại đúng bộ đề cũ, KHÔNG random lại.
 *  - Đồng hồ đếm ngược do server quyết (tn_luot_thi.thoi_gian_han_nop).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TnThiService {

    private final TnDeThiRepository deThiRepo;
    private final TnDeThiCauHoiRepository deThiCauHoiRepo;
    private final TnMaTranRepository maTranRepo;
    private final TnCauHoiRepository cauHoiRepo;
    private final TnDapAnRepository dapAnRepo;
    private final TnLuotThiRepository luotThiRepo;
    private final TnLuotThiCauHoiRepository luotChRepo;
    private final KhoaScopeService khoaScopeService;
    private final ObjectMapper om;

    /** Ân hạn cho lệch giờ client/mạng khi auto-save / nộp sát giờ. */
    private static final long GRACE_SECONDS = 30;

    // ============================================================
    // 1) BẮT ĐẦU THI
    // ============================================================

    public TnLamBaiResponse batDau(Long deThiId, String maSv, String ip, String userAgent) {
        if (maSv == null || maSv.isBlank())
            throw new BusinessException("KHONG_PHAI_DOAN_VIEN",
                    "Tài khoản của bạn chưa gắn hồ sơ đoàn viên — không thể dự thi");

        TnDeThi de = deThiRepo.findById(deThiId)
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi: " + deThiId));

        LocalDateTime now = LocalDateTime.now();
        if (de.getTrangThai() != TrangThaiDeThiEnum.DA_XUAT_BAN)
            throw new BusinessException("DE_CHUA_MO", "Đề thi chưa được mở");
        if (de.getMoLuc() != null && now.isBefore(de.getMoLuc()))
            throw new BusinessException("CHUA_DEN_GIO", "Chưa đến giờ làm bài");
        if (de.getDongLuc() != null && now.isAfter(de.getDongLuc()))
            throw new BusinessException("DE_DA_DONG", "Đề thi đã đóng");
        if (de.getMaKhoa() != null) {
            String khoaSv = khoaScopeService.getCurrentMaKhoa();
            if (khoaSv != null && !de.getMaKhoa().equals(khoaSv))
                throw new AccessDeniedException("Đề thi này chỉ dành cho đoàn viên khoa " + de.getMaKhoa());
        }

        // --- F5 / khôi phục: có lượt DANG_LAM chưa? (khoá bi quan chống mở nhiều tab) ---
        Optional<TnLuotThi> dangLam = luotThiRepo.lockLuotDangLam(deThiId, maSv);
        if (dangLam.isPresent()) {
            TnLuotThi lt = dangLam.get();
            if (now.isAfter(lt.getThoiGianHanNop().plusSeconds(GRACE_SECONDS))) {
                chamVaChot(lt, TrangThaiLuotThiEnum.TU_DONG_NOP);   // quá giờ → tự nộp phần đã làm
            } else {
                return buildLamBaiResponse(de, lt, true);           // còn giờ → trả đúng bộ đề cũ
            }
        }

        // --- Sinh lượt mới ---
        long daLam = luotThiRepo.countByDeThiIdAndMaSv(deThiId, maSv);
        if (daLam >= de.getSoLanLamToiDa())
            throw new BusinessException("HET_LUOT", "Bạn đã dùng hết " + de.getSoLanLamToiDa() + " lượt thi");

        LocalDateTime hanNop = now.plusMinutes(de.getThoiLuongPhut());
        if (de.getDongLuc() != null && hanNop.isAfter(de.getDongLuc())) hanNop = de.getDongLuc();

        List<Long> cauHoiIds = de.getCheDo() == CheDoDeThiEnum.CO_DINH
                ? layCauHoiCoDinh(deThiId)
                : sinhDeNgauNhien(deThiId);
        if (cauHoiIds.isEmpty())
            throw new BusinessException("DE_RONG", "Không bốc được câu hỏi nào cho đề này");

        if (Boolean.TRUE.equals(de.getTronCauHoi())) Collections.shuffle(cauHoiIds);

        TnLuotThi lt = luotThiRepo.save(TnLuotThi.builder()
                .deThiId(deThiId).maSv(maSv)
                .lanThu((int) daLam + 1)
                .trangThai(TrangThaiLuotThiEnum.DANG_LAM)
                .thoiGianBatDau(now).thoiGianHanNop(hanNop)
                .tongSoCau(cauHoiIds.size())
                .ipAddress(ip).userAgent(cat(userAgent, 255))
                .build());

        khoaBoDe(de, lt, cauHoiIds);   // GHI CỨNG bộ đề + snapshot
        log.info("Bắt đầu lượt thi id={} de={} sv={} lần {} ({} câu)",
                lt.getId(), deThiId, maSv, lt.getLanThu(), cauHoiIds.size());
        return buildLamBaiResponse(de, lt, false);
    }

    private List<Long> layCauHoiCoDinh(Long deThiId) {
        return deThiCauHoiRepo.findByDeThiIdOrderByThuTuAsc(deThiId).stream()
                .map(TnDeThiCauHoi::getCauHoiId).collect(Collectors.toCollection(ArrayList::new));
    }

    /** Bốc theo ma trận — chỉ chạy tại thời điểm này (yêu cầu: đề chỉ sinh khi bấm "Bắt đầu"). */
    private List<Long> sinhDeNgauNhien(Long deThiId) {
        LinkedHashSet<Long> ket = new LinkedHashSet<>();
        for (TnMaTran ro : maTranRepo.findByDeThiIdOrderByThuTuAsc(deThiId)) {
            long dm = ro.getDanhMucId() != null ? ro.getDanhMucId() : 0L;
            String dk = ro.getDoKho() != null ? ro.getDoKho().name() : "";
            // bốc dư để bù phần trùng với rổ trước
            List<Long> boc = cauHoiRepo.bocNgauNhien(dm, dk, ro.getSoLuong() + ket.size());
            int themVao = 0;
            for (Long id : boc) {
                if (themVao >= ro.getSoLuong()) break;
                if (ket.add(id)) themVao++;
            }
            if (themVao < ro.getSoLuong())
                log.warn("Ma trận đề {} rổ (dm={},dk={}) thiếu câu: cần {} chỉ có {}",
                        deThiId, dm, dk, ro.getSoLuong(), themVao);
        }
        return new ArrayList<>(ket);
    }

    /** Ghi cứng từng câu của lượt thi + snapshot nội dung & đáp án (đã trộn). */
    private void khoaBoDe(TnDeThi de, TnLuotThi lt, List<Long> cauHoiIds) {
        Map<Long, TnCauHoi> chMap = cauHoiRepo.findAllById(cauHoiIds).stream()
                .collect(Collectors.toMap(TnCauHoi::getId, c -> c));
        Map<Long, List<TnDapAn>> daMap = dapAnRepo.findByCauHoiIdInOrderByThuTuAsc(cauHoiIds).stream()
                .collect(Collectors.groupingBy(d -> d.getCauHoi().getId()));

        Map<Long, BigDecimal> diemGhiDe = new HashMap<>();
        Map<Long, BigDecimal> diemMaTran = new HashMap<>();
        if (de.getCheDo() == CheDoDeThiEnum.CO_DINH) {
            deThiCauHoiRepo.findByDeThiIdOrderByThuTuAsc(de.getId())
                    .forEach(m -> { if (m.getDiemGhiDe() != null) diemGhiDe.put(m.getCauHoiId(), m.getDiemGhiDe()); });
        } else {
            // gán điểm theo rổ: câu bốc từ rổ nào thì lấy diemMoiCau của rổ đó (xấp xỉ theo danh mục+độ khó)
            for (TnMaTran ro : maTranRepo.findByDeThiIdOrderByThuTuAsc(de.getId())) {
                if (ro.getDiemMoiCau() == null) continue;
                for (Long id : cauHoiIds) {
                    TnCauHoi c = chMap.get(id);
                    if (c == null || diemMaTran.containsKey(id)) continue;
                    boolean khopDm = ro.getDanhMucId() == null || ro.getDanhMucId().equals(c.getDanhMucId());
                    boolean khopDk = ro.getDoKho() == null || ro.getDoKho() == c.getDoKho();
                    if (khopDm && khopDk) diemMaTran.put(id, ro.getDiemMoiCau());
                }
            }
        }

        List<TnLuotThiCauHoi> rows = new ArrayList<>();
        for (int i = 0; i < cauHoiIds.size(); i++) {
            Long chId = cauHoiIds.get(i);
            TnCauHoi c = chMap.get(chId);
            if (c == null) continue;

            List<TnDapAn> das = new ArrayList<>(daMap.getOrDefault(chId, List.of()));
            if (Boolean.TRUE.equals(de.getTronDapAn())) Collections.shuffle(das);

            List<Map<String, Object>> snapshot = das.stream().map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", d.getId());
                m.put("noiDung", d.getNoiDung());
                if (d.getHinhAnh() != null) m.put("hinhAnh", d.getHinhAnh());
                return m;
            }).toList();
            List<Long> dungIds = das.stream().filter(d -> Boolean.TRUE.equals(d.getDung()))
                    .map(TnDapAn::getId).toList();

            BigDecimal diem = diemGhiDe.getOrDefault(chId,
                    diemMaTran.getOrDefault(chId, c.getDiem() != null ? c.getDiem() : BigDecimal.ONE));

            rows.add(TnLuotThiCauHoi.builder()
                    .luotThiId(lt.getId())
                    .cauHoiId(chId)
                    .thuTu(i + 1)
                    .diem(diem)
                    .loai(c.getLoai())
                    .noiDungSnapshot(c.getNoiDung())
                    .hinhAnhSnapshot(c.getHinhAnh())
                    .dapAnSnapshot(toJson(snapshot))
                    .dapAnDungIds(toJson(dungIds))
                    .giaiThichSnapshot(c.getGiaiThich())
                    .daTraLoi(false).danhDau(false)
                    .build());
        }
        luotChRepo.saveAll(rows);
    }

    // ============================================================
    // 2) AUTO-SAVE
    // ============================================================

    public Map<String, Object> autoSave(Long luotThiId, Long cauHoiId, TnAutoSaveRequest req, String maSv) {
        TnLuotThi lt = layLuotCuaToi(luotThiId, maSv);
        if (lt.getTrangThai() != TrangThaiLuotThiEnum.DANG_LAM)
            throw new BusinessException("DA_NOP", "Lượt thi đã kết thúc — không thể lưu thêm");

        LocalDateTime now = LocalDateTime.now();
        boolean quaGio = now.isAfter(lt.getThoiGianHanNop().plusSeconds(GRACE_SECONDS));
        if (quaGio) {
            chamVaChot(lt, TrangThaiLuotThiEnum.TU_DONG_NOP);
            throw new BusinessException("HET_GIO", "Đã hết giờ làm bài — hệ thống đã tự động nộp");
        }

        TnLuotThiCauHoi row = luotChRepo.findByLuotThiIdAndCauHoiId(luotThiId, cauHoiId)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không thuộc lượt thi này"));

        List<Long> chon = req.getTraLoi() == null ? List.of()
                : req.getTraLoi().stream().filter(Objects::nonNull).distinct().toList();
        // chỉ chấp nhận id đáp án nằm trong snapshot của chính câu này
        Set<Long> hopLe = idsTrongSnapshot(row);
        chon = chon.stream().filter(hopLe::contains).toList();

        row.setTraLoi(chon.isEmpty() ? null : toJson(chon));
        row.setDaTraLoi(!chon.isEmpty());
        if (req.getDanhDau() != null) row.setDanhDau(req.getDanhDau());
        row.setThoiGianTraLoi(now);
        luotChRepo.save(row);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("saved", true);
        res.put("serverTime", now);
        res.put("thoiGianHanNop", lt.getThoiGianHanNop());
        res.put("conLaiGiay", Math.max(0, java.time.Duration.between(now, lt.getThoiGianHanNop()).getSeconds()));
        return res;
    }

    // ============================================================
    // 3) NỘP BÀI (tự chấm)
    // ============================================================

    public TnKetQuaResponse nopBai(Long luotThiId, String maSv) {
        TnLuotThi lt = layLuotCuaToi(luotThiId, maSv);
        if (lt.getTrangThai() != TrangThaiLuotThiEnum.DANG_LAM)
            return getKetQua(luotThiId, maSv);   // idempotent: đã nộp thì trả kết quả sẵn

        boolean quaGio = LocalDateTime.now().isAfter(lt.getThoiGianHanNop().plusSeconds(GRACE_SECONDS));
        chamVaChot(lt, quaGio ? TrangThaiLuotThiEnum.TU_DONG_NOP : TrangThaiLuotThiEnum.DA_NOP);
        return getKetQua(luotThiId, maSv);
    }

    /** Chấm toàn bộ câu + chốt điểm lượt thi. */
    private void chamVaChot(TnLuotThi lt, TrangThaiLuotThiEnum trangThaiCuoi) {
        TnDeThi de = deThiRepo.findById(lt.getDeThiId()).orElseThrow();
        List<TnLuotThiCauHoi> rows = luotChRepo.findByLuotThiIdOrderByThuTuAsc(lt.getId());

        BigDecimal diemTho = BigDecimal.ZERO, tongToiDa = BigDecimal.ZERO;
        int soCauDung = 0;
        for (TnLuotThiCauHoi r : rows) {
            tongToiDa = tongToiDa.add(r.getDiem());
            KetQuaCham kq = chamMot(r, Boolean.TRUE.equals(de.getChamDiemTungPhan()));
            r.setDung(kq.dungHoanToan);
            r.setDiemDatDuoc(kq.diem);
            diemTho = diemTho.add(kq.diem);
            if (kq.dungHoanToan) soCauDung++;
        }
        luotChRepo.saveAll(rows);

        BigDecimal diemQuyDoi = tongToiDa.signum() > 0
                ? diemTho.divide(tongToiDa, 6, RoundingMode.HALF_UP)
                        .multiply(de.getThangDiem()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        lt.setTrangThai(trangThaiCuoi);
        lt.setThoiGianNop(LocalDateTime.now());
        lt.setDiemTho(diemTho.setScale(2, RoundingMode.HALF_UP));
        lt.setTongDiemToiDa(tongToiDa.setScale(2, RoundingMode.HALF_UP));
        lt.setDiem(diemQuyDoi);
        lt.setSoCauDung(soCauDung);
        if (de.getDiemDat() != null) lt.setDat(diemQuyDoi.compareTo(de.getDiemDat()) >= 0);
        luotThiRepo.save(lt);
        log.info("Chốt lượt thi id={} -> {} điểm={}/{} ({} câu đúng)",
                lt.getId(), trangThaiCuoi, diemQuyDoi, de.getThangDiem(), soCauDung);
    }

    private record KetQuaCham(boolean dungHoanToan, BigDecimal diem) {}

    private KetQuaCham chamMot(TnLuotThiCauHoi r, boolean chamTungPhan) {
        Set<Long> chon = new HashSet<>(parseIds(r.getTraLoi()));
        Set<Long> dung = new HashSet<>(parseIds(r.getDapAnDungIds()));
        BigDecimal diemCau = r.getDiem();

        if (chon.isEmpty()) return new KetQuaCham(false, BigDecimal.ZERO);

        if (r.getLoai() == LoaiCauHoiEnum.MOT_DAP_AN || r.getLoai() == LoaiCauHoiEnum.DUNG_SAI) {
            boolean ok = chon.equals(dung);
            return new KetQuaCham(ok, ok ? diemCau : BigDecimal.ZERO);
        }

        // NHIEU_DAP_AN
        if (!chamTungPhan) {
            boolean ok = chon.equals(dung);
            return new KetQuaCham(ok, ok ? diemCau : BigDecimal.ZERO);
        }
        long soDung = chon.stream().filter(dung::contains).count();
        long soSai = chon.size() - soDung;
        double ratio = dung.isEmpty() ? 0 : Math.max(0.0, (soDung - soSai) / (double) dung.size());
        BigDecimal diem = diemCau.multiply(BigDecimal.valueOf(ratio)).setScale(2, RoundingMode.HALF_UP);
        return new KetQuaCham(ratio >= 1.0, diem);
    }

    // ============================================================
    // 4) XEM KẾT QUẢ / LỊCH SỬ
    // ============================================================

    @Transactional(readOnly = true)
    public TnKetQuaResponse getKetQua(Long luotThiId, String maSv) {
        TnLuotThi lt = layLuotCuaToi(luotThiId, maSv);
        TnDeThi de = deThiRepo.findById(lt.getDeThiId()).orElseThrow();

        boolean daNop = lt.getTrangThai() != TrangThaiLuotThiEnum.DANG_LAM;
        boolean hienChiTiet = daNop && Boolean.TRUE.equals(de.getChoXemLaiBai()) && switch (de.getCheDoHienKetQua()) {
            case NGAY -> true;
            case SAU_KHI_DONG -> de.getDongLuc() != null && LocalDateTime.now().isAfter(de.getDongLuc());
            case KHONG -> false;
        };

        TnKetQuaResponse.TnKetQuaResponseBuilder b = TnKetQuaResponse.builder()
                .luotThiId(lt.getId())
                .trangThai(lt.getTrangThai().name())
                .diem(lt.getDiem()).diemTho(lt.getDiemTho()).tongDiemToiDa(lt.getTongDiemToiDa())
                .soCauDung(lt.getSoCauDung()).tongSoCau(lt.getTongSoCau())
                .dat(lt.getDat()).thoiGianNop(lt.getThoiGianNop())
                .hienChiTiet(hienChiTiet);

        if (hienChiTiet) {
            boolean loDapAn = Boolean.TRUE.equals(de.getHienDapAnDung());
            b.chiTiet(luotChRepo.findByLuotThiIdOrderByThuTuAsc(lt.getId()).stream().map(r ->
                    TnKetQuaResponse.CauHoi.builder()
                            .thuTu(r.getThuTu())
                            .noiDung(r.getNoiDungSnapshot())
                            .loai(r.getLoai().name())
                            .traLoi(parseIds(r.getTraLoi()))
                            .dapAnDung(loDapAn ? parseIds(r.getDapAnDungIds()) : null)
                            .dung(r.getDung())
                            .diemDatDuoc(r.getDiemDatDuoc())
                            .diem(r.getDiem())
                            .giaiThich(loDapAn ? r.getGiaiThichSnapshot() : null)
                            .dapAns(parseSnapshot(r.getDapAnSnapshot()))
                            .build()).toList());
        }
        return b.build();
    }

    /** Danh sách đề thi đoàn viên có thể làm (đã xuất bản, trong phạm vi khoa, còn hạn). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDeThiKhaDung(String maSv) {
        String khoaSv = khoaScopeService.getCurrentMaKhoa();
        LocalDateTime now = LocalDateTime.now();
        List<TnDeThi> des = deThiRepo
                .findByTrangThaiAndIsActiveTrueOrderByCreatedAtDesc(TrangThaiDeThiEnum.DA_XUAT_BAN);
        List<Map<String, Object>> out = new ArrayList<>();
        for (TnDeThi de : des) {
            if (de.getMaKhoa() != null && khoaSv != null && !de.getMaKhoa().equals(khoaSv)) continue;

            long daLam = luotThiRepo.countByDeThiIdAndMaSv(de.getId(), maSv);
            Optional<TnLuotThi> dangLam = luotThiRepo
                    .findByMaSvOrderByThoiGianBatDauDesc(maSv).stream()
                    .filter(l -> l.getDeThiId().equals(de.getId())).findFirst();

            String tinhTrang;
            Long luotIdMoNhat = dangLam.map(TnLuotThi::getId).orElse(null);
            if (dangLam.isPresent() && dangLam.get().getTrangThai() == TrangThaiLuotThiEnum.DANG_LAM
                    && now.isBefore(dangLam.get().getThoiGianHanNop().plusSeconds(GRACE_SECONDS))) {
                tinhTrang = "DANG_LAM";
            } else if (de.getDongLuc() != null && now.isAfter(de.getDongLuc())) {
                tinhTrang = "DA_DONG";
            } else if (de.getMoLuc() != null && now.isBefore(de.getMoLuc())) {
                tinhTrang = "CHUA_MO";
            } else if (daLam >= de.getSoLanLamToiDa()) {
                tinhTrang = "HET_LUOT";
            } else {
                tinhTrang = "CO_THE_LAM";
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("deThiId", de.getId());
            m.put("tieuDe", de.getTieuDe());
            m.put("moTa", de.getMoTa());
            m.put("cheDo", de.getCheDo().name());
            m.put("thoiLuongPhut", de.getThoiLuongPhut());
            m.put("tongSoCau", de.getTongSoCau());
            m.put("thangDiem", de.getThangDiem());
            m.put("moLuc", de.getMoLuc());
            m.put("dongLuc", de.getDongLuc());
            m.put("soLanLamToiDa", de.getSoLanLamToiDa());
            m.put("soLanDaLam", daLam);
            m.put("tinhTrang", tinhTrang);
            m.put("luotThiGanNhat", luotIdMoNhat);
            out.add(m);
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLichSu(String maSv) {
        return luotThiRepo.findByMaSvOrderByThoiGianBatDauDesc(maSv).stream().map(lt -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("luotThiId", lt.getId());
            m.put("deThiId", lt.getDeThiId());
            m.put("lanThu", lt.getLanThu());
            m.put("trangThai", lt.getTrangThai().name());
            m.put("thoiGianBatDau", lt.getThoiGianBatDau());
            m.put("thoiGianNop", lt.getThoiGianNop());
            m.put("diem", lt.getDiem());
            m.put("soCauDung", lt.getSoCauDung());
            m.put("tongSoCau", lt.getTongSoCau());
            m.put("dat", lt.getDat());
            return m;
        }).toList();
    }

    // ============================================================
    // 5) SCHEDULER — tự động nộp lượt quá giờ (thí sinh đóng máy giữa chừng)
    // ============================================================

    @Scheduled(fixedDelayString = "${tn.autosubmit.interval-ms:120000}")
    public void tuDongNopHetGio() {
        LocalDateTime moc = LocalDateTime.now().minusSeconds(GRACE_SECONDS);
        List<TnLuotThi> quaHan = luotThiRepo
                .findByTrangThaiAndThoiGianHanNopBefore(TrangThaiLuotThiEnum.DANG_LAM, moc);
        if (quaHan.isEmpty()) return;
        log.info("Tự động nộp {} lượt thi quá giờ", quaHan.size());
        for (TnLuotThi lt : quaHan) {
            try { chamVaChot(lt, TrangThaiLuotThiEnum.TU_DONG_NOP); }
            catch (Exception e) { log.error("Lỗi tự nộp lượt {}: {}", lt.getId(), e.getMessage()); }
        }
    }

    // ============================================================
    // helpers
    // ============================================================

    private TnLuotThi layLuotCuaToi(Long luotThiId, String maSv) {
        TnLuotThi lt = luotThiRepo.findById(luotThiId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt thi: " + luotThiId));
        if (!lt.getMaSv().equals(maSv))
            throw new AccessDeniedException("Đây không phải lượt thi của bạn");
        return lt;
    }

    private TnLamBaiResponse buildLamBaiResponse(TnDeThi de, TnLuotThi lt, boolean tiepTuc) {
        List<TnLuotThiCauHoi> rows = luotChRepo.findByLuotThiIdOrderByThuTuAsc(lt.getId());
        List<TnLamBaiResponse.CauHoi> cauHois = rows.stream().map(r -> TnLamBaiResponse.CauHoi.builder()
                .id(r.getId())
                .cauHoiId(r.getCauHoiId())
                .thuTu(r.getThuTu())
                .loai(r.getLoai().name())
                .noiDung(r.getNoiDungSnapshot())
                .hinhAnh(r.getHinhAnhSnapshot())
                .dapAns(parseSnapshotLamBai(r.getDapAnSnapshot()))
                .traLoi(parseIds(r.getTraLoi()))
                .danhDau(r.getDanhDau())
                .build()).toList();

        return TnLamBaiResponse.builder()
                .luotThiId(lt.getId())
                .deThiId(de.getId())
                .tieuDe(de.getTieuDe())
                .lanThu(lt.getLanThu())
                .thoiLuongPhut(de.getThoiLuongPhut())
                .thoiGianBatDau(lt.getThoiGianBatDau())
                .thoiGianHanNop(lt.getThoiGianHanNop())
                .serverTime(LocalDateTime.now())
                .trangThai(lt.getTrangThai().name())
                .tongSoCau(lt.getTongSoCau())
                .tiepTuc(tiepTuc)
                .cauHois(cauHois)
                .build();
    }

    private Set<Long> idsTrongSnapshot(TnLuotThiCauHoi row) {
        return parseSnapshot(row.getDapAnSnapshot()).stream()
                .map(TnKetQuaResponse.DapAn::getId).collect(Collectors.toSet());
    }

    private List<TnKetQuaResponse.DapAn> parseSnapshot(String json) {
        return parseRawSnapshot(json).stream()
                .map(m -> TnKetQuaResponse.DapAn.builder()
                        .id(((Number) m.get("id")).longValue())
                        .noiDung(String.valueOf(m.get("noiDung")))
                        .build())
                .toList();
    }

    private List<TnLamBaiResponse.DapAn> parseSnapshotLamBai(String json) {
        return parseRawSnapshot(json).stream()
                .map(m -> TnLamBaiResponse.DapAn.builder()
                        .id(((Number) m.get("id")).longValue())
                        .noiDung(String.valueOf(m.get("noiDung")))
                        .hinhAnh(m.get("hinhAnh") != null ? String.valueOf(m.get("hinhAnh")) : null)
                        .build())
                .toList();
    }

    private List<Map<String, Object>> parseRawSnapshot(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return om.readValue(json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception e) { log.error("parse dapAnSnapshot lỗi: {}", e.getMessage()); return List.of(); }
    }

    private List<Long> parseIds(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return om.readValue(json, new TypeReference<List<Number>>() {})
                    .stream().map(Number::longValue).toList();
        } catch (Exception e) { return List.of(); }
    }

    private String toJson(Object o) {
        try { return om.writeValueAsString(o); }
        catch (Exception e) { throw new BusinessException("JSON_LOI", "Không serialize được dữ liệu đề"); }
    }

    private static String cat(String s, int max) {
        return s == null ? null : (s.length() > max ? s.substring(0, max) : s);
    }
}
