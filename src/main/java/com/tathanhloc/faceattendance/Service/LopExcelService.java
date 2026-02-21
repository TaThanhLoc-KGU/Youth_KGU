package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.faceattendance.DTO.ExcelErrorDTO;
import com.tathanhloc.faceattendance.DTO.LopDTO;
import com.tathanhloc.faceattendance.Repository.NganhRepository;
import com.tathanhloc.faceattendance.Repository.KhoaHocRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LopExcelService {

    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoahocRepository;

    /**
     * Tạo template Excel với danh sách ngành và khóa học
     */
    public byte[] createTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Template dữ liệu
            Sheet dataSheet = workbook.createSheet("Danh sách lớp");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Create data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);

            // Create headers
            Row headerRow = dataSheet.createRow(0);
            String[] headers = {"Mã lớp", "Tên lớp", "Mã ngành", "Mã khóa học", "Trạng thái"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                dataSheet.setColumnWidth(i, 5000);
            }

            // Add sample data
            Row sampleRow = dataSheet.createRow(1);
            sampleRow.createCell(0).setCellValue("LOP001");
            sampleRow.createCell(1).setCellValue("Lớp 10A");
            sampleRow.createCell(2).setCellValue("CNTT");
            sampleRow.createCell(3).setCellValue("K20");
            sampleRow.createCell(4).setCellValue("HOAT_DONG");

            // Sheet 2: Danh sách ngành
            Sheet nganhSheet = workbook.createSheet("Danh sách ngành");
            Row nganhHeaderRow = nganhSheet.createRow(0);
            nganhHeaderRow.createCell(0).setCellValue("Mã ngành");
            nganhHeaderRow.createCell(1).setCellValue("Tên ngành");

            for (int i = 0; i < 2; i++) {
                nganhHeaderRow.getCell(i).setCellStyle(headerStyle);
                nganhSheet.setColumnWidth(i, 5000);
            }

            // Lấy danh sách ngành đang hoạt động
            var nganhList = nganhRepository.findAllActive();
            int nganhRowNum = 1;
            for (var nganh : nganhList) {
                Row row = nganhSheet.createRow(nganhRowNum++);
                row.createCell(0).setCellValue(nganh.getMaNganh());
                row.createCell(1).setCellValue(nganh.getTenNganh());
            }

            // Sheet 3: Danh sách khóa học
            Sheet khoahocSheet = workbook.createSheet("Danh sách khóa học");
            Row khoahocHeaderRow = khoahocSheet.createRow(0);
            khoahocHeaderRow.createCell(0).setCellValue("Mã khóa học");
            khoahocHeaderRow.createCell(1).setCellValue("Tên khóa học");

            for (int i = 0; i < 2; i++) {
                khoahocHeaderRow.getCell(i).setCellStyle(headerStyle);
                khoahocSheet.setColumnWidth(i, 5000);
            }

            // Lấy danh sách khóa học
            var khoahocList = khoahocRepository.findAll();
            int khoahocRowNum = 1;
            for (var khoahoc : khoahocList) {
                Row row = khoahocSheet.createRow(khoahocRowNum++);
                row.createCell(0).setCellValue(khoahoc.getMaKhoahoc());
                row.createCell(1).setCellValue(khoahoc.getTenKhoahoc());
            }

            // Sheet 4: Hướng dẫn
            Sheet guideSheet = workbook.createSheet("Hướng dẫn");
            String[] guides = {
                    "HƯỚNG DẪN NHẬP LIỆU",
                    "",
                    "1. Mã lớp: Bắt buộc, tối đa 20 ký tự, không được trùng",
                    "2. Tên lớp: Bắt buộc, tối đa 100 ký tự",
                    "3. Mã ngành: Bắt buộc, phải tồn tại trong sheet 'Danh sách ngành'",
                    "4. Mã khóa học: Tùy chọn, phải tồn tại trong sheet 'Danh sách khóa học'",
                    "5. Trạng thái: HOAT_DONG hoặc NGUNG_HOAT_DONG (viết hoa, gạch dưới)",
                    "",
                    "LƯU Ý:",
                    "- Không chỉnh sửa dòng tiêu đề",
                    "- Không để trống các trường bắt buộc",
                    "- Kiểm tra kỹ mã ngành và khóa học trong các sheet tương ứng",
                    "- Xóa dòng mẫu trước khi nhập dữ liệu thực"
            };

            for (int i = 0; i < guides.length; i++) {
                Row row = guideSheet.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(guides[i]);
                if (i == 0 || i == 8) {
                    cell.setCellStyle(headerStyle);
                }
            }
            guideSheet.setColumnWidth(0, 15000);

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
        List<LopDTO> validData = new ArrayList<>();
        List<ExcelErrorDTO> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheet("Danh sách lớp");
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }

            int totalRows = sheet.getLastRowNum();
            preview.setTotalRows(totalRows);

            // Skip header row
            for (int i = 1; i <= totalRows; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                try {
                    int rowNumber = i + 1;
                    LopDTO dto = parseRowToDTO(row, i);
                    validateDTO(dto, i, errors);

                    if (errors.stream().noneMatch(e -> e.getRowNumber() == rowNumber)) {
                        validData.add(dto);
                    }
                } catch (Exception e) {
                    errors.add(ExcelErrorDTO.builder()
                            .rowNumber(i + 1)
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
     * Export lớp ra Excel
     */
    public byte[] exportToExcel(List<LopDTO> lopList) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh sách lớp");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);

            // Create header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Mã lớp", "Tên lớp", "Ngành", "Khóa học", "Trạng thái"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Fill data
            int rowNum = 1;
            for (LopDTO lop : lopList) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(lop.getMaLop());
                row.createCell(1).setCellValue(lop.getTenLop());
                row.createCell(2).setCellValue(lop.getMaNganh() != null ? lop.getMaNganh() : "");
                row.createCell(3).setCellValue(lop.getMaKhoahoc() != null ? lop.getMaKhoahoc(): "");
                row.createCell(4).setCellValue(lop.getIsActive() != null && lop.getIsActive() ? "HOAT_DONG" : "NGUNG_HOAT_DONG");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    // Helper methods
    private LopDTO parseRowToDTO(Row row, int rowIndex) {
        LopDTO dto = new LopDTO();

        dto.setMaLop(getCellValueAsString(row.getCell(0)));
        dto.setTenLop(getCellValueAsString(row.getCell(1)));
        dto.setMaNganh(getCellValueAsString(row.getCell(2)));
        dto.setMaKhoahoc(getCellValueAsString(row.getCell(3)));

        String trangThai = getCellValueAsString(row.getCell(4));
        dto.setIsActive(trangThai == null || trangThai.equalsIgnoreCase("HOAT_DONG"));

        return dto;
    }

    private void validateDTO(LopDTO dto, int rowIndex, List<ExcelErrorDTO> errors) {
        int rowNumber = rowIndex + 1;

        if (dto.getMaLop() == null || dto.getMaLop().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Mã lớp")
                    .errorMessage("Mã lớp không được để trống")
                    .build());
        }

        if (dto.getTenLop() == null || dto.getTenLop().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Tên lớp")
                    .errorMessage("Tên lớp không được để trống")
                    .build());
        }

        if (dto.getMaNganh() == null || dto.getMaNganh().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Mã ngành")
                    .errorMessage("Mã ngành không được để trống")
                    .build());
        } else {
            if (!nganhRepository.existsById(dto.getMaNganh())) {
                errors.add(ExcelErrorDTO.builder()
                        .rowNumber(rowNumber)
                        .field("Mã ngành")
                        .errorMessage("Mã ngành không tồn tại: " + dto.getMaNganh())
                        .build());
            }
        }

        if (dto.getMaKhoahoc() != null && !dto.getMaKhoahoc().trim().isEmpty()) {
            if (!khoahocRepository.existsById(dto.getMaKhoahoc())) {
                errors.add(ExcelErrorDTO.builder()
                        .rowNumber(rowNumber)
                        .field("Mã khóa học")
                        .errorMessage("Mã khóa học không tồn tại: " + dto.getMaKhoahoc())
                        .build());
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < 5; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    return false;
                }
            }
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
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
}
