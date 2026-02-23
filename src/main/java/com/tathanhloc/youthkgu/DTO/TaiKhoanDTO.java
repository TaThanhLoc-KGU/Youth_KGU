package com.tathanhloc.youthkgu.DTO;

import com.tathanhloc.youthkgu.Enum.VaiTroEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiKhoanDTO {
    private Long id;
    private String username;
    private String passwordHash;
    private VaiTroEnum vaiTro;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String maSv;
    private String maGv;
}
