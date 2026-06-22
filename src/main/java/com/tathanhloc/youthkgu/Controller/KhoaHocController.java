package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.KhoaHocDTO;
import com.tathanhloc.youthkgu.Service.KhoaHocService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/khoahoc")
@RequiredArgsConstructor
public class KhoaHocController {

    private final KhoaHocService khoaHocService;

    @GetMapping
    @PreAuthorize("hasPermission(null, 'XEM_KHOA_HOC')")
    public List<KhoaHocDTO> getAll() {
        return khoaHocService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'XEM_KHOA_HOC')")
    public KhoaHocDTO getById(@PathVariable String id) {
        return khoaHocService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'CAI_DAT_KHOA_HOC')")
    public KhoaHocDTO create(@RequestBody KhoaHocDTO dto) {
        return khoaHocService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_KHOA_HOC')")
    public KhoaHocDTO update(@PathVariable String id, @RequestBody KhoaHocDTO dto) {
        return khoaHocService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'CAI_DAT_KHOA_HOC')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        khoaHocService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-makhoahoc/{maKhoahoc}")
    @PreAuthorize("hasPermission(null, 'XEM_KHOA_HOC')")
    public ResponseEntity<KhoaHocDTO> getByMaKhoahoc(@PathVariable String maKhoahoc) {
        return ResponseEntity.ok(khoaHocService.getByMaKhoahoc(maKhoahoc));
    }

}
