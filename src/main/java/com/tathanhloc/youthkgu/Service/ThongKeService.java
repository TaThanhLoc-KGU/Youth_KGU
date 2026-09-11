package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import com.tathanhloc.youthkgu.Model.HoatDong;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Thống kê nâng cao — 4 cụm: Hoạt động, Điểm danh & tham gia, Điểm rèn luyện, CLB & Tài khoản/Phân quyền.
 * Mọi số liệu tự động scope theo khoa của người dùng đang đăng nhập (Đoàn trường/ADMIN = toàn hệ thống).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ThongKeService {

    private final HoatDongRepository hoatDongRepository;
    private final DangKyHoatDongRepository dangKyHoatDongRepository;
    private final DiemDanhHoatDongRepository diemDanhHoatDongRepository;
    private final DiemRenLuyenRepository diemRenLuyenRepository;
    private final CauLacBoRepository cauLacBoRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final KhoaRepository khoaRepository;
    private final PermissionRepository permissionRepository;
    private final RoleDefaultPermissionRepository roleDefaultPermissionRepository;
    private final TaiKhoanQuyenRepository taiKhoanQuyenRepository;
    private final KhoaScopeService khoaScopeService;

    // ==================== Nhãn hiển thị ====================

    private static final Map<String, String> LOAI_LABEL = Map.ofEntries(
            Map.entry("CHINH_TRI", "Chính trị"),
            Map.entry("VAN_HOA_NGHE_THUAT", "Văn hoá - Nghệ thuật"),
            Map.entry("THE_THAO", "Thể thao"),
            Map.entry("TINH_NGUYEN", "Tình nguyện"),
            Map.entry("HOC_THUAT", "Học thuật"),
            Map.entry("KY_NANG_MEM", "Kỹ năng mềm"),
            Map.entry("DOAN_HOI", "Đoàn - Hội"),
            Map.entry("CONG_DONG", "Cộng đồng"),
            Map.entry("KHAC", "Khác"));

    private static final Map<String, String> CAPDO_LABEL = Map.ofEntries(
            Map.entry("DOAN_TRUONG", "Đoàn trường"),
            Map.entry("HOI_SINH_VIEN", "Hội Sinh viên"),
            Map.entry("TRUONG", "Cấp trường"),
            Map.entry("PHONG", "Phòng/Ban"),
            Map.entry("KHOA", "Khoa"),
            Map.entry("CHI_DOAN", "Chi đoàn"),
            Map.entry("BAN_DOI_CLB", "Ban/Đội/CLB"),
            Map.entry("TINH_DOAN", "Tỉnh đoàn"),
            Map.entry("HOAT_DONG_PHOI_HOP", "Phối hợp"));

    private static final Map<String, String> TT_HD_LABEL = Map.ofEntries(
            Map.entry("CHO_DUYET", "Chờ duyệt"),
            Map.entry("SAP_DIEN_RA", "Sắp diễn ra"),
            Map.entry("DANG_MO_DANG_KY", "Đang mở đăng ký"),
            Map.entry("DANG_DIEN_RA", "Đang diễn ra"),
            Map.entry("DA_HOAN_THANH", "Đã hoàn thành"),
            Map.entry("DA_KET_THUC", "Đã kết thúc"),
            Map.entry("DA_HUY", "Đã huỷ"));

    private static final Map<String, String> DRL_XEPLOAI_LABEL = Map.ofEntries(
            Map.entry("XUAT_SAC", "Xuất sắc"),
            Map.entry("TOT", "Tốt"),
            Map.entry("KHA", "Khá"),
            Map.entry("TRUNG_BINH", "Trung bình"),
            Map.entry("YEU", "Yếu"),
            Map.entry("KEM", "Kém"),
            Map.entry("CHUA_XEP", "Chưa xếp loại"));

    private static final Map<String, String> DRL_TT_LABEL = Map.of(
            "NHAP", "Nháp",
            "DA_DUYET", "Đã duyệt",
            "KHOA", "Đã khoá");

    private static final Map<String, String> TK_PHEDUYET_LABEL = Map.of(
            "CHO_PHE_DUYET", "Chờ phê duyệt",
            "DA_PHE_DUYET", "Đã phê duyệt",
            "TU_CHOI", "Từ chối");

    // ==================== API chính ====================

    public Map<String, Object> getTongHop() {
        boolean unrestricted = isUnrestricted();
        String maKhoa = unrestricted ? null : khoaScopeService.getCurrentMaKhoa();
        String maClb = unrestricted ? null : khoaScopeService.getCurrentMaClb();
        String khoaFilter = maKhoa == null ? "" : maKhoa;

        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> scope = new LinkedHashMap<>();
        scope.put("maKhoa", maKhoa);
        scope.put("maClb", maClb);
        scope.put("tenKhoa", maKhoa == null ? null
                : khoaRepository.findById(maKhoa).map(k -> k.getTenKhoa()).orElse(maKhoa));
        scope.put("phamVi", maClb != null ? "CLB: " + maClb
                : maKhoa != null ? "Khoa: " + scope.get("tenKhoa")
                : "Toàn trường");
        scope.put("toanHeThong", unrestricted);
        result.put("scope", scope);

        result.put("hoatDong", buildHoatDong(maKhoa, maClb, unrestricted));
        result.put("diemDanh", buildDiemDanh(khoaFilter));
        result.put("diemRenLuyen", buildDiemRenLuyen(khoaFilter));
        result.put("clbTaiKhoan", buildClbTaiKhoan(maKhoa, unrestricted));

        return result;
    }

    // ==================== Cụm 1 — Hoạt động ====================

    private Map<String, Object> buildHoatDong(String maKhoa, String maClb, boolean unrestricted) {
        List<HoatDong> list;
        if (maClb != null) {
            list = hoatDongRepository.findByCauLacBoMaClbOrderByNgayToChucDesc(maClb);
        } else if (maKhoa != null) {
            list = hoatDongRepository.findByKhoaScopeOrGlobal(maKhoa);
        } else {
            list = hoatDongRepository.findByIsActiveTrueOrIsActiveIsNull();
        }

        Map<String, Long> theoTrangThai = new LinkedHashMap<>();
        Map<String, Long> theoLoai = new LinkedHashMap<>();
        Map<String, Long> theoCapDo = new LinkedHashMap<>();
        Map<String, Long> theoKhoa = new LinkedHashMap<>();
        Map<String, Long> theoThang = last12MonthsSkeleton();

        long tong = 0, choDuyet = 0, sapDienRa = 0, dangDienRa = 0, hoanThanh = 0, daHuy = 0;

        for (HoatDong hd : list) {
            tong++;
            String tt = hd.getTrangThai() != null ? hd.getTrangThai().name() : "KHAC";
            theoTrangThai.merge(tt, 1L, Long::sum);
            switch (tt) {
                case "CHO_DUYET" -> choDuyet++;
                case "SAP_DIEN_RA", "DANG_MO_DANG_KY" -> sapDienRa++;
                case "DANG_DIEN_RA" -> dangDienRa++;
                case "DA_HOAN_THANH", "DA_KET_THUC" -> hoanThanh++;
                case "DA_HUY" -> daHuy++;
                default -> { }
            }
            if (hd.getLoaiHoatDong() != null)
                theoLoai.merge(hd.getLoaiHoatDong().name(), 1L, Long::sum);
            if (hd.getCapDo() != null)
                theoCapDo.merge(hd.getCapDo().name(), 1L, Long::sum);
            if (hd.getKhoa() != null && hd.getKhoa().getTenKhoa() != null)
                theoKhoa.merge(hd.getKhoa().getTenKhoa(), 1L, Long::sum);
            else if (hd.getKhoa() == null)
                theoKhoa.merge("Đoàn trường", 1L, Long::sum);
            LocalDate ngay = hd.getNgayToChuc();
            if (ngay != null) {
                String key = ngay.getYear() + "-" + String.format("%02d", ngay.getMonthValue());
                if (theoThang.containsKey(key)) theoThang.merge(key, 1L, Long::sum);
            }
        }

        long tongKhongHuy = tong - daHuy;
        double tyLeHoanThanh = tongKhongHuy > 0
                ? Math.round((double) hoanThanh / tongKhongHuy * 1000.0) / 10.0 : 0.0;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tong", tong);
        m.put("choDuyet", choDuyet);
        m.put("sapDienRa", sapDienRa);
        m.put("dangDienRa", dangDienRa);
        m.put("hoanThanh", hoanThanh);
        m.put("daHuy", daHuy);
        m.put("tyLeHoanThanh", tyLeHoanThanh);
        m.put("theoTrangThai", toNamedList(theoTrangThai, TT_HD_LABEL));
        m.put("theoLoai", toNamedList(theoLoai, LOAI_LABEL));
        m.put("theoCapDo", toNamedList(theoCapDo, CAPDO_LABEL));
        m.put("theoThang", theoThang.entrySet().stream().map(e -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("thang", e.getKey());
            row.put("soHoatDong", e.getValue());
            return row;
        }).collect(Collectors.toList()));
        if (unrestricted) {
            m.put("theoKhoa", theoKhoa.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .map(e -> namedRow(e.getKey(), e.getValue()))
                    .collect(Collectors.toList()));
        } else {
            m.put("theoKhoa", List.of());
        }
        return m;
    }

    // ==================== Cụm 2 — Điểm danh & tham gia ====================

    private Map<String, Object> buildDiemDanh(String khoaFilter) {
        long tongDangKy = dangKyHoatDongRepository.countActiveScoped(khoaFilter);

        Map<String, Long> byTt = new LinkedHashMap<>();
        diemDanhHoatDongRepository.countByTrangThaiScoped(khoaFilter).forEach(r ->
                byTt.merge(String.valueOf(r[0]), ((Number) r[1]).longValue(), Long::sum));
        long tongLuot = byTt.values().stream().mapToLong(Long::longValue).sum();
        long daThamGia = byTt.getOrDefault("DA_THAM_GIA", 0L);
        long vangMat = byTt.getOrDefault("VANG_MAT", 0L);

        long soDiTre = 0, soVeSom = 0;
        List<Object[]> le = diemDanhHoatDongRepository.countLateEarlyScoped(khoaFilter);
        if (!le.isEmpty() && le.get(0) != null) {
            Object[] r = le.get(0);
            soDiTre = r[0] != null ? ((Number) r[0]).longValue() : 0;
            soVeSom = r[1] != null ? ((Number) r[1]).longValue() : 0;
        }

        double tyLeThamGia = tongDangKy > 0
                ? Math.round((double) daThamGia / tongDangKy * 1000.0) / 10.0 : 0.0;

        List<Map<String, Object>> theoKhoa = diemDanhHoatDongRepository
                .countDiemDanhGroupByKhoaScoped(khoaFilter).stream()
                .map(r -> namedRow(String.valueOf(r[0]), ((Number) r[1]).longValue(), "tongDiemDanh"))
                .collect(Collectors.toList());

        List<Map<String, Object>> topSinhVien = diemDanhHoatDongRepository
                .topStudentsScoped(khoaFilter, 10).stream()
                .map(r -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("maSv", r[0]);
                    row.put("hoTen", r[1]);
                    row.put("soLan", ((Number) r[2]).longValue());
                    return row;
                }).collect(Collectors.toList());

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tongDangKy", tongDangKy);
        m.put("tongLuot", tongLuot);
        m.put("daThamGia", daThamGia);
        m.put("vangMat", vangMat);
        m.put("tyLeThamGia", tyLeThamGia);
        m.put("soDiTre", soDiTre);
        m.put("soVeSom", soVeSom);
        m.put("theoKhoa", theoKhoa);
        m.put("topSinhVien", topSinhVien);
        return m;
    }

    // ==================== Cụm 3 — Điểm rèn luyện ====================

    private Map<String, Object> buildDiemRenLuyen(String khoaFilter) {
        List<Map<String, Object>> theoXepLoai = diemRenLuyenRepository.countGroupByXepLoai(khoaFilter).stream()
                .map(r -> namedRow(DRL_XEPLOAI_LABEL.getOrDefault(String.valueOf(r[0]), String.valueOf(r[0])),
                        ((Number) r[1]).longValue()))
                .collect(Collectors.toList());

        List<Map<String, Object>> theoTrangThai = diemRenLuyenRepository.countGroupByTrangThai(khoaFilter).stream()
                .map(r -> namedRow(DRL_TT_LABEL.getOrDefault(String.valueOf(r[0]), String.valueOf(r[0])),
                        ((Number) r[1]).longValue()))
                .collect(Collectors.toList());

        List<Map<String, Object>> theoHocKy = diemRenLuyenRepository.statsGroupByHocKy(khoaFilter).stream()
                .map(r -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("hocKy", r[0]);
                    row.put("soLuong", ((Number) r[1]).longValue());
                    row.put("diemTB", r[2] != null ? ((Number) r[2]).doubleValue() : 0.0);
                    return row;
                }).collect(Collectors.toList());

        List<Map<String, Object>> theoKhoa = diemRenLuyenRepository.statsGroupByKhoa(khoaFilter).stream()
                .map(r -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("ten", r[0]);
                    row.put("soLuong", ((Number) r[1]).longValue());
                    row.put("diemTB", r[2] != null ? ((Number) r[2]).doubleValue() : 0.0);
                    return row;
                }).collect(Collectors.toList());

        long tongBanGhi = theoTrangThai.stream()
                .mapToLong(r -> ((Number) r.get("giaTri")).longValue()).sum();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tongBanGhi", tongBanGhi);
        m.put("theoXepLoai", theoXepLoai);
        m.put("theoTrangThai", theoTrangThai);
        m.put("theoHocKy", theoHocKy);
        m.put("theoKhoa", theoKhoa);
        return m;
    }

    // ==================== Cụm 4 — CLB & Tài khoản / Phân quyền ====================

    private Map<String, Object> buildClbTaiKhoan(String maKhoa, boolean unrestricted) {
        // ---- CLB ----
        Map<String, Object> clb = new LinkedHashMap<>();
        if (maKhoa != null) {
            int soClb = cauLacBoRepository.findByKhoaMaKhoaAndIsActiveTrueOrderByTenClbAsc(maKhoa).size();
            clb.put("tong", (long) soClb);
            clb.put("theoLoai", List.of());
        } else {
            clb.put("tong", cauLacBoRepository.countByIsActiveTrue());
            clb.put("theoLoai", cauLacBoRepository.countGroupByLoai().stream()
                    .map(r -> namedRow(r[0] != null ? String.valueOf(r[0]) : "Khác",
                            ((Number) r[1]).longValue()))
                    .collect(Collectors.toList()));
        }

        // ---- Tài khoản ----
        Map<String, Object> taiKhoan = new LinkedHashMap<>();
        List<Map<String, Object>> theoVaiTro = new ArrayList<>();
        List<Map<String, Object>> theoPheDuyet = new ArrayList<>();
        long tongTk;

        if (maKhoa != null) {
            var dsTk = taiKhoanRepository.findByKhoa_MaKhoaAndIsActiveTrue(maKhoa);
            tongTk = dsTk.size();
            Map<String, Long> vt = new LinkedHashMap<>();
            Map<String, Long> pd = new LinkedHashMap<>();
            dsTk.forEach(tk -> {
                if (tk.getVaiTro() != null) vt.merge(tk.getVaiTro().name(), 1L, Long::sum);
                if (tk.getTrangThaiPheDuyet() != null) pd.merge(tk.getTrangThaiPheDuyet(), 1L, Long::sum);
            });
            vt.forEach((k, v) -> theoVaiTro.add(namedRow(vaiTroLabel(k), v)));
            pd.forEach((k, v) -> theoPheDuyet.add(namedRow(TK_PHEDUYET_LABEL.getOrDefault(k, k), v)));
        } else {
            tongTk = taiKhoanRepository.countByIsActiveTrue();
            for (VaiTroEnum vt : VaiTroEnum.values()) {
                long c = taiKhoanRepository.countByVaiTroAndIsActiveTrue(vt);
                if (c > 0) theoVaiTro.add(namedRow(vt.getLabel(), c));
            }
            for (String tt : List.of("CHO_PHE_DUYET", "DA_PHE_DUYET", "TU_CHOI")) {
                long c = taiKhoanRepository.countByTrangThaiPheDuyet(tt);
                if (c > 0) theoPheDuyet.add(namedRow(TK_PHEDUYET_LABEL.get(tt), c));
            }
        }
        taiKhoan.put("tongHoatDong", tongTk);
        taiKhoan.put("theoVaiTro", theoVaiTro);
        taiKhoan.put("theoPheDuyet", theoPheDuyet);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("clb", clb);
        m.put("taiKhoan", taiKhoan);

        // ---- Phân quyền (chỉ Đoàn trường/ADMIN) ----
        if (unrestricted) {
            Map<String, Object> pq = new LinkedHashMap<>();
            pq.put("tongQuyen", permissionRepository.count());
            List<Map<String, Object>> roleRows = roleDefaultPermissionRepository.findDistinctVaiTro().stream()
                    .map(role -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("ten", role);
                        row.put("soQuyen", (long) roleDefaultPermissionRepository
                                .findPermissionNamesByVaiTro(role).size());
                        return row;
                    })
                    .sorted((a, b) -> Long.compare((long) b.get("soQuyen"), (long) a.get("soQuyen")))
                    .collect(Collectors.toList());
            pq.put("theoVaiTro", roleRows);
            long soTkCoQuyenRieng = taiKhoanQuyenRepository.findAll().stream()
                    .map(q -> q.getTaiKhoanId()).distinct().count();
            pq.put("soTaiKhoanCoQuyenRieng", soTkCoQuyenRieng);
            m.put("phanQuyen", pq);
        } else {
            m.put("phanQuyen", null);
        }
        return m;
    }

    // ==================== Helpers ====================

    private boolean isUnrestricted() {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null) return true;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private String vaiTroLabel(String name) {
        try {
            return VaiTroEnum.valueOf(name).getLabel();
        } catch (Exception e) {
            return name;
        }
    }

    private Map<String, Long> last12MonthsSkeleton() {
        Map<String, Long> m = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusMonths(i);
            m.put(d.getYear() + "-" + String.format("%02d", d.getMonthValue()), 0L);
        }
        return m;
    }

    private List<Map<String, Object>> toNamedList(Map<String, Long> src, Map<String, String> labels) {
        return src.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> namedRow(labels.getOrDefault(e.getKey(), e.getKey()), e.getValue()))
                .collect(Collectors.toList());
    }

    private Map<String, Object> namedRow(String ten, long giaTri) {
        return namedRow(ten, giaTri, "giaTri");
    }

    private Map<String, Object> namedRow(String ten, long giaTri, String valueKey) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("ten", ten);
        row.put(valueKey, giaTri);
        return row;
    }
}
