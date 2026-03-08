package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.SliderItemDTO;
import com.tathanhloc.youthkgu.Service.SliderItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slider-items")
@RequiredArgsConstructor
@Slf4j
public class SliderAdminController {

    private final SliderItemService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SliderItemDTO>>> getAll() {
        log.info("Admin get all slider items");
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SliderItemDTO>> create(@RequestBody SliderItemDTO dto) {
        log.info("Admin create slider item");
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SliderItemDTO>> update(@PathVariable Long id, @RequestBody SliderItemDTO dto) {
        log.info("Admin update slider item id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Updated", service.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Admin delete slider item id={}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("Admin reorder slider items");
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success("Reordered", null));
    }
}
