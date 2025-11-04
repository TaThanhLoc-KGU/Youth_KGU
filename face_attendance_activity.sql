-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 04, 2025 lúc 05:47 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `face_attendance_activity`
--

DELIMITER $$
--
-- Thủ tục
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_dang_ky_hoat_dong` (IN `p_ma_sv` VARCHAR(50), IN `p_ma_hoat_dong` VARCHAR(50), OUT `p_ma_qr` VARCHAR(100), OUT `p_result` VARCHAR(255))   BEGIN
    DECLARE v_da_dang_ky INT DEFAULT 0;
    DECLARE v_han_dang_ky DATETIME;
    DECLARE v_so_luong_toi_da INT;
    DECLARE v_so_nguoi_dang_ky INT;
    DECLARE v_qr_code VARCHAR(100);

    -- Kiểm tra hoạt động tồn tại
    IF NOT EXISTS (SELECT 1 FROM hoat_dong WHERE ma_hoat_dong = p_ma_hoat_dong AND is_active = TRUE) THEN
        SET p_result = 'ERROR: Hoạt động không tồn tại';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hoạt động không tồn tại';
    END IF;

    -- Kiểm tra đã đăng ký
    SELECT COUNT(*) INTO v_da_dang_ky
    FROM dang_ky_hoat_dong
    WHERE ma_sv = p_ma_sv AND ma_hoat_dong = p_ma_hoat_dong AND is_active = TRUE;

    IF v_da_dang_ky > 0 THEN
        SET p_result = 'ERROR: Đã đăng ký hoạt động này';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đã đăng ký hoạt động này';
    END IF;

    -- Kiểm tra hạn và số lượng
    SELECT han_dang_ky, so_luong_toi_da INTO v_han_dang_ky, v_so_luong_toi_da
    FROM hoat_dong WHERE ma_hoat_dong = p_ma_hoat_dong;

    IF v_han_dang_ky < NOW() THEN
        SET p_result = 'ERROR: Hết hạn đăng ký';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đã hết hạn đăng ký';
    END IF;

    SELECT COUNT(*) INTO v_so_nguoi_dang_ky
    FROM dang_ky_hoat_dong
    WHERE ma_hoat_dong = p_ma_hoat_dong AND is_active = TRUE;

    IF v_so_luong_toi_da IS NOT NULL AND v_so_nguoi_dang_ky >= v_so_luong_toi_da THEN
        SET p_result = 'ERROR: Hoạt động đã đủ số lượng';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hoạt động đã đủ số lượng';
    END IF;

    -- Sinh mã QR
    SET v_qr_code = CONCAT(p_ma_hoat_dong, p_ma_sv);

    -- Đăng ký
    INSERT INTO dang_ky_hoat_dong (ma_sv, ma_hoat_dong, ma_qr, is_active)
    VALUES (p_ma_sv, p_ma_hoat_dong, v_qr_code, TRUE);

    SET p_ma_qr = v_qr_code;
    SET p_result = CONCAT('SUCCESS: Đăng ký thành công. Mã QR: ', v_qr_code);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_diem_danh_qr` (IN `p_ma_qr` VARCHAR(100), IN `p_ma_hoat_dong` VARCHAR(50), IN `p_ma_bch_xac_nhan` VARCHAR(50), IN `p_latitude` DOUBLE, IN `p_longitude` DOUBLE, OUT `p_result` VARCHAR(255))   BEGIN
    DECLARE v_ma_sv VARCHAR(50);
    DECLARE v_qr_hop_le INT DEFAULT 0;
    DECLARE v_da_diem_danh INT DEFAULT 0;

    SELECT COUNT(*) INTO v_qr_hop_le
    FROM dang_ky_hoat_dong
    WHERE ma_qr = p_ma_qr AND ma_hoat_dong = p_ma_hoat_dong AND is_active = TRUE;

    IF v_qr_hop_le = 0 THEN
        SET p_result = 'ERROR: Mã QR không hợp lệ';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mã QR không hợp lệ';
    END IF;

    SELECT ma_sv INTO v_ma_sv
    FROM dang_ky_hoat_dong WHERE ma_qr = p_ma_qr;

    SELECT COUNT(*) INTO v_da_diem_danh
    FROM diem_danh_hoat_dong WHERE ma_qr_da_quet = p_ma_qr;

    IF v_da_diem_danh > 0 THEN
        SET p_result = 'ERROR: Mã QR đã được điểm danh';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mã QR đã được quét';
    END IF;

    INSERT INTO diem_danh_hoat_dong (
        ma_hoat_dong, ma_sv, ma_qr_da_quet,
        trang_thai, thoi_gian_check_in,
        ma_bch_xac_nhan, latitude, longitude
    )
    VALUES (
        p_ma_hoat_dong, v_ma_sv, p_ma_qr,
        'DA_THAM_GIA', NOW(),
        p_ma_bch_xac_nhan, p_latitude, p_longitude
    );

    SET p_result = CONCAT('SUCCESS: Điểm danh thành công cho sinh viên ', v_ma_sv);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ban`
--

CREATE TABLE `ban` (
  `ma_ban` varchar(20) NOT NULL,
  `ten_ban` varchar(100) NOT NULL,
  `loai_ban` varchar(30) DEFAULT NULL,
  `mo_ta` text DEFAULT NULL,
  `ma_khoa` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ban`
--

INSERT INTO `ban` (`ma_ban`, `ten_ban`, `loai_ban`, `mo_ta`, `ma_khoa`, `is_active`) VALUES
('BAN001', 'Ban Truyền thông - Chuyển đổi số', 'BAN', NULL, NULL, 1),
('BAN002', 'Ban Hậu cần', 'BAN', NULL, NULL, 1),
('BAN003', 'CLB Truyền thông và máy tính', 'CLB', NULL, NULL, 1),
('BAN004', 'Đội Tình nguyện', 'DOI', NULL, NULL, 1),
('BAN005', 'Ban Văn hóa - Thể thao', 'BAN', NULL, NULL, 1),
('BAN006', 'Ban Lễ tân - Khánh tiết', 'DOAN', '', NULL, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bch_chuc_vu`
--

CREATE TABLE `bch_chuc_vu` (
  `id` bigint(20) NOT NULL,
  `ma_bch` varchar(20) NOT NULL,
  `ma_chuc_vu` varchar(20) NOT NULL,
  `ma_ban` varchar(20) DEFAULT NULL,
  `ngay_nhan_chuc` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `bch_chuc_vu`
--

INSERT INTO `bch_chuc_vu` (`id`, `ma_bch`, `ma_chuc_vu`, `ma_ban`, `ngay_nhan_chuc`, `ngay_ket_thuc`, `is_active`) VALUES
(1, 'BCHKGU0001', 'CV001', NULL, '2025-11-04', NULL, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bch_doan_hoi`
--

CREATE TABLE `bch_doan_hoi` (
  `ma_bch` varchar(50) NOT NULL,
  `loai_thanh_vien` enum('SINH_VIEN','GIANG_VIEN','CHUYEN_VIEN') NOT NULL DEFAULT 'SINH_VIEN',
  `hinh_anh` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime(6) DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `nhiem_ky` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `ma_sv` varchar(20) DEFAULT NULL,
  `ma_gv` varchar(50) DEFAULT NULL,
  `ma_chuyen_vien` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `bch_doan_hoi`
--

INSERT INTO `bch_doan_hoi` (`ma_bch`, `loai_thanh_vien`, `hinh_anh`, `is_active`, `created_at`, `ngay_bat_dau`, `ngay_ket_thuc`, `nhiem_ky`, `updated_at`, `ma_sv`, `ma_gv`, `ma_chuyen_vien`) VALUES
('BCHKGU0001', 'GIANG_VIEN', NULL, 1, '2025-11-04 11:39:06.000000', '2025-01-01', '2027-12-12', '2025-2027', '2025-11-04 11:39:06.000000', NULL, 'GV001', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chuc_vu`
--

CREATE TABLE `chuc_vu` (
  `ma_chuc_vu` varchar(20) NOT NULL,
  `ten_chuc_vu` varchar(100) NOT NULL,
  `thuoc_ban` varchar(50) DEFAULT NULL,
  `mo_ta` text DEFAULT NULL,
  `thu_tu` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chuc_vu`
--

INSERT INTO `chuc_vu` (`ma_chuc_vu`, `ten_chuc_vu`, `thuoc_ban`, `mo_ta`, `thu_tu`, `is_active`) VALUES
('CV001', 'Bí thư Đoàn Trường', 'DOAN', NULL, 1, 1),
('CV002', 'Phó Bí thư Đoàn Trường', 'DOAN', NULL, 2, 1),
('CV003', 'Ủy viên Ban Chấp hành Đoàn', 'DOAN', NULL, 3, 1),
('CV004', 'Ủy viên Ban Thường vụ', 'DOAN', NULL, 4, 1),
('CV005', 'Chủ tịch Hội Sinh viên', 'HOI', NULL, 5, 1),
('CV006', 'Phó Chủ tịch Hội Sinh viên', 'HOI', NULL, 6, 1),
('CV007', 'Ban Thư ký Hội Sinh viên', 'HOI', NULL, 7, 1),
('CV008', 'Ủy viên Ban Chấp hành Hội', 'HOI', NULL, 8, 1),
('CV009', 'Trưởng Ban', 'BAN', NULL, 9, 1),
('CV010', 'Phó Ban', 'BAN', NULL, 10, 1),
('CV011', 'Thành viên', 'BAN', NULL, 11, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chung_nhan_hoat_dong`
--

CREATE TABLE `chung_nhan_hoat_dong` (
  `id` bigint(20) NOT NULL,
  `ma_chung_nhan` varchar(50) NOT NULL,
  `ma_sv` varchar(50) NOT NULL,
  `ma_hoat_dong` varchar(50) NOT NULL,
  `ngay_cap` date DEFAULT NULL,
  `noi_dung_chung_nhan` text DEFAULT NULL,
  `ma_bch_ky` varchar(50) DEFAULT NULL,
  `so_gio_phuc_vu` double DEFAULT NULL COMMENT 'Số giờ phục vụ cộng đồng',
  `file_pdf` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `file_path` varchar(500) DEFAULT NULL,
  `noi_dung` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chuyenvien`
--

CREATE TABLE `chuyenvien` (
  `ma_chuyen_vien` varchar(50) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `sdt` varchar(15) DEFAULT NULL,
  `chuc_danh` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `ma_khoa` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chuyenvien`
--

INSERT INTO `chuyenvien` (`ma_chuyen_vien`, `ho_ten`, `email`, `sdt`, `chuc_danh`, `is_active`, `created_at`, `updated_at`, `ma_khoa`) VALUES
('CV001', 'Nguyễn Thị Lan', 'lan.nt@university.edu.vn', '0901234567', 'Chuyên viên Đoàn Trường', 1, NULL, NULL, NULL),
('CV002', 'Trần Văn Minh', 'minh.tv@university.edu.vn', '0902345678', 'Chuyên viên Hội Sinh viên', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dang_ky_hoat_dong`
--

CREATE TABLE `dang_ky_hoat_dong` (
  `ma_sv` varchar(50) NOT NULL,
  `ma_hoat_dong` varchar(50) NOT NULL,
  `ma_qr` varchar(100) NOT NULL,
  `ngay_dang_ky` timestamp NOT NULL DEFAULT current_timestamp(),
  `ghi_chu` text DEFAULT NULL,
  `da_xac_nhan` tinyint(1) DEFAULT 0,
  `qr_code_image_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `diem_danh_hoat_dong`
--

CREATE TABLE `diem_danh_hoat_dong` (
  `id` bigint(20) NOT NULL,
  `ma_hoat_dong` varchar(50) NOT NULL,
  `ma_sv` varchar(50) NOT NULL,
  `ma_qr_da_quet` varchar(100) NOT NULL,
  `trang_thai` enum('DANG_KY','DA_THAM_GIA','VANG_MAT','HUY_DANG_KY') NOT NULL DEFAULT 'DANG_KY',
  `thoi_gian_check_in` datetime DEFAULT NULL COMMENT 'Thời điểm quét QR check-in',
  `trang_thai_check_in` enum('DUNG_GIO','TRE','CHUA_CHECK_IN') DEFAULT NULL COMMENT 'Trạng thái check-in',
  `so_phut_tre` int(11) DEFAULT 0 COMMENT 'Số phút trễ',
  `ma_bch_check_in` varchar(50) DEFAULT NULL COMMENT 'BCH check-in',
  `thiet_bi_check_in` varchar(255) DEFAULT NULL COMMENT 'Device info check-in',
  `latitude_check_in` double DEFAULT NULL COMMENT 'Tọa độ GPS check-in',
  `longitude_check_in` double DEFAULT NULL,
  `thoi_gian_check_out` datetime DEFAULT NULL COMMENT 'Thời điểm quét QR check-out',
  `trang_thai_check_out` enum('HOAN_THANH','VE_SOM','CHUA_CHECK_OUT') DEFAULT NULL COMMENT 'Trạng thái check-out',
  `so_phut_ve_som` int(11) DEFAULT 0 COMMENT 'Số phút về sớm',
  `ma_bch_check_out` varchar(50) DEFAULT NULL COMMENT 'BCH check-out',
  `thiet_bi_check_out` varchar(255) DEFAULT NULL COMMENT 'Device info check-out',
  `latitude_check_out` double DEFAULT NULL COMMENT 'Tọa độ GPS check-out',
  `longitude_check_out` double DEFAULT NULL,
  `tong_thoi_gian_tham_gia` int(11) DEFAULT NULL COMMENT 'Tổng thời gian tham gia (phút)',
  `dat_thoi_gian_toi_thieu` tinyint(1) DEFAULT 0 COMMENT 'Đủ thời gian tối thiểu không',
  `tinh_gio_phuc_vu` tinyint(1) DEFAULT 0 COMMENT 'Tính vào giờ phục vụ cộng đồng',
  `ghi_chu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `thiet_bi_quet` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `giangvien`
--

CREATE TABLE `giangvien` (
  `ma_gv` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ho_ten` varchar(255) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `ma_khoa` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `giangvien`
--

INSERT INTO `giangvien` (`ma_gv`, `email`, `ho_ten`, `is_active`, `ma_khoa`) VALUES
('GV001', 'ntkphuoc@vnkgu.edu.vn', 'Nguyễn Thị Kim Phước', b'1', 'TNMT');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hoat_dong`
--

CREATE TABLE `hoat_dong` (
  `ma_hoat_dong` varchar(50) NOT NULL,
  `ten_hoat_dong` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `loai_hoat_dong` enum('CHINH_TRI','VAN_HOA_NGHE_THUAT','THE_THAO','TINH_NGUYEN','HOC_THUAT','KY_NANG_MEM','DOAN_HOI','CONG_DONG','KHAC') NOT NULL DEFAULT 'KHAC',
  `cap_do` enum('TRUONG','KHOA','NGANH','LOP') NOT NULL DEFAULT 'TRUONG',
  `ngay_to_chuc` date NOT NULL,
  `thoi_gian_bat_dau` time(6) DEFAULT NULL,
  `thoi_gian_ket_thuc` time(6) DEFAULT NULL,
  `cho_phep_check_in_som` int(11) DEFAULT 30 COMMENT 'Phút được phép check-in sớm',
  `thoi_gian_tre_toi_da` int(11) DEFAULT 15 COMMENT 'Phút trễ tối đa vẫn tính đúng giờ',
  `yeu_cau_check_out` tinyint(1) DEFAULT 0 COMMENT 'Có yêu cầu check-out không',
  `thoi_gian_toi_thieu` int(11) DEFAULT 60 COMMENT 'Thời gian tối thiểu tham gia (phút)',
  `dia_diem` varchar(200) DEFAULT NULL,
  `ma_phong` varchar(50) DEFAULT NULL,
  `so_luong_toi_da` int(11) DEFAULT NULL,
  `diem_ren_luyen` int(11) DEFAULT 0,
  `ma_bch_phu_trach` varchar(50) DEFAULT NULL,
  `ma_khoa` varchar(50) DEFAULT NULL,
  `ma_nganh` varchar(50) DEFAULT NULL,
  `trang_thai` enum('SAP_DIEN_RA','DANG_DIEN_RA','DA_KET_THUC','HUY_BO') NOT NULL DEFAULT 'SAP_DIEN_RA',
  `yeu_cau_diem_danh` tinyint(1) DEFAULT 1,
  `cho_phep_dang_ky` tinyint(1) DEFAULT 1,
  `han_dang_ky` datetime DEFAULT NULL,
  `hinh_anh_poster` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ghi_chu` text DEFAULT NULL,
  `gio_to_chuc` time(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hoc_ky`
--

CREATE TABLE `hoc_ky` (
  `ma_hoc_ky` varchar(255) NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_current` bit(1) DEFAULT NULL,
  `mo_ta` varchar(255) DEFAULT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `ten_hoc_ky` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hoc_ky_nam_hoc`
--

CREATE TABLE `hoc_ky_nam_hoc` (
  `id` int(11) NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `thu_tu` int(11) DEFAULT NULL,
  `ma_hoc_ky` varchar(255) DEFAULT NULL,
  `ma_nam_hoc` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khoa`
--

CREATE TABLE `khoa` (
  `ma_khoa` varchar(50) NOT NULL,
  `ten_khoa` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `khoa`
--

INSERT INTO `khoa` (`ma_khoa`, `ten_khoa`, `is_active`) VALUES
('CTL', 'Chính trị - Luật', 1),
('KHTPSK', 'Khoa học Thực phẩm và Sức khỏe', 1),
('KT', 'Kỹ thuật', 1),
('KTe', 'Kinh Tế', 1),
('NN', 'Ngoại ngữ', 1),
('NN_PTNT', 'Nông nghiệp và Phát triển Nông thôn', 1),
('SPXH', 'Sư phạm và Xã hội Nhân văn', 1),
('TEST', 'TEST1', 0),
('TNMT', 'Tài nguyên - Môi trường', 1),
('TTTT', 'Thông tin và Truyền thông', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khoahoc`
--

CREATE TABLE `khoahoc` (
  `ma_khoahoc` varchar(50) NOT NULL,
  `ten_khoahoc` varchar(255) NOT NULL,
  `nam_bat_dau` int(11) DEFAULT NULL,
  `nam_ket_thuc` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_current` bit(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `khoahoc`
--

INSERT INTO `khoahoc` (`ma_khoahoc`, `ten_khoahoc`, `nam_bat_dau`, `nam_ket_thuc`, `is_active`, `is_current`) VALUES
('B021', 'Khóa 7', 2021, 2025, 1, b'1'),
('B022', 'Khóa 8', 2022, 2025, 1, b'1'),
('B023', 'Khóa 9', 2023, 2026, 1, b'1'),
('B024', 'Khóa 10', 2024, 2028, 1, b'1'),
('B025', 'Khóa 11', 2025, 2029, 1, b'1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lop`
--

CREATE TABLE `lop` (
  `ma_lop` varchar(50) NOT NULL,
  `ten_lop` varchar(255) NOT NULL,
  `ma_nganh` varchar(50) DEFAULT NULL,
  `ma_khoahoc` varchar(50) DEFAULT NULL,
  `ma_khoa` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lop`
--

INSERT INTO `lop` (`ma_lop`, `ten_lop`, `ma_nganh`, `ma_khoahoc`, `ma_khoa`, `is_active`) VALUES
('B021TT1', 'B021TT1', 'CNTT', 'B021', 'TTTT', 1),
('B021TT2', 'B021TT2', 'CNTT', 'B021', 'TTTT', 1),
('B022TT2', 'B022TT2', 'CNTT', 'B022', 'TTTT', 1),
('B022TT3', 'B022TT3', 'CNTT', 'B022', 'TTTT', 1),
('B022TT4', 'B022TT4', 'CNTT', 'B022', 'TTTT', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `nam_hoc`
--

CREATE TABLE `nam_hoc` (
  `ma_nam_hoc` varchar(255) NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_current` bit(1) DEFAULT NULL,
  `mo_ta` varchar(255) DEFAULT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `ten_nam_hoc` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `nam_hoc`
--

INSERT INTO `nam_hoc` (`ma_nam_hoc`, `is_active`, `is_current`, `mo_ta`, `ngay_bat_dau`, `ngay_ket_thuc`, `ten_nam_hoc`) VALUES
('2025-2026', b'1', b'1', 'Năm học 2025-2026', '2025-08-10', '2026-07-31', 'Năm học 2025 - 2026'),
('2026-2027', b'0', b'0', 'Năm học 2026-2027 được tạo tự động', '2026-09-01', '2027-06-30', 'Năm học 2026-2027');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `nganh`
--

CREATE TABLE `nganh` (
  `ma_nganh` varchar(50) NOT NULL,
  `ten_nganh` varchar(255) NOT NULL,
  `ma_khoa` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `nganh`
--

INSERT INTO `nganh` (`ma_nganh`, `ten_nganh`, `ma_khoa`, `is_active`) VALUES
('CNTT', 'Công nghệ Thông tin', 'TTTT', 1),
('TTDPT', 'Truyền thông Đa phương tiện', 'TTTT', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `phonghoc`
--

CREATE TABLE `phonghoc` (
  `ma_phong` varchar(50) NOT NULL,
  `ten_phong` varchar(255) NOT NULL,
  `loai_phong` varchar(255) DEFAULT NULL,
  `suc_chua` int(11) DEFAULT NULL,
  `toa_nha` varchar(255) DEFAULT NULL,
  `tang` int(11) DEFAULT NULL,
  `trang_thai` varchar(255) DEFAULT NULL,
  `vi_tri` varchar(255) DEFAULT NULL,
  `thiet_bi` text DEFAULT NULL,
  `mo_ta` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `phonghoc`
--

INSERT INTO `phonghoc` (`ma_phong`, `ten_phong`, `loai_phong`, `suc_chua`, `toa_nha`, `tang`, `trang_thai`, `vi_tri`, `thiet_bi`, `mo_ta`, `is_active`) VALUES
('A101', 'Phòng học A101', 'LECTURE', 50, 'Tòa B', 1, 'AVAILABLE', 'Cuối hành lang bên trái', 'PROJECTOR,AC', 'Phòng học lý thuyết cơ bản', 0),
('A201', 'Phòng học A201', 'LECTURE', 60, 'Tòa A', 2, 'INACTIVE', 'Giữa hành lang', 'PROJECTOR,AC,MICROPHONE', 'Phòng học lớn cho lớp đông sinh viên', 1),
('A507', 'Phòng máy tính A507', 'COMPUTER', 20, 'Nhà A', 5, 'AVAILABLE', NULL, 'PROJECTOR,COMPUTER,AC', NULL, 1),
('A509', 'Phòng thực hành A509', 'LECTURE', 50, 'Tòa A', 3, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng học máy tính', 1),
('B101', 'Lab Tin học B101', 'COMPUTER', 40, 'Tòa B', 1, 'AVAILABLE', 'Đầu hành lang bên phải', 'COMPUTER,PROJECTOR,AC,WIFI', 'Phòng máy tính với 40 máy tính', 1),
('B201', 'Lab Thí nghiệm B201', 'LAB', 25, 'Tòa B', 2, 'MAINTENANCE', 'Cuối hành lang', 'PROJECTOR,WHITEBOARD', 'Phòng thí nghiệm vật lý', 1),
('C301', 'Phòng hội thảo C301', 'CONFERENCE', 100, 'Tòa C', 3, 'AVAILABLE', 'Tầng 3 tòa C', 'PROJECTOR,MICROPHONE,SPEAKER,AC,WIFI', 'Phòng hội thảo lớn cho sự kiện', 1),
('P101', 'Phòng 101', 'LECTURE', 50, 'Tòa A', 1, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng học lý thuyết', 1),
('P102', 'Phòng 102', 'LECTURE', 50, 'Tòa A', 1, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng học lý thuyết', 1),
('P103', 'Phòng 103', 'LECTURE', 50, 'Tòa A', 1, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng thực hành máy tính', 1),
('P104', 'Phòng 104', 'LECTURE', 50, 'Tòa A', 2, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng thực hành máy tính', 1),
('P105', 'Phòng 105', 'LECTURE', 50, 'Tòa A', 2, 'AVAILABLE', NULL, 'PROJECTOR,WHITEBOARD', 'Phòng học lý thuyết', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` bigint(20) NOT NULL,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(255) NOT NULL,
  `tai_khoan_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sinhvien`
--

CREATE TABLE `sinhvien` (
  `ma_sv` varchar(50) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `gioi_tinh` varchar(10) DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `sdt` varchar(15) DEFAULT NULL,
  `ma_lop` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sinhvien`
--

INSERT INTO `sinhvien` (`ma_sv`, `ho_ten`, `gioi_tinh`, `ngay_sinh`, `email`, `sdt`, `ma_lop`, `is_active`) VALUES
('21072006095', 'Tạ Thành Lộc', 'NAM', '2003-08-24', 'loc21072006095@vnkgu.edu.vn', '0967006704', 'B021TT2', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_log`
--

CREATE TABLE `system_log` (
  `id` bigint(20) NOT NULL,
  `action` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `duration_ms` bigint(20) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `error_details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `log_level` enum('DEBUG','ERROR','FATAL','INFO','TRACE','WARN') NOT NULL,
  `message` text NOT NULL,
  `module` varchar(100) NOT NULL,
  `new_value` text DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `request_url` varchar(500) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `system_log`
--

INSERT INTO `system_log` (`id`, `action`, `created_at`, `duration_ms`, `entity_id`, `entity_type`, `error_details`, `ip_address`, `log_level`, `message`, `module`, `new_value`, `old_value`, `request_method`, `request_url`, `session_id`, `status`, `user_agent`, `user_id`, `user_name`) VALUES
(1, 'BCHDoanHoiController.getAll', '2025-11-03 19:55:11.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.toDTOWithChucVu(BCHDoanHoiService.java:291)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getAll(BCHDoanHoiService.java:36)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(2, 'BCHDoanHoiController.getAll', '2025-11-03 19:55:12.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.toDTOWithChucVu(BCHDoanHoiService.java:291)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getAll(BCHDoanHoiService.java:36)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(3, 'KhoaHocController.getAll', '2025-11-03 19:55:15.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(4, 'KhoaHocController.getAll', '2025-11-03 19:55:16.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(5, 'KhoaController.getAll', '2025-11-03 19:55:16.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(6, 'LopController.getAllActive', '2025-11-03 19:55:16.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(7, 'NganhController.getAllActive', '2025-11-03 19:55:16.000000', 32, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(8, 'KhoaController.getAll', '2025-11-03 19:55:16.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(9, 'NganhController.getAllActive', '2025-11-03 19:55:17.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(10, 'KhoaController.getAll', '2025-11-03 19:55:17.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(11, 'HoatDongController.getAllWithPagination', '2025-11-03 19:55:18.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(12, 'NganhController.getAllActive', '2025-11-03 19:55:19.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(13, 'KhoaController.getAll', '2025-11-03 19:55:19.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(14, 'LopController.getAllActive', '2025-11-03 19:55:19.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(15, 'SinhVienController.getAll', '2025-11-03 19:55:19.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(16, 'BCHDoanHoiController.getAll', '2025-11-03 19:55:22.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.toDTOWithChucVu(BCHDoanHoiService.java:291)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getAll(BCHDoanHoiService.java:36)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(17, 'BCHDoanHoiController.getAll', '2025-11-03 19:55:27.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.toDTOWithChucVu(BCHDoanHoiService.java:291)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getAll(BCHDoanHoiService.java:36)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(18, 'BCHDoanHoiController.getAll', '2025-11-03 19:55:45.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.toDTOWithChucVu(BCHDoanHoiService.java:291)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getAll(BCHDoanHoiService.java:36)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getMaSv()\" because \"sv\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(19, 'BCHDoanHoiController.getAll', '2025-11-03 19:58:05.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(20, 'BCHDoanHoiController.getAll', '2025-11-03 19:58:08.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(21, 'BCHDoanHoiController.getAll', '2025-11-03 19:58:10.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(22, 'BCHDoanHoiController.getAll', '2025-11-03 19:58:11.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(23, 'BCHDoanHoiController.getAll', '2025-11-03 20:07:06.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(24, 'ThongKeController.getParticipationByFaculty', '2025-11-03 20:07:10.000000', 38, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(25, 'HoatDongController.getUpcoming', '2025-11-03 20:07:10.000000', 109, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(26, 'ThongKeController.getDashboard', '2025-11-03 20:07:10.000000', 208, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(27, 'ThongKeController.getAttendanceStatistics', '2025-11-03 20:07:10.000000', 28, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(28, 'ThongKeController.getActivityTrends', '2025-11-03 20:07:10.000000', 322, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(29, 'ThongKeController.getTopStudents', '2025-11-03 20:07:10.000000', 322, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(30, 'SinhVienController.getStudentCount', '2025-11-03 20:07:10.000000', 551, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(31, 'ThongKeController.getActivityStatisticsEndpoint', '2025-11-03 20:07:10.000000', 639, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(32, 'ThongKeController.getParticipationByFaculty', '2025-11-03 20:11:29.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(33, 'HoatDongController.getUpcoming', '2025-11-03 20:11:29.000000', 18, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(34, 'ThongKeController.getDashboard', '2025-11-03 20:11:29.000000', 29, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(35, 'SinhVienController.getStudentCount', '2025-11-03 20:11:29.000000', 36, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(36, 'ThongKeController.getAttendanceStatistics', '2025-11-03 20:11:29.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(37, 'ThongKeController.getActivityTrends', '2025-11-03 20:11:29.000000', 87, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(38, 'ThongKeController.getTopStudents', '2025-11-03 20:11:29.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(39, 'ThongKeController.getActivityStatisticsEndpoint', '2025-11-03 20:11:29.000000', 138, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(40, 'BCHDoanHoiController.getAll', '2025-11-03 20:11:30.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(41, 'ChucVuController.getAll', '2025-11-03 20:11:30.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(42, 'BanController.getAll', '2025-11-03 20:11:30.000000', 19, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(43, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:11:30.000000', 27, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(44, 'ChucVuController.getAll', '2025-11-03 20:11:30.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(45, 'BCHDoanHoiController.getAll', '2025-11-03 20:11:36.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(46, 'LopController.getAllActive', '2025-11-03 20:12:13.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(47, 'BCHDoanHoiController.getAll', '2025-11-03 20:13:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(48, 'BanController.getAll', '2025-11-03 20:13:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(49, 'ChucVuController.getAll', '2025-11-03 20:13:58.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(50, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:13:58.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(51, 'ChucVuController.getAll', '2025-11-03 20:13:58.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(52, 'ChucVuController.getAll', '2025-11-03 20:13:59.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(53, 'BCHDoanHoiController.getAll', '2025-11-03 20:13:59.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(54, 'BanController.getAll', '2025-11-03 20:13:59.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(55, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:13:59.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(56, 'ChucVuController.getAll', '2025-11-03 20:13:59.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(57, 'BCHDoanHoiController.getAll', '2025-11-03 20:14:00.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(58, 'ChucVuController.getAll', '2025-11-03 20:14:00.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(59, 'BanController.getAll', '2025-11-03 20:14:00.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(60, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:14:00.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(61, 'ChucVuController.getAll', '2025-11-03 20:14:00.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(62, 'KhoaController.getAll', '2025-11-03 20:14:01.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(63, 'NganhController.getAllActive', '2025-11-03 20:14:01.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(64, 'KhoaController.getAll', '2025-11-03 20:14:02.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(65, 'NganhController.getAllActive', '2025-11-03 20:14:02.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(66, 'KhoaController.getAll', '2025-11-03 20:14:02.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(67, 'LopController.getAllActive', '2025-11-03 20:14:02.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(68, 'SinhVienController.getAll', '2025-11-03 20:14:02.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(69, 'BanController.getAll', '2025-11-03 20:15:11.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(70, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:15:11.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(71, 'ChucVuController.getAll', '2025-11-03 20:15:11.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(72, 'BCHDoanHoiController.getAll', '2025-11-03 20:15:11.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(73, 'ChucVuController.getAll', '2025-11-03 20:15:11.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(74, 'BCHDoanHoiController.getAll', '2025-11-03 20:15:16.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(75, 'ChucVuController.getAll', '2025-11-03 20:15:16.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(76, 'SinhVienController.getAll', '2025-11-03 20:15:16.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(77, 'BCHDoanHoiController.getAll', '2025-11-03 20:15:16.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(78, 'BCHDoanHoiController.getAll', '2025-11-03 20:15:50.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(79, 'BCHDoanHoiController.getAll', '2025-11-03 20:15:57.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(80, 'BCHDoanHoiController.getById', '2025-11-03 20:16:19.000000', NULL, NULL, NULL, 'Không tìm thấy BCH: BCH001\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.lambda$getById$0(BCHDoanHoiService.java:45)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService.getById(BCHDoanHoiService.java:45)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.BCHDoanHoiService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.BCHDoanHoiController.getById(BCHDoanHoiController.java:41)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy BCH: BCH001', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(81, 'KhoaHocController.getAll', '2025-11-03 20:17:39.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(82, 'NganhController.getAllActive', '2025-11-03 20:17:40.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(83, 'KhoaController.getAll', '2025-11-03 20:17:40.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(84, 'SinhVienController.getAll', '2025-11-03 20:17:40.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(85, 'LopController.getAllActive', '2025-11-03 20:17:40.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(86, 'BanController.getAll', '2025-11-03 20:19:06.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(87, 'BanController.getAll', '2025-11-03 20:19:10.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(88, 'SinhVienController.getAll', '2025-11-03 20:19:10.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(89, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:10.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(90, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:10.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(91, 'ChucVuController.getAll', '2025-11-03 20:19:10.000000', 23, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(92, 'BanController.getAll', '2025-11-03 20:19:10.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(93, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:10.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(94, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:19:10.000000', 32, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(95, 'ChucVuController.getAll', '2025-11-03 20:19:10.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(96, 'ChucVuController.getAll', '2025-11-03 20:19:10.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(97, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:13.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(98, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:13.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(99, 'ChucVuController.getAll', '2025-11-03 20:19:13.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(100, 'SinhVienController.getAll', '2025-11-03 20:19:13.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(101, 'BanController.getAll', '2025-11-03 20:19:13.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(102, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:19:13.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(103, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:13.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(104, 'ChucVuController.getAll', '2025-11-03 20:19:13.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(105, 'BanController.getAll', '2025-11-03 20:19:13.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(106, 'ChucVuController.getAll', '2025-11-03 20:19:13.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(107, 'KhoaHocController.getAll', '2025-11-03 20:19:35.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(108, 'LopController.getAllActive', '2025-11-03 20:19:36.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(109, 'NganhController.getAllActive', '2025-11-03 20:19:36.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(110, 'KhoaController.getAll', '2025-11-03 20:19:36.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(111, 'SinhVienController.getAll', '2025-11-03 20:19:36.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(112, 'BanController.getAll', '2025-11-03 20:19:44.000000', 108, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(113, 'ChucVuController.getAll', '2025-11-03 20:19:44.000000', 107, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(114, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:44.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(115, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:44.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(116, 'SinhVienController.getAll', '2025-11-03 20:19:44.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(117, 'BCHDoanHoiController.getStatistics', '2025-11-03 20:19:44.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(118, 'ChucVuController.getAll', '2025-11-03 20:19:44.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(119, 'BanController.getAll', '2025-11-03 20:19:44.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(120, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:44.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(121, 'ChucVuController.getAll', '2025-11-03 20:19:44.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(122, 'BanController.getAll', '2025-11-03 20:19:45.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(123, 'ChucVuController.getAll', '2025-11-03 20:19:45.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(124, 'SinhVienController.getAll', '2025-11-03 20:19:45.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(125, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:45.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(126, 'BCHDoanHoiController.getAll', '2025-11-03 20:19:45.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(127, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:16:13.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(128, 'BCHDoanHoiController.getAll', '2025-11-04 02:16:13.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(129, 'BCHDoanHoiController.getAll', '2025-11-04 02:16:13.000000', 14, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(130, 'BCHDoanHoiController.getAll', '2025-11-04 02:16:13.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(131, 'BanController.getAll', '2025-11-04 02:16:13.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(132, 'ChucVuController.getAll', '2025-11-04 02:16:13.000000', 27, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(133, 'BanController.getAll', '2025-11-04 02:16:13.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(134, 'SinhVienController.getAll', '2025-11-04 02:16:13.000000', 44, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(135, 'ChucVuController.getAll', '2025-11-04 02:16:13.000000', 24, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(136, 'ChucVuController.getAll', '2025-11-04 02:16:13.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(137, 'SinhVienController.getAll', '2025-11-04 02:32:14.000000', 37, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(138, 'ChuyenVienController.getAll', '2025-11-04 02:32:14.000000', 23, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(139, 'ChucVuController.getAll', '2025-11-04 02:32:14.000000', 23, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(140, 'BanController.getAll', '2025-11-04 02:32:14.000000', 23, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(141, 'ChucVuController.getAll', '2025-11-04 02:32:14.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(142, 'ChucVuController.getAll', '2025-11-04 02:32:14.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(143, 'ChuyenVienController.getAll', '2025-11-04 02:32:15.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(144, 'BanController.getAll', '2025-11-04 02:32:15.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(145, 'ChucVuController.getAll', '2025-11-04 02:32:15.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(146, 'SinhVienController.getAll', '2025-11-04 02:32:15.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(147, 'ChucVuController.getAll', '2025-11-04 02:32:15.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(148, 'BCHDoanHoiController.getAll', '2025-11-04 02:32:15.000000', 23, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(149, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:32:15.000000', 26, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(150, 'ChucVuController.getAll', '2025-11-04 02:32:15.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(151, 'ChucVuController.getAll', '2025-11-04 02:32:24.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(152, 'ChucVuController.getStatistics', '2025-11-04 02:32:24.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(153, 'BanController.getAll', '2025-11-04 02:32:36.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(154, 'BanController.getStatistics', '2025-11-04 02:32:36.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(155, 'LopController.getAllActive', '2025-11-04 02:32:49.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(156, 'KhoaHocController.getAll', '2025-11-04 02:32:54.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(157, 'KhoaHocController.getAll', '2025-11-04 02:32:56.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(158, 'KhoaController.getAll', '2025-11-04 02:32:56.000000', 71, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(159, 'LopController.getAllActive', '2025-11-04 02:32:56.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(160, 'NganhController.getAllActive', '2025-11-04 02:32:56.000000', 89, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(161, 'NganhController.getAllActive', '2025-11-04 02:32:58.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(162, 'KhoaController.getAll', '2025-11-04 02:32:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(163, 'LopController.getAllActive', '2025-11-04 02:32:58.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(164, 'SinhVienController.getAll', '2025-11-04 02:32:58.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(165, 'ThongKeController.getTopStudents', '2025-11-04 02:33:34.000000', 25, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(166, 'ThongKeController.getParticipationByFaculty', '2025-11-04 02:33:34.000000', 18, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(167, 'ThongKeController.getDashboard', '2025-11-04 02:33:34.000000', 81, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(168, 'HoatDongController.getUpcoming', '2025-11-04 02:33:34.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(169, 'ThongKeController.getAttendanceStatistics', '2025-11-04 02:33:34.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(170, 'ThongKeController.getActivityTrends', '2025-11-04 02:33:34.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$ArrayListSpliterator.forEachRemaining(ArrayList.java:1716)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getByDateRange(HoatDongService.java:161)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(171, 'SinhVienController.getStudentCount', '2025-11-04 02:33:34.000000', 102, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(172, 'ThongKeController.getActivityStatisticsEndpoint', '2025-11-04 02:33:34.000000', 354, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL);
INSERT INTO `system_log` (`id`, `action`, `created_at`, `duration_ms`, `entity_id`, `entity_type`, `error_details`, `ip_address`, `log_level`, `message`, `module`, `new_value`, `old_value`, `request_method`, `request_url`, `session_id`, `status`, `user_agent`, `user_id`, `user_name`) VALUES
(173, 'KhoaController.getAll', '2025-11-04 02:33:45.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(174, 'HoatDongController.getAllWithPagination', '2025-11-04 02:33:46.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(175, 'HoatDongController.handleException', '2025-11-04 02:33:46.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(176, 'HoatDongController.getAllWithPagination', '2025-11-04 02:33:47.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(177, 'HoatDongController.handleException', '2025-11-04 02:33:47.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(178, 'BCHDoanHoiController.getAll', '2025-11-04 02:33:56.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(179, 'ChuyenVienController.getAll', '2025-11-04 02:34:41.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(180, 'ChuyenVienController.getById', '2025-11-04 02:34:41.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(181, 'ChuyenVienController.getById', '2025-11-04 02:34:42.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(182, 'ChuyenVienController.getAll', '2025-11-04 02:34:53.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(183, 'ChuyenVienController.getById', '2025-11-04 02:34:53.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(184, 'ChuyenVienController.getById', '2025-11-04 02:34:55.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(185, 'KhoaHocController.getAll', '2025-11-04 02:35:14.000000', 14, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(186, 'ChuyenVienController.getAll', '2025-11-04 02:35:15.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(187, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:35:15.000000', 33, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(188, 'ChucVuController.getAll', '2025-11-04 02:35:15.000000', 22, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(189, 'BanController.getAll', '2025-11-04 02:35:15.000000', 24, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(190, 'BCHDoanHoiController.getAll', '2025-11-04 02:35:15.000000', 29, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(191, 'SinhVienController.getAll', '2025-11-04 02:35:15.000000', 21, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(192, 'ChucVuController.getAll', '2025-11-04 02:35:16.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(193, 'ChuyenVienController.getById', '2025-11-04 02:35:16.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(194, 'ChucVuController.getAll', '2025-11-04 02:35:16.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(195, 'ChucVuController.getAll', '2025-11-04 02:35:16.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(196, 'ChucVuController.getStatistics', '2025-11-04 02:35:16.000000', 19, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(197, 'ChuyenVienController.getById', '2025-11-04 02:35:21.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(198, 'ChuyenVienController.getById', '2025-11-04 02:35:22.000000', NULL, NULL, NULL, 'Không tìm thấy chuyên viên: statistics\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.lambda$getById$0(ChuyenVienService.java:39)\njava.base/java.util.Optional.orElseThrow(Optional.java:403)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getById(ChuyenVienService.java:39)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:727)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService$$SpringCGLIB$$0.getById(<generated>)\ncom.tathanhloc.faceattendance.Controller.ChuyenVienController.getById(ChuyenVienController.java:37)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\n... (truncated)', NULL, 'ERROR', 'API call failed: Không tìm thấy chuyên viên: statistics', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(199, 'LopController.getAllActive', '2025-11-04 02:37:31.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(200, 'KhoaHocController.getAll', '2025-11-04 02:37:31.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(201, 'KhoaController.getAll', '2025-11-04 02:37:31.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(202, 'NganhController.getAllActive', '2025-11-04 02:37:31.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(203, 'BanController.getAll', '2025-11-04 02:37:47.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(204, 'ChucVuController.getAll', '2025-11-04 02:37:47.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(205, 'SinhVienController.getAll', '2025-11-04 02:37:47.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(206, 'ChuyenVienController.getAll', '2025-11-04 02:37:47.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(207, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:37:47.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(208, 'BCHDoanHoiController.getAll', '2025-11-04 02:37:47.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(209, 'ChucVuController.getAll', '2025-11-04 02:37:47.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(210, 'ChucVuController.getAll', '2025-11-04 02:37:47.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(211, 'ChuyenVienController.getAll', '2025-11-04 02:37:48.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(212, 'ChucVuController.getAll', '2025-11-04 02:39:37.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(213, 'ChucVuController.getStatistics', '2025-11-04 02:39:37.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(214, 'BanController.getStatistics', '2025-11-04 02:39:38.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(215, 'BanController.getAll', '2025-11-04 02:39:38.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(216, 'BanController.getAll', '2025-11-04 02:39:42.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(217, 'BanController.getStatistics', '2025-11-04 02:39:42.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(218, 'ChucVuController.getAll', '2025-11-04 02:39:44.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(219, 'ChucVuController.getStatistics', '2025-11-04 02:39:44.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(220, 'ChucVuController.getAll', '2025-11-04 02:39:46.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(221, 'BanController.getAll', '2025-11-04 02:39:46.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(222, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:39:46.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(223, 'SinhVienController.getAll', '2025-11-04 02:39:46.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(224, 'ChucVuController.getAll', '2025-11-04 02:39:46.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(225, 'BCHDoanHoiController.getAll', '2025-11-04 02:39:46.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(226, 'ChucVuController.getAll', '2025-11-04 02:39:46.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(227, 'KhoaHocController.getAll', '2025-11-04 02:39:47.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(228, 'ChucVuController.getStatistics', '2025-11-04 02:40:02.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(229, 'ChucVuController.getAll', '2025-11-04 02:40:02.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(230, 'KhoaHocController.getAll', '2025-11-04 02:40:32.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(231, 'KhoaHocController.getAll', '2025-11-04 02:40:32.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(232, 'KhoaController.getAll', '2025-11-04 02:40:32.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(233, 'LopController.getAllActive', '2025-11-04 02:40:32.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(234, 'NganhController.getAllActive', '2025-11-04 02:40:32.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(235, 'KhoaController.getAll', '2025-11-04 02:40:33.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(236, 'NganhController.getAllActive', '2025-11-04 02:40:33.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(237, 'KhoaController.getAll', '2025-11-04 02:40:33.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(238, 'ChucVuController.getAll', '2025-11-04 02:40:35.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(239, 'BanController.getAll', '2025-11-04 02:40:35.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(240, 'SinhVienController.getAll', '2025-11-04 02:40:35.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(241, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:40:35.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(242, 'BCHDoanHoiController.getAll', '2025-11-04 02:40:35.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(243, 'ChucVuController.getAll', '2025-11-04 02:40:35.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(244, 'ChucVuController.getAll', '2025-11-04 02:40:35.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(245, 'ChuyenVienController.getAll', '2025-11-04 02:43:01.000000', 24, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(246, 'ChucVuController.getAll', '2025-11-04 02:43:40.000000', 65, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(247, 'ChucVuController.getAll', '2025-11-04 02:43:41.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(248, 'ChuyenVienController.getStatistics', '2025-11-04 02:43:43.000000', 28, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(249, 'ChucVuController.getAll', '2025-11-04 02:43:44.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(250, 'BanController.getAll', '2025-11-04 02:43:44.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(251, 'ChuyenVienController.getAll', '2025-11-04 02:43:44.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(252, 'ChucVuController.getAll', '2025-11-04 02:43:44.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(253, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:43:44.000000', 24, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(254, 'BCHDoanHoiController.getAll', '2025-11-04 02:43:44.000000', 27, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(255, 'ChucVuController.getAll', '2025-11-04 02:43:44.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(256, 'SinhVienController.getAll', '2025-11-04 02:43:44.000000', 19, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(257, 'KhoaHocController.getAll', '2025-11-04 02:43:58.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(258, 'KhoaController.getAll', '2025-11-04 02:43:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(259, 'LopController.getAllActive', '2025-11-04 02:43:58.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(260, 'NganhController.getAllActive', '2025-11-04 02:43:58.000000', 27, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(261, 'ChucVuController.getStatistics', '2025-11-04 02:44:04.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(262, 'KhoaHocController.getAll', '2025-11-04 02:44:08.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(263, 'LopController.getAllActive', '2025-11-04 02:44:10.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(264, 'ChuyenVienController.getStatistics', '2025-11-04 02:45:10.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(265, 'ChuyenVienController.getAll', '2025-11-04 02:45:15.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(266, 'ChucVuController.getAll', '2025-11-04 02:50:30.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(267, 'ChucVuController.getStatistics', '2025-11-04 02:50:30.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(268, 'ChuyenVienController.getAll', '2025-11-04 02:50:32.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(269, 'ChuyenVienController.getStatistics', '2025-11-04 02:50:32.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(270, 'ChuyenVienController.getAll', '2025-11-04 02:50:58.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(271, 'ChuyenVienController.getStatistics', '2025-11-04 02:50:58.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(272, 'ChuyenVienController.getAll', '2025-11-04 02:51:30.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(273, 'ChuyenVienController.getStatistics', '2025-11-04 02:51:30.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(274, 'KhoaHocController.getAll', '2025-11-04 02:52:56.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(275, 'ChucVuController.getAll', '2025-11-04 02:52:57.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(276, 'BanController.getAll', '2025-11-04 02:52:57.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(277, 'ChucVuController.getAll', '2025-11-04 02:52:57.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(278, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:52:57.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(279, 'BCHDoanHoiController.getAll', '2025-11-04 02:52:57.000000', 26, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(280, 'SinhVienController.getAll', '2025-11-04 02:52:57.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(281, 'GiangVienController.getAll', '2025-11-04 02:52:57.000000', 26, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(282, 'ChucVuController.getAll', '2025-11-04 02:52:57.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(283, 'GiangVienController.getAll', '2025-11-04 02:52:57.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(284, 'ChuyenVienController.getAll', '2025-11-04 02:52:57.000000', NULL, NULL, NULL, 'JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:277)\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:241)\norg.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:560)\norg.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)\norg.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:343)\norg.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:160)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:136)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:223)\njdk.proxy4/jdk.proxy4.$Proxy202.findByIsActiveTrueOrderByHoTenAsc(Unknown Source)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getAll(ChuyenVienService.java:31)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\n... (truncated)', NULL, 'ERROR', 'API call failed: JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(285, 'ChuyenVienController.getAll', '2025-11-04 02:52:58.000000', NULL, NULL, NULL, 'JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:277)\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:241)\norg.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:560)\norg.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)\norg.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:343)\norg.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:160)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:136)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:223)\njdk.proxy4/jdk.proxy4.$Proxy202.findByIsActiveTrueOrderByHoTenAsc(Unknown Source)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getAll(ChuyenVienService.java:31)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\n... (truncated)', NULL, 'ERROR', 'API call failed: JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL);
INSERT INTO `system_log` (`id`, `action`, `created_at`, `duration_ms`, `entity_id`, `entity_type`, `error_details`, `ip_address`, `log_level`, `message`, `module`, `new_value`, `old_value`, `request_method`, `request_url`, `session_id`, `status`, `user_agent`, `user_id`, `user_name`) VALUES
(286, 'ChuyenVienController.getAll', '2025-11-04 02:53:09.000000', NULL, NULL, NULL, 'JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:277)\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:241)\norg.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:560)\norg.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)\norg.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:343)\norg.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:160)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:136)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:223)\njdk.proxy4/jdk.proxy4.$Proxy202.findByIsActiveTrueOrderByHoTenAsc(Unknown Source)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getAll(ChuyenVienService.java:31)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\n... (truncated)', NULL, 'ERROR', 'API call failed: JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(287, 'ChuyenVienController.getAll', '2025-11-04 02:53:25.000000', NULL, NULL, NULL, 'JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:277)\norg.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:241)\norg.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:560)\norg.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)\norg.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:343)\norg.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:160)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:136)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:223)\njdk.proxy4/jdk.proxy4.$Proxy202.findByIsActiveTrueOrderByHoTenAsc(Unknown Source)\ncom.tathanhloc.faceattendance.Service.ChuyenVienService.getAll(ChuyenVienService.java:31)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\n... (truncated)', NULL, 'ERROR', 'API call failed: JDBC exception executing SQL [select cv1_0.ma_chuyen_vien,cv1_0.chuc_danh,cv1_0.created_at,cv1_0.email,cv1_0.ho_ten,cv1_0.is_active,cv1_0.ma_khoa,cv1_0.sdt,cv1_0.updated_at from chuyenvien cv1_0 where cv1_0.is_active order by cv1_0.ho_ten] [Unknown column \'cv1_0.ma_khoa\' in \'field list\'] [n/a]; SQL [n/a]', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(288, 'BCHDoanHoiController.getAll', '2025-11-04 02:54:25.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(289, 'ChucVuController.getAll', '2025-11-04 02:54:27.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(290, 'GiangVienController.getAll', '2025-11-04 02:54:27.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(291, 'BanController.getAll', '2025-11-04 02:54:27.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(292, 'ChuyenVienController.getAll', '2025-11-04 02:54:27.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(293, 'SinhVienController.getAll', '2025-11-04 02:54:27.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(294, 'BCHDoanHoiController.getAll', '2025-11-04 02:54:27.000000', 18, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(295, 'ChucVuController.getAll', '2025-11-04 02:54:27.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(296, 'GiangVienController.getAll', '2025-11-04 02:54:27.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(297, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:54:27.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(298, 'ChucVuController.getAll', '2025-11-04 02:54:27.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(299, 'KhoaController.getAll', '2025-11-04 02:54:36.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(300, 'SinhVienController.getAll', '2025-11-04 02:54:36.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(301, 'LopController.getAllActive', '2025-11-04 02:54:37.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(302, 'NganhController.getAllActive', '2025-11-04 02:54:37.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(303, 'ChuyenVienController.getAll', '2025-11-04 02:54:48.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(304, 'ChuyenVienController.getStatistics', '2025-11-04 02:54:48.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(305, 'ChucVuController.getAll', '2025-11-04 02:55:45.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(306, 'ChucVuController.getStatistics', '2025-11-04 02:55:45.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(307, 'BanController.getAll', '2025-11-04 02:56:08.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(308, 'BanController.getStatistics', '2025-11-04 02:56:09.000000', 36, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(309, 'ChucVuController.getAll', '2025-11-04 02:56:31.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(310, 'ChucVuController.getStatistics', '2025-11-04 02:56:31.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(311, 'ChucVuController.getAll', '2025-11-04 02:56:32.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(312, 'ChucVuController.getStatistics', '2025-11-04 02:56:32.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(313, 'ChucVuController.getStatistics', '2025-11-04 02:56:33.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(314, 'ChucVuController.getAll', '2025-11-04 02:56:33.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(315, 'KhoaController.getAll', '2025-11-04 02:56:54.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(316, 'GiangVienController.getAll', '2025-11-04 02:56:54.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(317, 'CREATE', '2025-11-04 02:57:21.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'CREATE GiangVien [unknown]', 'GIANGVIEN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(318, 'GiangVienController.create', '2025-11-04 02:57:21.000000', 89, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(319, 'GiangVienController.getAll', '2025-11-04 02:57:21.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(320, 'KhoaController.getAll', '2025-11-04 02:57:28.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(321, 'GiangVienController.getAll', '2025-11-04 02:57:28.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(322, 'GiangVienController.getAll', '2025-11-04 02:57:32.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(323, 'KhoaController.getAll', '2025-11-04 02:57:32.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(324, 'ChucVuController.getStatistics', '2025-11-04 02:58:01.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(325, 'ChucVuController.getAll', '2025-11-04 02:58:01.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(326, 'ChuyenVienController.getAll', '2025-11-04 02:58:05.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(327, 'ChuyenVienController.getStatistics', '2025-11-04 02:58:05.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(328, 'ChuyenVienController.getAll', '2025-11-04 02:58:08.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(329, 'BanController.getAll', '2025-11-04 02:58:08.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(330, 'ChucVuController.getAll', '2025-11-04 02:58:08.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(331, 'SinhVienController.getAll', '2025-11-04 02:58:08.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(332, 'BCHDoanHoiController.getStatistics', '2025-11-04 02:58:08.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(333, 'ChucVuController.getAll', '2025-11-04 02:58:08.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(334, 'GiangVienController.getAll', '2025-11-04 02:58:08.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(335, 'BCHDoanHoiController.getAll', '2025-11-04 02:58:08.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(336, 'ChucVuController.getAll', '2025-11-04 02:58:08.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(337, 'GiangVienController.getAll', '2025-11-04 02:58:08.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(338, 'LopController.getAllActive', '2025-11-04 02:58:09.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(339, 'BanController.getAll', '2025-11-04 02:58:09.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(340, 'BanController.getStatistics', '2025-11-04 02:58:09.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(341, 'KhoaController.getAll', '2025-11-04 02:59:08.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(342, 'HoatDongController.getAllWithPagination', '2025-11-04 02:59:10.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(343, 'HoatDongController.handleException', '2025-11-04 02:59:10.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(344, 'HoatDongController.getAllWithPagination', '2025-11-04 02:59:11.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(345, 'HoatDongController.handleException', '2025-11-04 02:59:11.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(346, 'KhoaController.getAll', '2025-11-04 02:59:11.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(347, 'NganhController.getAllActive', '2025-11-04 02:59:11.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(348, 'NganhController.getAllActive', '2025-11-04 02:59:13.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(349, 'KhoaController.getAll', '2025-11-04 02:59:13.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(350, 'KhoaHocController.getAll', '2025-11-04 02:59:13.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(351, 'LopController.getAllActive', '2025-11-04 02:59:13.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(352, 'KhoaHocController.getAll', '2025-11-04 02:59:17.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(353, 'BanController.getAll', '2025-11-04 03:05:17.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(354, 'BanController.getAll', '2025-11-04 03:05:21.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(355, 'ChucVuController.getAll', '2025-11-04 03:05:22.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(356, 'KhoaHocController.getAll', '2025-11-04 03:05:31.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(357, 'ChucVuController.getAll', '2025-11-04 03:05:32.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(358, 'BanController.getAll', '2025-11-04 03:05:32.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(359, 'ChuyenVienController.getAll', '2025-11-04 03:05:32.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(360, 'GiangVienController.getAll', '2025-11-04 03:05:32.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(361, 'ChucVuController.getAll', '2025-11-04 03:05:32.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(362, 'SinhVienController.getAll', '2025-11-04 03:05:32.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(363, 'BCHDoanHoiController.getAll', '2025-11-04 03:05:32.000000', 34, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(364, 'BCHDoanHoiController.getStatistics', '2025-11-04 03:05:32.000000', 28, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(365, 'ChucVuController.getAll', '2025-11-04 03:05:32.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(366, 'GiangVienController.getAll', '2025-11-04 03:05:32.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(367, 'ChuyenVienController.getAll', '2025-11-04 03:05:34.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(368, 'ChuyenVienController.getStatistics', '2025-11-04 03:05:34.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(369, 'ChucVuController.getAll', '2025-11-04 03:05:36.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(370, 'ChucVuController.getStatistics', '2025-11-04 03:05:36.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(371, 'HoatDongController.handleException', '2025-11-04 03:10:07.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(372, 'HoatDongController.getAllWithPagination', '2025-11-04 03:10:07.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(373, 'HoatDongController.getAllWithPagination', '2025-11-04 03:10:08.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(374, 'HoatDongController.handleException', '2025-11-04 03:10:08.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(375, 'HoatDongController.handleException', '2025-11-04 03:16:57.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(376, 'HoatDongController.getAllWithPagination', '2025-11-04 03:16:57.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(377, 'HoatDongController.getAllWithPagination', '2025-11-04 03:16:58.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(378, 'HoatDongController.handleException', '2025-11-04 03:16:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(379, 'BanController.getAll', '2025-11-04 03:16:59.000000', 36, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(380, 'BanController.getStatistics', '2025-11-04 03:16:59.000000', 56, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(381, 'ChucVuController.getAll', '2025-11-04 03:17:08.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(382, 'ChucVuController.getStatistics', '2025-11-04 03:17:08.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(383, 'KhoaController.getAll', '2025-11-04 03:17:23.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(384, 'GiangVienController.getAll', '2025-11-04 03:17:23.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(385, 'ChuyenVienController.getAll', '2025-11-04 03:18:01.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(386, 'ChuyenVienController.getStatistics', '2025-11-04 03:18:01.000000', 26, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(387, 'BanController.getAll', '2025-11-04 03:18:21.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(388, 'BanController.getStatistics', '2025-11-04 03:18:21.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(389, 'KhoaController.getAll', '2025-11-04 03:18:23.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(390, 'GiangVienController.getAll', '2025-11-04 03:18:23.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(391, 'GiangVienController.getAll', '2025-11-04 03:18:31.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(392, 'ChucVuController.getAll', '2025-11-04 03:19:03.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(393, 'ChucVuController.getStatistics', '2025-11-04 03:19:38.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(394, 'KhoaController.getAll', '2025-11-04 03:28:35.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(395, 'GiangVienController.getAll', '2025-11-04 03:28:35.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(396, 'BanController.getStatistics', '2025-11-04 03:28:38.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(397, 'BanController.getAll', '2025-11-04 03:28:38.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(398, 'ChucVuController.getStatistics', '2025-11-04 03:30:19.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(399, 'ChucVuController.getAll', '2025-11-04 03:30:19.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(400, 'ChucVuController.getStatistics', '2025-11-04 03:30:19.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(401, 'ChucVuController.getAll', '2025-11-04 03:30:19.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(402, 'BanController.getStatistics', '2025-11-04 03:30:22.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(403, 'BanController.getAll', '2025-11-04 03:30:22.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(404, 'KhoaController.getAll', '2025-11-04 03:32:56.000000', 27, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(405, 'GiangVienController.getAll', '2025-11-04 03:32:56.000000', 28, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(406, 'GiangVienController.getAll', '2025-11-04 03:33:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(407, 'KhoaController.getAll', '2025-11-04 03:33:58.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(408, 'KhoaController.getAll', '2025-11-04 03:34:00.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(409, 'GiangVienController.getAll', '2025-11-04 03:34:00.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(410, 'GiangVienController.getAll', '2025-11-04 03:34:06.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(411, 'KhoaController.getAll', '2025-11-04 03:34:06.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(412, 'GiangVienController.getAll', '2025-11-04 03:34:11.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(413, 'GiangVienController.getAll', '2025-11-04 03:35:00.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(414, 'KhoaController.getAll', '2025-11-04 03:35:33.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(415, 'GiangVienController.getAll', '2025-11-04 03:35:33.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(416, 'KhoaController.getAll', '2025-11-04 03:35:45.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(417, 'GiangVienController.getAll', '2025-11-04 03:35:45.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(418, 'KhoaController.getAll', '2025-11-04 03:35:56.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(419, 'GiangVienController.getAll', '2025-11-04 03:35:56.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(420, 'KhoaController.getAll', '2025-11-04 03:36:06.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(421, 'GiangVienController.getAll', '2025-11-04 03:36:06.000000', 14, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(422, 'KhoaController.getAll', '2025-11-04 03:39:04.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(423, 'GiangVienController.getAll', '2025-11-04 03:39:04.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(424, 'GiangVienController.getAll', '2025-11-04 11:09:31.000000', 56, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(425, 'KhoaController.getAll', '2025-11-04 11:09:31.000000', 56, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(426, 'KhoaController.getAll', '2025-11-04 11:19:06.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(427, 'GiangVienController.getAll', '2025-11-04 11:19:06.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(428, 'KhoaController.getAll', '2025-11-04 11:22:01.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(429, 'GiangVienController.getAll', '2025-11-04 11:22:01.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(430, 'HoatDongController.handleException', '2025-11-04 11:22:03.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL);
INSERT INTO `system_log` (`id`, `action`, `created_at`, `duration_ms`, `entity_id`, `entity_type`, `error_details`, `ip_address`, `log_level`, `message`, `module`, `new_value`, `old_value`, `request_method`, `request_url`, `session_id`, `status`, `user_agent`, `user_id`, `user_name`) VALUES
(431, 'HoatDongController.getAllWithPagination', '2025-11-04 11:22:03.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(432, 'HoatDongController.getAllWithPagination', '2025-11-04 11:22:05.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(433, 'HoatDongController.handleException', '2025-11-04 11:22:05.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(434, 'KhoaController.getAll', '2025-11-04 11:22:07.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(435, 'KhoaController.getAll', '2025-11-04 11:22:08.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(436, 'NganhController.getAllActive', '2025-11-04 11:22:09.000000', 32, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(437, 'NganhController.getAllActive', '2025-11-04 11:22:09.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(438, 'KhoaController.getAll', '2025-11-04 11:22:09.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(439, 'KhoaHocController.getAll', '2025-11-04 11:22:09.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(440, 'LopController.getAllActive', '2025-11-04 11:22:09.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(441, 'KhoaHocController.getAll', '2025-11-04 11:22:14.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(442, 'GiangVienController.getAllActive', '2025-11-04 11:22:16.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(443, 'ChucVuController.getAll', '2025-11-04 11:22:16.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(444, 'BanController.getAll', '2025-11-04 11:22:16.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(445, 'ChuyenVienController.getAll', '2025-11-04 11:22:16.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(446, 'SinhVienController.getAllActiveStudents', '2025-11-04 11:22:16.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(447, 'ChucVuController.getAll', '2025-11-04 11:22:16.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(448, 'BCHDoanHoiController.getAll', '2025-11-04 11:22:16.000000', 22, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(449, 'BCHDoanHoiController.getStatistics', '2025-11-04 11:22:16.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(450, 'ChucVuController.getAll', '2025-11-04 11:22:16.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(451, 'ChuyenVienController.getAll', '2025-11-04 11:22:18.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(452, 'ChuyenVienController.getStatistics', '2025-11-04 11:22:18.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(453, 'ChucVuController.getAll', '2025-11-04 11:22:20.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(454, 'ChucVuController.getStatistics', '2025-11-04 11:22:20.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(455, 'BanController.getAll', '2025-11-04 11:22:34.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(456, 'BanController.getStatistics', '2025-11-04 11:22:34.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(457, 'ChucVuController.getStatistics', '2025-11-04 11:22:48.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(458, 'ChucVuController.getAll', '2025-11-04 11:22:48.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(459, 'ChucVuController.getAll', '2025-11-04 11:23:12.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(460, 'ChucVuController.getStatistics', '2025-11-04 11:23:12.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(461, 'BanController.getStatistics', '2025-11-04 11:25:06.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(462, 'BanController.getAll', '2025-11-04 11:25:06.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(463, 'BanController.getAll', '2025-11-04 11:25:45.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(464, 'BanController.getStatistics', '2025-11-04 11:25:45.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(465, 'CREATE', '2025-11-04 11:26:40.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'CREATE Ban [unknown]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(466, 'BanController.create', '2025-11-04 11:26:40.000000', 34, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(467, 'BanController.getAll', '2025-11-04 11:26:40.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(468, 'BanController.getStatistics', '2025-11-04 11:26:40.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(469, 'UPDATE', '2025-11-04 11:26:50.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN006]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(470, 'BanController.update', '2025-11-04 11:26:50.000000', 25, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(471, 'BanController.getStatistics', '2025-11-04 11:26:50.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(472, 'BanController.getAll', '2025-11-04 11:26:50.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(473, 'UPDATE', '2025-11-04 11:26:57.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN002]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(474, 'BanController.update', '2025-11-04 11:26:57.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(475, 'BanController.getStatistics', '2025-11-04 11:26:57.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(476, 'BanController.getAll', '2025-11-04 11:26:57.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(477, 'UPDATE', '2025-11-04 11:27:02.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN001]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(478, 'BanController.update', '2025-11-04 11:27:02.000000', 9, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(479, 'BanController.getAll', '2025-11-04 11:27:02.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(480, 'BanController.getStatistics', '2025-11-04 11:27:02.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(481, 'UPDATE', '2025-11-04 11:27:06.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN005]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(482, 'BanController.update', '2025-11-04 11:27:06.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(483, 'BanController.getAll', '2025-11-04 11:27:06.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(484, 'BanController.getStatistics', '2025-11-04 11:27:06.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(485, 'UPDATE', '2025-11-04 11:27:10.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN003]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(486, 'BanController.update', '2025-11-04 11:27:10.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(487, 'BanController.getAll', '2025-11-04 11:27:10.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(488, 'BanController.getStatistics', '2025-11-04 11:27:10.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(489, 'UPDATE', '2025-11-04 11:28:24.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN002]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(490, 'BanController.update', '2025-11-04 11:28:24.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(491, 'BanController.getAll', '2025-11-04 11:28:24.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(492, 'BanController.getStatistics', '2025-11-04 11:28:24.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(493, 'BanController.getAll', '2025-11-04 11:28:27.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(494, 'BanController.getStatistics', '2025-11-04 11:28:27.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(495, 'UPDATE', '2025-11-04 11:28:35.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN001]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(496, 'BanController.update', '2025-11-04 11:28:35.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(497, 'BanController.getAll', '2025-11-04 11:28:35.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(498, 'BanController.getStatistics', '2025-11-04 11:28:35.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(499, 'UPDATE', '2025-11-04 11:29:23.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN005]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(500, 'BanController.update', '2025-11-04 11:29:23.000000', 12, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(501, 'BanController.getAll', '2025-11-04 11:29:23.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(502, 'BanController.getStatistics', '2025-11-04 11:29:23.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(503, 'UPDATE', '2025-11-04 11:29:31.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN003]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(504, 'BanController.update', '2025-11-04 11:29:31.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(505, 'BanController.getStatistics', '2025-11-04 11:29:31.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(506, 'BanController.getAll', '2025-11-04 11:29:31.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(507, 'UPDATE', '2025-11-04 11:29:36.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE Ban [BAN004]', 'BAN', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(508, 'BanController.update', '2025-11-04 11:29:36.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(509, 'BanController.getStatistics', '2025-11-04 11:29:36.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(510, 'BanController.getAll', '2025-11-04 11:29:36.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(511, 'ChucVuController.getAll', '2025-11-04 11:29:42.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(512, 'ChucVuController.getStatistics', '2025-11-04 11:29:42.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(513, 'UPDATE', '2025-11-04 11:29:58.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE ChucVu [CV009]', 'CHUCVU', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(514, 'ChucVuController.update', '2025-11-04 11:29:58.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(515, 'ChucVuController.getAll', '2025-11-04 11:29:58.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(516, 'ChucVuController.getStatistics', '2025-11-04 11:29:58.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(517, 'UPDATE', '2025-11-04 11:30:02.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE ChucVu [CV010]', 'CHUCVU', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(518, 'ChucVuController.update', '2025-11-04 11:30:02.000000', 6, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(519, 'ChucVuController.getAll', '2025-11-04 11:30:02.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(520, 'ChucVuController.getStatistics', '2025-11-04 11:30:02.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(521, 'UPDATE', '2025-11-04 11:30:10.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'UPDATE ChucVu [CV011]', 'CHUCVU', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(522, 'ChucVuController.update', '2025-11-04 11:30:10.000000', 8, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(523, 'ChucVuController.getStatistics', '2025-11-04 11:30:10.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(524, 'ChucVuController.getAll', '2025-11-04 11:30:10.000000', 4, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(525, 'KhoaHocController.getAll', '2025-11-04 11:35:38.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(526, 'BanController.getAll', '2025-11-04 11:35:39.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(527, 'ChucVuController.getAll', '2025-11-04 11:35:39.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(528, 'GiangVienController.getAllActive', '2025-11-04 11:35:39.000000', 10, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(529, 'ChuyenVienController.getAll', '2025-11-04 11:35:39.000000', 11, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(530, 'SinhVienController.getAllActiveStudents', '2025-11-04 11:35:39.000000', 17, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(531, 'ChucVuController.getAll', '2025-11-04 11:35:39.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(532, 'BCHDoanHoiController.getAll', '2025-11-04 11:35:39.000000', 15, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(533, 'BCHDoanHoiController.getStatistics', '2025-11-04 11:35:39.000000', 19, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(534, 'ChucVuController.getAll', '2025-11-04 11:35:39.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(535, 'HoatDongController.handleException', '2025-11-04 11:35:40.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(536, 'HoatDongController.getAllWithPagination', '2025-11-04 11:35:40.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(537, 'HoatDongController.getAllWithPagination', '2025-11-04 11:35:41.000000', NULL, NULL, NULL, 'Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null\ncom.tathanhloc.faceattendance.Service.HoatDongService.toDTO(HoatDongService.java:356)\njava.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:215)\njava.base/java.util.ArrayList$Itr.forEachRemaining(ArrayList.java:1086)\njava.base/java.util.Spliterators$IteratorSpliterator.forEachRemaining(Spliterators.java:1939)\njava.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:570)\njava.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:560)\njava.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)\njava.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:265)\njava.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:727)\norg.springframework.data.domain.Chunk.getConvertedContent(Chunk.java:131)\norg.springframework.data.domain.PageImpl.map(PageImpl.java:86)\ncom.tathanhloc.faceattendance.Service.HoatDongService.getAllWithPagination(HoatDongService.java:48)\njava.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)\njava.base/java.lang.reflect.Method.invoke(Method.java:565)\norg.springframework.aop.support.AopUtils.invokeJoinpointUsingReflection(AopUtils.java:359)\norg.springframework.aop.framework.ReflectiveMethodInvocation.invokeJoinpoint(ReflectiveMethodInvocation.java:196)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163)\norg.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:380)\norg.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)\norg.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:184)\norg.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)\n... (truncated)', NULL, 'ERROR', 'API call failed: Cannot invoke \"com.tathanhloc.faceattendance.Model.SinhVien.getHoTen()\" because the return value of \"com.tathanhloc.faceattendance.Model.BCHDoanHoi.getSinhVien()\" is null', 'API', NULL, NULL, NULL, NULL, NULL, 'FAILED', NULL, NULL, NULL),
(538, 'HoatDongController.handleException', '2025-11-04 11:35:41.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(539, 'CREATE', '2025-11-04 11:39:06.000000', NULL, NULL, NULL, NULL, NULL, 'INFO', 'CREATE BCHDoanHoi [unknown]', 'BCHDOANHOI', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, 'admin', 'admin'),
(540, 'BCHDoanHoiController.create', '2025-11-04 11:39:06.000000', 41, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(541, 'BCHDoanHoiController.getStatistics', '2025-11-04 11:39:06.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(542, 'BCHDoanHoiController.getAll', '2025-11-04 11:39:06.000000', 7, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(543, 'BCHDoanHoiController.getChucVuByBCH', '2025-11-04 11:39:10.000000', 5, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(544, 'BCHDoanHoiController.getAll', '2025-11-04 11:40:29.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(545, 'KhoaController.getAll', '2025-11-04 11:40:33.000000', 1, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(546, 'KhoaController.getAll', '2025-11-04 11:40:33.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(547, 'KhoaHocController.getAll', '2025-11-04 11:40:33.000000', 0, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(548, 'LopController.getAllActive', '2025-11-04 11:40:33.000000', 13, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(549, 'NganhController.getAllActive', '2025-11-04 11:40:33.000000', 16, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(550, 'NganhController.getAllActive', '2025-11-04 11:40:36.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(551, 'KhoaController.getAll', '2025-11-04 11:40:36.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(552, 'HoatDongController.getAllWithPagination', '2025-11-04 11:40:36.000000', 3, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL),
(553, 'HoatDongController.getAllWithPagination', '2025-11-04 11:40:40.000000', 2, NULL, NULL, NULL, NULL, 'INFO', 'API call completed successfully', 'API', NULL, NULL, NULL, NULL, NULL, 'SUCCESS', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `taikhoan`
--

CREATE TABLE `taikhoan` (
  `id` bigint(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `vai_tro` enum('ADMIN','GIANGVIEN','SINHVIEN') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ma_sv` varchar(50) DEFAULT NULL,
  `ma_bch` varchar(50) DEFAULT NULL,
  `ma_gv` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `taikhoan`
--

INSERT INTO `taikhoan` (`id`, `username`, `password_hash`, `vai_tro`, `is_active`, `created_at`, `ma_sv`, `ma_bch`, `ma_gv`, `updated_at`) VALUES
(8, 'admin', '$2a$10$MWeCaYuQtZUSI8ljxQILJeQTXkhxfsgJxNbxQMnfmLQvW0iDEHV0u', 'ADMIN', 1, '2025-10-22 08:08:47', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_bao_cao_gio_phuc_vu`
-- (See below for the actual view)
--
CREATE TABLE `v_bao_cao_gio_phuc_vu` (
`ma_sv` varchar(50)
,`ho_ten` varchar(100)
,`ten_lop` varchar(255)
,`ma_hoat_dong` varchar(50)
,`ten_hoat_dong` varchar(200)
,`loai_hoat_dong` enum('CHINH_TRI','VAN_HOA_NGHE_THUAT','THE_THAO','TINH_NGUYEN','HOC_THUAT','KY_NANG_MEM','DOAN_HOI','CONG_DONG','KHAC')
,`ngay_to_chuc` date
,`thoi_gian_check_in` datetime
,`thoi_gian_check_out` datetime
,`tong_phut` int(11)
,`tong_gio` decimal(14,2)
,`dat_thoi_gian_toi_thieu` tinyint(1)
,`tinh_gio_phuc_vu` tinyint(1)
,`trang_thai_check_in` enum('DUNG_GIO','TRE','CHUA_CHECK_IN')
,`trang_thai_check_out` enum('HOAN_THANH','VE_SOM','CHUA_CHECK_OUT')
);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_chi_tiet_hoat_dong`
-- (See below for the actual view)
--
CREATE TABLE `v_chi_tiet_hoat_dong` (
`ma_hoat_dong` varchar(50)
,`ten_hoat_dong` varchar(200)
,`loai_hoat_dong` enum('CHINH_TRI','VAN_HOA_NGHE_THUAT','THE_THAO','TINH_NGUYEN','HOC_THUAT','KY_NANG_MEM','DOAN_HOI','CONG_DONG','KHAC')
,`ngay_to_chuc` date
,`thoi_gian_bat_dau` time(6)
,`thoi_gian_ket_thuc` time(6)
,`yeu_cau_check_out` tinyint(1)
,`thoi_gian_toi_thieu` int(11)
,`so_nguoi_dang_ky` bigint(21)
,`so_nguoi_tham_gia` bigint(21)
,`so_nguoi_check_in` bigint(21)
,`so_nguoi_check_out` bigint(21)
,`so_nguoi_dung_gio` bigint(21)
,`so_nguoi_tre` bigint(21)
,`thoi_gian_tham_gia_trung_binh` decimal(13,2)
,`tong_gio_phuc_vu` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_thong_ke_sinh_vien`
-- (See below for the actual view)
--
CREATE TABLE `v_thong_ke_sinh_vien` (
`ma_sv` varchar(50)
,`ho_ten` varchar(100)
,`ten_lop` varchar(255)
,`ten_khoa` varchar(255)
,`so_hoat_dong_dang_ky` bigint(21)
,`so_hoat_dong_da_tham_gia` bigint(21)
,`tong_phut_phuc_vu` decimal(32,0)
,`tong_gio_phuc_vu` decimal(36,2)
,`so_lan_dung_gio` bigint(21)
,`so_lan_tre` bigint(21)
,`trung_binh_phut_tre` decimal(13,2)
,`tong_diem_ren_luyen` decimal(32,0)
,`ty_le_tham_gia` decimal(26,2)
);

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_bao_cao_gio_phuc_vu`
--
DROP TABLE IF EXISTS `v_bao_cao_gio_phuc_vu`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_bao_cao_gio_phuc_vu`  AS SELECT `sv`.`ma_sv` AS `ma_sv`, `sv`.`ho_ten` AS `ho_ten`, `l`.`ten_lop` AS `ten_lop`, `hd`.`ma_hoat_dong` AS `ma_hoat_dong`, `hd`.`ten_hoat_dong` AS `ten_hoat_dong`, `hd`.`loai_hoat_dong` AS `loai_hoat_dong`, `hd`.`ngay_to_chuc` AS `ngay_to_chuc`, `dd`.`thoi_gian_check_in` AS `thoi_gian_check_in`, `dd`.`thoi_gian_check_out` AS `thoi_gian_check_out`, `dd`.`tong_thoi_gian_tham_gia` AS `tong_phut`, round(`dd`.`tong_thoi_gian_tham_gia` / 60.0,2) AS `tong_gio`, `dd`.`dat_thoi_gian_toi_thieu` AS `dat_thoi_gian_toi_thieu`, `dd`.`tinh_gio_phuc_vu` AS `tinh_gio_phuc_vu`, `dd`.`trang_thai_check_in` AS `trang_thai_check_in`, `dd`.`trang_thai_check_out` AS `trang_thai_check_out` FROM (((`diem_danh_hoat_dong` `dd` join `sinhvien` `sv` on(`dd`.`ma_sv` = `sv`.`ma_sv`)) join `lop` `l` on(`sv`.`ma_lop` = `l`.`ma_lop`)) join `hoat_dong` `hd` on(`dd`.`ma_hoat_dong` = `hd`.`ma_hoat_dong`)) WHERE `dd`.`tinh_gio_phuc_vu` = 1 AND `dd`.`trang_thai` = 'DA_THAM_GIA' ORDER BY `sv`.`ma_sv` ASC, `hd`.`ngay_to_chuc` ASC ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_chi_tiet_hoat_dong`
--
DROP TABLE IF EXISTS `v_chi_tiet_hoat_dong`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_chi_tiet_hoat_dong`  AS SELECT `hd`.`ma_hoat_dong` AS `ma_hoat_dong`, `hd`.`ten_hoat_dong` AS `ten_hoat_dong`, `hd`.`loai_hoat_dong` AS `loai_hoat_dong`, `hd`.`ngay_to_chuc` AS `ngay_to_chuc`, `hd`.`thoi_gian_bat_dau` AS `thoi_gian_bat_dau`, `hd`.`thoi_gian_ket_thuc` AS `thoi_gian_ket_thuc`, `hd`.`yeu_cau_check_out` AS `yeu_cau_check_out`, `hd`.`thoi_gian_toi_thieu` AS `thoi_gian_toi_thieu`, count(distinct `dk`.`ma_sv`) AS `so_nguoi_dang_ky`, count(distinct case when `dd`.`trang_thai` = 'DA_THAM_GIA' then `dd`.`ma_sv` end) AS `so_nguoi_tham_gia`, count(distinct case when `dd`.`thoi_gian_check_in` is not null then `dd`.`ma_sv` end) AS `so_nguoi_check_in`, count(distinct case when `dd`.`thoi_gian_check_out` is not null then `dd`.`ma_sv` end) AS `so_nguoi_check_out`, count(distinct case when `dd`.`trang_thai_check_in` = 'DUNG_GIO' then `dd`.`ma_sv` end) AS `so_nguoi_dung_gio`, count(distinct case when `dd`.`trang_thai_check_in` = 'TRE' then `dd`.`ma_sv` end) AS `so_nguoi_tre`, round(avg(`dd`.`tong_thoi_gian_tham_gia`),2) AS `thoi_gian_tham_gia_trung_binh`, round(sum(case when `dd`.`tinh_gio_phuc_vu` = 1 then `dd`.`tong_thoi_gian_tham_gia` else 0 end) / 60.0,2) AS `tong_gio_phuc_vu` FROM ((`hoat_dong` `hd` left join `dang_ky_hoat_dong` `dk` on(`hd`.`ma_hoat_dong` = `dk`.`ma_hoat_dong` and `dk`.`is_active` = 1)) left join `diem_danh_hoat_dong` `dd` on(`hd`.`ma_hoat_dong` = `dd`.`ma_hoat_dong`)) WHERE `hd`.`is_active` = 1 GROUP BY `hd`.`ma_hoat_dong` ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_thong_ke_sinh_vien`
--
DROP TABLE IF EXISTS `v_thong_ke_sinh_vien`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_thong_ke_sinh_vien`  AS SELECT `sv`.`ma_sv` AS `ma_sv`, `sv`.`ho_ten` AS `ho_ten`, `l`.`ten_lop` AS `ten_lop`, `k`.`ten_khoa` AS `ten_khoa`, count(distinct `dk`.`ma_hoat_dong`) AS `so_hoat_dong_dang_ky`, count(distinct case when `dd`.`trang_thai` = 'DA_THAM_GIA' then `dd`.`ma_hoat_dong` end) AS `so_hoat_dong_da_tham_gia`, sum(case when `dd`.`tinh_gio_phuc_vu` = 1 then `dd`.`tong_thoi_gian_tham_gia` else 0 end) AS `tong_phut_phuc_vu`, round(sum(case when `dd`.`tinh_gio_phuc_vu` = 1 then `dd`.`tong_thoi_gian_tham_gia` else 0 end) / 60.0,2) AS `tong_gio_phuc_vu`, count(case when `dd`.`trang_thai_check_in` = 'DUNG_GIO' then 1 end) AS `so_lan_dung_gio`, count(case when `dd`.`trang_thai_check_in` = 'TRE' then 1 end) AS `so_lan_tre`, round(avg(case when `dd`.`so_phut_tre` > 0 then `dd`.`so_phut_tre` end),2) AS `trung_binh_phut_tre`, sum(case when `dd`.`trang_thai` = 'DA_THAM_GIA' then `hd`.`diem_ren_luyen` else 0 end) AS `tong_diem_ren_luyen`, round(count(distinct case when `dd`.`trang_thai` = 'DA_THAM_GIA' then `dd`.`ma_hoat_dong` end) * 100.0 / nullif(count(distinct `dk`.`ma_hoat_dong`),0),2) AS `ty_le_tham_gia` FROM (((((`sinhvien` `sv` left join `lop` `l` on(`sv`.`ma_lop` = `l`.`ma_lop`)) left join `khoa` `k` on(`l`.`ma_khoa` = `k`.`ma_khoa`)) left join `dang_ky_hoat_dong` `dk` on(`sv`.`ma_sv` = `dk`.`ma_sv` and `dk`.`is_active` = 1)) left join `diem_danh_hoat_dong` `dd` on(`sv`.`ma_sv` = `dd`.`ma_sv`)) left join `hoat_dong` `hd` on(`dd`.`ma_hoat_dong` = `hd`.`ma_hoat_dong`)) WHERE `sv`.`is_active` = 1 GROUP BY `sv`.`ma_sv`, `sv`.`ho_ten`, `l`.`ten_lop`, `k`.`ten_khoa` ;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `ban`
--
ALTER TABLE `ban`
  ADD PRIMARY KEY (`ma_ban`),
  ADD KEY `ma_khoa` (`ma_khoa`);

--
-- Chỉ mục cho bảng `bch_chuc_vu`
--
ALTER TABLE `bch_chuc_vu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ma_bch` (`ma_bch`),
  ADD KEY `ma_chuc_vu` (`ma_chuc_vu`),
  ADD KEY `ma_ban` (`ma_ban`);

--
-- Chỉ mục cho bảng `bch_doan_hoi`
--
ALTER TABLE `bch_doan_hoi`
  ADD PRIMARY KEY (`ma_bch`),
  ADD KEY `fk_bch_sinhvien` (`ma_sv`),
  ADD KEY `fk_bch_giangvien` (`ma_gv`),
  ADD KEY `fk_bch_chuyenvien` (`ma_chuyen_vien`);

--
-- Chỉ mục cho bảng `chuc_vu`
--
ALTER TABLE `chuc_vu`
  ADD PRIMARY KEY (`ma_chuc_vu`);

--
-- Chỉ mục cho bảng `chung_nhan_hoat_dong`
--
ALTER TABLE `chung_nhan_hoat_dong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_chung_nhan` (`ma_chung_nhan`),
  ADD KEY `ma_bch_ky` (`ma_bch_ky`),
  ADD KEY `idx_sinh_vien` (`ma_sv`),
  ADD KEY `idx_hoat_dong` (`ma_hoat_dong`),
  ADD KEY `idx_ngay_cap` (`ngay_cap`);

--
-- Chỉ mục cho bảng `chuyenvien`
--
ALTER TABLE `chuyenvien`
  ADD PRIMARY KEY (`ma_chuyen_vien`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `fk_chuyenvien_khoa` (`ma_khoa`);

--
-- Chỉ mục cho bảng `dang_ky_hoat_dong`
--
ALTER TABLE `dang_ky_hoat_dong`
  ADD PRIMARY KEY (`ma_sv`,`ma_hoat_dong`),
  ADD UNIQUE KEY `ma_qr` (`ma_qr`),
  ADD UNIQUE KEY `unique_qr_code` (`ma_qr`),
  ADD KEY `ma_hoat_dong` (`ma_hoat_dong`),
  ADD KEY `idx_ma_qr` (`ma_qr`),
  ADD KEY `idx_ngay_dang_ky` (`ngay_dang_ky`);

--
-- Chỉ mục cho bảng `diem_danh_hoat_dong`
--
ALTER TABLE `diem_danh_hoat_dong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`ma_hoat_dong`,`ma_sv`),
  ADD KEY `ma_bch_check_in` (`ma_bch_check_in`),
  ADD KEY `ma_bch_check_out` (`ma_bch_check_out`),
  ADD KEY `idx_ma_qr_da_quet` (`ma_qr_da_quet`),
  ADD KEY `idx_hoat_dong` (`ma_hoat_dong`),
  ADD KEY `idx_sinh_vien` (`ma_sv`),
  ADD KEY `idx_trang_thai` (`trang_thai`),
  ADD KEY `idx_check_in` (`thoi_gian_check_in`),
  ADD KEY `idx_check_out` (`thoi_gian_check_out`),
  ADD KEY `idx_tinh_gio_phuc_vu` (`tinh_gio_phuc_vu`);

--
-- Chỉ mục cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  ADD PRIMARY KEY (`ma_gv`),
  ADD KEY `FKg4j2s5snd2xwcsx77g5bgmkwe` (`ma_khoa`);

--
-- Chỉ mục cho bảng `hoat_dong`
--
ALTER TABLE `hoat_dong`
  ADD PRIMARY KEY (`ma_hoat_dong`),
  ADD KEY `ma_phong` (`ma_phong`),
  ADD KEY `ma_bch_phu_trach` (`ma_bch_phu_trach`),
  ADD KEY `ma_khoa` (`ma_khoa`),
  ADD KEY `ma_nganh` (`ma_nganh`),
  ADD KEY `idx_ngay_to_chuc` (`ngay_to_chuc`),
  ADD KEY `idx_trang_thai` (`trang_thai`),
  ADD KEY `idx_loai_hoat_dong` (`loai_hoat_dong`);

--
-- Chỉ mục cho bảng `hoc_ky`
--
ALTER TABLE `hoc_ky`
  ADD PRIMARY KEY (`ma_hoc_ky`);

--
-- Chỉ mục cho bảng `hoc_ky_nam_hoc`
--
ALTER TABLE `hoc_ky_nam_hoc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKlrwiis840pd4njt59nr446ldq` (`ma_hoc_ky`),
  ADD KEY `FK95fn1xc3fxikvp3jgqcqkjm19` (`ma_nam_hoc`);

--
-- Chỉ mục cho bảng `khoa`
--
ALTER TABLE `khoa`
  ADD PRIMARY KEY (`ma_khoa`);

--
-- Chỉ mục cho bảng `khoahoc`
--
ALTER TABLE `khoahoc`
  ADD PRIMARY KEY (`ma_khoahoc`);

--
-- Chỉ mục cho bảng `lop`
--
ALTER TABLE `lop`
  ADD PRIMARY KEY (`ma_lop`),
  ADD KEY `ma_nganh` (`ma_nganh`),
  ADD KEY `ma_khoahoc` (`ma_khoahoc`),
  ADD KEY `ma_khoa` (`ma_khoa`);

--
-- Chỉ mục cho bảng `nam_hoc`
--
ALTER TABLE `nam_hoc`
  ADD PRIMARY KEY (`ma_nam_hoc`);

--
-- Chỉ mục cho bảng `nganh`
--
ALTER TABLE `nganh`
  ADD PRIMARY KEY (`ma_nganh`),
  ADD KEY `ma_khoa` (`ma_khoa`);

--
-- Chỉ mục cho bảng `phonghoc`
--
ALTER TABLE `phonghoc`
  ADD PRIMARY KEY (`ma_phong`);

--
-- Chỉ mục cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKghpmfn23vmxfu3spu3lfg4r2d` (`token`),
  ADD UNIQUE KEY `UKjs3rj5pesr5sruelk5lkrw7j2` (`tai_khoan_id`);

--
-- Chỉ mục cho bảng `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD PRIMARY KEY (`ma_sv`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_lop` (`ma_lop`);

--
-- Chỉ mục cho bảng `system_log`
--
ALTER TABLE `system_log`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `UK7n8guubjmp0bqhx9u2hvcnejd` (`ma_gv`),
  ADD KEY `ma_sv` (`ma_sv`),
  ADD KEY `ma_bch` (`ma_bch`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_vai_tro` (`vai_tro`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bch_chuc_vu`
--
ALTER TABLE `bch_chuc_vu`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `chung_nhan_hoat_dong`
--
ALTER TABLE `chung_nhan_hoat_dong`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `diem_danh_hoat_dong`
--
ALTER TABLE `diem_danh_hoat_dong`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `hoc_ky_nam_hoc`
--
ALTER TABLE `hoc_ky_nam_hoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `system_log`
--
ALTER TABLE `system_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=554;

--
-- AUTO_INCREMENT cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `ban`
--
ALTER TABLE `ban`
  ADD CONSTRAINT `ban_ibfk_1` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`);

--
-- Các ràng buộc cho bảng `bch_chuc_vu`
--
ALTER TABLE `bch_chuc_vu`
  ADD CONSTRAINT `bch_chuc_vu_ibfk_1` FOREIGN KEY (`ma_bch`) REFERENCES `bch_doan_hoi` (`ma_bch`),
  ADD CONSTRAINT `bch_chuc_vu_ibfk_2` FOREIGN KEY (`ma_chuc_vu`) REFERENCES `chuc_vu` (`ma_chuc_vu`),
  ADD CONSTRAINT `bch_chuc_vu_ibfk_3` FOREIGN KEY (`ma_ban`) REFERENCES `ban` (`ma_ban`);

--
-- Các ràng buộc cho bảng `bch_doan_hoi`
--
ALTER TABLE `bch_doan_hoi`
  ADD CONSTRAINT `bch_doan_hoi_ibfk_2` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`),
  ADD CONSTRAINT `fk_bch_chuyenvien` FOREIGN KEY (`ma_chuyen_vien`) REFERENCES `chuyenvien` (`ma_chuyen_vien`),
  ADD CONSTRAINT `fk_bch_giangvien` FOREIGN KEY (`ma_gv`) REFERENCES `giangvien` (`ma_gv`),
  ADD CONSTRAINT `fk_bch_sinhvien` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`);

--
-- Các ràng buộc cho bảng `chung_nhan_hoat_dong`
--
ALTER TABLE `chung_nhan_hoat_dong`
  ADD CONSTRAINT `chung_nhan_hoat_dong_ibfk_1` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`) ON DELETE CASCADE,
  ADD CONSTRAINT `chung_nhan_hoat_dong_ibfk_2` FOREIGN KEY (`ma_hoat_dong`) REFERENCES `hoat_dong` (`ma_hoat_dong`) ON DELETE CASCADE,
  ADD CONSTRAINT `chung_nhan_hoat_dong_ibfk_3` FOREIGN KEY (`ma_bch_ky`) REFERENCES `bch_doan_hoi` (`ma_bch`);

--
-- Các ràng buộc cho bảng `chuyenvien`
--
ALTER TABLE `chuyenvien`
  ADD CONSTRAINT `fk_chuyenvien_khoa` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`);

--
-- Các ràng buộc cho bảng `dang_ky_hoat_dong`
--
ALTER TABLE `dang_ky_hoat_dong`
  ADD CONSTRAINT `dang_ky_hoat_dong_ibfk_1` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`) ON DELETE CASCADE,
  ADD CONSTRAINT `dang_ky_hoat_dong_ibfk_2` FOREIGN KEY (`ma_hoat_dong`) REFERENCES `hoat_dong` (`ma_hoat_dong`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `diem_danh_hoat_dong`
--
ALTER TABLE `diem_danh_hoat_dong`
  ADD CONSTRAINT `diem_danh_hoat_dong_ibfk_1` FOREIGN KEY (`ma_hoat_dong`) REFERENCES `hoat_dong` (`ma_hoat_dong`) ON DELETE CASCADE,
  ADD CONSTRAINT `diem_danh_hoat_dong_ibfk_2` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`) ON DELETE CASCADE,
  ADD CONSTRAINT `diem_danh_hoat_dong_ibfk_3` FOREIGN KEY (`ma_bch_check_in`) REFERENCES `bch_doan_hoi` (`ma_bch`),
  ADD CONSTRAINT `diem_danh_hoat_dong_ibfk_4` FOREIGN KEY (`ma_bch_check_out`) REFERENCES `bch_doan_hoi` (`ma_bch`);

--
-- Các ràng buộc cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  ADD CONSTRAINT `FKg4j2s5snd2xwcsx77g5bgmkwe` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`);

--
-- Các ràng buộc cho bảng `hoat_dong`
--
ALTER TABLE `hoat_dong`
  ADD CONSTRAINT `hoat_dong_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phonghoc` (`ma_phong`),
  ADD CONSTRAINT `hoat_dong_ibfk_2` FOREIGN KEY (`ma_bch_phu_trach`) REFERENCES `bch_doan_hoi` (`ma_bch`),
  ADD CONSTRAINT `hoat_dong_ibfk_3` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`),
  ADD CONSTRAINT `hoat_dong_ibfk_4` FOREIGN KEY (`ma_nganh`) REFERENCES `nganh` (`ma_nganh`);

--
-- Các ràng buộc cho bảng `hoc_ky_nam_hoc`
--
ALTER TABLE `hoc_ky_nam_hoc`
  ADD CONSTRAINT `FK95fn1xc3fxikvp3jgqcqkjm19` FOREIGN KEY (`ma_nam_hoc`) REFERENCES `nam_hoc` (`ma_nam_hoc`),
  ADD CONSTRAINT `FKlrwiis840pd4njt59nr446ldq` FOREIGN KEY (`ma_hoc_ky`) REFERENCES `hoc_ky` (`ma_hoc_ky`);

--
-- Các ràng buộc cho bảng `lop`
--
ALTER TABLE `lop`
  ADD CONSTRAINT `lop_ibfk_1` FOREIGN KEY (`ma_nganh`) REFERENCES `nganh` (`ma_nganh`),
  ADD CONSTRAINT `lop_ibfk_2` FOREIGN KEY (`ma_khoahoc`) REFERENCES `khoahoc` (`ma_khoahoc`),
  ADD CONSTRAINT `lop_ibfk_3` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`);

--
-- Các ràng buộc cho bảng `nganh`
--
ALTER TABLE `nganh`
  ADD CONSTRAINT `nganh_ibfk_1` FOREIGN KEY (`ma_khoa`) REFERENCES `khoa` (`ma_khoa`);

--
-- Các ràng buộc cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `FKngcs3fewrm95e0ndjxckq40y4` FOREIGN KEY (`tai_khoan_id`) REFERENCES `taikhoan` (`id`);

--
-- Các ràng buộc cho bảng `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`ma_lop`) REFERENCES `lop` (`ma_lop`);

--
-- Các ràng buộc cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD CONSTRAINT `FKs0bgyr1iyn1mpx30touj5twv5` FOREIGN KEY (`ma_gv`) REFERENCES `giangvien` (`ma_gv`),
  ADD CONSTRAINT `taikhoan_ibfk_1` FOREIGN KEY (`ma_sv`) REFERENCES `sinhvien` (`ma_sv`) ON DELETE CASCADE,
  ADD CONSTRAINT `taikhoan_ibfk_2` FOREIGN KEY (`ma_bch`) REFERENCES `bch_doan_hoi` (`ma_bch`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
