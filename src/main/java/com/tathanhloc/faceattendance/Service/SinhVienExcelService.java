package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.ExcelImportPreviewDTO;
import com.tathanhloc.faceattendance.DTO.ExcelErrorDTO;
import com.tathanhloc.faceattendance.DTO.SinhVienDTO;
import com.tathanhloc.faceattendance.Enum.GioiTinhEnum;
import com.tathanhloc.faceattendance.Model.Lop;
import com.tathanhloc.faceattendance.Repository.LopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SinhVienExcelService {

    private final LopRepository lopRepository;

    /**
     * Tạo template Excel với danh sách lớp
     */
    public byte[] createTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Hướng dẫn và template
            Sheet dataSheet = workbook.createSheet("Danh sách sinh viên");

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

            // Create date style
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(dataStyle);
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));

            // Create headers
            Row headerRow = dataSheet.createRow(0);
            String[] headers = {"Mã SV", "Họ tên", "Giới tính", "Ngày sinh", "Email", "SĐT", "Mã lớp", "Trạng thái"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                dataSheet.setColumnWidth(i, 4000);
            }

            // Add sample data
            Row sampleRow = dataSheet.createRow(1);
            sampleRow.createCell(0).setCellValue("SV001");
            sampleRow.createCell(1).setCellValue("Nguyễn Văn A");
            sampleRow.createCell(2).setCellValue("NAM");
            Cell dateCell = sampleRow.createCell(3);
            dateCell.setCellValue(LocalDate.of(2000, 1, 1));
            dateCell.setCellStyle(dateStyle);
            sampleRow.createCell(4).setCellValue("student@example.com");
            sampleRow.createCell(5).setCellValue("0123456789");
            sampleRow.createCell(6).setCellValue("LOP001");
            sampleRow.createCell(7).setCellValue("HOAT_DONG");

            // Sheet 2: Danh sách lớp
            Sheet lopSheet = workbook.createSheet("Danh sách lớp");
            Row lopHeaderRow = lopSheet.createRow(0);
            lopHeaderRow.createCell(0).setCellValue("Mã lớp");
            lopHeaderRow.createCell(1).setCellValue("Tên lớp");
            lopHeaderRow.createCell(2).setCellValue("Khoa");
            lopHeaderRow.createCell(3).setCellValue("Ngành");

            for (int i = 0; i < 4; i++) {
                lopHeaderRow.getCell(i).setCellStyle(headerStyle);
                lopSheet.setColumnWidth(i, 5000);
            }

            // Lấy danh sách lớp đang hoạt động
            List<Lop> lopList = lopRepository.findByIsActiveTrue();
            int lopRowNum = 1;
            for (Lop lop : lopList) {
                Row row = lopSheet.createRow(lopRowNum++);
                row.createCell(0).setCellValue(lop.getMaLop());
                row.createCell(1).setCellValue(lop.getTenLop());
                row.createCell(2).setCellValue(lop.getMaKhoa() != null ? lop.getMaKhoa().getTenKhoa() : "");
                row.createCell(3).setCellValue(lop.getNganh() != null ? lop.getNganh().getTenNganh() : "");
            }

            // Sheet 3: Hướng dẫn
            Sheet guideSheet = workbook.createSheet("Hướng dẫn");
            String[] guides = {
                    "HƯỚNG DẪN NHẬP LIỆU",
                    "",
                    "1. Mã SV: Bắt buộc, tối đa 20 ký tự, không được trùng",
                    "2. Họ tên: Bắt buộc, tối đa 100 ký tự",
                    "3. Giới tính: NAM hoặc NU (viết hoa)",
                    "4. Ngày sinh: Định dạng dd/mm/yyyy (ví dụ: 01/01/2000)",
                    "5. Email: Định dạng email hợp lệ",
                    "6. SĐT: Tối đa 15 ký tự, chỉ số",
                    "7. Mã lớp: Bắt buộc, tham khảo sheet 'Danh sách lớp'",
                    "8. Trạng thái: HOAT_DONG hoặc NGUNG_HOAT_DONG (viết hoa, gạch dưới)",
                    "",
                    "LƯU Ý:",
                    "- Không chỉnh sửa dòng tiêu đề",
                    "- Không để trống các trường bắt buộc",
                    "- Kiểm tra kỹ mã lớp trong sheet 'Danh sách lớp'",
                    "- Xóa dòng mẫu trước khi nhập dữ liệu thực"
            };

            for (int i = 0; i < guides.length; i++) {
                Row row = guideSheet.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(guides[i]);
                if (i == 0 || i == 11) {
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
        List<SinhVienDTO> validData = new ArrayList<>();
        List<ExcelErrorDTO> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheet("Danh sách sinh viên");
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
                    SinhVienDTO dto = parseRowToDTO(row, i);
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
     * Export sinh viên ra Excel
     */
    public byte[] exportToExcel(List<SinhVienDTO> sinhVienList) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh sách sinh viên");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);

            // Create header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Mã SV", "Họ tên", "Giới tính", "Ngày sinh", "Email", "SĐT", "Lớp", "Trạng thái"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            // Fill data
            int rowNum = 1;
            for (SinhVienDTO sv : sinhVienList) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(sv.getMaSv());
                row.createCell(1).setCellValue(sv.getHoTen());
                row.createCell(2).setCellValue(sv.getGioiTinh() != null ? sv.getGioiTinh().name() : "");

                if (sv.getNgaySinh() != null) {
                    Cell dateCell = row.createCell(3);
                    dateCell.setCellValue(sv.getNgaySinh());
                    dateCell.setCellStyle(dateStyle);
                } else {
                    row.createCell(3).setCellValue("");
                }

                row.createCell(4).setCellValue(sv.getEmail() != null ? sv.getEmail() : "");
                row.createCell(5).setCellValue(sv.getSdt() != null ? sv.getSdt() : "");
                row.createCell(6).setCellValue(sv.getTenLop() != null ? sv.getTenLop() : "");
                row.createCell(7).setCellValue(sv.getIsActive() != null && sv.getIsActive() ? "HOAT_DONG" : "NGUNG_HOAT_DONG");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    // Helper methods
    private SinhVienDTO parseRowToDTO(Row row, int rowIndex) {
        SinhVienDTO dto = new SinhVienDTO();

        dto.setMaSv(getCellValueAsString(row.getCell(0)));
        dto.setHoTen(getCellValueAsString(row.getCell(1)));

        String gioiTinh = getCellValueAsString(row.getCell(2));
        if (gioiTinh != null && !gioiTinh.isEmpty()) {
            try {
                dto.setGioiTinh(GioiTinhEnum.valueOf(gioiTinh.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Will be caught in validation
            }
        }

        Cell dateCell = row.getCell(3);
        if (dateCell != null) {
            if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                dto.setNgaySinh(dateCell.getDateCellValue().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate());
            } else {
                String dateStr = getCellValueAsString(dateCell);
                if (dateStr != null && !dateStr.isEmpty()) {
                    try {
                        // Try parsing dd/mm/yyyy format
                        String[] parts = dateStr.split("/");
                        if (parts.length == 3) {
                            dto.setNgaySinh(LocalDate.of(
                                    Integer.parseInt(parts[2]),
                                    Integer.parseInt(parts[1]),
                                    Integer.parseInt(parts[0])
                            ));
                        }
                    } catch (Exception e) {
                        // Will be caught in validation
                    }
                }
            }
        }

        dto.setEmail(getCellValueAsString(row.getCell(4)));
        dto.setSdt(getCellValueAsString(row.getCell(5)));
        dto.setMaLop(getCellValueAsString(row.getCell(6)));

        String trangThai = getCellValueAsString(row.getCell(7));
        dto.setIsActive(trangThai == null || trangThai.equalsIgnoreCase("HOAT_DONG"));

        return dto;
    }

    private void validateDTO(SinhVienDTO dto, int rowIndex, List<ExcelErrorDTO> errors) {
        int rowNumber = rowIndex + 1;

        if (dto.getMaSv() == null || dto.getMaSv().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Mã SV")
                    .errorMessage("Mã sinh viên không được để trống")
                    .build());
        }

        if (dto.getHoTen() == null || dto.getHoTen().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Họ tên")
                    .errorMessage("Họ tên không được để trống")
                    .build());
        }

        if (dto.getMaLop() == null || dto.getMaLop().trim().isEmpty()) {
            errors.add(ExcelErrorDTO.builder()
                    .rowNumber(rowNumber)
                    .field("Mã lớp")
                    .errorMessage("Mã lớp không được để trống")
                    .build());
        } else {
            Optional<Lop> lop = lopRepository.findById(dto.getMaLop());
            if (lop.isEmpty()) {
                errors.add(ExcelErrorDTO.builder()
                        .rowNumber(rowNumber)
                        .field("Mã lớp")
                        .errorMessage("Mã lớp không tồn tại: " + dto.getMaLop())
                        .build());
            }
        }

        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                errors.add(ExcelErrorDTO.builder()
                        .rowNumber(rowNumber)
                        .field("Email")
                        .errorMessage("Email không hợp lệ")
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
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
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
        for (int i = 0; i < 7; i++) {
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

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
}