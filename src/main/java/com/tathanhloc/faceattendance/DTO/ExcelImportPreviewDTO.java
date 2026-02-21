package com.tathanhloc.faceattendance.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class ExcelImportPreviewDTO {
    @JsonProperty("validData")
    private List<?> validData;
    private List<ExcelErrorDTO> errors;
    private int totalRows;
    private int validRows;
    private int errorRows;

    public ExcelImportPreviewDTO() {
        this.validData = new ArrayList<>();
        this.errors = new ArrayList<>();
    }
}

