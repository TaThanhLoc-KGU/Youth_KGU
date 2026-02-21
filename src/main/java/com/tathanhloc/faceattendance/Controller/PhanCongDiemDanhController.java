package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.ApiResponse;
import com.tathanhloc.faceattendance.DTO.PhanCongDiemDanhDTO;
import com.tathanhloc.faceattendance.DTO.PhanCongDiemDanhRequest;
import com.tathanhloc.faceattendance.Service.PhanCongDiemDanhService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý phân công điểm danh cho các hoạt động
 */
@RestController
@RequestMapping("/api/phan-cong-diem-danh")
@RequiredArgsConstructor
@Slf4j
public class PhanCongDiemDanhController {

    private final PhanCongDiemDanhService phanCongService;

    /**
     * Phân công người điểm danh cho hoạt động
     * POST /api/phan-cong-diem-danh
     * @param request Yêu cầu phân công
     * @return List của PhanCongDiemDanhDTO
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<PhanCongDiemDanhDTO>>> phanCongNguoiDiemDanh(
            @RequestBody PhanCongDiemDanhRequest request) {
        log.info("POST /api/phan-cong-diem-danh - Phân công hoạt động: {}", request.getMaHoatDong());

        try {
            List<PhanCongDiemDanhDTO> result = phanCongService.phanCongNguoiDiemDanh(request);
            log.info("Phân công thành công: {} người cho hoạt động {}", result.size(), request.getMaHoatDong());

            return ResponseEntity.ok(
                    ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(true)
                            .message("Phân công người điểm danh thành công")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi phân công người điểm danh", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách người được phân công điểm danh cho một hoạt động
     * GET /api/phan-cong-diem-danh/hoat-dong/{maHoatDong}
     * @param maHoatDong Mã hoạt động
     * @return List của PhanCongDiemDanhDTO
     */
    @GetMapping("/hoat-dong/{maHoatDong}")
    public ResponseEntity<ApiResponse<List<PhanCongDiemDanhDTO>>> getDanhSachNguoiDiemDanh(
            @PathVariable String maHoatDong) {
        log.info("GET /api/phan-cong-diem-danh/hoat-dong/{} - Lấy danh sách người điểm danh", maHoatDong);

        try {
            List<PhanCongDiemDanhDTO> result = phanCongService.getDanhSachNguoiDiemDanh(maHoatDong);
            log.info("Tìm thấy {} người điểm danh cho hoạt động {}", result.size(), maHoatDong);

            return ResponseEntity.ok(
                    ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách người điểm danh thành công")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách người điểm danh", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Xóa phân công người điểm danh
     * DELETE /api/phan-cong-diem-danh?maHoatDong={maHoatDong}&maBch={maBch}
     * @param maHoatDong Mã hoạt động
     * @param maBch Mã BCH
     * @return ApiResponse
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> xoaPhanCong(
            @RequestParam String maHoatDong,
            @RequestParam String maBch) {
        log.info("DELETE /api/phan-cong-diem-danh - Xóa phân công hoạt động {} - BCH {}", maHoatDong, maBch);

        try {
            phanCongService.xoaPhanCong(maHoatDong, maBch);
            log.info("Xóa phân công thành công");

            return ResponseEntity.ok(
                    ApiResponse.<Void>builder()
                            .success(true)
                            .message("Xóa phân công thành công")
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi xóa phân công", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }

    /**
     * Lấy danh sách hoạt động được phân công cho một BCH
     * GET /api/phan-cong-diem-danh/bch/{maBch}
     * @param maBch Mã BCH
     * @return List của PhanCongDiemDanhDTO
     */
    @GetMapping("/bch/{maBch}")
    public ResponseEntity<ApiResponse<List<PhanCongDiemDanhDTO>>> getDanhSachHoatDongCuaBCH(
            @PathVariable String maBch) {
        log.info("GET /api/phan-cong-diem-danh/bch/{} - Lấy danh sách hoạt động của BCH", maBch);

        try {
            List<PhanCongDiemDanhDTO> result = phanCongService.getDanhSachHoatDongCuaBCH(maBch);
            log.info("Tìm thấy {} hoạt động được phân công cho BCH {}", result.size(), maBch);

            return ResponseEntity.ok(
                    ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(true)
                            .message("Lấy danh sách hoạt động thành công")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách hoạt động của BCH", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<PhanCongDiemDanhDTO>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
                    );
        }
    }
}
