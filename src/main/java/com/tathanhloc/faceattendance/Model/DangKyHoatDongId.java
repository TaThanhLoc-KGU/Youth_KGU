package com.tathanhloc.faceattendance.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangKyHoatDongId implements Serializable {

    @Column(name = "ma_sv")
    private String maSv;

    @Column(name = "ma_hoat_dong")
    private String maHoatDong;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DangKyHoatDongId that = (DangKyHoatDongId) o;
        return Objects.equals(maSv, that.maSv) &&
                Objects.equals(maHoatDong, that.maHoatDong);
    }

    @Override
    public int hashCode() {
        return Objects.hash(maSv, maHoatDong);
    }
}