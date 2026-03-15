# Youth KGU - Activity Attendance System

## Project Overview
Youth KGU là hệ thống quản lý điểm danh hoạt động Đoàn Hội cho sinh viên KGU (Kiên Giang University). Hỗ trợ đăng ký hoạt động, điểm danh QR, theo dõi điểm rèn luyện và báo cáo thống kê.

## Tech Stack

### Backend
- **Framework:** Spring Boot 3.4.4 (Java 21)
- **Build tool:** Maven
- **Group ID:** `com.tathanhloc.youthkgu`
- **Database:** MySQL 8.0 (DB: `face_attendance_activity`)
- **ORM:** Spring Data JPA / Hibernate (MySQL8Dialect)
- **Auth:** JWT (jjwt 0.11.5) + Spring Security + OAuth2 Client
- **Notable libs:** ZXing (QR Code), Apache POI (Excel), WebSocket, SpringDoc OpenAPI, Jaffree

### Frontend
- **Framework:** React 18 + Vite 7
- **Styling:** Tailwind CSS 3
- **State:** Zustand, TanStack Query (React Query 5)
- **Routing:** React Router 6
- **Forms:** React Hook Form + Yup
- **Charts:** Chart.js, Recharts
- **Other:** Axios, Lucide React icons, React Toastify, jsqr (QR scanning)

## Project Structure

```
Youth_KGU/
├── src/main/java/com/tathanhloc/youthkgu/
│   ├── Aspect/          # AOP (LoggingAspect)
│   ├── Config/          # Spring configs (Security, CORS, JWT, WebSocket, etc.)
│   ├── Controller/      # REST controllers
│   ├── Converter/       # Enum converters
│   └── DTO/             # Data Transfer Objects
├── src/main/resources/
│   └── application.properties
├── frontend-react/
│   └── src/
│       ├── pages/
│       │   ├── admin/   # Admin pages (Dashboard, Students, Activities, BCH, etc.)
│       │   ├── bch/     # BCH pages (Dashboard, Activities, Attendance, ScanQR)
│       │   ├── student/ # Student pages (Dashboard, Activities, TrainingPoints, etc.)
│       │   └── auth/    # Login
│       ├── components/
│       │   ├── common/  # Shared UI (Button, Modal, Table, Input, etc.)
│       │   ├── admin/   # Admin-specific components
│       │   ├── layout/  # Header, Sidebar, MainLayout
│       │   └── activity/, student/, accounts/
│       └── main.jsx, App.jsx
├── docker-compose.yml   # MySQL + Backend + Frontend containers
├── Dockerfile           # Backend container
└── pom.xml
```

## Local Development

### Prerequisites
- Java 21
- Maven
- Node.js + npm
- MySQL 8.0 running on localhost:3306

### Backend
```bash
# Start backend (port 8080)
mvn spring-boot:run
```

### Frontend
```bash
cd frontend-react
npm install
npm run dev     # dev server (usually port 5173)
npm run build   # production build
npm run lint    # ESLint
```

### Docker (full stack)
```bash
docker-compose up       # Start all services
docker-compose down     # Stop all
```

## Key URLs
- **Backend API:** `http://localhost:8080`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **API Docs:** `http://localhost:8080/api-docs`
- **PhpMyAdmin (Docker):** `http://localhost:8081`
- **Frontend (Docker):** `http://localhost:3000`
- **Health Check:** `http://localhost:8080/api/health`

## Database
- **Local:** `jdbc:mysql://localhost:3306/face_attendance_activity`
  - Username: `root`, Password: (empty)
- **Docker:** username `myuser`, password `secret`
- DDL: `spring.jpa.hibernate.ddl-auto=update` (auto-creates/updates tables)

## Environment Variables (Frontend)
```
VITE_API_URL=http://localhost:8080
```

## Vietnamese Domain Naming
The codebase uses Vietnamese names extensively:
| Vietnamese | English |
|---|---|
| `HoatDong` | Activity |
| `DangKy` | Registration |
| `DiemDanh` | Attendance |
| `SinhVien` | Student |
| `GiangVien` | Lecturer |
| `BCHDoanHoi` | Youth Union Executive Committee |
| `ChucVu` | Position/Role |
| `Ban` | Sub-committee |
| `Khoa` | Faculty |
| `Lop` | Class |
| `Nganh` | Major |
| `KhoaHoc` | Academic Year |
| `HocKy` | Semester |
| `DiemRenLuyen` | Training Points |
| `ChuyenVien` | Specialist/Officer |
| `TaiKhoan` | Account |
| `ThongKe` | Statistics |
| `BaoCao` | Report |

## Roles
- **ADMIN** – Full system access
- **BCH** (Ban Chấp Hành) – Executive board, manages activities and attendance
- **SINH_VIEN** – Student, can register/view activities and training points

## Key Features
- Activity creation, registration, and QR-based attendance scanning
- Student training points (Điểm Rèn Luyện) calculation
- Excel import/export (student lists, class lists, bulk accounts)
- Activity certificates (Chứng Nhận Hoạt Động)
- Notifications and real-time WebSocket updates
- System logs with AOP aspect
- Swagger API documentation

## Testing
- Spring Boot Test + Spring Security Test
- No dedicated test command beyond `mvn test`

## Notes
- Timezone: `Asia/Ho_Chi_Minh` throughout
- Jackson date format: `yyyy-MM-dd HH:mm:ss`
- File uploads stored in `uploads/` directory (QR codes in `uploads/qrcodes`)
- Logs written to `logs/activity-attendance.log`
- The project was previously named `FaceAttendance` — some legacy references may remain
