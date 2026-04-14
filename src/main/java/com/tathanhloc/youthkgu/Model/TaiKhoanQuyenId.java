package com.tathanhloc.youthkgu.Model;

import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TaiKhoanQuyenId implements Serializable {
    private Long taiKhoanId;
    private Long quyenId;
}
