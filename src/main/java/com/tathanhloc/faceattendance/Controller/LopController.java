package com.tathanhloc.faceattendance.Controller;
import com.tathanhloc.faceattendance.DTO.LopDTO;
import com.tathanhloc.faceattendance.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.faceattendance.Service.LopService;
import com.tathanhloc.faceattendance.Service.LopExcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/lop")
@RequiredArgsConstructor
public class LopController {

    private final LopService lopService;
    private final LopExcelService lopExcelService;

    // Lấy tất cả lớp (bao gồm cả đã xóa)
    @GetMapping("/all")
    public List<LopDTO> getAll() {
        return lopService.getAll();
    }

    // Lấy chỉ lớp đang hoạt động
    @GetMapping
    public List<LopDTO> getAllActive() {
        return lopService.getAllActive();
    }

    // Lấy chỉ lớp đã bị xóa mềm
    @GetMapping("/deleted")
    public List<LopDTO> getAllDeleted() {
        return lopService.getAllDeleted();
    }

    @GetMapping("/{id}")
    public LopDTO getById(@PathVariable String id) {
        return lopService.getById(id);
    }

    @PostMapping
    public LopDTO create(@RequestBody LopDTO dto) {
        return lopService.create(dto);
    }

    @PutMapping("/{id}")
    public LopDTO update(@PathVariable String id, @RequestBody LopDTO dto) {
        return lopService.update(id, dto);
    }

    // Xóa mềm
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable String id) {
        lopService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    // Khôi phục lớp đã xóa mềm
    @PutMapping("/{id}/restore")
    public ResponseEntity<LopDTO> restore(@PathVariable String id) {
        LopDTO restored = lopService.restore(id);
        return ResponseEntity.ok(restored);
    }

    // Xóa vĩnh viễn
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDelete(@PathVariable String id) {
        lopService.hardDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-malop/{maLop}")
    public ResponseEntity<LopDTO> getByMaLop(@PathVariable String maLop) {
        return ResponseEntity.ok(lopService.getByMaLop(maLop));
    }

    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        long count = lopService.count();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/active")
    public ResponseEntity<Long> countActive() {
        long count = lopService.countActive();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/inactive")
    public ResponseEntity<Long> countInactive() {
        long count = lopService.countInactive();
        return ResponseEntity.ok(count);
    }
    // Thêm vào class LopController
    @GetMapping("/{maLop}/sinhvien/count")
    public ResponseEntity<Long> countSinhVienByLop(@PathVariable String maLop) {
        long count = lopService.countSinhVienByLop(maLop);
        return ResponseEntity.ok(count);
    }

    // Excel import/export endpoints
    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] excelFile = lopExcelService.createTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template-lop.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelFile);
    }

    @PostMapping("/import-excel/preview")
    public ResponseEntity<ExcelImportPreviewDTO> previewExcelImport(@RequestParam MultipartFile file) throws Exception {
        ExcelImportPreviewDTO preview = lopExcelService.previewExcel(file);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/import-excel/confirm")
    public ResponseEntity<ExcelImportPreviewDTO> confirmExcelImport(@RequestParam MultipartFile file) throws Exception {
        ExcelImportPreviewDTO preview = lopExcelService.previewExcel(file);
        // Import valid data
        if (preview.getValidData() != null && !preview.getValidData().isEmpty()) {
            for (Object item : preview.getValidData()) {
                try {
                    if (item instanceof LopDTO) {
                        LopDTO lopDTO = (LopDTO) item;
                        lopService.create(lopDTO);
                    }
                } catch (Exception e) {
                    // Log error but continue importing
                }
            }
        }
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportToExcel() throws Exception {
        List<LopDTO> lopList = lopService.getAll();
        byte[] excelFile = lopExcelService.exportToExcel(lopList);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lop-" + System.currentTimeMillis() + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelFile);
    }
}