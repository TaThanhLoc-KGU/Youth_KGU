-- ============================================================
-- Migration: eNews Module — Slider, Ticker & Ad Banners
-- File     : V2__slider_ticker_banner.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- BẢNG 7: slider_item — Hero Slider trên trang chủ
-- ============================================================
CREATE TABLE IF NOT EXISTS slider_item (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  tieu_de         VARCHAR(255)  NOT NULL,
  mo_ta           TEXT          NULL,
  hinh_anh        VARCHAR(500)  NOT NULL                    COMMENT 'URL ảnh slider',
  duong_dan       VARCHAR(500)  NULL                        COMMENT 'Link khi click vào slide',
  thu_tu          INT           NOT NULL DEFAULT 0,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BẢNG 8: ticker_item — Tin chạy chữ (News Ticker)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticker_item (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  noi_dung        TEXT          NOT NULL,
  duong_dan       VARCHAR(500)  NULL                        COMMENT 'Link khi click vào tin',
  thu_tu          INT           NOT NULL DEFAULT 0,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BẢNG 9: ad_banner — Banner quảng cáo & Widget sidebar
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_banner (
  id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
  tieu_de         VARCHAR(255)  NOT NULL,
  hinh_anh        VARCHAR(500)  NOT NULL                    COMMENT 'URL ảnh banner',
  duong_dan       VARCHAR(500)  NULL                        COMMENT 'Link khi click vào banner',
  loai            ENUM('MAIN', 'SIDEBAR') NOT NULL DEFAULT 'MAIN',
  thu_tu          INT           NOT NULL DEFAULT 0,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
