package com.tathanhloc.youthkgu.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevokeCertificateRequest {

    @NotNull(message = "ID chứng nhận không được trống")
    private Long certificateId;

    @NotBlank(message = "Lý do không được trống")
    private String lyDo;
}
