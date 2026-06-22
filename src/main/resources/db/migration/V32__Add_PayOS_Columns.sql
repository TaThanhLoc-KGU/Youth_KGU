-- Thêm các cột cho PayOS vào bảng clb_cau_hinh
ALTER TABLE clb_cau_hinh
    ADD COLUMN payos_client_id VARCHAR(100) NULL,
    ADD COLUMN payos_api_key VARCHAR(100) NULL,
    ADD COLUMN payos_checksum_key VARCHAR(100) NULL;

-- Thêm các cột lưu trạng thái checkout PayOS vào bảng dong_phi_clb
ALTER TABLE dong_phi_clb
    ADD COLUMN payos_order_code BIGINT NULL UNIQUE,
    ADD COLUMN payos_payment_url VARCHAR(500) NULL;
