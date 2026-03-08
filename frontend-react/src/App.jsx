import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { ShieldOff } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';
import PermissionGate from './components/common/PermissionGate';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Loading from './components/common/Loading';
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
import PermissionMatrixPage from './pages/admin/PermissionMatrixPage';
import AttendanceReport from './pages/admin/AttendanceReport';
import ChuyenVien from './pages/admin/ChuyenVien';
import SettingsPage from './pages/admin/SettingsPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentRegisterActivities from './pages/student/RegisterActivities';
import StudentMyActivities from './pages/student/MyActivities';
import StudentTrainingPoints from './pages/student/TrainingPoints';
import StudentProfile from './pages/student/Profile';
import Activities from './pages/admin/Activities';
import HoatDongEditorPage from './pages/HoatDong/HoatDongEditorPage';
import ActivityAttendancePage from './pages/admin/ActivityAttendancePage';
import StudentActivities from './pages/student/Activities';
import ForbiddenPage from './pages/ForbiddenPage';
// BCH pages
import BCHDashboard from './pages/bch/Dashboard';
import BCHActivities from './pages/bch/Activities';
import BCHAttendance from './pages/bch/Attendance';
import BCHScanQR from './pages/bch/ScanQR';
// eNews — layout
import NewsLayout from './components/news/layout/NewsLayout';
// eNews — public pages
import NewsHomePage from './pages/news/NewsHomePage';
import VanBanListPage from './pages/news/VanBanListPage';
import NewsResolver from './components/news/public/NewsResolver';
// eNews — admin manage pages
import AdminTinTucManage from './pages/admin/news/TinTucManage';
import AdminVanBanManage from './pages/admin/news/VanBanManage';
import AdminChuyenMucManage from './pages/admin/news/ChuyenMucManage';
// eNews — BCH manage pages
import BCHTinTucManage from './pages/bch/news/TinTucManage';
import BCHVanBanManage from './pages/bch/news/VanBanManage';
// eNews — shared editor page
import TinTucEditorPage from './pages/news/TinTucEditorPage';
// Dashboard layout editor
import LayoutEditorPage from './pages/admin/LayoutEditorPage';
// News page layout editor
import NewsLayoutEditorPage from './pages/admin/NewsLayoutEditorPage';
// Content managers
import SliderManagerPage    from './pages/admin/SliderManagerPage';
import TickerManagerPage    from './pages/admin/TickerManagerPage';
import AdBannerManagerPage  from './pages/admin/AdBannerManagerPage';
import BieuMauManagePage    from './pages/admin/BieuMauManagePage';

import useAuthStore from './stores/authStore';
import useSessionTimeout from './hooks/useSessionTimeout';
import { ROUTES, ROLES, PERMISSIONS } from './utils/constants';

/** Component không render gì — chỉ chạy hook theo dõi session timeout */
const SessionTimeoutWatcher = () => {
  useSessionTimeout();
  return null;
};

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

// Quyền mở khóa trang quản trị (đồng bộ với Login.jsx)
const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
  // eNews
  PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
  PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
];



function App() {
  const { checkAuth, refreshPermissions, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    const auth = checkAuth();
    if (auth) {
      refreshPermissions().catch(() => {});
    }
  }, []);

  return (
    <ErrorBoundary>
      {/* Hiển thị loading toàn màn hình khi đang xử lý đăng nhập/đăng xuất */}
      {isAuthLoading && <Loading fullScreen text="Đang xử lý..." />}
      
      {/* Theo dõi session timeout 1 giờ — không render gì */}
      <SessionTimeoutWatcher />
      
      <Suspense fallback={<Loading fullScreen text="Đang tải dữ liệu..." />}>
        <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Profile — mọi user đã đăng nhập, KHÔNG kiểm tra role hay permission (VẤN ĐỀ 3)
            Đây là quyền cứng không thể bị thu hồi */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
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
              // eNews
              PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
              PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
            ]}>
              <MainLayout title="Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={
            <PermissionGate permission={PERMISSIONS.XEM_SINH_VIEN}>
              <Students />
            </PermissionGate>
          } />
          <Route path="teachers" element={
            <PermissionGate permission={PERMISSIONS.XEM_GIANG_VIEN}>
              <GiangVien />
            </PermissionGate>
          } />
          <Route path="giangvien" element={
            <PermissionGate permission={PERMISSIONS.XEM_GIANG_VIEN}>
              <GiangVien />
            </PermissionGate>
          } />
          <Route path="activities" element={
            <PermissionGate permission={PERMISSIONS.XEM_HOAT_DONG}>
              <Activities />
            </PermissionGate>
          } />
          <Route path="activities/create" element={
            <PermissionGate permission={PERMISSIONS.TAO_HOAT_DONG}>
              <HoatDongEditorPage backPath="/admin/activities" />
            </PermissionGate>
          } />
          <Route path="activities/:id/edit" element={
            <PermissionGate permission={PERMISSIONS.SUA_HOAT_DONG}>
              <HoatDongEditorPage backPath="/admin/activities" />
            </PermissionGate>
          } />
          <Route path="activities/:id/attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH}>
              <ActivityAttendancePage />
            </PermissionGate>
          } />
          <Route path="bch" element={
            <PermissionGate permission={PERMISSIONS.XEM_BCH}>
              <BCH />
            </PermissionGate>
          } />
          <Route path="chuc-vu" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CHUC_VU}>
              <ChucVu />
            </PermissionGate>
          } />
          <Route path="ban" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_BAN}>
              <Ban />
            </PermissionGate>
          } />
          <Route path="khoa" element={
            <PermissionGate permission={PERMISSIONS.XEM_KHOA}>
              <Khoa />
            </PermissionGate>
          } />
          <Route path="nganh" element={
            <PermissionGate permission={PERMISSIONS.XEM_NGANH}>
              <Nganh />
            </PermissionGate>
          } />
          <Route path="lop" element={
            <PermissionGate permission={PERMISSIONS.XEM_LOP}>
              <Lop />
            </PermissionGate>
          } />
          <Route path="khoahoc" element={
            <PermissionGate permission={PERMISSIONS.XEM_KHOA_HOC}>
              <KhoaHoc />
            </PermissionGate>
          } />
          <Route path="chuyenvien" element={
            <PermissionGate permission={PERMISSIONS.XEM_CHUYEN_VIEN}>
              <ChuyenVien />
            </PermissionGate>
          } />
          <Route path="logs" element={
            <PermissionGate permission={PERMISSIONS.XEM_SYSTEM_LOG}>
              <SystemLogPage />
            </PermissionGate>
          } />
          <Route path="system-log" element={
            <PermissionGate permission={PERMISSIONS.XEM_SYSTEM_LOG}>
              <SystemLogPage />
            </PermissionGate>
          } />
          <Route path="attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH}>
              <AttendanceReport />
            </PermissionGate>
          } />
          <Route path="certificates" element={<ComingSoon title="Quản lý Chứng nhận" />} />
          <Route path="accounts" element={
            <PermissionGate permission={PERMISSIONS.XEM_TAI_KHOAN}>
              <AccountManagementPage />
            </PermissionGate>
          } />
          <Route path="account-statistics" element={
            <PermissionGate permission={PERMISSIONS.XEM_THONG_KE}>
              <DashboardStatisticsPage />
            </PermissionGate>
          } />
          <Route path="settings" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM}>
              <SettingsPermissionsPage />
            </PermissionGate>
          } />
          {/* Phân quyền BCH theo Level — Bí thư Level 1 cũng truy cập được */}
          <Route path="phan-quyen" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM}>
              <PermissionMatrixPage />
            </PermissionGate>
          } />
          {/* eNews admin routes */}
          <Route path="news" element={
            <PermissionGate permission={PERMISSIONS.DANG_TIN_TUC}>
              <AdminTinTucManage />
            </PermissionGate>
          } />
          <Route path="news/create" element={
            <PermissionGate permission={PERMISSIONS.DANG_TIN_TUC}>
              <TinTucEditorPage backPath="/admin/news" basePath="/admin/news" />
            </PermissionGate>
          } />
          <Route path="news/:id/edit" element={
            <PermissionGate permission={PERMISSIONS.SUA_TIN_TUC}>
              <TinTucEditorPage backPath="/admin/news" basePath="/admin/news" />
            </PermissionGate>
          } />
          <Route path="van-ban" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_VAN_BAN}>
              <AdminVanBanManage />
            </PermissionGate>
          } />
          <Route path="chuyen-muc" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CHUYEN_MUC}>
              <AdminChuyenMucManage />
            </PermissionGate>
          } />
          {/* Layout editor — admin only, no sidebar */}
          <Route path="layout-editor" element={<LayoutEditorPage />} />
          {/* News page layout editor — admin only, no sidebar */}
          <Route path="news-layout-editor" element={<NewsLayoutEditorPage />} />
          {/* Content managers */}
          <Route path="slider-manager"    element={<SliderManagerPage />} />
          <Route path="ticker-manager"    element={<TickerManagerPage />} />
          <Route path="ad-banner-manager" element={<AdBannerManagerPage />} />
          <Route path="bieu-mau"          element={<BieuMauManagePage />} />
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
          {/* VẤN ĐỀ 4: /student/profile redirect về /profile duy nhất */}
          <Route path="profile" element={<Navigate to={ROUTES.PROFILE} replace />} />
        </Route>

        {/* BCH Routes - ai có quyền TAO_HOAT_DONG (BCH STAFF trở lên, kể cả SV là BCH) */}
        <Route
          path={ROUTES.BCH}
          element={
            <ProtectedRoute requiredPermissions={[
              PERMISSIONS.TAO_HOAT_DONG, PERMISSIONS.QUET_QR,
              PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.QUAN_LY_VAN_BAN,
            ]}>
              <MainLayout title="BCH" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.BCH_DASHBOARD} replace />} />
          <Route path="dashboard" element={<BCHDashboard />} />
          <Route path="activities" element={<BCHActivities />} />
          <Route path="activities/create" element={<HoatDongEditorPage backPath="/bch/activities" />} />
          <Route path="activities/:id/edit" element={<HoatDongEditorPage backPath="/bch/activities" />} />
          <Route path="activities/:id/attendance" element={<ActivityAttendancePage />} />
          <Route path="attendance" element={<BCHAttendance />} />
          <Route path="scan-qr" element={<BCHScanQR />} />
          {/* eNews BCH routes */}
          <Route path="news" element={
            <PermissionGate permission={PERMISSIONS.DANG_TIN_TUC}>
              <BCHTinTucManage />
            </PermissionGate>
          } />
          <Route path="news/create" element={
            <PermissionGate permission={PERMISSIONS.DANG_TIN_TUC}>
              <TinTucEditorPage backPath="/bch/news" basePath="/bch/news" />
            </PermissionGate>
          } />
          <Route path="news/:id/edit" element={
            <PermissionGate permission={PERMISSIONS.SUA_TIN_TUC}>
              <TinTucEditorPage backPath="/bch/news" basePath="/bch/news" />
            </PermissionGate>
          } />
          <Route path="van-ban" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_VAN_BAN}>
              <BCHVanBanManage />
            </PermissionGate>
          } />
          {/* Phân quyền theo Level — dành cho Bí thư (Level 1) */}
          <Route path="phan-quyen" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM}>
              <PermissionMatrixPage />
            </PermissionGate>
          } />
          <Route path="profile" element={<Navigate to={ROUTES.PROFILE} replace />} />
        </Route>

        {/* Unauthorized / Forbidden */}
        <Route path="/unauthorized" element={<ForbiddenPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* eNews — Trang chủ và các trang công khai đặt tại gốc / */}
        <Route path="/" element={<NewsLayout />}>
          <Route index element={<NewsHomePage />} />
          <Route path="news" element={<Navigate to="/" replace />} />
          <Route path="van-ban" element={<VanBanListPage />} />
          {/* Catch-all cho các URL động của tin tức (slug chuyên mục/bài viết) */}
          <Route path="*" element={<NewsResolver />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
