package com.tathanhloc.youthkgu.DTO;

import lombok.Data;
import java.util.List;

/** Auto-save 1 câu trong lúc làm bài. */
@Data
public class TnAutoSaveRequest {
    /** ID các đáp án thí sinh chọn (rỗng/null = bỏ trống). */
    private List<Long> traLoi;
    /** Cờ "đánh dấu xem lại". */
    private Boolean danhDau;
}
