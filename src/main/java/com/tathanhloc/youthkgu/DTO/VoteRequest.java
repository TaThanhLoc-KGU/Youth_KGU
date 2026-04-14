package com.tathanhloc.youthkgu.DTO;

import lombok.*;
import jakarta.validation.constraints.NotNull;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VoteRequest {
    @NotNull
    private Long cuocThiId;
    @NotNull
    private Long thiSinhId;
    private String deviceId; // browser fingerprint cho anonymous vote
}
