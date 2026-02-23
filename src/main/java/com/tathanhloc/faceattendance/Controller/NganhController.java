package com.tathanhloc.faceattendance.Controller;

import com.tathanhloc.faceattendance.DTO.NganhDTO;
import com.tathanhloc.faceattendance.Service.NganhService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nganh")
@RequiredArgsConstructor
@Slf4j
public class NganhController {

    private final NganhService nganhService;

    /**
     * Lấy tất cả ngành đang hoạt động
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<List<NganhDTO>> getAllActive() {
        log.info("Lấy danh sách ngành đang hoạt động");
        return ResponseEntity.ok(nganhService.getAllActive());
    }

    /**
     * Lấy tất cả ngành (bao gồm đã xóa)
     */
    @GetMapping("/all")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<List<NganhDTO>> getAll() {
        log.info("Lấy tất cả ngành (bao gồm đã xóa)");
        return ResponseEntity.ok(nganhService.getAllWithDeleted());
    }

    /**
     * Lấy tất cả ngành với đầy đủ thông tin sinh viên
     */
    @GetMapping("/all-with-students")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<List<NganhDTO>> getAllWithAllStudents() {
        log.info("Lấy tất cả ngành với thông tin sinh viên đầy đủ");
        return ResponseEntity.ok(nganhService.getAllWithAllStudents());
    }

    /**
     * Lấy chỉ những ngành đã bị xóa
     */
    @GetMapping("/deleted")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<List<NganhDTO>> getDeleted() {
        log.info("Lấy danh sách ngành đã xóa");
        return ResponseEntity.ok(nganhService.getDeletedOnly());
    }

    /**
     * Lấy ngành theo ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<NganhDTO> getById(@PathVariable String id) {
        log.info("Lấy ngành với ID: {}", id);
        return ResponseEntity.ok(nganhService.getById(id));
    }

    /**
     * Lấy ngành theo mã ngành
     */
    @GetMapping("/by-manganh/{maNganh}")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<NganhDTO> getByMaNganh(@PathVariable String maNganh) {
        log.info("Lấy ngành theo mã: {}", maNganh);
        return ResponseEntity.ok(nganhService.getByMaNganh(maNganh));
    }

    /**
     * Lấy ngành theo khoa
     */
    @GetMapping("/by-khoa/{maKhoa}")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<List<NganhDTO>> getByKhoa(@PathVariable String maKhoa) {
        log.info("Lấy ngành theo khoa: {}", maKhoa);
        return ResponseEntity.ok(nganhService.getByKhoa(maKhoa));
    }

    /**
     * Tạo ngành mới
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'QUAN_LY_NGANH')")
    public ResponseEntity<NganhDTO> create(@RequestBody NganhDTO dto) {
        log.info("Tạo ngành mới: {}", dto);
        NganhDTO created = nganhService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Cập nhật ngành
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_NGANH')")
    public ResponseEntity<NganhDTO> update(@PathVariable String id, @RequestBody NganhDTO dto) {
        log.info("Cập nhật ngành với ID {}: {}", id, dto);
        return ResponseEntity.ok(nganhService.update(id, dto));
    }

    /**
     * Xóa mềm ngành (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_NGANH')")
    public ResponseEntity<Void> softDelete(@PathVariable String id) {
        log.info("Xóa mềm ngành với ID: {}", id);
        nganhService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Khôi phục ngành đã xóa mềm
     */
    @PutMapping("/{id}/restore")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_NGANH')")
    public ResponseEntity<Void> restore(@PathVariable String id) {
        log.info("Khôi phục ngành với ID: {}", id);
        nganhService.restore(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa vĩnh viễn ngành (hard delete)
     */
    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasPermission(null, 'QUAN_LY_NGANH')")
    public ResponseEntity<Void> hardDelete(@PathVariable String id) {
        log.info("Xóa vĩnh viễn ngành với ID: {}", id);
        nganhService.hardDelete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy thống kê chi tiết về ngành
     */
    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasPermission(null, 'XEM_NGANH')")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable String id) {
        log.info("Lấy thống kê chi tiết cho ngành với ID: {}", id);
        return ResponseEntity.ok(nganhService.getNganhStatistics(id));
    }
}
