package com.tathanhloc.youthkgu.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiemDanhSelfScanRequest {
    private String token; // The dynamic QR token scanned by the student
    private Double latitude; // The GPS latitude of the student's device
    private Double longitude; // The GPS longitude of the student's device
}