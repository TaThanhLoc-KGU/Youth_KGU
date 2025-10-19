package com.tathanhloc.faceattendance.Util;

public class QRCodeGenerator {

    public static String generateQRCode(String maHoatDong, String maSinhVien) {
        if (maHoatDong == null || maSinhVien == null) {
            throw new IllegalArgumentException("Mã hoạt động và mã sinh viên không được null");
        }
        return maHoatDong + maSinhVien;
    }

    public static boolean isValidQRFormat(String maQR, String maHoatDong) {
        if (maQR == null || maHoatDong == null) {
            return false;
        }
        return maQR.startsWith(maHoatDong);
    }

    public static String extractMaSinhVien(String maQR, String maHoatDong) {
        if (!isValidQRFormat(maQR, maHoatDong)) {
            throw new IllegalArgumentException("Mã QR không hợp lệ");
        }
        return maQR.substring(maHoatDong.length());
    }
}