package com.tathanhloc.faceattendance.DTO;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportFailureDetail {
    private int row;
    private String maSv;
    private List<String> errors;
}
