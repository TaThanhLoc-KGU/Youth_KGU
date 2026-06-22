package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.Repository.ChuyenVienRepository;
import com.tathanhloc.youthkgu.Repository.GiangVienRepository;
import com.tathanhloc.youthkgu.Repository.SinhVienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tìm kiếm thống nhất SinhVien / GiangVien / ChuyenVien cho form thêm BCN CLB.
 */
@Service
@RequiredArgsConstructor
public class NguoiTimKiemBCNService {

    private final SinhVienRepository  sinhVienRepository;
    private final GiangVienRepository giangVienRepository;
    private final ChuyenVienRepository chuyenVienRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(String keyword, String loai) {
        String kw = keyword == null ? "" : keyword.trim();
        return switch (loai.toUpperCase()) {
            case "GV" -> giangVienRepository.searchByKeyword(kw).stream()
                    .limit(15)
                    .map(gv -> Map.<String, Object>of(
                            "ma", gv.getMaGv(),
                            "ten", gv.getHoTen() != null ? gv.getHoTen() : "",
                            "donVi", gv.getKhoa() != null ? gv.getKhoa().getTenKhoa() : "Giảng viên",
                            "email", gv.getEmail() != null ? gv.getEmail() : "",
                            "loai", "GV"
                    ))
                    .collect(Collectors.toList());
            case "CV" -> chuyenVienRepository.searchByKeyword(kw).stream()
                    .limit(15)
                    .map(cv -> Map.<String, Object>of(
                            "ma", cv.getMaChuyenVien(),
                            "ten", cv.getHoTen() != null ? cv.getHoTen() : "",
                            "donVi", cv.getChucDanh() != null ? cv.getChucDanh() : "Chuyên viên",
                            "email", cv.getEmail() != null ? cv.getEmail() : "",
                            "loai", "CV"
                    ))
                    .collect(Collectors.toList());
            default -> sinhVienRepository.searchByKeyword(kw).stream().limit(15)
                    .map(sv -> Map.<String, Object>of(
                            "ma", sv.getMaSv(),
                            "ten", sv.getHoTen() != null ? sv.getHoTen() : "",
                            "donVi", sv.getLop() != null ? sv.getLop().getTenLop() : "",
                            "email", sv.getEmail() != null ? sv.getEmail() : "",
                            "loai", "SV"
                    ))
                    .collect(Collectors.toList());
        };
    }
}
