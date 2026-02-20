# Hướng Dẫn Quản Lý Vai Trò (Role) - Linh Hoạt & Không Hardcode

## Tổng Quan

Hệ thống đã được thiết kế để **vai trò (role) được định nghĩa động từ cơ sở dữ liệu** thay vì hardcode trong code. Điều này cho phép bạn:

1. **Thêm chức vụ/vai trò mới mà không cần sửa code**
2. **Cập nhật vai trò mà không cần rebuild ứng dụng**
3. **Linh hoạt trong quản lý cấu trúc tổ chức**

---

## Cơ Chế Hoạt Động

### Bảng `chuc_vu` (Chức Vụ)

Bảng `chuc_vu` giờ đã có cột mới:

```sql
CREATE TABLE chuc_vu (
    ma_chuc_vu VARCHAR(20) PRIMARY KEY,
    ten_chuc_vu VARCHAR(100) NOT NULL,
    thuoc_ban VARCHAR(50),  -- "DOAN", "HOI", "BAN_PHUC_VU"
    vai_tro_key VARCHAR(50),  -- ✅ CỘT MỚI: Định nghĩa vai trò
    mo_ta TEXT,
    thu_tu INT,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Cột `vai_tro_key`

- **Định nghĩa**: Enum key tương ứng với `VaiTroEnum`
- **Ví dụ giá trị**: 
  - `BI_THU_DOAN`
  - `PHO_BI_THU_DOAN`
  - `THANH_VIEN_DOAN`
  - `CHU_TICH_HOI`
  - `THANH_VIEN_HOI`
  - Etc.

### Luồng Lấy Vai Trò

Khi lấy vai trò của một người dùng:

```
TaiKhoan.getVaiTro()
    ↓
1. Kiểm tra trường vaiTro (nếu được set trực tiếp từ API)
2. Nếu không → lấy từ ChucVu.vaiTroKey
3. Nếu vaiTroKey hợp lệ → convert thành VaiTroEnum
4. Fallback → THANH_VIEN_DOAN hoặc THANH_VIEN_HOI
```

---

## Hướng Dẫn Sử Dụng

### 1. Khởi Tạo Cơ Sở Dữ Liệu

Chạy migration SQL để thêm cột `vai_tro_key`:

```bash
mysql -u root -p your_database < add_vai_tro_key_column.sql
```

**Hoặc chạy thủ công:**

```sql
ALTER TABLE chuc_vu ADD COLUMN vai_tro_key VARCHAR(50);

-- Cập nhật các chức vụ hiện tại
UPDATE chuc_vu SET vai_tro_key = 'BI_THU_DOAN' WHERE ma_chuc_vu = 'CV001';
UPDATE chuc_vu SET vai_tro_key = 'PHO_BI_THU_DOAN' WHERE ma_chuc_vu = 'CV002';
UPDATE chuc_vu SET vai_tro_key = 'THANH_VIEN_DOAN' WHERE thuoc_ban = 'DOAN' AND vai_tro_key IS NULL;
UPDATE chuc_vu SET vai_tro_key = 'THANH_VIEN_HOI' WHERE thuoc_ban = 'HOI' AND vai_tro_key IS NULL;
```

### 2. Thêm Chức Vụ Mới

Khi admin thêm chức vụ mới (ví dụ: "Trưởng Ban Tuyên Truyền Mới"):

```sql
INSERT INTO chuc_vu (ma_chuc_vu, ten_chuc_vu, thuoc_ban, vai_tro_key, mo_ta, is_active)
VALUES ('CV041', 'Trưởng Ban Tuyên Truyền Mới', 'DOAN', 'TRUONG_BAN_DOAN', 'Ban Tuyên Truyền', TRUE);
```

**Điều quan trọng**: 
- Chọn `vai_tro_key` từ các giá trị có sẵn trong `VaiTroEnum`
- Nếu cần vai trò mới, thêm vào `VaiTroEnum` trước, sau đó cập nhật cơ sở dữ liệu

### 3. Danh Sách `vai_tro_key` Có Sẵn

```
NHÓM ĐOÀN:
- BI_THU_DOAN                   (Bí thư Đoàn)
- PHO_BI_THU_DOAN               (Phó Bí thư Đoàn)
- UY_VIEN_THUONG_VU_DOAN        (Ủy viên Ban Thường vụ)
- UY_VIEN_CHAP_HANH_DOAN        (Ủy viên Ban Chấp hành)
- CAN_BO_VAN_PHONG_DOAN         (Cán bộ Văn phòng Đoàn)
- THU_KY_HANH_CHINH_DOAN        (Thư ký hành chính Đoàn)
- TRUONG_BAN_DOAN               (Trưởng Ban Đoàn)
- PHO_TRUONG_BAN_DOAN           (Phó Trưởng Ban Đoàn)
- UV_BAN_DOAN                   (Ủy viên Ban Đoàn)
- THANH_VIEN_DOAN              (Thành viên Đoàn)

NHÓM HỘI:
- CHU_TICH_HOI                  (Chủ tịch Hội)
- PHO_CHU_TICH_HOI              (Phó chủ tịch Hội)
- UY_VIEN_THU_KY_HOI            (Ủy viên Ban Thư ký)
- UY_VIEN_CHAP_HANH_HOI         (Ủy viên Ban Chấp hành)
- TRUONG_BAN_HOI                (Trưởng Ban Hội)
- PHO_TRUONG_BAN_HOI            (Phó Trưởng Ban Hội)
- UV_BAN_HOI                    (Ủy viên Ban Hội)
- THANH_VIEN_HOI               (Thành viên Hội)

ĐẶC BIỆT:
- ADMIN                         (Quản trị viên hệ thống)
- GIANG_VIEN_HUONG_DAN          (Giảng viên hướng dẫn)
- GIANG_VIEN                    (Giảng viên)
- SINH_VIEN                     (Sinh viên)
```

### 4. Thêm Vai Trò Mới

Nếu cần thêm vai trò hoàn toàn mới (ví dụ: "Thành viên Ban Tuyên Truyền"):

**Bước 1**: Thêm vào `VaiTroEnum.java`:
```java
UV_BAN_TUYEN_TRUYEN_DOAN("Ủy viên Ban Tuyên Truyền Đoàn", "PHU_VU", "DOAN", "CAP_3"),
```

**Bước 2**: Thêm cột `vai_tro_key` trong `chuc_vu`:
```sql
INSERT INTO chuc_vu (ma_chuc_vu, ten_chuc_vu, thuoc_ban, vai_tro_key, is_active)
VALUES ('CV051', 'Ủy viên Ban Tuyên Truyền', 'DOAN', 'UV_BAN_TUYEN_TRUYEN_DOAN', TRUE);
```

**Bước 3**: Rebuild & restart ứng dụng

---

## Truy Vấn VD

### Lấy tất cả người dùng có vai trò "BI_THU_DOAN"

```sql
SELECT tk.* FROM taikhoan tk
JOIN chuc_vu cv ON tk.ma_chuc_vu = cv.ma_chuc_vu
WHERE cv.vai_tro_key = 'BI_THU_DOAN';
```

### Cập nhật vai trò của một chức vụ

```sql
UPDATE chuc_vu SET vai_tro_key = 'TRUONG_BAN_HOI' 
WHERE ma_chuc_vu = 'CV031';
```

### Kiểm tra các chức vụ chưa có vai trò

```sql
SELECT * FROM chuc_vu WHERE vai_tro_key IS NULL;
```

---

## Lợi Ích

✅ **Không cần sửa code** khi thêm chức vụ/vai trò mới  
✅ **Cập nhật động** mà không cần rebuild  
✅ **Linh hoạt** trong quản lý cấu trúc tổ chức  
✅ **Dễ bảo trì** và mở rộng  

---

## Lưu Ý

- Luôn sử dụng enum key hợp lệ từ `VaiTroEnum`
- Nếu `vai_tro_key` không tồn tại, hệ thống sẽ fallback thành `THANH_VIEN_DOAN` hoặc `THANH_VIEN_HOI`
- Kiểm tra danh sách enum trước khi thêm chức vụ mới
