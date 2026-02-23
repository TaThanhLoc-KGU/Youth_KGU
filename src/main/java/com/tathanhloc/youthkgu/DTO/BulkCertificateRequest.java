package com.tathanhloc.youthkgu.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho cấp chứng nhận hàng loạt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkCertificateRequest {

    @NotBlank(message = "Mã hoạt động không được trống")
    private String maHoatDong;

    private Boolean autoIssue; // true = tự động cho tất cả đã hoàn thành

    private List<String> danhSachMaSv; // nếu muốn chỉ định cụ thể
}
