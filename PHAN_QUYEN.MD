# TÀI LIỆU ĐỀ XUẤT CẢI TỔ HỆ THỐNG PHÂN QUYỀN (YOUTH KGU)

## I. MỤC TIÊU CẢI TỔ
Giải quyết triệt để tình trạng:
1. **Gộp quyền quá mức:** Một người được giao quản lý (Ví dụ: Chuyên viên) là có luôn cả quyền Thêm, Sửa, Xóa. Không thể chia nhỏ được.
2. **Ràng buộc chéo (Lỗi UI/API):** Tình trạng "Có quyền A nhưng bị chặn vì thiếu quyền B".
   * **Ví dụ điển hình (Bug hiện tại):** Cấp quyền `CHINH_SUA_DIEM_DANH` (hoặc quét QR, quản lý hoạt động) để một bạn thêm sinh viên thủ công vào danh sách điểm danh. Nhưng khi gõ MSSV để tìm kiếm, hệ thống báo lỗi hoặc không ra kết quả vì API tìm kiếm Sinh Viên (`GET /api/sinh-vien/search`) đang bị khóa chặt bởi quyền `XEM_SINH_VIEN`.

Mục tiêu là tạo ra một bộ quyền **"Độc lập - Đơn nhiệm"** để gán cho ai quyền gì thì họ chạy mượt chức năng đó mà không bị vướng các quyền phụ.

---

## II. DANH SÁCH QUYỀN CẦN BỔ SUNG VÀ CHIA TÁCH LẠI

> **Lưu ý cho Dev:** Cần viết một file Migration SQL (Ví dụ: `V2__split_permissions.sql`) để INSERT thêm các quyền này vào bảng `permissions` và cấp cho Role `ADMIN` mặc định.

### 1. Nhóm Quản trị Tổ chức & Con người (Cần chia nhỏ)
Các module này đang dùng chung quyền `QUAN_LY_...` (nghĩa là Thêm/Sửa/Xóa gộp làm 1). Cần chia ra:

* **Chuyên viên:** Thay vì chỉ có `QUAN_LY_CHUYEN_VIEN`, cần tách thành: `THEM_CHUYEN_VIEN`, `SUA_CHUYEN_VIEN`, `XOA_CHUYEN_VIEN`.
* **Khoa:** Tách `QUAN_LY_KHOA` thành ➔ `THEM_KHOA`, `SUA_KHOA`, `XOA_KHOA`.
* **Ngành:** Tách `QUAN_LY_NGANH` thành ➔ `THEM_NGANH`, `SUA_NGANH`, `XOA_NGANH`, `IMPORT_NGANH`, `EXPORT_NGANH`.
* **Lớp:** Tách `QUAN_LY_LOP` thành ➔ `THEM_LOP`, `SUA_LOP`, `XOA_LOP`, `IMPORT_LOP`, `EXPORT_LOP`.
* **Khóa học:** Tách `QUAN_LY_KHOA_HOC` thành ➔ `THEM_KHOA_HOC`, `SUA_KHOA_HOC`, `XOA_KHOA_HOC`.
* **Chức vụ:** Tách `QUAN_LY_CHUC_VU` thành ➔ `XEM_CHUC_VU`, `THEM_CHUC_VU`, `SUA_CHUC_VU`, `XOA_CHUC_VU`.
* **Ban/Đội/CLB:** Tách `QUAN_LY_BAN` thành ➔ `XEM_BAN`, `THEM_BAN`, `SUA_BAN`, `XOA_BAN`.

### 2. Nhóm Báo Cáo & Dữ liệu (Tránh dính chùm)
* **Sinh viên:** Đã có `IMPORT_SINH_VIEN` nhưng thiếu Export ➔ Thêm quyền `EXPORT_SINH_VIEN`.
* **Tài khoản:** Thêm quyền `IMPORT_TAI_KHOAN`.
* **Báo cáo Điểm danh / Hoạt động:** Hiện đang gộp vào quyền `XUAT_BAO_CAO` chung của hệ thống. 
  ➔ **Cần tách riêng:** `XUAT_DS_DIEM_DANH`, `XUAT_DS_DANG_KY` để giao cho các bạn chạy sự kiện mà không sợ lộ các báo cáo hệ thống khác.

---

## III. CÁCH SỬA LỖI "RÀNG BUỘC CHÉO" (PHẦN QUAN TRỌNG NHẤT)

Đây là hướng dẫn cụ thể để Dev sửa các lỗi như bạn vừa ví dụ (Thêm thủ công không search được MSSV).

### 1. Lỗi Thêm sinh viên thủ công lúc Điểm danh
**Nguyên nhân:** Khi gõ tìm kiếm, Frontend gọi API `GET /api/sinh-vien/search`. API này đang được Backend bảo vệ bằng `@PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN')")`. Người được giao nhiệm vụ điểm danh không có quyền này nên API trả về 403 Forbidden.

**Cách khắc phục (Backend):**
Mở file `SinhVienController.java`, nới lỏng quyền cho API search. Cho phép người có quyền điểm danh hoặc sửa hoạt động cũng được tìm kiếm sinh viên.
```java
// Sửa đổi dòng này
@PreAuthorize("hasPermission(null, 'XEM_SINH_VIEN') " +
              "or hasPermission(null, 'CHINH_SUA_DIEM_DANH') " +
              "or hasPermission(null, 'QUET_QR')")
@GetMapping("/search")
public ResponseEntity<Page<SinhVienDTO>> searchWithFilters(...) { ... }
```

### 2. Lỗi UI bị ẩn do "Móc nối sai quyền" ở Sidebar
Mở file `frontend-react/src/components/layout/Sidebar.jsx` và cấu hình lại mảng MENU cho khớp 100% với tên quyền dưới DB (và các quyền mới chia nhỏ ở trên):

* **Menu Khoa:** Đổi `permission: PERMISSIONS.CAI_DAT_HE_THONG` thành `PERMISSIONS.XEM_KHOA`.
* **Menu Ngành:** Đổi thành `PERMISSIONS.XEM_NGANH`.
* **Menu Lớp:** Đổi thành `PERMISSIONS.XEM_LOP`.
* **Menu Khóa học:** Đổi thành `PERMISSIONS.XEM_KHOA_HOC`.
* **Menu Ban / Đội / CLB:** Đổi thành `PERMISSIONS.XEM_BAN` (Sau khi đã thêm quyền này ở mục II).
* **Menu Chuyên viên:** Gỡ cái alias lằng nhằng, dùng trực tiếp `PERMISSIONS.XEM_CHUYEN_VIEN`.

### 3. Lỗi load trang Điểm danh QR bị trắng
**Nguyên nhân:** Trang QR load danh sách Hoạt động để chọn. Nếu UI bắt user phải có quyền `XEM_HOAT_DONG` mới render ra danh sách thì người chỉ có quyền `QUET_QR` sẽ không làm ăn được gì.
**Cách khắc phục (Frontend & Backend):** 
1. Ở Backend, API get danh sách sự kiện đang diễn ra phải cho phép `QUET_QR` truy cập.
2. Ở Frontend, không bọc thẻ `<PermissionGate permission={PERMISSIONS.XEM_HOAT_DONG}>` ở trang quét QR.

---

## IV. CÁC TÍNH NĂNG "CHỈ QUẢN TRỊ" (ĐÃ CHUẨN - GIỮ NGUYÊN)
Các tính năng sau đây đang được bảo vệ tuyệt đối bằng cơ chế `adminOnly = true` hoặc quyền `CAI_DAT_HE_THONG` (id=4). Không ai ngoài Quản trị viên tối cao chạm vào được, bao gồm:
* Bố cục Dashboard
* Bố cục Trang News
* Hero Slider
* Tin chạy chữ
* Banner & Widget
* Biểu mẫu
* System Log
* Cấu hình Email / Chữ ký / Con dấu / Ban hành văn bản PDF

---

## V. CÁC BƯỚC THỰC THI (CHO DEVELOPER)
Khi bạn có thời gian rảnh, hãy làm theo đúng trình tự sau để không bị vỡ hệ thống:
1. **Bước 1:** Cập nhật Database (INSERT các quyền mới vào bảng `permissions`, `role_permissions` cho ADMIN).
2. **Bước 2:** Cập nhật Frontend - file `constants.js` (Thêm các constant mới khớp với DB).
3. **Bước 3:** Cập nhật Frontend - file `Sidebar.jsx` (Chỉnh lại các permission cho các menu).
4. **Bước 4:** Cập nhật Backend - nới lỏng các API dùng chung (như API Search Sinh Viên) bằng toán tử `or` (`hasPermission('A') or hasPermission('B')`).
5. **Bước 5:** Thay các Annotation `@PreAuthorize('QUAN_LY_KHOA')` cũ thành các quyền nhỏ tương ứng ở các Controller.
