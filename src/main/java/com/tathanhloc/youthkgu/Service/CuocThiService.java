package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.*;
import com.tathanhloc.youthkgu.Enum.*;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CuocThiService {

    private final CuocThiRepository cuocThiRepository;
    private final ThiSinhRepository thiSinhRepository;
    private final LuotBinhChonRepository luotBinhChonRepository;
    private final HoatDongRepository hoatDongRepository;
    private final DangKyHoatDongRepository dangKyHoatDongRepository;
    private final DiemDanhHoatDongRepository diemDanhRepository;
    private final SinhVienRepository sinhVienRepository;
    private final KhoaScopeService khoaScopeService;

    // ─── CRUD Cuộc thi ───────────────────────────────────────────────────────

    public List<CuocThiDTO> getAll() {
        String maKhoa = khoaScopeService.getCurrentMaKhoa();
        if (maKhoa != null) {
            return cuocThiRepository.findByHoatDongKhoaMaKhoa(maKhoa).stream()
                    .map(ct -> toDTO(ct, true, false)).collect(Collectors.toList());
        }
        return cuocThiRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream().map(ct -> toDTO(ct, true, false)).collect(Collectors.toList());
    }

    /** Public: tất cả cuộc thi đang mở — không scope theo khoa (sinh viên thấy toàn trường) */
    public List<CuocThiDTO> getDangMo() {
        return cuocThiRepository.findDangMo()
                .stream().map(ct -> toDTO(ct, false, false)).collect(Collectors.toList());
    }

    /** Public: tất cả cuộc thi công khai (trừ DA_HUY) — không scope theo khoa */
    public List<CuocThiDTO> getTatCaPublic() {
        return cuocThiRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .filter(ct -> ct.getTrangThai() != TrangThaiCuocThiEnum.DA_HUY)
                .map(ct -> {
                    boolean hideVote = ct.getHienThiKetQua() == HienThiKetQuaEnum.AN_DEN_CUOI
                            && ct.getTrangThai() != TrangThaiCuocThiEnum.DA_CONG_BO;
                    return toDTO(ct, false, hideVote);
                })
                .collect(Collectors.toList());
    }

    public List<CuocThiDTO> getByHoatDong(String maHoatDong) {
        return cuocThiRepository.findByHoatDongMaHoatDongAndIsActiveTrue(maHoatDong)
                .stream().map(ct -> toDTO(ct, true, false)).collect(Collectors.toList());
    }

    public CuocThiDTO getById(Long id, boolean isAdmin) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));
        return toDTO(ct, true, !isAdmin && ct.getHienThiKetQua() == HienThiKetQuaEnum.AN_DEN_CUOI);
    }

    public CuocThiDTO getBySlug(String slug, boolean isAdmin) {
        CuocThi ct = cuocThiRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + slug));
        return toDTO(ct, true, !isAdmin && ct.getHienThiKetQua() == HienThiKetQuaEnum.AN_DEN_CUOI);
    }

    @Transactional
    public CuocThiDTO create(CuocThiCreateRequest req, String createdBy) {
        String slug = resolveSlug(req.getSlug(), req.getTieuDe());

        HoatDong hoatDong = null;
        if (req.getMaHoatDong() != null && !req.getMaHoatDong().isBlank()) {
            hoatDong = hoatDongRepository.findById(req.getMaHoatDong()).orElse(null);
        }

        CuocThi ct = CuocThi.builder()
                .tieuDe(req.getTieuDe())
                .moTa(req.getMoTa())
                .anhBia(req.getAnhBia())
                .slug(slug)
                .loaiCuocThi(req.getLoaiCuocThi())
                .hoatDong(hoatDong)
                .trangThai(TrangThaiCuocThiEnum.CHUAN_BI)
                .hienThiKetQua(req.getHienThiKetQua())
                .dieuKienVote(req.getDieuKienVote())
                .quyTacVote(req.getQuyTacVote())
                .soLuotToiDa(req.getSoLuotToiDa())
                .thoiGianMoVote(req.getThoiGianMoVote())
                .thoiGianDongVote(req.getThoiGianDongVote())
                .choPhepNopBai(req.getChoPhepNopBai() != null ? req.getChoPhepNopBai() : false)
                .hanNop(req.getHanNop())
                .createdBy(createdBy)
                .build();

        ct = cuocThiRepository.save(ct);
        log.info("Tạo cuộc thi: {} by {}", ct.getTieuDe(), createdBy);
        return toDTO(ct, false, false);
    }

    @Transactional
    public CuocThiDTO update(Long id, CuocThiCreateRequest req, String updatedBy) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));

        // Slug: nếu đổi slug thì kiểm tra unique
        if (req.getSlug() != null && !req.getSlug().equals(ct.getSlug())) {
            String newSlug = generateSlug(req.getSlug());
            if (cuocThiRepository.existsBySlug(newSlug)) {
                throw new RuntimeException("Slug đã tồn tại: " + newSlug);
            }
            ct.setSlug(newSlug);
        }

        HoatDong hoatDong = null;
        if (req.getMaHoatDong() != null && !req.getMaHoatDong().isBlank()) {
            hoatDong = hoatDongRepository.findById(req.getMaHoatDong()).orElse(null);
        }

        ct.setTieuDe(req.getTieuDe());
        ct.setMoTa(req.getMoTa());
        ct.setAnhBia(req.getAnhBia());
        ct.setLoaiCuocThi(req.getLoaiCuocThi());
        ct.setHoatDong(hoatDong);
        ct.setHienThiKetQua(req.getHienThiKetQua());
        ct.setDieuKienVote(req.getDieuKienVote());
        ct.setQuyTacVote(req.getQuyTacVote());
        ct.setSoLuotToiDa(req.getSoLuotToiDa());
        ct.setThoiGianMoVote(req.getThoiGianMoVote());
        ct.setThoiGianDongVote(req.getThoiGianDongVote());
        if (req.getChoPhepNopBai() != null) ct.setChoPhepNopBai(req.getChoPhepNopBai());
        ct.setHanNop(req.getHanNop());

        ct = cuocThiRepository.save(ct);
        return toDTO(ct, true, false);
    }

    @Transactional
    public void delete(Long id) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));
        ct.setIsActive(false);
        cuocThiRepository.save(ct);
    }

    @Transactional
    public CuocThiDTO moVote(Long id) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));
        ct.setTrangThai(TrangThaiCuocThiEnum.DANG_MO);
        if (ct.getThoiGianMoVote() == null) ct.setThoiGianMoVote(LocalDateTime.now());
        cuocThiRepository.save(ct);
        return toDTO(ct, true, false);
    }

    @Transactional
    public CuocThiDTO dongVote(Long id) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));
        ct.setTrangThai(TrangThaiCuocThiEnum.DONG_BINH_CHON);
        if (ct.getThoiGianDongVote() == null) ct.setThoiGianDongVote(LocalDateTime.now());
        cuocThiRepository.save(ct);
        return toDTO(ct, true, false);
    }

    @Transactional
    public CuocThiDTO congBoKetQua(Long id) {
        CuocThi ct = cuocThiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + id));
        ct.setTrangThai(TrangThaiCuocThiEnum.DA_CONG_BO);
        ct.setHienThiKetQua(HienThiKetQuaEnum.REALTIME); // Khi công bố thì hiển thị kết quả
        cuocThiRepository.save(ct);
        return toDTO(ct, true, false);
    }

    // ─── CRUD Thí sinh ─────────────────────────────────────────────────────────

    @Transactional
    public ThiSinhDTO addThiSinh(Long cuocThiId, ThiSinhDTO dto) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + cuocThiId));

        long count = thiSinhRepository.countByCuocThiId(cuocThiId);
        ThiSinh ts = ThiSinh.builder()
                .cuocThi(ct)
                .ten(dto.getTen())
                .moTa(dto.getMoTa())
                .anhDaiDien(dto.getAnhDaiDien())
                .urlMedia(dto.getUrlMedia())
                .soThuTu(dto.getSoThuTu() != null ? dto.getSoThuTu() : (int) count + 1)
                .thongTinThem(dto.getThongTinThem())
                .maSv(dto.getMaSv())
                .build();
        ts = thiSinhRepository.save(ts);
        return toThiSinhDTO(ts, false);
    }

    @Transactional
    public ThiSinhDTO updateThiSinh(Long cuocThiId, Long thiSinhId, ThiSinhDTO dto) {
        ThiSinh ts = thiSinhRepository.findById(thiSinhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thí sinh: " + thiSinhId));
        if (!ts.getCuocThi().getId().equals(cuocThiId)) {
            throw new RuntimeException("Thí sinh không thuộc cuộc thi này");
        }
        ts.setTen(dto.getTen());
        ts.setMoTa(dto.getMoTa());
        ts.setAnhDaiDien(dto.getAnhDaiDien());
        ts.setUrlMedia(dto.getUrlMedia());
        ts.setSoThuTu(dto.getSoThuTu());
        ts.setThongTinThem(dto.getThongTinThem());
        ts.setMaSv(dto.getMaSv());
        ts = thiSinhRepository.save(ts);
        return toThiSinhDTO(ts, false);
    }

    @Transactional
    public void deleteThiSinh(Long cuocThiId, Long thiSinhId) {
        ThiSinh ts = thiSinhRepository.findById(thiSinhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thí sinh: " + thiSinhId));
        if (!ts.getCuocThi().getId().equals(cuocThiId)) {
            throw new RuntimeException("Thí sinh không thuộc cuộc thi này");
        }
        ts.setIsActive(false);
        thiSinhRepository.save(ts);
    }

    // ─── Thống kê (admin) ─────────────────────────────────────────────────────

    public Map<String, Object> getThongKe(Long cuocThiId) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + cuocThiId));

        long tongVote = luotBinhChonRepository.countByCuocThiId(cuocThiId);
        List<Object[]> voteByDay = luotBinhChonRepository.countVoteByDay(cuocThiId);
        List<Object[]> voteByTs = luotBinhChonRepository.countVoteGroupByThiSinh(cuocThiId);

        Map<Long, Long> voteMap = new HashMap<>();
        for (Object[] row : voteByTs) {
            voteMap.put((Long) row[0], (Long) row[1]);
        }

        List<Map<String, Object>> trendData = new ArrayList<>();
        for (Object[] row : voteByDay) {
            Map<String, Object> item = new HashMap<>();
            item.put("ngay", row[0].toString());
            item.put("soVote", row[1]);
            trendData.add(item);
        }

        List<ThiSinh> dsTh = thiSinhRepository.findByCuocThiIdAndIsActiveTrueOrderBySoThuTuAsc(cuocThiId);
        List<Map<String, Object>> ketQua = new ArrayList<>();
        for (ThiSinh ts : dsTh) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", ts.getId());
            item.put("ten", ts.getTen());
            item.put("anhDaiDien", ts.getAnhDaiDien());
            item.put("soVote", voteMap.getOrDefault(ts.getId(), 0L));
            item.put("phanTram", tongVote > 0 ? (voteMap.getOrDefault(ts.getId(), 0L) * 100.0 / tongVote) : 0);
            ketQua.add(item);
        }
        // Sắp xếp theo số vote giảm dần
        ketQua.sort((a, b) -> Long.compare((Long) b.get("soVote"), (Long) a.get("soVote")));

        // Đếm số người vote đã đăng nhập (distinct nguoiVoteMa, loại null)
        long tongNguoiVote = luotBinhChonRepository.findByCuocThiIdOrderByCreatedAtDesc(cuocThiId)
                .stream()
                .map(LuotBinhChon::getNguoiVoteMa)
                .filter(ma -> ma != null && !ma.isBlank())
                .distinct()
                .count();

        Map<String, Object> result = new HashMap<>();
        result.put("cuocThiId", cuocThiId);
        result.put("tieuDe", ct.getTieuDe());
        result.put("tongVote", tongVote);
        result.put("tongNguoiVote", tongNguoiVote);
        result.put("trendData", trendData);
        result.put("ketQua", ketQua);
        return result;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public CuocThiDTO toDTO(CuocThi ct, boolean includeThiSinh, boolean hideVoteCount) {
        boolean dangMoVote = ct.getTrangThai() == TrangThaiCuocThiEnum.DANG_MO
                && (ct.getThoiGianMoVote() == null || !LocalDateTime.now().isBefore(ct.getThoiGianMoVote()))
                && (ct.getThoiGianDongVote() == null || LocalDateTime.now().isBefore(ct.getThoiGianDongVote()));

        long tongSoVote = luotBinhChonRepository.countByCuocThiId(ct.getId());

        List<ThiSinhDTO> dsTh = null;
        if (includeThiSinh) {
            dsTh = thiSinhRepository.findByCuocThiIdAndIsActiveTrueOrderBySoThuTuAsc(ct.getId())
                    .stream().map(ts -> toThiSinhDTO(ts, hideVoteCount)).collect(Collectors.toList());
        }

        return CuocThiDTO.builder()
                .id(ct.getId())
                .tieuDe(ct.getTieuDe())
                .moTa(ct.getMoTa())
                .anhBia(ct.getAnhBia())
                .slug(ct.getSlug())
                .loaiCuocThi(ct.getLoaiCuocThi())
                .maHoatDong(ct.getHoatDong() != null ? ct.getHoatDong().getMaHoatDong() : null)
                .tenHoatDong(ct.getHoatDong() != null ? ct.getHoatDong().getTenHoatDong() : null)
                .trangThai(ct.getTrangThai())
                .hienThiKetQua(ct.getHienThiKetQua())
                .dieuKienVote(ct.getDieuKienVote())
                .quyTacVote(ct.getQuyTacVote())
                .soLuotToiDa(ct.getSoLuotToiDa())
                .thoiGianMoVote(ct.getThoiGianMoVote())
                .thoiGianDongVote(ct.getThoiGianDongVote())
                .isActive(ct.getIsActive())
                .choPhepNopBai(ct.getChoPhepNopBai())
                .hanNop(ct.getHanNop())
                .createdBy(ct.getCreatedBy())
                .createdAt(ct.getCreatedAt())
                .danhSachThiSinh(dsTh)
                .tongSoVote(tongSoVote)
                .dangMoVote(dangMoVote)
                .build();
    }

    public ThiSinhDTO toThiSinhDTO(ThiSinh ts, boolean hideVoteCount) {
        return ThiSinhDTO.builder()
                .id(ts.getId())
                .cuocThiId(ts.getCuocThi().getId())
                .ten(ts.getTen())
                .moTa(ts.getMoTa())
                .anhDaiDien(ts.getAnhDaiDien())
                .urlMedia(ts.getUrlMedia())
                .soThuTu(ts.getSoThuTu())
                .thongTinThem(ts.getThongTinThem())
                .soVote(hideVoteCount ? null : ts.getSoVote())
                .isActive(ts.getIsActive())
                .maSv(ts.getMaSv())
                .trangThaiDuyet(ts.getTrangThaiDuyet())
                .loaiNopBai(ts.getLoaiNopBai())
                .dsHinhAnh(ts.getDsHinhAnh())
                .noiDung(ts.getNoiDung())
                .createdAt(ts.getCreatedAt() != null ? ts.getCreatedAt().toString() : null)
                .build();
    }

    // ─── Danh sách vote & Export ───────────────────────────────────────────────

    /**
     * Danh sách vote (paginated) cho admin
     */
    public Map<String, Object> getDanhSachVote(Long cuocThiId, int page, int size) {
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<LuotBinhChon> pageData =
                luotBinhChonRepository.findByCuocThiIdOrderByCreatedAtDesc(cuocThiId, pageable);

        List<Map<String, Object>> items = new ArrayList<>();
        for (LuotBinhChon lbc : pageData.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", lbc.getId());
            item.put("thiSinhId", lbc.getThiSinh().getId());
            item.put("tenThiSinh", lbc.getThiSinh().getTen());
            item.put("nguoiVoteMa", lbc.getNguoiVoteMa() != null ? lbc.getNguoiVoteMa() : "Ẩn danh");
            item.put("nguoiVoteIp", lbc.getNguoiVoteIp());
            item.put("ngayVote", lbc.getNgayVote() != null ? lbc.getNgayVote().toString() : null);
            item.put("createdAt", lbc.getCreatedAt() != null ? lbc.getCreatedAt().toString() : null);
            items.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("content", items);
        result.put("totalElements", pageData.getTotalElements());
        result.put("totalPages", pageData.getTotalPages());
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    /**
     * Lấy toàn bộ vote để export Excel (không phân trang)
     */
    public List<Map<String, Object>> getAllVoteForExport(Long cuocThiId) {
        List<LuotBinhChon> all = luotBinhChonRepository.findByCuocThiIdOrderByCreatedAtDesc(cuocThiId);
        List<Map<String, Object>> items = new ArrayList<>();
        int stt = 1;
        for (LuotBinhChon lbc : all) {
            Map<String, Object> item = new HashMap<>();
            item.put("stt", stt++);
            item.put("thiSinhId", lbc.getThiSinh().getId());
            item.put("tenThiSinh", lbc.getThiSinh().getTen());
            item.put("nguoiVoteMa", lbc.getNguoiVoteMa() != null ? lbc.getNguoiVoteMa() : "Ẩn danh");
            item.put("nguoiVoteIp", lbc.getNguoiVoteIp() != null ? lbc.getNguoiVoteIp() : "");
            item.put("ngayVote", lbc.getNgayVote() != null ? lbc.getNgayVote().toString() : "");
            item.put("thoiGian", lbc.getCreatedAt() != null ? lbc.getCreatedAt().toString() : "");
            items.add(item);
        }
        return items;
    }

    /**
     * Checkout winners: cập nhật trạng thái đăng ký hoạt động cho các thí sinh thắng.
     * Chỉ áp dụng khi cuocThi gắn với hoatDong VÀ thiSinh có maSv.
     */
    @Transactional
    public Map<String, Object> checkoutWinners(Long cuocThiId, List<Long> thiSinhIds) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + cuocThiId));

        List<ThiSinh> winners = thiSinhRepository.findAllById(thiSinhIds);

        int soLuongDiemDanh = 0;
        List<String> daCheckout = new ArrayList<>();
        List<String> khongCoMaSv = new ArrayList<>();
        List<String> khongDangKy = new ArrayList<>();

        String maHoatDong = ct.getHoatDong() != null ? ct.getHoatDong().getMaHoatDong() : null;

        for (ThiSinh ts : winners) {
            if (ts.getMaSv() == null || ts.getMaSv().isBlank()) {
                khongCoMaSv.add(ts.getTen());
                continue;
            }
            if (maHoatDong == null) {
                // No linked activity – just record as winner
                daCheckout.add(ts.getTen() + " (không có hoạt động)");
                continue;
            }
            // Find DangKyHoatDong record
            Optional<com.tathanhloc.youthkgu.Model.DangKyHoatDong> dkOpt =
                    dangKyHoatDongRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(ts.getMaSv(), maHoatDong);
            if (dkOpt.isEmpty()) {
                khongDangKy.add(ts.getTen() + " (" + ts.getMaSv() + ")");
                continue;
            }
            com.tathanhloc.youthkgu.Model.DangKyHoatDong dk = dkOpt.get();
            dk.setTrangThai("DA_CHECK_OUT");
            dangKyHoatDongRepository.save(dk);
            soLuongDiemDanh++;
            daCheckout.add(ts.getTen());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("tongCheckout", soLuongDiemDanh);
        result.put("daCheckout", daCheckout);
        result.put("khongCoMaSv", khongCoMaSv);
        result.put("khongDangKy", khongDangKy);
        result.put("maHoatDong", maHoatDong);
        return result;
    }

    /**
     * Checkout dựa trên DANH SÁCH NGƯỜI ĐÃ VOTE — không phải thí sinh.
     * Tìm tất cả LuotBinhChon.nguoiVoteMa → tra DangKyHoatDong → cập nhật DA_THAM_GIA.
     */
    @Transactional
    public Map<String, Object> checkoutVoters(Long cuocThiId) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + cuocThiId));

        String maHoatDong = ct.getHoatDong() != null ? ct.getHoatDong().getMaHoatDong() : null;

        // Lấy tất cả lượt vote, lọc lấy voter đã đăng nhập (có nguoiVoteMa)
        List<LuotBinhChon> allVotes = luotBinhChonRepository.findByCuocThiIdOrderByCreatedAtDesc(cuocThiId);

        // Unique danh sách username người vote
        List<String> voterUsernames = allVotes.stream()
                .map(LuotBinhChon::getNguoiVoteMa)
                .filter(ma -> ma != null && !ma.isBlank())
                .distinct()
                .collect(Collectors.toList());

        int soLuongCheckout = 0;
        List<String> daCheckout      = new ArrayList<>();
        List<String> khongDangKy     = new ArrayList<>();
        List<String> khongCoDangKy   = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (String username : voterUsernames) {
            if (maHoatDong == null) {
                // Không có hoạt động liên kết — chỉ đếm
                daCheckout.add(username + " (không có hoạt động)");
                soLuongCheckout++;
                continue;
            }
            // Tìm DangKyHoatDong theo username (username = maSv)
            Optional<com.tathanhloc.youthkgu.Model.DangKyHoatDong> dkOpt =
                    dangKyHoatDongRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(username, maHoatDong);
            if (dkOpt.isEmpty()) {
                khongDangKy.add(username);
                continue;
            }
            com.tathanhloc.youthkgu.Model.DangKyHoatDong dk = dkOpt.get();

            // 1. Cập nhật DangKyHoatDong → DA_CHECK_OUT
            dk.setTrangThai("DA_CHECK_OUT");
            dangKyHoatDongRepository.save(dk);

            // 2. Tìm hoặc tạo DiemDanhHoatDong
            Optional<DiemDanhHoatDong> ddOpt =
                    diemDanhRepository.findBySinhVienMaSvAndHoatDongMaHoatDong(username, maHoatDong);

            if (ddOpt.isPresent()) {
                DiemDanhHoatDong dd = ddOpt.get();
                // Đã checkout rồi (tự quét QR trước) → bỏ qua, không ghi đè dữ liệu gốc
                if (dd.getThoiGianCheckOut() != null) {
                    soLuongCheckout++;
                    daCheckout.add(username + " (đã checkout trước đó)");
                    continue;
                }
                // Chưa checkout → cập nhật
                if (dd.getThoiGianCheckIn() == null) dd.setThoiGianCheckIn(now);
                dd.setThoiGianCheckOut(now);
                dd.setTrangThaiCheckOut(TrangThaiCheckOutEnum.HOAN_THANH);
                dd.setTrangThai(TrangThaiThamGiaEnum.DA_THAM_GIA);
                // Tính tổng thời gian tham gia và đạt tối thiểu
                long minutes = java.time.temporal.ChronoUnit.MINUTES.between(dd.getThoiGianCheckIn(), now);
                dd.setTongThoiGianThamGia((int) minutes);
                HoatDong hdVote = ct.getHoatDong();
                dd.setDatThoiGianToiThieu(hdVote == null || hdVote.getThoiGianToiThieu() == null
                        || minutes >= hdVote.getThoiGianToiThieu());
                diemDanhRepository.save(dd);
            } else {
                // Chưa có bản ghi → tạo mới với check-in & check-out = now
                Optional<com.tathanhloc.youthkgu.Model.SinhVien> svOpt =
                        sinhVienRepository.findByMaSv(username);
                if (svOpt.isEmpty()) {
                    khongDangKy.add(username + " (không tìm thấy sinh viên)");
                    continue;
                }
                HoatDong hoatDong = ct.getHoatDong();
                String maQR = dk.getMaQR() != null ? dk.getMaQR() : "VOTE_" + cuocThiId + "_" + username;

                DiemDanhHoatDong ddMoi = DiemDanhHoatDong.builder()
                        .hoatDong(hoatDong)
                        .sinhVien(svOpt.get())
                        .maQRDaQuet(maQR)
                        .trangThai(TrangThaiThamGiaEnum.DA_THAM_GIA)
                        .thoiGianCheckIn(now)
                        .trangThaiCheckIn(TrangThaiCheckInEnum.DUNG_GIO)
                        .thoiGianCheckOut(now)
                        .trangThaiCheckOut(TrangThaiCheckOutEnum.HOAN_THANH)
                        .tinhGioPhucVu(true)
                        .ghiChu("Checkout tự động từ kết quả bình chọn")
                        .build();
                diemDanhRepository.save(ddMoi);
            }

            soLuongCheckout++;
            daCheckout.add(username);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("tongVoter",      voterUsernames.size());
        result.put("tongCheckout",   soLuongCheckout);
        result.put("daCheckout",     daCheckout);
        result.put("khongDangKy",    khongDangKy);   // đã vote nhưng chưa đăng ký hoạt động
        result.put("voAnDanh",       allVotes.stream().filter(v -> v.getNguoiVoteMa() == null || v.getNguoiVoteMa().isBlank()).count());
        result.put("maHoatDong",     maHoatDong);
        return result;
    }

    // ─── Sinh viên tự đăng ký nộp bài ────────────────────────────────────────

    @Transactional
    public ThiSinhDTO dangKyNopBai(Long cuocThiId, ThiSinhDTO dto, String username) {
        CuocThi ct = cuocThiRepository.findById(cuocThiId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc thi: " + cuocThiId));

        if (!Boolean.TRUE.equals(ct.getChoPhepNopBai())) {
            throw new RuntimeException("Cuộc thi này không mở đăng ký nộp bài");
        }
        if (ct.getHanNop() != null && LocalDateTime.now().isAfter(ct.getHanNop())) {
            throw new RuntimeException("Đã hết hạn nộp bài");
        }

        // Kiểm tra xem user đã nộp chưa
        boolean daNop = thiSinhRepository.findByCuocThiIdAndIsActiveTrueOrderBySoThuTuAsc(cuocThiId)
                .stream().anyMatch(ts -> username.equals(ts.getMaSv()) && !"TU_CHOI".equals(ts.getTrangThaiDuyet()));
        if (daNop) {
            throw new RuntimeException("Bạn đã đăng ký nộp bài cho cuộc thi này");
        }

        long count = thiSinhRepository.countByCuocThiId(cuocThiId);
        ThiSinh ts = ThiSinh.builder()
                .cuocThi(ct)
                .ten(dto.getTen() != null ? dto.getTen() : username)
                .moTa(dto.getMoTa())
                .anhDaiDien(dto.getAnhDaiDien())
                .urlMedia(dto.getUrlMedia())
                .soThuTu((int) count + 1)
                .maSv(username)
                .trangThaiDuyet("CHO_DUYET")
                .loaiNopBai(dto.getLoaiNopBai() != null ? dto.getLoaiNopBai() : "ANH_DON")
                .dsHinhAnh(dto.getDsHinhAnh())
                .noiDung(dto.getNoiDung())
                .build();
        ts = thiSinhRepository.save(ts);
        return toThiSinhDTO(ts, false);
    }

    @Transactional
    public ThiSinhDTO duyetThiSinh(Long cuocThiId, Long thiSinhId) {
        ThiSinh ts = thiSinhRepository.findById(thiSinhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thí sinh: " + thiSinhId));
        if (!ts.getCuocThi().getId().equals(cuocThiId)) throw new RuntimeException("Thí sinh không thuộc cuộc thi này");
        ts.setTrangThaiDuyet("DA_DUYET");
        ts = thiSinhRepository.save(ts);
        return toThiSinhDTO(ts, false);
    }

    @Transactional
    public ThiSinhDTO tuChoiThiSinh(Long cuocThiId, Long thiSinhId) {
        ThiSinh ts = thiSinhRepository.findById(thiSinhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thí sinh: " + thiSinhId));
        if (!ts.getCuocThi().getId().equals(cuocThiId)) throw new RuntimeException("Thí sinh không thuộc cuộc thi này");
        ts.setTrangThaiDuyet("TU_CHOI");
        ts.setIsActive(false);
        ts = thiSinhRepository.save(ts);
        return toThiSinhDTO(ts, false);
    }

    public List<ThiSinhDTO> getDanhSachChoDuyet(Long cuocThiId) {
        return thiSinhRepository.findByCuocThiIdOrderBySoThuTuAsc(cuocThiId)
                .stream()
                .filter(ts -> "CHO_DUYET".equals(ts.getTrangThaiDuyet()))
                .map(ts -> toThiSinhDTO(ts, false))
                .collect(Collectors.toList());
    }

    private String resolveSlug(String inputSlug, String tieuDe) {
        String base = (inputSlug != null && !inputSlug.isBlank()) ? inputSlug : tieuDe;
        String slug = generateSlug(base);
        String original = slug;
        int counter = 1;
        while (cuocThiRepository.existsBySlug(slug)) {
            slug = original + "-" + counter++;
        }
        return slug;
    }

    public static String generateSlug(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\w\\s-]", "")
                .trim()
                .toLowerCase()
                .replaceAll("[\\s_]+", "-")
                .replaceAll("-+", "-");
    }
}
