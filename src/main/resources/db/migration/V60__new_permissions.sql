    -- V60__new_permissions.sql
    -- LƯU Ý QUAN TRỌNG: Flyway đang tắt (spring.flyway.enabled=false).
    --
    -- Phần INSERT permissions bên dưới CHỈ để tài liệu/tham khảo — permission thực tế
    -- được tạo bởi DataInitializer.initializePermissions() (chạy mỗi lần app khởi động).
    --
    -- Phần INSERT role_default_permissions KHÔNG có code tương đương nào chạy tự động
    -- (giống hệt tình huống đã xảy ra và được ghi lại ở V54__backfill_role_default_permissions.sql).
    -- PHẢI CHẠY TAY 1 LẦN trên DB sau khi deploy:
    --   mysql -u youthkgu -p youth-kgu < V60__new_permissions.sql
    -- Nếu bỏ qua bước này, mọi tài khoản không phải ADMIN sẽ bị 403 khi dùng
    -- các chức năng kiểm duyệt bình luận / xử lý góp ý mới.

    SET NAMES utf8mb4;

    INSERT INTO permissions (name, description, category)
    SELECT * FROM (SELECT 'KIEM_DUYET_BINH_LUAN' AS name,
           'Khóa bình luận bài viết; chặn/bỏ chặn/xóa bình luận vi phạm' AS description,
           'NEWS' AS category) t
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'KIEM_DUYET_BINH_LUAN');

    INSERT INTO permissions (name, description, category)
    SELECT * FROM (SELECT 'QUAN_LY_CON_DAU' AS name,
           'Upload, xóa và gán quyền sở hữu (scoping) con dấu' AS description,
           'KY_SO' AS category) t
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'QUAN_LY_CON_DAU');

    INSERT INTO permissions (name, description, category)
    SELECT * FROM (SELECT 'XEM_GOP_Y' AS name,
           'Xem danh sách/chi tiết góp ý-phản ánh (danh tính người gửi được ẩn)' AS description,
           'GOP_Y' AS category) t
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'XEM_GOP_Y');

    INSERT INTO permissions (name, description, category)
    SELECT * FROM (SELECT 'XU_LY_GOP_Y' AS name,
           'Cập nhật trạng thái và phản hồi góp ý-phản ánh' AS description,
           'GOP_Y' AS category) t
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'XU_LY_GOP_Y');

    -- role_default_permissions backfill — mirror đúng phân bố NEWS hiện tại trong V54
    -- (QUAN_LY_KHOA / PHO_QUAN_LY_KHOA đã có sẵn DANG_TIN_TUC/SUA_TIN_TUC).
    -- QUAN_LY_CON_DAU KHÔNG backfill cho role nào — giữ tinh thần cấp thủ công
    -- per-account cho các chức năng ký số nhạy cảm (giống KY_SO_PDF/CAI_DAT_HE_THONG hiện tại).
    INSERT IGNORE INTO role_default_permissions (vai_tro, permission_id)
    SELECT 'QUAN_LY_KHOA', id FROM permissions
    WHERE name IN ('KIEM_DUYET_BINH_LUAN', 'XEM_GOP_Y', 'XU_LY_GOP_Y');

    INSERT IGNORE INTO role_default_permissions (vai_tro, permission_id)
    SELECT 'PHO_QUAN_LY_KHOA', id FROM permissions
    WHERE name IN ('KIEM_DUYET_BINH_LUAN', 'XEM_GOP_Y', 'XU_LY_GOP_Y');

    -- ADMIN không cần insert — CustomPermissionEvaluator bypass toàn bộ quyền cho ADMIN.

    -- Kiểm tra kết quả sau khi chạy:
    -- SELECT vai_tro, COUNT(*) FROM role_default_permissions
    --   WHERE permission_id IN (SELECT id FROM permissions WHERE name IN
    --     ('KIEM_DUYET_BINH_LUAN','QUAN_LY_CON_DAU','XEM_GOP_Y','XU_LY_GOP_Y'))
    --   GROUP BY vai_tro;
