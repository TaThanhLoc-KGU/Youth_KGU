# eNews Module — Tổng quan & Hướng dẫn Implement

> **Dành cho Claude Code:** Đọc file này trước, sau đó đọc các file spec con theo thứ tự được liệt kê.
> Implement đúng theo spec, không tự suy diễn ngoài phạm vi đã mô tả.

---

## Mục lục các file spec

```
ENEWS_SPEC.md              ← File này — đọc trước tiên
ENEWS_DATABASE.md          ← Schema SQL đầy đủ — chạy migration trước
ENEWS_BACKEND.md           ← Tất cả Entity, Service, Controller cần tạo
ENEWS_FRONTEND.md          ← Tất cả React component, route, page cần tạo
ENEWS_PERMISSIONS.md       ← Permissions mới cần seed vào DB
```

---

## Bối cảnh hệ thống hiện tại

Đây là module **bổ sung** vào hệ thống **Youth KGU** đang chạy:

| Thành phần | Công nghệ | Vị trí |
|---|---|---|
| Backend | Spring Boot 3+, Java 21, Spring Security JWT | `src/main/java/com/tathanhloc/faceattendance/` |
| Frontend | React 18 TypeScript, Vite, Tailwind CSS, DaisyUI | `frontend-react/src/` |
| Database | MySQL, tên DB hiện tại xem trong `application.properties` |
| Auth | JWT, role-based: ADMIN / MANAGER / STAFF / SINH_VIEN |

**Các bảng hiện có liên quan:**
- `tai_khoan` — tài khoản người dùng
- `hoat_dong` — hoạt động (Activity)
- `ban` — Ban/Đội/CLB
- `bch_doan_hoi` — thành viên BCH
- `permissions` / `role_permissions` / `account_permissions` — phân quyền

---

## Nguyên tắc implement

1. **Không xóa hoặc sửa code hiện tại** — chỉ thêm mới
2. **Theo đúng convention của project:** đặt tên package, class, method giống code hiện tại
3. **Backend trước, Frontend sau** — theo thứ tự: Database → Entity → Repository → Service → Controller → Frontend
4. **Mọi API public** (eNews) đặt dưới prefix `/api/public/` — không cần JWT
5. **Mọi API quản lý** đặt dưới prefix `/api/news/` hoặc `/api/van-ban/` — cần JWT + permission check
6. **Soft delete** cho mọi bảng — không DELETE cứng
7. **Tiếng Việt** cho tên biến/field DB, tiếng Anh cho method/class Java

---

## Thứ tự implement (Claude Code làm theo đúng thứ tự này)

```
Bước 1 → Chạy ENEWS_DATABASE.md    (tạo bảng + seed permissions)
Bước 2 → Chạy ENEWS_PERMISSIONS.md (seed data permissions vào DataInitializer)
Bước 3 → Chạy ENEWS_BACKEND.md     (Entity → Repository → Service → Controller)
Bước 4 → Chạy ENEWS_FRONTEND.md    (Routes → Layout → Pages → Components)
```
