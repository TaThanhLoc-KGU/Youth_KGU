import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import BCH from './pages/admin/BCH';
import StudentDashboard from './pages/student/Dashboard';
import Activities from './pages/admin/Activities';
import StudentActivities from './pages/student/Activities';
import useAuthStore from './stores/authStore';
import { ROUTES, ROLES } from './utils/constants';

// Placeholder components for routes not yet implemented
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">Tính năng đang được phát triển...</p>
    </div>
  </div>
);

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />

        {/* Admin Routes */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <MainLayout title="Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<ComingSoon title="Quản lý Giảng viên" />} />
          <Route path="activities" element={<Activities />} />
          <Route path="bch" element={<BCH />} />
          <Route path="attendance" element={<ComingSoon title="Quản lý Điểm danh" />} />
          <Route path="certificates" element={<ComingSoon title="Quản lý Chứng nhận" />} />
          <Route path="statistics" element={<ComingSoon title="Thống kê" />} />
          <Route path="settings" element={<ComingSoon title="Cài đặt" />} />
        </Route>

        {/* Student Routes */}
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
          <Route path="registrations" element={<ComingSoon title="Đăng ký của tôi" />} />
          <Route path="certificates" element={<ComingSoon title="Chứng nhận" />} />
          <Route path="profile" element={<ComingSoon title="Hồ sơ" />} />
        </Route>

        {/* BCH Routes */}
        <Route
          path={ROUTES.BCH}
          element={
            <ProtectedRoute allowedRoles={[ROLES.BCH]}>
              <MainLayout title="BCH" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.BCH_DASHBOARD} replace />} />
          <Route path="dashboard" element={<ComingSoon title="BCH Dashboard" />} />
          <Route path="activities" element={<Activities />} />
          <Route path="attendance" element={<ComingSoon title="Điểm danh" />} />
          <Route path="scan-qr" element={<ComingSoon title="Quét QR" />} />
        </Route>

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
                <p className="text-xl text-gray-600 mb-8">Bạn không có quyền truy cập trang này</p>
                <a href={ROUTES.LOGIN} className="btn btn-primary">
                  Về trang đăng nhập
                </a>
              </div>
            </div>
          }
        />

        {/* 404 Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Không tìm thấy trang</p>
                <a href={ROUTES.LOGIN} className="btn btn-primary">
                  Về trang đăng nhập
                </a>
              </div>
            </div>
          }
        />

        {/* Home - redirect to login */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
