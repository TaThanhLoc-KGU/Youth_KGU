package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.SinhVienDTO;
import com.tathanhloc.faceattendance.Enum.GioiTinhEnum;
import com.tathanhloc.faceattendance.Model.Lop;
import com.tathanhloc.faceattendance.Model.SinhVien;
import com.tathanhloc.faceattendance.Repository.LopRepository;
import com.tathanhloc.faceattendance.Repository.SinhVienRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final SinhVienRepository sinhVienRepository;
    private final LopRepository lopRepository;

    // Tạo template Excel với dropdown cho lớp
    public byte[] generateSinhVienTemplate() throws IOException {
        Workbook workbook = new XSSFWorkbook();

        // Sheet chính để nhập dữ liệu
        Sheet sheet = workbook.createSheet("Sinh Viên");

        // Sheet chứa danh sách lớp
        Sheet lopSheet = workbook.createSheet("Danh Sách Lớp");

        // Tạo header cho sheet Sinh Viên
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Mã SV", "Họ Tên", "Giới Tính", "Ngày Sinh (dd/MM/yyyy)",
                "Email", "SĐT", "Mã Lớp", "Trạng Thái (1=Active, 0=Inactive)"};

        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 4000);
        }

        // Thêm danh sách lớp vào sheet Danh Sách Lớp
        List<Lop> lopList = lopRepository.findAll();
        Row lopHeaderRow = lopSheet.createRow(0);
        lopHeaderRow.createCell(0).setCellValue("Mã Lớp");
        lopHeaderRow.createCell(1).setCellValue("Tên Lớp");

        for (int i = 0; i < lopList.size(); i++) {
            Row row = lopSheet.createRow(i + 1);
            row.createCell(0).setCellValue(lopList.get(i).getMaLop());
            row.createCell(1).setCellValue(lopList.get(i).getTenLop());
        }

        // Tạo dropdown cho cột Mã Lớp (cột index 6)
        if (!lopList.isEmpty()) {
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            String formula = "='Danh Sách Lớp'!$A$2:$A$" + (lopList.size() + 1);
            DataValidationConstraint constraint = validationHelper.createFormulaListConstraint(formula);
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 6, 6);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            validation.setSuppressDropDownArrow(true);
            validation.setShowErrorBox(true);
            sheet.addValidationData(validation);
        }

        // Tạo dropdown cho cột Giới Tính (cột index 2)
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        DataValidationConstraint genderConstraint = validationHelper.createExplicitListConstraint(
                new String[]{"Nam", "Nữ", "Khác"}
        );
        CellRangeAddressList genderAddressList = new CellRangeAddressList(1, 1000, 2, 2);
        DataValidation genderValidation = validationHelper.createValidation(genderConstraint, genderAddressList);
        genderValidation.setSuppressDropDownArrow(true);
        sheet.addValidationData(genderValidation);

        // Ẩn sheet Danh Sách Lớp
        workbook.setSheetHidden(1, true);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    // Parse Excel file và trả về danh sách DTO để preview
    public List<SinhVienDTO> parseExcelFile(MultipartFile file) throws IOException {
        List<SinhVienDTO> sinhVienList = new ArrayList<>();

        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        // Bỏ qua header row (row 0)
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            SinhVienDTO dto = new SinhVienDTO();
            StringBuilder errors = new StringBuilder();

            try {
                // Mã SV
                Cell maSvCell = row.getCell(0);
                if (maSvCell != null && maSvCell.getCellType() != CellType.BLANK) {
                    dto.setMaSv(getCellValueAsString(maSvCell));
                } else {
                    errors.append("Mã SV không được để trống. ");
                }

                // Họ tên
                Cell hoTenCell = row.getCell(1);
                if (hoTenCell != null && hoTenCell.getCellType() != CellType.BLANK) {
                    dto.setHoTen(getCellValueAsString(hoTenCell));
                } else {
                    errors.append("Họ tên không được để trống. ");
                }

                // Giới tính
                Cell gioiTinhCell = row.getCell(2);
                if (gioiTinhCell != null) {
                    String gioiTinhStr = getCellValueAsString(gioiTinhCell);
                    if (!gioiTinhStr.isEmpty()) {
                        try {
                            dto.setGioiTinh(GioiTinhEnum.fromValue(gioiTinhStr));
                        } catch (IllegalArgumentException e) {
                            errors.append("Giới tính không hợp lệ. ");
                        }
                    }
                }

                // Ngày sinh
                Cell ngaySinhCell = row.getCell(3);
                if (ngaySinhCell != null) {
                    if (ngaySinhCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(ngaySinhCell)) {
                        Date date = ngaySinhCell.getDateCellValue();
                        dto.setNgaySinh(date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
                    } else {
                        errors.append("Định dạng ngày sinh không hợp lệ. ");
                    }
                }

                // Email
                Cell emailCell = row.getCell(4);
                if (emailCell != null) {
                    dto.setEmail(getCellValueAsString(emailCell));
                }

                // SĐT
                Cell sdtCell = row.getCell(5);
                if (sdtCell != null) {
                    dto.setSdt(getCellValueAsString(sdtCell));
                }

                // Mã lớp
                Cell maLopCell = row.getCell(6);
                if (maLopCell != null && maLopCell.getCellType() != CellType.BLANK) {
                    String maLop = getCellValueAsString(maLopCell);
                    dto.setMaLop(maLop);

                    // Kiểm tra lớp có tồn tại không
                    Optional<Lop> lop = lopRepository.findById(maLop);
                    if (lop.isPresent()) {
                        dto.setTenLop(lop.get().getTenLop());
                    } else {
                        errors.append("Mã lớp không tồn tại. ");
                    }
                } else {
                    errors.append("Mã lớp không được để trống. ");
                }

                // Trạng thái
                Cell isActiveCell = row.getCell(7);
                if (isActiveCell != null) {
                    if (isActiveCell.getCellType() == CellType.NUMERIC) {
                        dto.setIsActive(isActiveCell.getNumericCellValue() == 1);
                    } else {
                        String value = getCellValueAsString(isActiveCell);
                        dto.setIsActive("1".equals(value) || "true".equalsIgnoreCase(value));
                    }
                } else {
                    dto.setIsActive(true); // Mặc định là active
                }

                dto.setErrorMessage(errors.length() > 0 ? errors.toString() : null);
                sinhVienList.add(dto);

            } catch (Exception e) {
                dto.setErrorMessage("Lỗi đọc dữ liệu: " + e.getMessage());
                sinhVienList.add(dto);
            }
        }

        workbook.close();
        return sinhVienList;
    }

    // Lưu danh sách sinh viên từ Excel vào database
    public List<SinhVien> importSinhVien(List<SinhVienDTO> dtoList) {
        List<SinhVien> savedList = new ArrayList<>();

        for (SinhVienDTO dto : dtoList) {
            if (dto.getErrorMessage() != null && !dto.getErrorMessage().isEmpty()) {
                continue; // Bỏ qua những dòng có lỗi
            }

            try {
                SinhVien sinhVien = new SinhVien();
                sinhVien.setMaSv(dto.getMaSv());
                sinhVien.setHoTen(dto.getHoTen());
                sinhVien.setGioiTinh(dto.getGioiTinh());
                sinhVien.setNgaySinh(dto.getNgaySinh());
                sinhVien.setEmail(dto.getEmail());
                sinhVien.setSdt(dto.getSdt());
                sinhVien.setIsActive(dto.getIsActive());

                // Set lớp
                Optional<Lop> lop = lopRepository.findById(dto.getMaLop());
                lop.ifPresent(sinhVien::setLop);

                savedList.add(sinhVienRepository.save(sinhVien));
            } catch (Exception e) {
                // Log lỗi nếu cần
            }
        }

        return savedList;
    }

    // Export danh sách sinh viên ra Excel
    public byte[] exportSinhVien(List<SinhVien> sinhVienList) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Sinh Viên");

        // Tạo header style
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Tạo date style
        CellStyle dateStyle = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/MM/yyyy"));

        // Tạo header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Mã SV", "Họ Tên", "Giới Tính", "Ngày Sinh",
                "Email", "SĐT", "Mã Lớp", "Tên Lớp", "Trạng Thái"};

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 4000);
        }

        // Điền dữ liệu
        int rowNum = 1;
        for (SinhVien sv : sinhVienList) {
            Row row = sheet.createRow(rowNum++);

            row.createCell(0).setCellValue(sv.getMaSv());
            row.createCell(1).setCellValue(sv.getHoTen());
            row.createCell(2).setCellValue(sv.getGioiTinh() != null ? sv.getGioiTinh().getValue() : "");

            if (sv.getNgaySinh() != null) {
                Cell dateCell = row.createCell(3);
                dateCell.setCellValue(Date.from(sv.getNgaySinh().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                dateCell.setCellStyle(dateStyle);
            }

            row.createCell(4).setCellValue(sv.getEmail());
            row.createCell(5).setCellValue(sv.getSdt());
            row.createCell(6).setCellValue(sv.getLop() != null ? sv.getLop().getMaLop() : "");
            row.createCell(7).setCellValue(sv.getLop() != null ? sv.getLop().getTenLop() : "");
            row.createCell(8).setCellValue(sv.getIsActive() ? "Active" : "Inactive");
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

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
                return "";
        }
    }
}