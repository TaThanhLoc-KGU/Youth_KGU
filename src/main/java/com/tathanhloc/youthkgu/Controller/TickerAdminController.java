package com.tathanhloc.youthkgu.Controller;

import com.tathanhloc.youthkgu.DTO.ApiResponse;
import com.tathanhloc.youthkgu.DTO.TickerItemDTO;
import com.tathanhloc.youthkgu.Service.TickerItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ticker-items")
@RequiredArgsConstructor
@Slf4j
public class TickerAdminController {

    private final TickerItemService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TickerItemDTO>>> getAll() {
        log.info("Admin get all ticker items");
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TickerItemDTO>> create(@RequestBody TickerItemDTO dto) {
        log.info("Admin create ticker item");
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TickerItemDTO>> update(@PathVariable Long id, @RequestBody TickerItemDTO dto) {
        log.info("Admin update ticker item id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Updated", service.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Admin delete ticker item id={}", id);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody List<Long> ids) {
        log.info("Admin reorder ticker items");
        service.reorder(ids);
        return ResponseEntity.ok(ApiResponse.success("Reordered", null));
    }
}
