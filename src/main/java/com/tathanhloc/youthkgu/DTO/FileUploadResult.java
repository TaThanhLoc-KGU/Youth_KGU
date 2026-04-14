package com.tathanhloc.youthkgu.DTO;

import lombok.*;

/**
 * Kết quả trả về sau khi FileStorageService lưu file thành công.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResult {
    private String duongDan;    // /uploads/van-ban/2025/03/{uuid}.pdf
    private String loaiFile;    // pdf | docx | xlsx ...
}
