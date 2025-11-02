package com.tathanhloc.faceattendance.Service;

import com.tathanhloc.faceattendance.DTO.*;
import com.tathanhloc.faceattendance.Enum.GioiTinhEnum;
import com.tathanhloc.faceattendance.Model.*;
import com.tathanhloc.faceattendance.Repository.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.springframework.data.jpa.repository.JpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class SinhVienService extends BaseService<SinhVien, String, SinhVienDTO> {

    private final SinhVienRepository sinhVienRepository;
    private final LopRepository lopRepository;

    @Override
    protected JpaRepository<SinhVien, String> getRepository() {
        return sinhVienRepository;
    }

    @Override
    protected void setActive(SinhVien entity, boolean active) {
        entity.setIsActive(active);
    }

    @Override
    protected boolean isActive(SinhVien entity) {
        return entity.getIsActive() != null && entity.getIsActive();
    }

    public SinhVienDTO create(SinhVienDTO dto) {
        SinhVien entity = toEntity(dto);
        return toDTO(sinhVienRepository.save(entity));
    }

    public SinhVienDTO update(String id, SinhVienDTO dto) {
        SinhVien sv = sinhVienRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Không tìm thấy sinh viên với mã: " + id));

        sv.setHoTen(dto.getHoTen());
        sv.setGioiTinh(dto.getGioiTinh());
        sv.setNgaySinh(dto.getNgaySinh());
        sv.setEmail(dto.getEmail());

        sv.setIsActive(dto.getIsActive());
        sv.setLop(lopRepository.findById(dto.getMaLop()).orElseThrow(() ->
                new RuntimeException("Không tìm thấy lớp với mã: " + dto.getMaLop())));

        return toDTO(sinhVienRepository.save(sv));
    }

    @Override
    protected SinhVienDTO toDTO(SinhVien sv) {
        return SinhVienDTO.builder()
                .maSv(sv.getMaSv())
                .hoTen(sv.getHoTen())
                .gioiTinh(sv.getGioiTinh())
                .ngaySinh(sv.getNgaySinh())
                .email(sv.getEmail())
                .isActive(sv.getIsActive())
                .maLop(sv.getLop().getMaLop())
                .build();
    }

    @Override
    protected SinhVien toEntity(SinhVienDTO dto) {
        return SinhVien.builder()
                .maSv(dto.getMaSv())
                .hoTen(dto.getHoTen())
                .gioiTinh(dto.getGioiTinh())
                .ngaySinh(dto.getNgaySinh())
                .email(dto.getEmail())
                .isActive(dto.getIsActive())
                .lop(lopRepository.findById(dto.getMaLop()).orElseThrow(() ->
                        new RuntimeException("Không tìm thấy lớp với mã: " + dto.getMaLop())))
                .build();
    }

    public SinhVienDTO getByMaSv(String maSv) {
        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên với mã: " + maSv));
        return toDTO(sinhVien);
    }

    // Chỉ lấy sinh viên đang hoạt động
    public List<SinhVienDTO> getAllActive() {
        return sinhVienRepository.findAll().stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .map(this::toDTO)
                .toList();
    }

    /**
     * Lấy tất cả embedding của sinh viên đang hoạt động
     * @return Danh sách embedding của sinh viên
     */
    public List<Map<String, Object>> getAllEmbeddings() {
        return sinhVienRepository.findAll().stream()
                .filter(sv -> sv.getIsActive() != null && sv.getIsActive())
                .map(sv -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("studentId", sv.getMaSv());
                    result.put("name", sv.getHoTen());
                    return result;
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy embedding của một sinh viên theo mã sinh viên
     * @param maSv Mã sinh viên
     * @return Embedding của sinh viên
     */
    public Map<String, Object> getEmbeddingByMaSv(String maSv) {
        SinhVien sinhVien = sinhVienRepository.findById(maSv)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên với mã: " + maSv));


        Map<String, Object> result = new HashMap<>();
        result.put("studentId", sinhVien.getMaSv());
        result.put("name", sinhVien.getHoTen());
        return result;
    }



    public long count() {
        return sinhVienRepository.count();
    }
    // Thêm vào class SinhVienService
    public long countActive() {
        return sinhVienRepository.countByIsActiveTrue();
    }

    public long countAll() {
        return sinhVienRepository.count();
    }

    public byte[] createExcelTemplate() throws IOException {
        Workbook workbook = new XSSFWorkbook();

        // Sheet chính
        Sheet sheet = workbook.createSheet("Danh sách sinh viên");

        // Tạo header
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Mã SV", "Họ tên", "Giới tính", "Ngày sinh",
                "Email", "Số điện thoại", "Mã lớp", "Trạng thái"};

        CellStyle headerStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        headerStyle.setFont(font);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 4000);
        }

        // Tạo Data Validation cho Giới tính
        createGioiTinhDropdown(workbook, sheet, 1, 1000, 2);

        // Tạo Data Validation cho Mã lớp
        createMaLopDropdown(workbook, sheet, 1, 1000, 6);

        // Tạo Data Validation cho Trạng thái
        createTrangThaiDropdown(workbook, sheet, 1, 1000, 7);

        // Thêm sheet hướng dẫn
        createInstructionSheet(workbook);

        // Thêm sheet danh sách lớp (hidden)
        createLopReferenceSheet(workbook);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    private void createGioiTinhDropdown(Workbook workbook, Sheet sheet,
                                        int firstRow, int lastRow, int col) {
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        DataValidationConstraint constraint = validationHelper
                .createExplicitListConstraint(new String[]{"Nam", "Nữ"});

        CellRangeAddressList addressList = new CellRangeAddressList(
                firstRow, lastRow, col, col);
        DataValidation validation = validationHelper.createValidation(
                constraint, addressList);
        validation.setShowErrorBox(true);
        validation.setErrorStyle(DataValidation.ErrorStyle.STOP);
        validation.createErrorBox("Lỗi", "Vui lòng chọn Nam hoặc Nữ");
        sheet.addValidationData(validation);
    }

    private void createMaLopDropdown(Workbook workbook, Sheet sheet,
                                     int firstRow, int lastRow, int col) {
        // Lấy danh sách lớp
        List<Lop> lops = lopRepository.findAll()
                .stream()
                .filter(Lop::isActive)
                .collect(Collectors.toList());

        String[] lopArray = lops.stream()
                .map(Lop::getMaLop)
                .toArray(String[]::new);

        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        DataValidationConstraint constraint = validationHelper
                .createExplicitListConstraint(lopArray);

        CellRangeAddressList addressList = new CellRangeAddressList(
                firstRow, lastRow, col, col);
        DataValidation validation = validationHelper.createValidation(
                constraint, addressList);
        validation.setShowErrorBox(true);
        sheet.addValidationData(validation);
    }

    private void createTrangThaiDropdown(Workbook workbook, Sheet sheet,
                                         int firstRow, int lastRow, int col) {
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        DataValidationConstraint constraint = validationHelper
                .createExplicitListConstraint(new String[]{"Hoạt động", "Ngưng hoạt động"});

        CellRangeAddressList addressList = new CellRangeAddressList(
                firstRow, lastRow, col, col);
        DataValidation validation = validationHelper.createValidation(
                constraint, addressList);
        sheet.addValidationData(validation);
    }

    private void createLopReferenceSheet(Workbook workbook) {
        Sheet refSheet = workbook.createSheet("Danh sách lớp");

        List<Lop> lops = lopRepository.findAll()
                .stream()
                .filter(Lop::isActive)
                .collect(Collectors.toList());

        Row headerRow = refSheet.createRow(0);
        headerRow.createCell(0).setCellValue("Mã lớp");
        headerRow.createCell(1).setCellValue("Tên lớp");
        headerRow.createCell(2).setCellValue("Ngành");

        int rowIdx = 1;
        for (Lop lop : lops) {
            Row row = refSheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(lop.getMaLop());
            row.createCell(1).setCellValue(lop.getTenLop());
            row.createCell(2).setCellValue(lop.getNganh().getTenNganh());
        }

        workbook.setSheetHidden(workbook.getSheetIndex(refSheet), true);
    }

    private void createInstructionSheet(Workbook workbook) {
        Sheet instructionSheet = workbook.createSheet("Hướng dẫn");

        String[] instructions = {
                "HƯỚNG DẪN NHẬP DỮ LIỆU SINH VIÊN",
                "",
                "1. Mã SV: Bắt buộc, chỉ gồm chữ in hoa và số",
                "2. Họ tên: Bắt buộc, tối thiểu 2 ký tự",
                "3. Giới tính: Chọn Nam hoặc Nữ từ dropdown",
                "4. Ngày sinh: Định dạng dd/MM/yyyy (VD: 01/01/2000)",
                "5. Email: Định dạng hợp lệ (VD: student@example.com)",
                "6. Số điện thoại: 10 chữ số",
                "7. Mã lớp: Chọn từ dropdown (xem sheet 'Danh sách lớp')",
                "8. Trạng thái: Chọn 'Hoạt động' hoặc 'Ngưng hoạt động'",
                "",
                "LƯU Ý:",
                "- Không được để trống các trường bắt buộc",
                "- Mã SV không được trùng với dữ liệu đã có",
                "- Email không được trùng lặp"
        };

        for (int i = 0; i < instructions.length; i++) {
            Row row = instructionSheet.createRow(i);
            row.createCell(0).setCellValue(instructions[i]);
        }

        instructionSheet.setColumnWidth(0, 15000);
    }

    public ImportExcelResponse importFromExcel(MultipartFile file) throws IOException {
        List<SinhVienDTO> successList = new ArrayList<>();
        List<ImportExcelResponse.ImportFailureDetail> failureDetails = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Bỏ qua header row
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    SinhVienDTO dto = parseRowToDTO(row);

                    // Validate
                    validateSinhVienDTO(dto);

                    // Tạo sinh viên
                    SinhVien entity = toEntity(dto);
                    sinhVienRepository.save(entity);
                    successList.add(dto);

                } catch (Exception e) {
                    failureDetails.add(ImportExcelResponse.ImportFailureDetail.builder()
                            .row(i + 1)
                            .maSv(getCellValue(row.getCell(0)))
                            .errors(List.of(e.getMessage()))
                            .build());
                }
            }
        } catch (Exception e) {
            errors.add("Lỗi đọc file: " + e.getMessage());
        }

        return ImportExcelResponse.builder()
                .successCount(successList.size())
                .failureCount(failureDetails.size())
                .successList(successList)
                .failureDetails(failureDetails)
                .errors(errors)
                .build();
    }

    private SinhVienDTO parseRowToDTO(Row row) {
        return SinhVienDTO.builder()
                .maSv(getCellValue(row.getCell(0)))
                .hoTen(getCellValue(row.getCell(1)))
                .gioiTinh(parseGioiTinh(getCellValue(row.getCell(2))))
                .ngaySinh(parseDateCell(row.getCell(3)))
                .email(getCellValue(row.getCell(4)))
                .sdt(getCellValue(row.getCell(5)))
                .maLop(getCellValue(row.getCell(6)))
                .isActive(parseTrangThai(getCellValue(row.getCell(7))))
                .build();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }

    private GioiTinhEnum parseGioiTinh(String value) {
        if (value == null || value.isEmpty()) return null;
        return value.equalsIgnoreCase("Nam") ? GioiTinhEnum.NAM : GioiTinhEnum.NU;
    }

    private LocalDate parseDateCell(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        // Parse từ string nếu cần
        String dateStr = getCellValue(cell);
        if (dateStr.isEmpty()) return null;
        return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private Boolean parseTrangThai(String value) {
        return "Hoạt động".equalsIgnoreCase(value);
    }

    public byte[] exportToExcel() throws IOException {
        List<SinhVien> allStudents = sinhVienRepository.findAll();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Danh sách sinh viên");

        // Tạo header
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Mã SV", "Họ tên", "Giới tính", "Ngày sinh",
                "Email", "Số điện thoại", "Lớp", "Trạng thái"};

        CellStyle headerStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        headerStyle.setFont(font);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Điền dữ liệu
        int rowIdx = 1;
        for (SinhVien sv : allStudents) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(sv.getMaSv());
            row.createCell(1).setCellValue(sv.getHoTen());
            row.createCell(2).setCellValue(sv.getGioiTinh() != null ?
                    sv.getGioiTinh().getValue() : "");
            row.createCell(3).setCellValue(sv.getNgaySinh() != null ?
                    sv.getNgaySinh().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            row.createCell(4).setCellValue(sv.getEmail());
            row.createCell(5).setCellValue(sv.getSdt());
            row.createCell(6).setCellValue(sv.getLop().getMaLop());
            row.createCell(7).setCellValue(sv.getIsActive() ? "Hoạt động" : "Ngưng hoạt động");
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    private void validateSinhVienDTO(SinhVienDTO dto) {
        if (dto.getMaSv() == null || dto.getMaSv().isEmpty()) {
            throw new IllegalArgumentException("Mã sinh viên không được để trống");
        }
        if (dto.getHoTen() == null || dto.getHoTen().isEmpty()) {
            throw new IllegalArgumentException("Họ tên không được để trống");
        }
        if (dto.getMaLop() == null || dto.getMaLop().isEmpty()) {
            throw new IllegalArgumentException("Mã lớp không được để trống");
        }
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new IllegalArgumentException("Email không hợp lệ");
            }
        }
        if (sinhVienRepository.existsById(dto.getMaSv())) {
            throw new IllegalArgumentException("Mã sinh viên đã tồn tại");
        }
    }
}
