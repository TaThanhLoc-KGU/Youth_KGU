package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "khoahoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhoaHoc {
    @Id
    @Column(name = "ma_khoahoc")
    private String maKhoaHoc;

    @Column(name = "ten_khoahoc")
    private String tenKhoaHoc;

    @Column(name = "nam_bat_dau")
    private Integer namBatDau;

    @Column(name = "nam_ket_thuc")
    private Integer namKetThuc;

    @Column(name = "is_current")
    private Boolean isCurrent;

    @Column(name = "is_active")
    private Boolean isActive;

    @AssertTrue(message = "Năm kết thúc phải sau năm bắt đầu")
    public boolean isValidDateRange() {
        return namKetThuc == null || namBatDau == null || namKetThuc > namBatDau;
    }
}
