package com.tathanhloc.youthkgu.Service;

import com.tathanhloc.youthkgu.DTO.ChuyenVienDTO;
import com.tathanhloc.youthkgu.DTO.ExcelErrorDTO;
import com.tathanhloc.youthkgu.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.youthkgu.Model.Khoa;
import com.tathanhloc.youthkgu.Repository.KhoaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChuyenVienExcelService {

    private final KhoaRepository khoaRepository;

    /**
     * Tạo template Excel cho Chuyên viên
     */
    public byte[] createTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet dataSheet = workbook.createSheet("Danh sách chuyên viên");

            // Header style
            CellStyle headerStyle = createHeaderStyle(workbook);

            // Headers
            String[] headers = {"Mã chuyên viên", "Họ tên", "Email", "SĐT", "Chức danh", "Mã khoa", "Trạng thái"};
            Row headerRow = dataSheet.createRow(0);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                dataSheet.setColumnWidth(i, 5000);
            }

            // Sample data
            Row sampleRow = dataSheet.createRow(1);
            sampleRow.createCell(0).setCellValue("CV001");
            sampleRow.createCell(1).setCellValue("Nguyễn Văn A");
            sampleRow.createCell(2).setCellValue("nva@vnkgu.edu.vn");
            sampleRow.createCell(3).setCellValue("0987654321");
            sampleRow.createCell(4).setCellValue("ThS");
            sampleRow.createCell(5).setCellValue("KH001");
            sampleRow.createCell(6).setCellValue("HOAT_DONG");

            // Sheet 2: Danh sách khoa (để tra cứu mã khoa)
            Sheet khoaSheet = workbook.createSheet("Danh sách khoa");
            Row khoaHeaderRow = khoaSheet.createRow(0);
            khoaHeaderRow.createCell(0).setCellValue("Mã khoa");
            khoaHeaderRow.createCell(1).setCellValue("Tên khoa");
            khoaHeaderRow.getCell(0).setCellStyle(headerStyle);
            khoaHeaderRow.getCell(1).setCellStyle(headerStyle);
            khoaSheet.setColumnWidth(0, 4000);
            khoaSheet.setColumnWidth(1, 8000);

            List<Khoa> khoaList = khoaRepository.findAll();
            int rowNum = 1;
            for (Khoa khoa : khoaList) {
                Row row = khoaSheet.createRow(rowNum++);
                row.createCell(0).setCellValue(khoa.getMaKhoa());
                row.createCell(1).setCellValue(khoa.getTenKhoa());
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Preview dữ liệu từ Excel
     */
    public ExcelImportPreviewDTO previewExcel(MultipartFile file) throws Exception {
        ExcelImportPreviewDTO preview = new ExcelImportPreviewDTO();
        List<ChuyenVienDTO> validData = new ArrayList<>();
        List<ExcelErrorDTO> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheet("Danh sách chuyên viên");
            if (sheet == null) sheet = workbook.getSheetAt(0);

            int totalRows = sheet.getLastRowNum();
            preview.setTotalRows(totalRows);

            for (int i = 1; i <= totalRows; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                final int rowNum = i + 1;
                try {
                    ChuyenVienDTO dto = parseRowToDTO(row);
                    validateDTO(dto, rowNum, errors);

                    if (errors.stream().noneMatch(e -> e.getRowNumber() == rowNum)) {
                        validData.add(dto);
                    }
                } catch (Exception e) {
                    errors.add(ExcelErrorDTO.builder()
                            .rowNumber(rowNum)
                            .field("General")
                            .errorMessage("Lỗi đọc dữ liệu: " + e.getMessage())
                            .build());
                }
            }

            preview.setValidData(validData);
            preview.setErrors(errors);
            preview.setValidRows(validData.size());
            preview.setErrorRows(errors.size());
        }

        return preview;
    }

    /**
     * Export danh sách chuyên viên ra Excel
     */
    public byte[] exportToExcel(List<ChuyenVienDTO> list) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh sách chuyên viên");
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"Mã chuyên viên", "Họ tên", "Email", "SĐT", "Chức danh", "Khoa", "Trạng thái"};
            Row headerRow = sheet.createRow(0);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (ChuyenVienDTO cv : list) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(cv.getMaChuyenVien());
                row.createCell(1).setCellValue(cv.getHoTen());
                row.createCell(2).setCellValue(cv.getEmail());
                row.createCell(3).setCellValue(cv.getSdt());
                row.createCell(4).setCellValue(cv.getChucDanh());
                row.createCell(5).setCellValue(cv.getTenKhoa());
                row.createCell(6).setCellValue(cv.getIsActive() != null && cv.getIsActive() ? "HOAT_DONG" : "NGUNG_HOAT_DONG");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private ChuyenVienDTO parseRowToDTO(Row row) {
        return ChuyenVienDTO.builder()
                .maChuyenVien(getCellValueAsString(row.getCell(0)))
                .hoTen(getCellValueAsString(row.getCell(1)))
                .email(getCellValueAsString(row.getCell(2)))
                .sdt(getCellValueAsString(row.getCell(3)))
                .chucDanh(getCellValueAsString(row.getCell(4)))
                .maKhoa(getCellValueAsString(row.getCell(5)))
                .isActive(!"NGUNG_HOAT_DONG".equalsIgnoreCase(getCellValueAsString(row.getCell(6))))
                .build();
    }

    private void validateDTO(ChuyenVienDTO dto, int rowNum, List<ExcelErrorDTO> errors) {
        if (dto.getMaChuyenVien() == null || dto.getMaChuyenVien().isEmpty()) {
            errors.add(new ExcelErrorDTO(rowNum, "Mã chuyên viên", "Mã chuyên viên không được để trống"));
        }
        if (dto.getHoTen() == null || dto.getHoTen().isEmpty()) {
            errors.add(new ExcelErrorDTO(rowNum, "Họ tên", "Họ tên không được để trống"));
        }
        if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
            errors.add(new ExcelErrorDTO(rowNum, "Email", "Email không được để trống"));
        } else if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            errors.add(new ExcelErrorDTO(rowNum, "Email", "Email không hợp lệ"));
        }
        
        if (dto.getMaKhoa() != null && !dto.getMaKhoa().isEmpty()) {
            Optional<Khoa> khoa = khoaRepository.findById(dto.getMaKhoa());
            if (khoa.isEmpty()) {
                errors.add(new ExcelErrorDTO(rowNum, "Mã khoa", "Mã khoa không tồn tại: " + dto.getMaKhoa()));
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            default: return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < 7; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
}
