# eNews — Permissions (Seed Data)

> **Claude Code:** Thêm vào method `initializePermissions()` trong `DataInitializer.java`
> Thêm vào method `initializeRolePermissions()` cho từng role tương ứng.

---

## Permissions mới cần thêm vào `DataInitializer.java`

### Trong method `initializePermissions()` — thêm block sau vào cuối:

```java
// ── eNews ────────────────────────────────────────────────────────────────
createPermission("DANG_TIN_TUC",       "Tạo và đăng bài viết eNews",           "NEWS");
createPermission("SUA_TIN_TUC",        "Sửa bài viết eNews",                   "NEWS");
createPermission("XOA_TIN_TUC",        "Xóa bài viết eNews",                   "NEWS");
createPermission("DUYET_TIN_TUC",      "Duyệt bài viết trước khi publish",     "NEWS");
createPermission("QUAN_LY_CHUYEN_MUC", "Thêm sửa xóa danh mục eNews",         "NEWS");
createPermission("QUAN_LY_VAN_BAN",    "Upload và quản lý văn bản/kế hoạch",   "NEWS");
createPermission("XOA_VAN_BAN",        "Xóa văn bản khỏi kho",                 "NEWS");
```

---

## Cập nhật permissions cho từng Role

### Trong method `initializeRolePermissions()`:

**ADMIN** — thêm tất cả NEWS permissions:
```java
// Thêm vào List adminPerms:
"DANG_TIN_TUC", "SUA_TIN_TUC", "XOA_TIN_TUC", "DUYET_TIN_TUC",
"QUAN_LY_CHUYEN_MUC", "QUAN_LY_VAN_BAN", "XOA_VAN_BAN"
```

**MANAGER** (Bí thư, Chủ tịch, Thường vụ) — thêm:
```java
// Thêm vào List managerPerms:
"DANG_TIN_TUC", "SUA_TIN_TUC", "XOA_TIN_TUC", "QUAN_LY_VAN_BAN"
// KHÔNG có: DUYET_TIN_TUC (manager tự publish), QUAN_LY_CHUYEN_MUC, XOA_VAN_BAN
```

**STAFF** (Trưởng ban, CTV) — thêm:
```java
// Thêm vào List staffPerms:
"DANG_TIN_TUC", "SUA_TIN_TUC", "QUAN_LY_VAN_BAN"
// KHÔNG có: XOA_TIN_TUC, DUYET_TIN_TUC, QUAN_LY_CHUYEN_MUC, XOA_VAN_BAN
```

**SINH_VIEN, GIANG_VIEN, CHUYEN_VIEN** — không thêm gì (chỉ xem public).

---

## Logic phân quyền chuyên mục theo đơn vị

> **Đây là business logic trong Service, không thể enforce chỉ bằng DB.**
> Implement trong `NewsService.java` khi check quyền đăng bài:

```
Khi user có DANG_TIN_TUC nhưng chọn chuyên mục:
  - Lấy chuyen_muc.to_chuc của chuyên mục được chọn
  - Lấy danh sách BCH của user (từ bch_doan_hoi)
  - So sánh:
    * ADMIN → pass mọi trường hợp
    * to_chuc = 'DOAN'         → user phải có BCH với tổ chức Đoàn
    * to_chuc = 'HOI'          → user phải có BCH với tổ chức Hội
    * to_chuc = 'BAN_DOI_CLB'  → user phải có BCH thuộc ban tương ứng (chuyen_muc.ban_id)
    * to_chuc = 'CHUNG'        → MANAGER trở lên của bất kỳ tổ chức nào đều pass
```

---

## CHUC_VU_PERMISSION_MAP — thêm NEWS permissions

> Trong `PermissionService.java`, thêm NEWS permissions vào `CHUC_VU_PERMISSION_MAP`:

```java
CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_1", new HashSet<>(Arrays.asList(
    // ... các permission cũ giữ nguyên ...
    "DANG_TIN_TUC", "SUA_TIN_TUC", "XOA_TIN_TUC", "QUAN_LY_VAN_BAN"  // thêm mới
)));

CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_2", new HashSet<>(Arrays.asList(
    // ... các permission cũ giữ nguyên ...
    "DANG_TIN_TUC", "SUA_TIN_TUC", "QUAN_LY_VAN_BAN"  // thêm mới
)));

CHUC_VU_PERMISSION_MAP.put("QUAN_LY_CAP_3", new HashSet<>(Arrays.asList(
    // ... các permission cũ giữ nguyên ...
    "DANG_TIN_TUC", "QUAN_LY_VAN_BAN"  // thêm mới
)));

CHUC_VU_PERMISSION_MAP.put("PHU_VU_CAP_2", new HashSet<>(Arrays.asList(
    // ... các permission cũ giữ nguyên ...
    "DANG_TIN_TUC", "QUAN_LY_VAN_BAN"  // thêm mới
)));
```
