package com.tathanhloc.youthkgu.payload.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
}
