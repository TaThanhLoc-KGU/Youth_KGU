# PERMISSIONS REFERENCE — Youth KGU

> Tài liệu tham chiếu quyền hệ thống sau migration **V_permissions_cleanup.sql**
> Tổng: **58 permissions**, ID cố định 1-58.

---

## 1. Danh sách tất cả Permissions (theo Category)

### HE_THONG (id 1-4)
| ID | Name | Mô tả |
|----|------|--------|
| 1 | `DOI_MAT_KHAU` | Đổi mật khẩu |
| 2 | `XEM_THONG_TIN_CA_NHAN` | Xem thông tin cá nhân |
| 3 | `SUA_THONG_TIN_CA_NHAN` | Sửa thông tin cá nhân |
| 4 | `CAI_DAT_HE_THONG` | Cài đặt hệ thống |

### SINH_VIEN (id 5-9)
| ID | Name | Mô tả |
|----|------|--------|
| 5 | `XEM_SINH_VIEN` | Xem danh sách sinh viên |
| 6 | `THEM_SINH_VIEN` | Thêm sinh viên |
| 7 | `SUA_SINH_VIEN` | Sửa sinh viên |
| 8 | `XOA_SINH_VIEN` | Xóa sinh viên |
| 9 | `IMPORT_SINH_VIEN` | Import sinh viên từ Excel |

### GIANG_VIEN (id 10-13)
| ID | Name | Mô tả |
|----|------|--------|
| 10 | `XEM_GIANG_VIEN` | Xem danh sách giảng viên |
| 11 | `THEM_GIANG_VIEN` | Thêm giảng viên |
| 12 | `SUA_GIANG_VIEN` | Sửa giảng viên |
| 13 | `XOA_GIANG_VIEN` | Xóa giảng viên |

### CHUYEN_VIEN (id 14-15)
| ID | Name | Mô tả |
|----|------|--------|
| 14 | `XEM_CHUYEN_VIEN` | Xem danh sách chuyên viên |
| 15 | `QUAN_LY_CHUYEN_VIEN` | Quản lý chuyên viên |

### TO_CHUC (id 16-27)
| ID | Name | Mô tả |
|----|------|--------|
| 16 | `XEM_KHOA` | Xem danh sách khoa |
| 17 | `QUAN_LY_KHOA` | Quản lý khoa (thêm/sửa/xóa) |
| 18 | `XEM_NGANH` | Xem danh sách ngành |
| 19 | `QUAN_LY_NGANH` | Quản lý ngành |
| 20 | `XEM_LOP` | Xem danh sách lớp |
| 21 | `QUAN_LY_LOP` | Quản lý lớp |
| 22 | `XEM_KHOA_HOC` | Xem khóa học |
| 23 | `QUAN_LY_KHOA_HOC` | Quản lý khóa học |
| 24 | `XEM_HOC_KY` | Xem học kỳ |
| 25 | `QUAN_LY_HOC_KY` | Quản lý học kỳ |
| 26 | `XEM_NAM_HOC` | Xem năm học |
| 27 | `QUAN_LY_NAM_HOC` | Quản lý năm học |

### HOAT_DONG (id 28-36)
| ID | Name | Mô tả |
|----|------|--------|
| 28 | `XEM_HOAT_DONG` | Xem hoạt động |
| 29 | `TAO_HOAT_DONG` | Tạo hoạt động |
| 30 | `SUA_HOAT_DONG` | Sửa / quản lý vòng đời hoạt động |
| 31 | `XOA_HOAT_DONG` | Xóa hoạt động |
| 32 | `DUYET_HOAT_DONG` | Duyệt hoạt động |
| 33 | `DANG_KY_HOAT_DONG` | Đăng ký tham gia hoạt động |
| 34 | `HUY_DANG_KY_HOAT_DONG` | Hủy đăng ký hoạt động |
| 35 | `XEM_LICH_SU_THAM_GIA` | Xem lịch sử tham gia |
| 36 | `QUAN_LY_DANG_KY` | Quản lý đăng ký hoạt động |

### DIEM_DANH (id 37-40)
| ID | Name | Mô tả |
|----|------|--------|
| 37 | `QUET_QR` | Quét mã QR điểm danh |
| 38 | `PHAN_CONG_DIEM_DANH` | Phân công người điểm danh |
| 39 | `XEM_DIEM_DANH` | Xem báo cáo điểm danh |
| 40 | `CHINH_SUA_DIEM_DANH` | Chỉnh sửa điểm danh thủ công |

### BCH (id 41-46)
| ID | Name | Mô tả |
|----|------|--------|
| 41 | `XEM_BCH` | Xem danh sách BCH |
| 42 | `THEM_BCH` | Thêm thành viên BCH |
| 43 | `SUA_BCH` | Sửa thông tin BCH |
| 44 | `XOA_BCH` | Xóa thành viên BCH |
| 45 | `QUAN_LY_CHUC_VU` | Quản lý chức vụ |
| 46 | `QUAN_LY_BAN` | Quản lý ban |

### TAI_KHOAN (id 47-51)
| ID | Name | Mô tả |
|----|------|--------|
| 47 | `XEM_TAI_KHOAN` | Xem danh sách tài khoản |
| 48 | `DUYET_TAI_KHOAN` | Duyệt tài khoản đăng ký |
| 49 | `TAO_TAI_KHOAN` | Tạo tài khoản mới |
| 50 | `SUA_TAI_KHOAN` | Sửa thông tin tài khoản |
| 51 | `XOA_TAI_KHOAN` | Xóa tài khoản |

### PHAN_QUYEN (id 52-53)
| ID | Name | Mô tả |
|----|------|--------|
| 52 | `QUAN_LY_PHAN_QUYEN_NHOM` | Quản lý quyền theo nhóm/chức vụ |
| 53 | `QUAN_LY_PHAN_QUYEN_TAI_KHOAN` | Phân quyền riêng cho tài khoản |

### BAO_CAO (id 54-56)
| ID | Name | Mô tả |
|----|------|--------|
| 54 | `XEM_BAO_CAO` | Xem báo cáo thống kê |
| 55 | `XUAT_BAO_CAO` | Xuất báo cáo (Excel/PDF) |
| 56 | `XEM_THONG_KE` | Xem thống kê tổng quan |

### SYSTEM (id 57-58)
| ID | Name | Mô tả |
|----|------|--------|
| 57 | `XEM_SYSTEM_LOG` | Xem system log |
| 58 | `XUAT_SYSTEM_LOG` | Xuất system log |

---

## 2. Phân quyền theo Role / Chức vụ

### Vai trò hệ thống (role_permissions)

| Role | Số quyền | Permissions chính |
|------|----------|-------------------|
| `ADMIN` | 58 (tất cả) | Toàn quyền |
| `SINH_VIEN` | 7 | 1,2,3,28,33,34,35 |
| `GIANG_VIEN` | 8 | 1,2,3,5,10,28,35,39 |
| `GIANG_VIEN_HUONG_DAN` | 9 | +40 so với GV |
| `CHUYEN_VIEN` | 9 | 1,2,3,5,10,28,39,54,56 |

### Chức vụ BCH (role_permissions dùng maChucVu làm role_name)

| Chức vụ | Mã | Số quyền | Ghi chú |
|---------|----|----------|---------|
| Bí thư Đoàn | `CV001` | 58 | Toàn quyền |
| Phó Bí thư | `CV002` | 53 | Trừ 51,52,53,57,58 |
| Trưởng Ban Truyền thông | `CV003` | 19 | Quản lý hoạt động + điểm danh |
| Trưởng Ban Tổ chức | `CV004` | 19 | Giống CV003 |
| Chủ tịch Hội SV | `CV005` | 58 | Toàn quyền |
| Phó Chủ tịch HSV | `CV006` | 53 | Giống CV002 |
| Tổng thư ký Hội | `CV007` | 13 | Chủ yếu xem/báo cáo |
| Trưởng Đội Tình nguyện | `CV008` | 13 | Giống CV007 |
| Thành viên Đội TN | `CV009` | 14 | Tạo HĐ + quét QR |
| Chủ tịch CLB | `CV010` | 11 | Quản lý đăng ký + quét QR |
| Thành viên CLB | `CV011` | 6 | 1,2,3,28,37,39 |

---

## 3. Mapping Frontend Constants → DB Permission Name

File: `frontend-react/src/utils/constants.js`

> Chỉ liệt kê các constants **đang được dùng trong code** và tên DB tương ứng.

| Constant (`PERMISSIONS.xxx`) | Value (string) | DB name | ID |
|------------------------------|---------------|---------|-----|
| `DOI_MAT_KHAU` | `'DOI_MAT_KHAU'` | `DOI_MAT_KHAU` | 1 |
| `XEM_THONG_TIN_CA_NHAN` | `'XEM_THONG_TIN_CA_NHAN'` | `XEM_THONG_TIN_CA_NHAN` | 2 |
| `SUA_THONG_TIN_CA_NHAN` | `'SUA_THONG_TIN_CA_NHAN'` | `SUA_THONG_TIN_CA_NHAN` | 3 |
| `CAI_DAT_HE_THONG` | `'CAI_DAT_HE_THONG'` | `CAI_DAT_HE_THONG` | 4 |
| `XEM_SINH_VIEN` | `'VIEW_SINH_VIEN'` | ⚠️ **MISMATCH** — DB: `XEM_SINH_VIEN` | 5 |
| `XEM_HOAT_DONG` | `'XEM_HOAT_DONG'` | `XEM_HOAT_DONG` | 28 |
| `TAO_HOAT_DONG` | `'TAO_HOAT_DONG'` | `TAO_HOAT_DONG` | 29 |
| `SUA_HOAT_DONG` | `'SUA_HOAT_DONG'` | `SUA_HOAT_DONG` | 30 |
| `XOA_HOAT_DONG` | `'XOA_HOAT_DONG'` | `XOA_HOAT_DONG` | 31 |
| `DUYET_HOAT_DONG` | `'DUYET_HOAT_DONG'` | `DUYET_HOAT_DONG` | 32 |
| `DANG_KY_HOAT_DONG` | `'DANG_KY_HOAT_DONG'` | `DANG_KY_HOAT_DONG` | 33 |
| `HUY_DANG_KY_HOAT_DONG` | `'HUY_DANG_KY_HOAT_DONG'` | `HUY_DANG_KY_HOAT_DONG` | 34 |
| `XEM_LICH_SU_THAM_GIA` | `'XEM_LICH_SU_THAM_GIA'` | `XEM_LICH_SU_THAM_GIA` | 35 |
| `QUAN_LY_DANG_KY` | `'QUAN_LY_DANG_KY'` | `QUAN_LY_DANG_KY` | 36 |
| `QUET_QR` | `'QUET_QR'` | `QUET_QR` | 37 |
| `PHAN_CONG_DIEM_DANH` | `'PHAN_CONG_DIEM_DANH'` | `PHAN_CONG_DIEM_DANH` | 38 |
| `XEM_BCH` | `'VIEW_BCH'` | ⚠️ **MISMATCH** — DB: `XEM_BCH` | 41 |
| `XEM_TAI_KHOAN` | `'VIEW_TAI_KHOAN'` | ⚠️ **MISMATCH** — DB: `XEM_TAI_KHOAN` | 47 |
| `MANAGE_ROLE_PERMISSIONS` | `'MANAGE_ROLE_PERMISSIONS'` | ⚠️ **MISMATCH** — DB: `QUAN_LY_PHAN_QUYEN_NHOM` | 52 |
| `MANAGE_ACCOUNT_PERMISSIONS` | `'MANAGE_ACCOUNT_PERMISSIONS'` | ⚠️ **MISMATCH** — DB: `QUAN_LY_PHAN_QUYEN_TAI_KHOAN` | 53 |
| `XEM_BAO_CAO` | `'XEM_BAO_CAO'` | `XEM_BAO_CAO` | 54 |
| `XUAT_BAO_CAO` | `'XUAT_BAO_CAO'` | `XUAT_BAO_CAO` | 55 |
| `VIEW_THONG_KE` | `'VIEW_THONG_KE'` | ⚠️ **MISMATCH** — DB: `XEM_THONG_KE` | 56 |
| `VIEW_SYSTEM_LOG` | `'VIEW_SYSTEM_LOG'` | ⚠️ **MISMATCH** — DB: `XEM_SYSTEM_LOG` | 57 |

> **Lưu ý MISMATCH**: Các constants có giá trị string khác tên trong DB sẽ không match khi `hasPermission()` kiểm tra. Với **ADMIN** không ảnh hưởng (luôn `true`), nhưng với các role khác cần được đồng bộ.

---

## 4. Permission Gates trong Routing & UI

### Route Guards (`App.jsx`)

| Route | Kiểm tra | Cơ chế |
|-------|----------|--------|
| `/admin/*` | `ROLES.ADMIN` | `allowedRoles` (strict) |
| `/profile` | Any authenticated role | `allowedRoles` (strict) |
| `/bch/*` | `TAO_HOAT_DONG` **hoặc** `QUET_QR` | `requiredPermissions` (any) |
| `/student/*` | `DANG_KY_HOAT_DONG` | `requiredPermissions` (any) |

### Sidebar BCH Menu

| Menu item | Permission gate |
|-----------|----------------|
| Dashboard BCH | `TAO_HOAT_DONG` |
| Quản lý Hoạt động | `TAO_HOAT_DONG` |
| Điểm danh | `QUET_QR` |
| Quét QR | `QUET_QR` |
| Hồ sơ cá nhân | *(none)* |

### BCH Pages — Permission checks

| Tính năng | Permission |
|-----------|-----------|
| Nút "Tạo hoạt động" | `TAO_HOAT_DONG` |
| Nút "Quét QR" (header) | `QUET_QR` |
| Link "Điểm danh" trên card hoạt động | `QUET_QR` |
| Mở/Đóng đăng ký, Bắt đầu, Kết thúc, Hủy | `SUA_HOAT_DONG` |

### Admin Sidebar Menu

| Menu item | Permission gate | Ghi chú |
|-----------|----------------|---------|
| Sinh viên | `VIEW_SINH_VIEN` | ⚠️ MISMATCH với DB |
| Giảng viên | `VIEW_GIANG_VIEN` | ⚠️ MISMATCH |
| Chuyên viên | `MANAGE_GIANG_VIEN` | ⚠️ Sai ngữ nghĩa |
| BCH Đoàn - Hội | `VIEW_BCH` | ⚠️ MISMATCH |
| Khoa/Ngành/Lớp/Khóa học | `CAI_DAT_HE_THONG` | ✅ |
| Chức vụ/Ban | `MANAGE_BCH` | ⚠️ MISMATCH |
| Hoạt động | `XEM_HOAT_DONG` | ✅ |
| Điểm danh | `MANAGE_DIEM_DANH` | ⚠️ Không có trong DB |
| Quản lý tài khoản | `VIEW_TAI_KHOAN` | ⚠️ MISMATCH |
| Thống kê | `VIEW_THONG_KE` | ⚠️ MISMATCH |
| System Log | `VIEW_SYSTEM_LOG` | ⚠️ MISMATCH |
| Cài đặt & Phân quyền | `MANAGE_ROLE_PERMISSIONS` | ⚠️ MISMATCH |

> **Lưu ý**: Admin luôn `hasPermission() = true` nên các MISMATCH trên không ảnh hưởng chức năng với role ADMIN. Cần đồng bộ nếu muốn các role khác (CHUYEN_VIEN, v.v.) dùng được Admin menu items này.

---

## 5. Hướng đồng bộ constants.js (việc cần làm)

Các constants sau cần cập nhật **value** để khớp với tên trong DB:

```js
// Hiện tại → Cần đổi thành
VIEW_SINH_VIEN: 'VIEW_SINH_VIEN'      → XEM_SINH_VIEN: 'XEM_SINH_VIEN'
MANAGE_SINH_VIEN: 'MANAGE_SINH_VIEN'  → (xóa hoặc map sang THEM/SUA/XOA_SINH_VIEN)
VIEW_GIANG_VIEN: 'VIEW_GIANG_VIEN'    → XEM_GIANG_VIEN: 'XEM_GIANG_VIEN'
MANAGE_GIANG_VIEN: 'MANAGE_GIANG_VIEN' → (map sang THEM/SUA/XOA_GIANG_VIEN)
VIEW_BCH: 'VIEW_BCH'                  → XEM_BCH: 'XEM_BCH'
MANAGE_BCH: 'MANAGE_BCH'              → (map sang QUAN_LY_CHUC_VU, QUAN_LY_BAN)
VIEW_TAI_KHOAN: 'VIEW_TAI_KHOAN'      → XEM_TAI_KHOAN: 'XEM_TAI_KHOAN'
VIEW_THONG_KE: 'VIEW_THONG_KE'        → XEM_THONG_KE: 'XEM_THONG_KE'
VIEW_SYSTEM_LOG: 'VIEW_SYSTEM_LOG'    → XEM_SYSTEM_LOG: 'XEM_SYSTEM_LOG'
EXPORT_SYSTEM_LOG: 'EXPORT_SYSTEM_LOG' → XUAT_SYSTEM_LOG: 'XUAT_SYSTEM_LOG'
MANAGE_ROLE_PERMISSIONS               → QUAN_LY_PHAN_QUYEN_NHOM: '...'
MANAGE_ACCOUNT_PERMISSIONS            → QUAN_LY_PHAN_QUYEN_TAI_KHOAN: '...'
MANAGE_DIEM_DANH: 'MANAGE_DIEM_DANH' → XEM_DIEM_DANH: 'XEM_DIEM_DANH'
```

> **Ưu tiên cao**: Chỉ cần đồng bộ khi cần phân quyền chi tiết cho non-ADMIN roles. Với ADMIN thì không ảnh hưởng.

---

## 6. Quy tắc `hasPermission()` trong hệ thống

```js
// authStore.js
hasPermission: (permission) => {
  const { permissions, user } = get();
  if (user?.vaiTro === 'ADMIN') return true;   // ADMIN luôn true
  return permissions.includes(permission);       // So sánh string với quyenTongHop từ backend
},
```

**`quyenTongHop`** = union của:
1. Quyền cơ bản theo `vaiTro` (từ `role_permissions` table)
2. Quyền từ các `ChucVu` BCH (từ `role_permissions` dùng `maChucVu` làm key)
3. Override cá nhân (từ `account_permissions` table, có thể grant thêm hoặc revoke)
