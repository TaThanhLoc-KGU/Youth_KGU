import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ShieldOff } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';
import PermissionGate from './components/common/PermissionGate';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AccountManagementPage from './pages/admin/AccountManagementPage';
import DashboardStatisticsPage from './pages/admin/DashboardStatisticsPage';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import BCH from './pages/admin/BCH';
import ChucVu from './pages/admin/ChucVu';
import Ban from './pages/admin/Ban';
import Khoa from './pages/admin/Khoa';
import Nganh from './pages/admin/Nganh';
import Lop from './pages/admin/Lop';
import KhoaHoc from './pages/admin/KhoaHoc';
import GiangVien from './pages/admin/GiangVien';
import Taikhoan from './pages/admin/Taikhoan';
import SystemLogPage from './pages/admin/SystemLogPage';
import SettingsPermissionsPage from './pages/admin/SettingsPermissionsPage';
import AttendanceReport from './pages/admin/AttendanceReport';
import ChuyenVien from './pages/admin/ChuyenVien';
import SettingsPage from './pages/admin/SettingsPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentRegisterActivities from './pages/student/RegisterActivities';
import StudentMyActivities from './pages/student/MyActivities';
import StudentTrainingPoints from './pages/student/TrainingPoints';
import StudentProfile from './pages/student/Profile';
import Activities from './pages/admin/Activities';
import CreateHoatDong from './pages/HoatDong/CreateHoatDong';
import ActivityAttendancePage from './pages/admin/ActivityAttendancePage';
import StudentActivities from './pages/student/Activities';
import ForbiddenPage from './pages/ForbiddenPage';
// BCH pages
import BCHDashboard from './pages/bch/Dashboard';
import BCHActivities from './pages/bch/Activities';
import BCHAttendance from './pages/bch/Attendance';
import BCHScanQR from './pages/bch/ScanQR';

import useAuthStore from './stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from './utils/constants';

// Hiển thị inline khi người dùng gõ URL trực tiếp nhưng không có quyền
// Render TRONG layout (sidebar vẫn hiển thị) thay vì redirect 403 toàn trang
const NoPermissionMessage = ({ feature }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center px-4">
    <ShieldOff className="w-16 h-16 text-gray-300 mb-4" />
    <h2 className="text-xl font-semibold text-gray-700 mb-2">Không có quyền truy cập</h2>
    <p className="text-gray-500 max-w-sm">
      Bạn không có quyền truy cập {feature ? `chức năng "${feature}"` : 'chức năng này'}.
    </p>
    <p className="text-sm text-gray-400 mt-1">
      Vui lòng liên hệ quản trị viên để được cấp quyền.
    </p>
  </div>
);

const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">Tính năng đang được phát triển...</p>
    </div>
  </div>
);

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Không tìm thấy trang</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Quay lại
        </button>
      </div>
    </div>
  );
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Profile - tất cả người dùng đã đăng nhập */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BCH, ROLES.SINHVIEN, ROLES.GIANG_VIEN, ROLES.CHUYEN_VIEN]}>
              <MainLayout title="Hồ sơ cá nhân" />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfilePage />} />
        </Route>

        {/* Admin Routes - ADMIN role HOẶC bất kỳ ai có quyền quản trị
            ADMIN luôn pass (hasAnyPermission trả true cho ADMIN)
            GV001 (Bí thư, nhiều quyền), BCH cấp cao... cũng được vào */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute requiredPermissions={[
              PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
              PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
              PERMISSIONS.XEM_KHOA, PERMISSIONS.XEM_NGANH, PERMISSIONS.XEM_LOP, PERMISSIONS.XEM_KHOA_HOC,
              PERMISSIONS.QUAN_LY_CHUC_VU, PERMISSIONS.QUAN_LY_BAN,
              PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
              PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
              PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
            ]}>
              <MainLayout title="Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={
            <PermissionGate permission={PERMISSIONS.XEM_SINH_VIEN} fallback={<NoPermissionMessage feature="Quản lý Sinh viên" />}>
              <Students />
            </PermissionGate>
          } />
          <Route path="teachers" element={
            <PermissionGate permission={PERMISSIONS.XEM_GIANG_VIEN} fallback={<NoPermissionMessage feature="Quản lý Giảng viên" />}>
              <GiangVien />
            </PermissionGate>
          } />
          <Route path="giangvien" element={
            <PermissionGate permission={PERMISSIONS.XEM_GIANG_VIEN} fallback={<NoPermissionMessage feature="Quản lý Giảng viên" />}>
              <GiangVien />
            </PermissionGate>
          } />
          <Route path="activities" element={
            <PermissionGate permission={PERMISSIONS.XEM_HOAT_DONG} fallback={<NoPermissionMessage feature="Quản lý Hoạt động" />}>
              <Activities />
            </PermissionGate>
          } />
          <Route path="activities/create" element={
            <PermissionGate permission={PERMISSIONS.TAO_HOAT_DONG} fallback={<NoPermissionMessage feature="Tạo Hoạt động" />}>
              <CreateHoatDong />
            </PermissionGate>
          } />
          <Route path="activities/:id/attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH} fallback={<NoPermissionMessage feature="Điểm danh Hoạt động" />}>
              <ActivityAttendancePage />
            </PermissionGate>
          } />
          <Route path="bch" element={
            <PermissionGate permission={PERMISSIONS.XEM_BCH} fallback={<NoPermissionMessage feature="Ban Chấp hành" />}>
              <BCH />
            </PermissionGate>
          } />
          <Route path="chuc-vu" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CHUC_VU} fallback={<NoPermissionMessage feature="Quản lý Chức vụ" />}>
              <ChucVu />
            </PermissionGate>
          } />
          <Route path="ban" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_BAN} fallback={<NoPermissionMessage feature="Quản lý Ban/Đội/CLB" />}>
              <Ban />
            </PermissionGate>
          } />
          <Route path="khoa" element={
            <PermissionGate permission={PERMISSIONS.XEM_KHOA} fallback={<NoPermissionMessage feature="Quản lý Khoa" />}>
              <Khoa />
            </PermissionGate>
          } />
          <Route path="nganh" element={
            <PermissionGate permission={PERMISSIONS.XEM_NGANH} fallback={<NoPermissionMessage feature="Quản lý Ngành" />}>
              <Nganh />
            </PermissionGate>
          } />
          <Route path="lop" element={
            <PermissionGate permission={PERMISSIONS.XEM_LOP} fallback={<NoPermissionMessage feature="Quản lý Lớp" />}>
              <Lop />
            </PermissionGate>
          } />
          <Route path="khoahoc" element={
            <PermissionGate permission={PERMISSIONS.XEM_KHOA_HOC} fallback={<NoPermissionMessage feature="Quản lý Khóa học" />}>
              <KhoaHoc />
            </PermissionGate>
          } />
          <Route path="chuyenvien" element={
            <PermissionGate permission={PERMISSIONS.XEM_CHUYEN_VIEN} fallback={<NoPermissionMessage feature="Quản lý Chuyên viên" />}>
              <ChuyenVien />
            </PermissionGate>
          } />
          <Route path="logs" element={
            <PermissionGate permission={PERMISSIONS.XEM_SYSTEM_LOG} fallback={<NoPermissionMessage feature="System Log" />}>
              <SystemLogPage />
            </PermissionGate>
          } />
          <Route path="system-log" element={
            <PermissionGate permission={PERMISSIONS.XEM_SYSTEM_LOG} fallback={<NoPermissionMessage feature="System Log" />}>
              <SystemLogPage />
            </PermissionGate>
          } />
          <Route path="attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH} fallback={<NoPermissionMessage feature="Điểm danh" />}>
              <AttendanceReport />
            </PermissionGate>
          } />
          <Route path="certificates" element={<ComingSoon title="Quản lý Chứng nhận" />} />
          <Route path="accounts" element={
            <PermissionGate permission={PERMISSIONS.XEM_TAI_KHOAN} fallback={<NoPermissionMessage feature="Quản lý Tài khoản" />}>
              <AccountManagementPage />
            </PermissionGate>
          } />
          <Route path="account-statistics" element={
            <PermissionGate permission={PERMISSIONS.XEM_THONG_KE} fallback={<NoPermissionMessage feature="Thống kê Tài khoản" />}>
              <DashboardStatisticsPage />
            </PermissionGate>
          } />
          <Route path="settings" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM} fallback={<NoPermissionMessage feature="Cài đặt & Phân quyền" />}>
              <SettingsPermissionsPage />
            </PermissionGate>
          } />
        </Route>

        {/* Student Routes - chỉ SINH_VIEN (kể cả SINH_VIEN là BCH, vaiTro vẫn là SINH_VIEN) */}
        <Route
          path={ROUTES.STUDENT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.SINHVIEN]}>
              <MainLayout title="Student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="activities" element={<StudentActivities />} />
          <Route path="register-activities" element={<StudentRegisterActivities />} />
          <Route path="my-activities" element={<StudentMyActivities />} />
          <Route path="training-points" element={<StudentTrainingPoints />} />
          <Route path="registrations" element={<ComingSoon title="Đăng ký của tôi" />} />
          <Route path="certificates" element={<ComingSoon title="Chứng nhận" />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* BCH Routes - ai có quyền TAO_HOAT_DONG (BCH STAFF trở lên, kể cả SV là BCH) */}
        <Route
          path={ROUTES.BCH}
          element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.TAO_HOAT_DONG, PERMISSIONS.QUET_QR]}>
              <MainLayout title="BCH" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.BCH_DASHBOARD} replace />} />
          <Route path="dashboard" element={<BCHDashboard />} />
          <Route path="activities" element={<BCHActivities />} />
          <Route path="activities/create" element={<CreateHoatDong />} />
          <Route path="activities/:id/attendance" element={<ActivityAttendancePage />} />
          <Route path="attendance" element={<BCHAttendance />} />
          <Route path="scan-qr" element={<BCHScanQR />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Unauthorized / Forbidden */}
        <Route path="/unauthorized" element={<ForbiddenPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />

        {/* Home - redirect to login */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
