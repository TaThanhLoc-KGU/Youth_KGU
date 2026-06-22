# Báo Cáo Tiến Độ Dự Án: Website Câu Lạc Bộ Truyền Thông & Máy Tính
*(Tài liệu bàn giao trạng thái dự án để tiếp tục phát triển)*

## 1. Mục tiêu chung
Xây dựng một Frontend riêng biệt (bằng React) cho "Câu lạc bộ Truyền thông và Máy tính" (Mã CLB: `CLB_TRUYEN_THONG`), sử dụng tone màu Light Blue. Giao diện này dùng chung Database và Backend Spring Boot hiện tại của hệ thống Youth_KGU.

---

## 2. Những việc **ĐÃ LÀM** (Hoàn thành)

### Frontend (React + Vite)
- **Khởi tạo dự án:** Tạo project React bằng Vite tại thư mục `d:\Youth_KGU\club-website`.
- **Thiết kế UI/UX:** Xây dựng hệ thống CSS hiện đại (Glassmorphism, Tone Light Blue chủ đạo, Responsive) tại `index.css`.
- **Cấu trúc trang (Pages & Routing):** 
  - Cài đặt `react-router-dom`.
  - Hoàn thiện các Layout dùng chung: `Header.jsx`, `Footer.jsx`.
  - Xây dựng giao diện trang chủ (`Home.jsx`), trang tin tức (`News.jsx`), trang danh sách thành viên (`Members.jsx`).
- **Kết nối API (Axios):** 
  - Tạo `src/services/api.js` cấu hình Base URL trỏ về `http://localhost:8080/api`.
  - Viết sẵn các hàm gọi API: `getClubNews()` và `getClubMembers()`.

### Backend (Java Spring Boot)
- **Mở rộng API Công khai (Public API):** Để trang web CLB có thể đọc dữ liệu mà không làm xáo trộn Database hiện tại, đã thêm các endpoint mới sử dụng biến `maClb`:
  - `GET /api/public/clb/{maClb}/news`: Lấy danh sách tin tức của CLB (Lọc qua trường `donViDang = Tên CLB`).
  - `GET /api/public/clb/{maClb}/members`: Lấy danh sách Ban Chủ Nhiệm đương nhiệm của CLB (Đã ẩn các thông tin nhạy cảm như email, số điện thoại).
- **Cập nhật Service & Repository:** Bổ sung phương thức `findPublishedByDonViDang` trong `TinTucRepository`, và các phương thức public lấy dữ liệu trong `TinTucService` và `BanChuNhiemCLBService`.
- **Trạng thái Code:** Đã chạy `mvn clean compile` thành công (BUILD SUCCESS).

---

## 3. Những việc **CHƯA LÀM** (Cần triển khai tiếp)

Yêu cầu gốc: *"Bên CLB thì chỉ được CLB đăng nhập thôi"*. 
Để đáp ứng yêu cầu này, cần thực hiện các hạng mục sau trên Frontend (và có thể tinh chỉnh nhẹ ở Backend nếu cần):

### 3.1. Xây dựng Tính năng Đăng nhập (Login Page)
- Tạo trang `Login.jsx` với giao diện đồng nhất (Light Blue) với các trang hiện tại.
- Xử lý Form đăng nhập: Gọi API Auth của hệ thống Youth_KGU (`POST /api/auth/login`) để nhận về JWT Token.
- Lưu trữ Token (localStorage / sessionStorage hoặc Redux/Zustand) để quản lý phiên đăng nhập.

### 3.2. Logic Phân quyền & Giới hạn Truy cập (Access Control)
- **Kiểm tra quyền hạn:** Sau khi đăng nhập thành công, cần giải mã JWT (hoặc gọi API `/api/auth/me`) để lấy thông tin User.
- **Ràng buộc CLB:** Phải kiểm tra xem tài khoản đó **có thuộc `CLB_TRUYEN_THONG` hay không**. Nếu là sinh viên bình thường hoặc người của CLB khác -> Từ chối quyền truy cập (Đăng xuất hoặc báo lỗi "Bạn không có quyền truy cập trang quản trị của CLB này").
- **Bảo vệ Route (Protected Routes):** Tạo component `<ProtectedRoute />` trong React Router để bọc các trang nhạy cảm (Ví dụ: Trang quản trị nội bộ CLB). Nếu chưa đăng nhập, tự động Redirect về trang chủ hoặc trang Login.

### 3.3. Các tính năng nội bộ (Tùy chọn mở rộng)
- Dựa trên việc đăng nhập thành công, có thể phát triển thêm Dashboard riêng cho CLB trên Frontend này: Cho phép Ban chủ nhiệm đăng bài tin tức mới, duyệt thành viên... thay vì phải dùng cổng hệ thống chung của trường.

---
> [!TIP]
> **Hướng dẫn cho Gemini phiên tiếp theo:**
> Hãy bắt đầu bằng việc đọc file `src/services/api.js` và `src/App.jsx` trong thư mục `club-website`. Sau đó tiến hành tạo `Login.jsx` và cài đặt logic xác thực JWT (Mục 3.1 và 3.2).
