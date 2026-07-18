-- V44: Mở rộng cuộc thi hỗ trợ ảnh/video + sinh viên tự đăng ký nộp bài

ALTER TABLE cuoc_thi
    ADD COLUMN cho_phep_nop_bai BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN han_nop          DATETIME NULL;

ALTER TABLE thi_sinh
    ADD COLUMN trang_thai_duyet VARCHAR(20) NOT NULL DEFAULT 'DA_DUYET',
    ADD COLUMN loai_nop_bai     VARCHAR(20) NOT NULL DEFAULT 'ANH_DON',
    ADD COLUMN ds_hinh_anh      JSON;
