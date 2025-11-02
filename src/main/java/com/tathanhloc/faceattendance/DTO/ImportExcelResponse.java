package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportExcelResponse {
    private int successCount;
    private int failureCount;
    private List<SinhVienDTO> successList;
    private List<ImportFailureDetail> failureDetails;
    private List<String> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportFailureDetail {
        private int row;
        private String maSv;
        private List<String> errors;
    }
}
