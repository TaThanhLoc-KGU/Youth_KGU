<div align="center">

# 🎓 Youth KGU — Hệ Thống Quản Lý Hoạt Động Đoàn - Hội

**Hệ thống điểm danh & quản lý hoạt động Đoàn Thanh niên — Hội Sinh viên**
Trường Đại học Kiên Giang

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://react.dev)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com)
[![Vite](https://img.shields.io/badge/Vite-7.3-purple?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Cấu Hình](#-cấu-hình)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Tài Khoản Mặc Định](#-tài-khoản-mặc-định)
- [API Documentation](#-api-documentation)
- [Phân Quyền Hệ Thống](#-phân-quyền-hệ-thống)
- [Bản Quyền](#-bản-quyền)

---

## 🌟 Giới Thiệu

**Youth KGU** là hệ thống quản lý hoạt động Đoàn Thanh niên – Hội Sinh viên được xây dựng dành riêng cho Trường Đại học Kiên Giang. Hệ thống giải quyết toàn bộ quy trình từ lên kế hoạch, tổ chức đến điểm danh và thống kê hoạt động một cách tự động, minh bạch và hiệu quả.

Thay vì điểm danh thủ công bằng giấy tờ, hệ thống sử dụng **mã QR cá nhân** để sinh viên tự check-in/check-out. Mọi dữ liệu được lưu trữ tập trung, hỗ trợ xuất báo cáo Excel và hiển thị thống kê trực quan qua biểu đồ.

### Vấn Đề Giải Quyết

| Trước khi có hệ thống | Sau khi có hệ thống |
|---|---|
| Điểm danh bằng bút tay, mất thời gian | Quét QR tức thì, tự động ghi nhận |
| Không kiểm soát được số lượng đăng ký | Giới hạn đăng ký, quản lý chỗ trống |
| Thống kê thủ công, hay sai sót | Biểu đồ & báo cáo tự động |
| Thông báo qua nhóm chat, dễ bỏ lỡ | Hệ thống thông báo tích hợp, real-time |
| Không theo dõi được điểm rèn luyện | Tích điểm rèn luyện tự động theo tiêu chí |

---

## ✨ Tính Năng Nổi Bật

### 🎯 Quản Lý Hoạt Động
- Tạo, chỉnh sửa, xóa mềm hoạt động với đầy đủ thông tin (địa điểm, thời gian, số lượng)
- Quản lý vòng đời: **Sắp diễn ra → Mở đăng ký → Đang diễn ra → Hoàn thành / Hủy**
- Phân loại theo loại hoạt động, cấp độ, khoa, năm học, học kỳ
- Kết thúc sớm với ghi nhận thời gian thực tế

### 📲 Điểm Danh Bằng Mã QR
- Tự động sinh mã QR cá nhân khi sinh viên đăng ký
- Quét QR check-in & check-out với kiểm tra vị trí (GPS radius)
- Phát hiện đi trễ theo ngưỡng cấu hình từng hoạt động
- Điểm danh thủ công cho trường hợp đặc biệt
- Cửa sổ checkout linh hoạt theo thời gian kết thúc

### 📊 Thống Kê & Báo Cáo
- Dashboard tổng quan với biểu đồ xu hướng 12 tháng
- Thống kê tham gia theo khoa, top hoạt động, top sinh viên
- Xuất báo cáo Excel: báo cáo tháng, quý, toàn bộ hoạt động
- Breakdown tham gia theo từng đoàn khoa

### 🔔 Hệ Thống Thông Báo
- Thông báo real-time qua Server-Sent Events (SSE)
- Tự động gửi khi mở đăng ký, hoàn thành, hủy hoạt động
- Nhắc nhở tự động hàng ngày lúc 7:00 cho hoạt động ngày mai
- Dọn dẹp tự động thông báo cũ hơn 30 ngày

### 👥 Quản Lý Người Dùng
- Đăng ký tài khoản với phê duyệt (ADMIN, BCH, Sinh viên)
- Tạo hàng loạt tài khoản từ file Excel
- Phân quyền chi tiết (58+ quyền đơn lẻ)
- Quản lý BCH Đoàn - Hội theo chức vụ, ban

### 🎓 Điểm Rèn Luyện
- Cấu hình tiêu chí điểm rèn luyện theo từng loại hoạt động
- Tự động tích điểm khi hoàn thành điểm danh
- Tra cứu lịch sử tham gia và điểm của sinh viên
- Cấp chứng nhận tham gia hoạt động

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│              React 18 + Vite + Tailwind CSS                 │
│     (Zustand · React Query · React Router · Recharts)       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST + SSE
                          │ JWT Bearer Token
┌─────────────────────────▼───────────────────────────────────┐
│                  SPRING BOOT 3.4.4 (port 8080)              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │Controllers│  │ Services │  │Repositories│  │ Security │  │
│  │ 36 REST  │  │Business  │  │Spring Data│  │JWT + RBAC│  │
│  │ endpoints│  │  Logic   │  │    JPA    │  │58 perms  │  │
│  └──────────┘  └──────────┘  └─────┬─────┘  └──────────┘  │
│                                    │                        │
│  ┌──────────┐  ┌──────────┐        │                        │
│  │  QR Code │  │  Excel   │        │                        │
│  │  ZXing   │  │ Apache   │        │                        │
│  │          │  │   POI    │        │                        │
│  └──────────┘  └──────────┘        │                        │
└────────────────────────────────────┼────────────────────────┘
                                     │ JDBC
                          ┌──────────▼──────────┐
                          │     MySQL 8.0        │
                          │ face_attendance_     │
                          │     activity         │
                          └─────────────────────┘
```

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Java | 21 | Ngôn ngữ lập trình |
| Spring Boot | 3.4.4 | Framework chính |
| Spring Security | 6.x | Bảo mật, JWT |
| Spring Data JPA | 3.x | ORM, truy vấn DB |
| MySQL | 8.0 | Cơ sở dữ liệu |
| JJWT | 0.12.6 | JSON Web Token |
| Apache POI | 5.x | Xuất/nhập Excel |
| ZXing | 3.5 | Tạo/đọc mã QR |
| SpringDoc OpenAPI | 2.x | Swagger UI |
| Lombok | 1.x | Giảm boilerplate code |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.2.0 | UI Framework |
| Vite | 7.3.1 | Build tool |
| React Router | 6.22.0 | Client-side routing |
| Zustand | 4.5.0 | State management |
| React Query | 5.28.0 | Server state & caching |
| Axios | 1.6.7 | HTTP client |
| Tailwind CSS | 3.4.1 | CSS Framework |
| Recharts | 3.3.0 | Biểu đồ thống kê |
| React Hook Form | 7.50.0 | Quản lý form |
| React Toastify | 10.0.4 | Thông báo Toast |
| Lucide React | 0.323.0 | Icon library |

---

## 💻 Yêu Cầu Hệ Thống

| Thành phần | Yêu cầu tối thiểu |
|---|---|
| **JDK** | Java 21 trở lên |
| **Node.js** | 18.x trở lên |
| **npm** | 9.x trở lên |
| **MySQL** | 8.0 trở lên |
| **Maven** | 3.8+ (hoặc dùng `mvnw` đính kèm) |
| **RAM** | 4 GB trở lên |
| **OS** | Windows 10/11, macOS, Linux |

---

## 📦 Hướng Dẫn Cài Đặt

### Bước 1 — Clone Repository

```bash
git clone https://github.com/tathanhloc/Youth-KGU.git
cd Youth-KGU
```

### Bước 2 — Tạo Cơ Sở Dữ Liệu

Mở MySQL client (MySQL Workbench, DBeaver, hoặc terminal) và chạy:

```sql
CREATE DATABASE face_attendance_activity
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

> Hibernate sẽ tự động tạo bảng khi chạy ứng dụng lần đầu (`spring.jpa.hibernate.ddl-auto=update`).

### Bước 3 — Cấu Hình Backend

Mở file `src/main/resources/application.properties` và chỉnh sửa:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/face_attendance_activity?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

# JWT Secret (thay bằng chuỗi ngẫu nhiên dài ≥ 256 bit)
app.jwt.secret=your-very-long-secret-key-at-least-256-bits-long

# Mail (nếu dùng tính năng gửi email)
spring.mail.host=smtp.gmail.com
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### Bước 4 — Cài Đặt Frontend

```bash
cd frontend-react
npm install
```

Tạo file `.env.local` trong thư mục `frontend-react/`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## ⚙️ Cấu Hình

### Biến Môi Trường Backend (`application.properties`)

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/face_attendance_activity
spring.datasource.username=root
spring.datasource.password=

# JWT
app.jwt.secret=YourSecretKey
app.jwt.expiration=86400000       # 24 giờ (ms)
app.jwt.refresh-expiration=604800000  # 7 ngày (ms)

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# QR Code
app.qrcode.storage-path=uploads/qrcodes
app.qrcode.width=300
app.qrcode.height=300
```

### Biến Môi Trường Frontend (`.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 🚀 Chạy Ứng Dụng

### Khởi động Backend

```bash
# Dùng Maven Wrapper (không cần cài Maven riêng)
./mvnw spring-boot:run

# Hoặc build trước rồi chạy
./mvnw clean package -DskipTests
java -jar target/youth-kgu-0.0.1-SNAPSHOT.jar
```

Backend sẽ chạy tại: **http://localhost:8080**

### Khởi động Frontend

```bash
cd frontend-react
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000** (hoặc port Vite tự chọn)

### Build Production

```bash
# Backend
./mvnw clean package -DskipTests

# Frontend
cd frontend-react
npm run build
# Kết quả trong thư mục dist/
```

---

## 📁 Cấu Trúc Dự Án

```
Youth-KGU/
├── 📂 src/main/java/com/tathanhloc/faceattendance/
│   ├── Aspect/              # AOP Logging
│   ├── Config/              # Security, WebSocket, Mail, OpenAPI config
│   ├── Controller/          # 36 REST Controllers
│   │   ├── AuthController          # Đăng nhập, đăng ký
│   │   ├── HoatDongController      # Quản lý hoạt động
│   │   ├── DiemDanhHoatDongController  # Điểm danh QR
│   │   ├── SinhVienController      # Sinh viên
│   │   ├── NotificationController  # Thông báo
│   │   ├── ThongKeController       # Thống kê
│   │   ├── BaoCaoController        # Báo cáo & xuất Excel
│   │   └── ...
│   ├── DTO/                 # Data Transfer Objects
│   ├── Enum/                # Enums (TrangThai, VaiTro, CapDo...)
│   ├── Model/               # JPA Entities (20+ bảng)
│   ├── Repository/          # Spring Data JPA Repositories
│   ├── Security/            # JWT Filter, UserDetails
│   ├── Service/             # Business Logic (35+ services)
│   └── Util/                # Tiện ích (QR, Calendar...)
│
├── 📂 src/main/resources/
│   ├── application.properties   # Cấu hình chính
│   └── static/                  # Static files
│
├── 📂 frontend-react/
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── common/          # ProtectedRoute, Modal, Table...
│   │   │   └── layout/          # Header, Sidebar, MainLayout
│   │   ├── pages/               # Trang theo vai trò
│   │   │   ├── admin/           # 20 trang quản trị
│   │   │   ├── student/         # 5 trang sinh viên
│   │   │   ├── bch/             # 5 trang BCH
│   │   │   └── auth/            # Login, Register
│   │   ├── services/            # API Services (25+ files)
│   │   ├── stores/              # Zustand stores
│   │   └── utils/               # Constants, helpers
│   ├── .env.local               # Biến môi trường local
│   └── package.json
│
├── 📂 uploads/
│   └── qrcodes/             # QR codes sinh viên
├── 📂 logs/                 # Application logs
└── README.md
```

---

## 🔑 Tài Khoản Mặc Định

Khi khởi động lần đầu, hệ thống tự tạo tài khoản ADMIN:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền |
|---|---|---|---|
| **Admin** | `admin` | `admin@123` | Toàn quyền hệ thống |

> ⚠️ **Lưu ý bảo mật**: Đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên trên môi trường production.

---

## 📖 API Documentation

Sau khi khởi động backend, truy cập Swagger UI để xem toàn bộ API:

```
http://localhost:8080/swagger-ui.html
```

Một số endpoint chính:

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/register` | Đăng ký |
| `GET` | `/api/hoat-dong` | Danh sách hoạt động |
| `POST` | `/api/diem-danh/scan` | Quét QR điểm danh |
| `GET` | `/api/notifications` | Lấy thông báo |
| `GET` | `/api/baocao/dashboard` | Dashboard thống kê |
| `GET` | `/api/baocao/xuat/thang` | Xuất báo cáo tháng Excel |
| `GET` | `/api/thong-ke/top-students` | Top sinh viên tích cực |

---

## 🔐 Phân Quyền Hệ Thống

Hệ thống có **4 vai trò** chính và **58 quyền** chi tiết:

| Vai trò | Ký hiệu | Mô tả |
|---|---|---|
| **Quản trị viên** | `ADMIN` | Toàn quyền hệ thống |
| **Ban Cán Hành** | `BCH` | Quản lý hoạt động, điểm danh |
| **Sinh viên** | `SINH_VIEN` | Đăng ký, xem lịch sử cá nhân |
| **Giảng viên** | `GIANG_VIEN` | Xem thông tin, hồ sơ |
| **Chuyên viên** | `CHUYEN_VIEN` | Hỗ trợ quản lý hành chính |

Các nhóm quyền bao gồm: `HE_THONG`, `SINH_VIEN`, `GIANG_VIEN`, `HOAT_DONG`, `DIEM_DANH`, `BCH`, `TAI_KHOAN`, `PHAN_QUYEN`, `BAO_CAO`, `TO_CHUC`.

---

## 🐛 Xử Lý Sự Cố Thường Gặp

**1. Lỗi kết nối Database**
```
Failed to obtain JDBC Connection
```
→ Kiểm tra MySQL đang chạy, đúng host/port/credentials trong `application.properties`.

**2. Frontend không kết nối được Backend**
```
ERR_CONNECTION_REFUSED
```
→ Đảm bảo `VITE_API_BASE_URL` trong `.env.local` trỏ đúng địa chỉ backend.

**3. Lỗi CORS**
→ Kiểm tra `CorsConfig.java` cho phép origin của frontend.

**4. JWT expired**
→ Token sẽ tự làm mới qua refresh token. Nếu không, đăng nhập lại.

**5. Port 8080 bị chiếm**
→ Đổi `server.port` trong `application.properties`.

---

## 📄 Bản Quyền

```
Copyright © 2025 Tạ Thành Lộc. All rights reserved.

Dự án này được phát triển bởi Tạ Thành Lộc như một hệ thống quản lý
hoạt động Đoàn – Hội dành cho Trường Đại học Kiên Giang.

Mọi hành vi sao chép, phân phối hoặc sử dụng lại mã nguồn mà không có
sự cho phép bằng văn bản của tác giả đều bị nghiêm cấm.
```

---

<div align="center">

**Phát triển bởi [Tạ Thành Lộc](https://github.com/tathanhloc)**
Trường Đại học Kiên Giang — 2025
## *Câu lạc bộ Truyền thông và Máy tính - KCMC*
*"Đổi mới công nghệ, phục vụ cộng đồng, Cống hiến sức trẻ", "Tiên phong công nghệ - Gói trọn sức trẻ - Lan tỏa giá trị"*

</div>
