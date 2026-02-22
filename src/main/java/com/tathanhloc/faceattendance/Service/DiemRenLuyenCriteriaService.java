package com.tathanhloc.faceattendance.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service quản lý tiêu chí điểm rèn luyện (cố định theo quy chế trường).
 * Dữ liệu được load từ file resources/diem-ren-luyen-criteria.json
 */
@Service
@Slf4j
public class DiemRenLuyenCriteriaService {

    private List<Map<String, Object>> criteriaList = new ArrayList<>();

    @PostConstruct
    public void loadCriteria() {
        try {
            ClassPathResource resource = new ClassPathResource("diem-ren-luyen-criteria.json");
            ObjectMapper mapper = new ObjectMapper();
            criteriaList = mapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            log.info("Loaded {} danh mục điểm rèn luyện", criteriaList.size());
        } catch (IOException e) {
            log.error("Không thể load file diem-ren-luyen-criteria.json", e);
        }
    }

    /** Trả về toàn bộ danh sách tiêu chí. */
    public List<Map<String, Object>> getAllCriteria() {
        return criteriaList;
    }

    /**
     * Tìm danh mục theo id (I, II, III, ...).
     */
    public Optional<Map<String, Object>> findDanhMuc(String danhMucId) {
        return criteriaList.stream()
                .filter(dm -> danhMucId.equals(dm.get("id")))
                .findFirst();
    }

    /**
     * Tìm tiêu chí con theo id (1.1, 2.1, 3.4, ...).
     * Trả về map chứa thông tin tiêu chí nếu tìm thấy.
     */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> findTieuChi(String tieuChiId) {
        for (Map<String, Object> dm : criteriaList) {
            List<Map<String, Object>> tieuChiList =
                    (List<Map<String, Object>>) dm.get("tieu_chi");
            if (tieuChiList != null) {
                for (Map<String, Object> tc : tieuChiList) {
                    if (tieuChiId.equals(tc.get("id"))) {
                        return Optional.of(tc);
                    }
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Lấy điểm tối đa của một tiêu chí con.
     * Trả về -1 nếu không tìm thấy.
     */
    public int getDiemToiDa(String tieuChiId) {
        return findTieuChi(tieuChiId)
                .map(tc -> (Integer) tc.get("diem_toi_da"))
                .orElse(-1);
    }

    /**
     * Kiểm tra xem điểm nhập có hợp lệ so với tiêu chí không.
     */
    public boolean isDiemHopLe(String tieuChiId, Integer diem) {
        if (tieuChiId == null || diem == null) return true;
        int max = getDiemToiDa(tieuChiId);
        if (max < 0) return true; // không tìm thấy tiêu chí, bỏ qua validate
        return diem >= 0 && diem <= max;
    }
}
