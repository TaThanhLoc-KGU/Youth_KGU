# FEATURE: Phân quyền Tài khoản theo Khoa (Scope-based Authorization)

## Mục tiêu
Cho phép tạo tài khoản **cán bộ cấp Khoa** — họ có các quyền quản lý hoạt động (tạo, sửa, điểm danh...) nhưng chỉ trong phạm vi khoa của mình. Đoàn trường vẫn quản lý tất cả như cũ.

---

## Kiến trúc hiện tại (cần nắm trước khi làm)

### Tech stack
- **Backend**: Spring Boot 3, JPA/Hibernate, MySQL, Flyway migration, JWT auth
- **Frontend**: React + Zustand + TailwindCSS + @tanstack/react-query
- **Project dir**: `D:\Youth_KGU`

### Hệ thống phân quyền hiện tại
```
TaiKhoan.vaiTro = SINH_VIEN | QUAN_LY
TaiKhoan.laAdmin = true  → QUAN_LY toàn quyền (bypass tất cả)
TaiKhoan.laAdmin = false → chỉ có quyền trong bảng tai_khoan_quyen (danh sách permission IDs)
```

Permissions liên quan đến hoạt động trong bảng `permissions`:
- `TAO_HOAT_DONG`, `SUA_HOAT_DONG`, `XOA_HOAT_DONG`, `XEM_HOAT_DONG`
- `DIEM_DANH_HOAT_DONG`, `QUET_QR`

### Model quan trọng
```java
// TaiKhoan.java (D:\Youth_KGU\src\main\java\com\tathanhloc\youthkgu\Model\TaiKhoan.java)
// HIỆN TẠI chưa có maKhoa

// HoatDong.java — ĐÃ CÓ:
@ManyToOne
@JoinColumn(name = "ma_khoa")
private Khoa khoa;  // hoạt động thuộc khoa nào

// Khoa.java
@Id @Column(name = "ma_khoa") private String maKhoa;
@Column(name = "ten_khoa")    private String tenKhoa;

// Lop.java — ĐÃ CÓ:
@ManyToOne @JoinColumn(name = "ma_khoa") private Khoa maKhoa;
// SinhVien → Lop → Khoa (để filter sinh viên thuộc khoa)

// CapDoEnum: DOAN_TRUONG, KHOA, LOP, ...
```

### File migration cuối cùng: `V9__hoat_dong_bat_dau_thuc_te.sql`
→ File migration mới phải đặt tên `V10__khoa_scope_taikhoan.sql`

---

## Thay đổi cần thực hiện

---

### BƯỚC 1 — Flyway Migration
**File tạo mới**: `src/main/resources/db/migration/V10__khoa_scope_taikhoan.sql`

```sql
-- Thêm cột ma_khoa vào taikhoan (nullable — null = Đoàn trường, không giới hạn khoa)
ALTER TABLE taikhoan
    ADD COLUMN ma_khoa VARCHAR(20) NULL DEFAULT NULL
    AFTER la_admin;

ALTER TABLE taikhoan
    ADD CONSTRAINT fk_taikhoan_khoa
    FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa)
    ON DELETE SET NULL ON UPDATE CASCADE;
```

---

### BƯỚC 2 — Backend Model
**File sửa**: `src/main/java/com/tathanhloc/youthkgu/Model/TaiKhoan.java`

Thêm field vào class (sau field `laAdmin`):
```java
@ManyToOne
@JoinColumn(name = "ma_khoa")
private Khoa khoa; // null = Đoàn trường (không giới hạn), non-null = cán bộ cấp Khoa
```

---

### BƯỚC 3 — Backend DTO
**File sửa**: `src/main/java/com/tathanhloc/youthkgu/DTO/AccountPermissionDTO.java`

Thêm 2 field vào class:
```java
/** Khoa scope — null = không giới hạn (Đoàn trường), non-null = chỉ khoa này */
private String maKhoa;
private String tenKhoa;
```

**File sửa**: `src/main/java/com/tathanhloc/youthkgu/DTO/TaiKhoanDTO.java` (nếu có)
→ Thêm tương tự: `maKhoa`, `tenKhoa`

---

### BƯỚC 4 — Backend PermissionService
**File sửa**: `src/main/java/com/tathanhloc/youthkgu/Service/PermissionService.java`

Trong method `getMyPermissions(String username)`, populate thêm `maKhoa` và `tenKhoa` vào `AccountPermissionDTO`:

```java
// Sau khi build DTO, thêm:
if (taiKhoan.getKhoa() != null) {
    dto.setMaKhoa(taiKhoan.getKhoa().getMaKhoa());
    dto.setTenKhoa(taiKhoan.getKhoa().getTenKhoa());
}
```

---

### BƯỚC 5 — Backend HoatDongService (QUAN TRỌNG NHẤT)
**File sửa**: `src/main/java/com/tathanhloc/youthkgu/Service/HoatDongService.java`

#### 5a. Inject thêm dependencies
```java
private final TaiKhoanRepository taiKhoanRepository; // nếu chưa có
```

#### 5b. Helper method — lấy khoa scope của user hiện tại
```java
private Khoa getKhoaScopeOfCurrentUser() {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    return taiKhoanRepository.findByUsername(username)
            .map(TaiKhoan::getKhoa)
            .orElse(null);
}

private boolean currentUserIsKhoaScoped() {
    return getKhoaScopeOfCurrentUser() != null;
}
```

#### 5c. Method `create(HoatDongDTO dto)` — ép scope khi tạo hoạt động
Tìm method `create` (khoảng dòng 68), thêm logic sau khi map DTO → entity, TRƯỚC khi save:

```java
// Nếu người tạo là cán bộ khoa → ép capDo=KHOA và khoa=khoaOfUser
Khoa khoaScope = getKhoaScopeOfCurrentUser();
if (khoaScope != null) {
    hoatDong.setCapDo(CapDoEnum.KHOA);
    hoatDong.setKhoa(khoaScope);
}
```

#### 5d. Method `update(HoatDongDTO dto)` — ngăn cán bộ khoa sửa hoạt động khoa khác
Tìm method update (khoảng dòng 92), thêm trước khi save:

```java
Khoa khoaScope = getKhoaScopeOfCurrentUser();
if (khoaScope != null) {
    // Kiểm tra hoạt động có thuộc khoa mình không
    if (existing.getKhoa() == null || !existing.getKhoa().getMaKhoa().equals(khoaScope.getMaKhoa())) {
        throw new RuntimeException("Không có quyền sửa hoạt động của khoa khác");
    }
}
```

#### 5e. Method `getAll()` hoặc list activities — filter theo khoa scope
Tìm method trả về danh sách hoạt động cho admin (thường là `getAll()` hoặc `findAll()`):

```java
public List<HoatDongDTO> getAll() {
    Khoa khoaScope = getKhoaScopeOfCurrentUser();
    List<HoatDong> list;
    if (khoaScope != null) {
        // Cán bộ khoa chỉ thấy hoạt động của khoa mình
        list = hoatDongRepository.findByKhoaMaKhoa(khoaScope.getMaKhoa());
        // findByKhoaMaKhoa đã có sẵn trong HoatDongRepository
    } else {
        list = hoatDongRepository.findAll();
    }
    return list.stream().map(this::toDTO).collect(Collectors.toList());
}
```

---

### BƯỚC 6 — Backend AccountController / AccountService
**Mục tiêu**: Khi tạo/sửa tài khoản, admin có thể gán `maKhoa` cho tài khoản QUAN_LY.

Tìm method tạo tài khoản trong `AccountController` hoặc `AccountService`.
Trong request body (DTO), thêm field `maKhoa` (String, nullable).
Khi save `TaiKhoan`, nếu `maKhoa != null` thì lookup `Khoa` và gán:

```java
if (request.getMaKhoa() != null && !request.getMaKhoa().isBlank()) {
    Khoa khoa = khoaRepository.findById(request.getMaKhoa())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa"));
    taiKhoan.setKhoa(khoa);
}
```

Tương tự cho method **update** tài khoản.

---

### BƯỚC 7 — Backend: API lấy danh sách Khoa
Kiểm tra xem đã có API `GET /api/khoa` hoặc `GET /api/khoa/all` chưa.
Nếu chưa có, tạo endpoint public/authenticated để frontend lấy danh sách khoa:

```java
@GetMapping("/api/khoa")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<List<KhoaDTO>> getAllKhoa() {
    return ResponseEntity.ok(khoaRepository.findAll().stream()
        .map(k -> KhoaDTO.builder()
            .maKhoa(k.getMaKhoa())
            .tenKhoa(k.getTenKhoa())
            .build())
        .collect(Collectors.toList()));
}
```

---

### BƯỚC 8 — Frontend authStore
**File sửa**: `frontend-react/src/stores/authStore.js`

Trong state và `partialize`, thêm `maKhoa` và `tenKhoa`:

```js
// Thêm vào state khởi tạo:
maKhoa: null,
tenKhoa: null,

// Trong login() sau khi load permData:
maKhoa: permData?.maKhoa || null,
tenKhoa: permData?.tenKhoa || null,

// Trong partialize:
partialize: (state) => ({
    ...
    maKhoa: state.maKhoa,
    tenKhoa: state.tenKhoa,
})
```

Thêm getter helper:
```js
isKhoaScoped: () => {
    const { maKhoa } = get();
    return !!maKhoa;
},
getKhoaScope: () => {
    const { maKhoa, tenKhoa } = get();
    return { maKhoa, tenKhoa };
},
```

---

### BƯỚC 9 — Frontend CreateAccountModal
**File sửa**: `frontend-react/src/components/admin/CreateAccountModal.jsx`

Khi `vaiTro === 'QUAN_LY'`, hiện thêm dropdown **"Thuộc khoa"** (optional):

```jsx
// Fetch danh sách khoa
const { data: danhSachKhoa } = useQuery({
    queryKey: ['khoa-list'],
    queryFn: () => api.get('/api/khoa').then(r => r.data.data),
});

// JSX — thêm sau phần checkbox permission:
{vaiTro === 'QUAN_LY' && (
    <div>
        <label className="text-sm font-medium text-gray-700">
            Phạm vi khoa (để trống = Đoàn trường, quản lý tất cả)
        </label>
        <select
            value={formData.maKhoa || ''}
            onChange={e => setFormData(p => ({ ...p, maKhoa: e.target.value || null }))}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
        >
            <option value="">-- Không giới hạn (Đoàn trường) --</option>
            {danhSachKhoa?.map(k => (
                <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa}</option>
            ))}
        </select>
        {formData.maKhoa && (
            <p className="text-xs text-orange-600 mt-1">
                ⚠ Tài khoản này chỉ quản lý hoạt động của {danhSachKhoa?.find(k => k.maKhoa === formData.maKhoa)?.tenKhoa}
            </p>
        )}
    </div>
)}
```

Submit: thêm `maKhoa: formData.maKhoa` vào payload gửi lên API.

---

### BƯỚC 10 — Frontend ActivityForm (tạo hoạt động)
**File sửa**: `frontend-react/src/components/admin/ActivityForm.jsx` hoặc `ActivityDetail.jsx`

Lấy `maKhoa`, `isKhoaScoped` từ authStore.
Nếu user là cán bộ khoa (`isKhoaScoped = true`):
- **Ẩn** dropdown chọn `capDo` (backend sẽ tự ép KHOA)
- **Ẩn** dropdown chọn `khoa` (backend tự gán theo user)
- Hiện label thông báo: *"Hoạt động sẽ được tạo ở cấp Khoa — [Tên khoa]"*

```jsx
const { maKhoa, tenKhoa, isKhoaScoped } = useAuthStore(s => ({
    maKhoa: s.maKhoa,
    tenKhoa: s.tenKhoa,
    isKhoaScoped: s.isKhoaScoped(),
}));

// Trong form:
{isKhoaScoped ? (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        Hoạt động cấp <strong>Khoa</strong> — {tenKhoa}
    </div>
) : (
    // Dropdown chọn capDo bình thường
    <select name="capDo" ...>...</select>
)}
```

---

### BƯỚC 11 — Frontend Sidebar
**File sửa**: `frontend-react/src/components/layout/Sidebar.jsx`

Nếu `isKhoaScoped`, hiện thêm badge tên khoa dưới tên user trong sidebar:
```jsx
{isKhoaScoped && (
    <span className="text-xs text-blue-400 block">{tenKhoa}</span>
)}
```

---

## Luồng hoạt động sau khi xong

### Cán bộ khoa (VD: Khoa CNTT)
1. Login → `maKhoa = "KH_CNTT"`, `tenKhoa = "Khoa Công nghệ thông tin"`
2. Vào trang "Hoạt động" → chỉ thấy hoạt động của Khoa CNTT
3. Tạo hoạt động → form ẩn dropdown capDo → backend tự set `capDo=KHOA`, `khoa=KH_CNTT`
4. Sinh viên thuộc Khoa CNTT thấy hoạt động này trong danh sách đăng ký
5. Trang tin tức công khai (`tuoitre.vnkgu.edu.vn`) hiển thị hoạt động kèm tag "Khoa CNTT"

### Đoàn trường (laAdmin=true hoặc QUAN_LY không có maKhoa)
- Mọi thứ như cũ, không bị giới hạn

---

## Lưu ý quan trọng

1. **Không tạo permission mới** — dùng lại permissions cũ, chỉ thêm scope bằng `maKhoa`
2. **`findByKhoaMaKhoa(String maKhoa)` đã có** trong `HoatDongRepository` — dùng luôn
3. **Migration là V10** — file trước là V9, không được bỏ số
4. **`maKhoa` trong `TaiKhoan` là nullable** — null = không giới hạn
5. Sinh viên filter hoạt động theo khoa: dùng quan hệ `SinhVien → Lop.maKhoa`
   - Trong `DangKyHoatDongService` hoặc endpoint public list activities, thêm filter:
     ```java
     // Nếu hoatDong.getCapDo() == KHOA, chỉ sinh viên cùng khoa mới thấy
     if (hoatDong.getCapDo() == CapDoEnum.KHOA && hoatDong.getKhoa() != null) {
         String maKhoaHD = hoatDong.getKhoa().getMaKhoa();
         String maKhoaSV = sinhVien.getLop() != null && sinhVien.getLop().getMaKhoa() != null
                 ? sinhVien.getLop().getMaKhoa().getMaKhoa() : null;
         if (!maKhoaHD.equals(maKhoaSV)) return false; // lọc ra
     }
     ```

---

## Danh sách file cần sửa/tạo

| File | Hành động |
|------|-----------|
| `src/main/resources/db/migration/V10__khoa_scope_taikhoan.sql` | TẠO MỚI |
| `src/main/java/.../Model/TaiKhoan.java` | Thêm field `khoa` (ManyToOne) |
| `src/main/java/.../DTO/AccountPermissionDTO.java` | Thêm `maKhoa`, `tenKhoa` |
| `src/main/java/.../Service/PermissionService.java` | Populate `maKhoa`, `tenKhoa` trong `getMyPermissions` |
| `src/main/java/.../Service/HoatDongService.java` | Helper `getKhoaScopeOfCurrentUser()`, ép scope trong create/update/getAll |
| `src/main/java/.../Service/DangKyHoatDongService.java` | Filter sinh viên chỉ thấy hoạt động cùng khoa |
| `src/main/java/.../Controller/AccountController.java` | Nhận `maKhoa` khi tạo/sửa tài khoản |
| `frontend-react/src/stores/authStore.js` | Thêm `maKhoa`, `tenKhoa`, `isKhoaScoped()` |
| `frontend-react/src/components/admin/CreateAccountModal.jsx` | Dropdown chọn Khoa khi tạo QUAN_LY |
| `frontend-react/src/components/admin/ActivityForm.jsx` | Ẩn/show capDo theo scope |
| `frontend-react/src/components/layout/Sidebar.jsx` | Hiện tên khoa trong sidebar |
