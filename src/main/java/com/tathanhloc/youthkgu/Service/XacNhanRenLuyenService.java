package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Exception.BusinessException;
import com.tathanhloc.youthkgu.Model.*;
import com.tathanhloc.youthkgu.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * "Xuất danh sách xác nhận hoạt động đã tham gia" — Đoàn trường bấm 1 lần cho cả trường, tạo
 * riêng 1 file PDF (ký số + khoá) cho mỗi sinh viên đã tham gia hoạt động có tính điểm rèn luyện
 * trong 1 học kỳ. Sinh viên chỉ xem/tải được bản của chính mình (lọc theo maSv).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class XacNhanRenLuyenService {

    private final DiemDanhHoatDongRepository diemDanhRepo;
    private final SinhVienRepository sinhVienRepository;
    private final XacNhanHoatDongRenLuyenRepository xacNhanRepo;
    private final DiemRenLuyenCriteriaService criteriaService;
    private final KySoService kySoService;

    // Self-reference qua proxy Spring (@Lazy tránh vòng lặp khi khởi tạo bean) — BẮT BUỘC để
    // @Transactional trên taoXacNhanMotSinhVienTx() có hiệu lực khi gọi từ vòng lặp trong CÙNG
    // class (self-invocation không đi qua proxy AOP nên @Transactional sẽ bị bỏ qua nếu gọi
    // "this.xxx()" trực tiếp).
    @Autowired @Lazy
    private XacNhanRenLuyenService self;

    @Value("${app.upload.path:./uploads}")
    private String uploadBasePath;

    public record TaoXacNhanConfig(
            Integer soHocKy, String maNamHoc,
            Long chuKyNguoiLapId, String tenNguoiLap, String chucVuNguoiLap,
            Long conDauId, Boolean apDungGiapLai, Boolean khoaFilePdf
    ) {}

    /**
     * Tạo xác nhận cho TOÀN BỘ sinh viên đã tham gia hoạt động có điểm rèn luyện trong 1 học kỳ.
     * KHÔNG bọc @Transactional ở đây — batch có thể chạy tới hàng nghìn sinh viên, mỗi lần render
     * PDF + ký số tốn hàng trăm ms; nếu gói cả vòng lặp vào 1 transaction, transaction đó bị giữ mở
     * rất lâu → khoá các dòng đã ghi trong bảng xac_nhan_hoat_dong_ren_luyen trong suốt thời gian
     * đó, khiến bất kỳ lượt tạo/ghi nào chạm cùng dòng (VD: bấm chạy lại) bị "Lock wait timeout".
     * Mỗi sinh viên được xử lý trong 1 transaction NGẮN, RIÊNG (qua self.taoXacNhanMotSinhVienTx),
     * nên 1 SV lỗi không ảnh hưởng SV khác và không giữ khoá lâu.
     */
    public Map<String, Object> taoXacNhanChoHocKy(TaoXacNhanConfig cfg, String nguoiThucHien) {
        if (cfg.soHocKy() == null || cfg.maNamHoc() == null || cfg.maNamHoc().isBlank())
            throw new BusinessException("THIEU_HOC_KY", "Vui lòng chọn học kỳ và năm học");
        if (cfg.tenNguoiLap() == null || cfg.tenNguoiLap().isBlank())
            throw new BusinessException("THIEU_NGUOI_LAP", "Vui lòng nhập tên người lập danh sách");

        List<String> danhSachMaSv = diemDanhRepo.findDistinctMaSvDaThamGiaTrongHocKy(cfg.soHocKy(), cfg.maNamHoc());

        // Sinh 1 lần cặp khoá/chứng chỉ ký cho CẢ BATCH (cùng 1 người lập) — vừa nhanh hơn nhiều
        // (khỏi sinh RSA-2048 mới cho từng SV), vừa rút ngắn thời gian mỗi transaction nhỏ bên dưới.
        KySoService.SigningIdentity signingIdentity;
        try {
            signingIdentity = kySoService.taoSigningIdentity(cfg.tenNguoiLap());
        } catch (Exception e) {
            log.warn("Không tạo được chữ ký số cho batch xác nhận hoạt động: {}", e.getMessage());
            signingIdentity = null; // từng SV sẽ tự sinh riêng lúc ký (chậm hơn nhưng vẫn ra file)
        }

        int thanhCong = 0, loi = 0;
        List<String> loiChiTiet = new ArrayList<>();

        for (String maSv : danhSachMaSv) {
            try {
                self.taoXacNhanMotSinhVienTx(maSv, cfg, nguoiThucHien, signingIdentity);
                thanhCong++;
            } catch (Exception e) {
                loi++;
                loiChiTiet.add(maSv + ": " + e.getMessage());
                log.warn("Không tạo được xác nhận hoạt động cho SV {}: {}", maSv, e.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tongSoSinhVien", danhSachMaSv.size());
        result.put("thanhCong", thanhCong);
        result.put("loi", loi);
        result.put("loiChiTiet", loiChiTiet.stream().limit(50).collect(Collectors.toList()));
        log.info("Tạo xác nhận hoạt động HK{} {} bởi {}: {}/{} thành công",
                cfg.soHocKy(), cfg.maNamHoc(), nguoiThucHien, thanhCong, danhSachMaSv.size());
        return result;
    }

    /** Tạo lại xác nhận cho ĐÚNG 1 sinh viên (dùng khi cần phát hành lại riêng lẻ). */
    public void taoXacNhanChoMotSinhVien(String maSv, TaoXacNhanConfig cfg, String nguoiThucHien) {
        try {
            self.taoXacNhanMotSinhVienTx(maSv, cfg, nguoiThucHien, null);
        } catch (IOException e) {
            throw new BusinessException("LOI_XUAT_PDF", "Không tạo được file xác nhận: " + e.getMessage());
        }
    }

    /**
     * Xử lý 1 sinh viên trong 1 transaction NGẮN, ĐỘC LẬP (public để self-invocation qua proxy
     * Spring áp dụng đúng @Transactional — xem giải thích ở field `self` phía trên).
     */
    @Transactional
    public void taoXacNhanMotSinhVienTx(String maSv, TaoXacNhanConfig cfg, String nguoiThucHien,
                                         KySoService.SigningIdentity signingIdentity) throws IOException {
        SinhVien sv = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new BusinessException("SV_KHONG_TON_TAI", "Không tìm thấy sinh viên: " + maSv));

        List<DiemDanhHoatDong> daThamGia =
                diemDanhRepo.findDaThamGiaTrongHocKy(maSv, cfg.soHocKy(), cfg.maNamHoc());

        List<KySoService.XacNhanHoatDongRow> rows = new ArrayList<>();
        int tongDiem = 0;
        for (DiemDanhHoatDong dd : daThamGia) {
            HoatDong hd = dd.getHoatDong();
            Integer diem = hd.getDiemRenLuyen();
            if (diem == null || diem <= 0) continue;
            tongDiem += diem;
            rows.add(new KySoService.XacNhanHoatDongRow(hd.getTenHoatDong(), mucLabel(hd, diem)));
        }

        String maLop = sv.getLop() != null ? sv.getLop().getMaLop() : null;
        String tenKhoa = (sv.getLop() != null && sv.getLop().getNganh() != null && sv.getLop().getNganh().getKhoa() != null)
                ? sv.getLop().getNganh().getKhoa().getTenKhoa() : null;
        String tenNganh = (sv.getLop() != null && sv.getLop().getNganh() != null)
                ? sv.getLop().getNganh().getTenNganh() : null;

        LocalDate today = LocalDate.now();
        String ngayStr = String.format("An Giang, ngày %02d tháng %02d năm %d",
                today.getDayOfMonth(), today.getMonthValue(), today.getYear());

        KySoService.XacNhanHoatDongRequest req = new KySoService.XacNhanHoatDongRequest(
                maSv, sv.getHoTen(), maLop, tenKhoa, tenNganh, ngayStr, rows,
                cfg.chuKyNguoiLapId(), cfg.tenNguoiLap(), cfg.chucVuNguoiLap(),
                cfg.conDauId(), cfg.apDungGiapLai(), cfg.khoaFilePdf());

        byte[] pdfBytes = kySoService.xuatXacNhanHoatDong(req, signingIdentity);

        String timestamp = String.valueOf(System.currentTimeMillis());
        String tenFile = "xac_nhan_" + maSv + "_" + cfg.soHocKy() + "_" + cfg.maNamHoc() + "_" + timestamp + ".pdf";
        Path dir = Paths.get(uploadBasePath, "xac-nhan-ren-luyen");
        Files.createDirectories(dir);
        Path filePath = dir.resolve(tenFile);
        Files.write(filePath, pdfBytes);

        xacNhanRepo.huyBanCuTruocKhiTaoLai(maSv, cfg.soHocKy(), cfg.maNamHoc());
        xacNhanRepo.save(XacNhanHoatDongRenLuyen.builder()
                .maSv(maSv).soHocKy(cfg.soHocKy()).maNamHoc(cfg.maNamHoc())
                .soHoatDong(rows.size()).tongDiem(tongDiem)
                .tenFile(tenFile).duongDanFile(filePath.toString())
                .trangThai("HIEU_LUC").nguoiTao(nguoiThucHien)
                .build());
    }

    /** VD: "Mục 3.4: Tham gia hoạt động ... (+5đ)". */
    private String mucLabel(HoatDong hd, int diem) {
        String tieuChiId = hd.getMaTieuChiRenLuyen();
        String noiDung = null;
        if (tieuChiId != null && !tieuChiId.isBlank()) {
            noiDung = criteriaService.findTieuChi(tieuChiId)
                    .map(tc -> tc.get("noi_dung")).map(String::valueOf).orElse(null);
        }
        StringBuilder sb = new StringBuilder();
        if (tieuChiId != null && !tieuChiId.isBlank()) sb.append("Mục ").append(tieuChiId);
        if (noiDung != null && !noiDung.isBlank()) {
            if (sb.length() > 0) sb.append(": ");
            sb.append(noiDung);
        }
        if (sb.length() == 0) sb.append("Điểm rèn luyện");
        sb.append(" (+").append(diem).append("đ)");
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<XacNhanHoatDongRenLuyen> getDanhSachCuaToi(String maSv) {
        return xacNhanRepo.findByMaSvAndTrangThaiOrderByMaNamHocDescSoHocKyDesc(maSv, "HIEU_LUC");
    }

    @Transactional(readOnly = true)
    public byte[] getFile(Long id, String requesterMaSv, boolean coQuyenXemTatCa) throws IOException {
        XacNhanHoatDongRenLuyen x = getMeta(id);
        if (!coQuyenXemTatCa && (requesterMaSv == null || !requesterMaSv.equals(x.getMaSv()))) {
            throw new BusinessException("FORBIDDEN", "Bạn không có quyền xem file này");
        }
        Path filePath = Paths.get(x.getDuongDanFile());
        if (!Files.exists(filePath)) throw new FileNotFoundException("File không còn tồn tại trên server");
        return Files.readAllBytes(filePath);
    }

    public XacNhanHoatDongRenLuyen getMeta(Long id) {
        return xacNhanRepo.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy bản xác nhận"));
    }

    @Transactional(readOnly = true)
    public List<XacNhanHoatDongRenLuyen> getAllByHocKy(Integer soHocKy, String maNamHoc) {
        return xacNhanRepo.findBySoHocKyAndMaNamHocAndTrangThaiOrderByMaSvAsc(soHocKy, maNamHoc, "HIEU_LUC");
    }
}
