# Youth KGU Frontend - React SPA

Frontend ứng dụng quản lý hoạt động Đoàn - Hội sinh viên, xây dựng với React + Vite.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Chart.js** - Data visualization
- **Lucide React** - Icons
- **React Toastify** - Notifications

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm hoặc yarn
- Backend API chạy tại `http://localhost:8080`

## 🛠️ Installation

1. Clone repository và di chuyển vào thư mục frontend:

```bash
cd frontend-react
```

2. Cài đặt dependencies:

```bash
npm install
# hoặc
yarn install
```

3. Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

4. Cấu hình biến môi trường trong `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=Youth KGU
VITE_APP_VERSION=1.0.0
```

## 🎯 Development

Chạy development server:

```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 🏗️ Build

Build cho production:

```bash
npm run build
# hoặc
yarn build
```

Preview production build:

```bash
npm run preview
# hoặc
yarn preview
```

## 📁 Project Structure

```
frontend-react/
├── public/              # Static files
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable components
│   │   ├── common/     # Common components
│   │   ├── layout/     # Layout components
│   │   ├── admin/      # Admin-specific components
│   │   ├── student/    # Student-specific components
│   │   └── lecturer/   # Lecturer-specific components
│   ├── context/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   │   ├── auth/       # Authentication pages
│   │   ├── admin/      # Admin pages
│   │   ├── student/    # Student pages
│   │   └── lecturer/   # Lecturer pages
│   ├── services/       # API services
│   ├── stores/         # Zustand stores
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions & constants
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── .env.example        # Environment variables template
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🔐 Authentication

Ứng dụng sử dụng JWT để xác thực:

- Access token được lưu trong `localStorage`
- Refresh token tự động khi access token hết hạn
- Protected routes dựa trên roles: `ADMIN`, `BCH`, `SINHVIEN`

### Đăng nhập mẫu:

- **Admin**: `admin` / `admin123`
- **BCH**: `bch01` / `bch123`
- **Sinh viên**: `sv001` / `sv123`

## 🎨 UI Components

### Common Components

- `Loading` - Loading spinner
- `ErrorBoundary` - Error boundary wrapper
- `ProtectedRoute` - Route protection based on roles
- `Sidebar` - Navigation sidebar
- `Header` - Top header bar

### Form Components

- Text input
- Select dropdown
- Date picker
- File upload
- Checkbox/Radio

## 📊 State Management

### Zustand Stores

- `authStore` - Authentication state
  - User info
  - Login/logout
  - Token management
  - Role checking

### React Query

Sử dụng cho server state management:

- Automatic caching
- Background refetching
- Optimistic updates
- Pagination support

## 🌐 API Services

### Available Services

- `authService` - Authentication
- `studentService` - Student management
- `activityService` - Activity management
- `attendanceService` - Attendance tracking
- `certificateService` - Certificate management

## 🎯 Features

### Admin

- Dashboard với thống kê tổng quan
- Quản lý sinh viên (CRUD)
- Quản lý giảng viên (CRUD)
- Quản lý hoạt động (CRUD)
- Quản lý BCH Đoàn - Hội
- Quản lý điểm danh
- Quản lý chứng nhận
- Thống kê và báo cáo

### BCH (Ban Chấp Hành)

- Dashboard BCH
- Quản lý hoạt động
- Điểm danh QR code
- Xem thống kê

### Sinh viên

- Dashboard sinh viên
- Xem danh sách hoạt động
- Đăng ký hoạt động
- Xem chứng nhận
- Quản lý hồ sơ cá nhân

## 🔧 Configuration

### Tailwind CSS

Tùy chỉnh theme trong `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#1c6681',
        // ...
      },
    },
  },
}
```

### Vite Proxy

API proxy được cấu hình trong `vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

## 📱 Responsive Design

Ứng dụng responsive trên các thiết bị:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🐛 Debugging

### React Developer Tools

Cài đặt extension:

- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Redux DevTools (cho Zustand)

Zustand đã tích hợp Redux DevTools để debug state.

## 📝 Code Style

Project sử dụng ESLint để đảm bảo code quality:

```bash
npm run lint
# hoặc
yarn lint
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License

## 👥 Authors

- Ta Thanh Loc

## 🙏 Acknowledgments

- React team
- Vite team
- All contributors

## 📞 Support

For support, email tathanhloc@example.com or create an issue in the repository.
