import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import PermissionGate from './components/common/PermissionGate';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import MaintenanceBanner from './components/layout/MaintenanceBanner';
import TnDeThiListPage from './pages/admin/tn/TnDeThiListPage';
import TnDeThiFormPage from './pages/admin/tn/TnDeThiFormPage';
import TnCauHoiBankPage from './pages/admin/tn/TnCauHoiBankPage';
import TnDanhSachDeThi from './pages/student/tn/TnDanhSachDeThi';
import TnLamBaiPage from './pages/student/tn/TnLamBaiPage';
import TnKetQuaPage from './pages/student/tn/TnKetQuaPage';
import AdminHubPage from './pages/admin/AdminHubPage';
import StudentLayout from './components/layout/StudentLayout';
import Loading from './components/common/Loading';
import Login from './pages/auth/Login';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import RegisterPage from './pages/RegisterPage';
import MustChangePasswordGuard from './components/common/MustChangePasswordGuard';
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
import PermissionMatrixPage from './pages/admin/PermissionMatrixPage';
import AttendanceReport from './pages/admin/AttendanceReport';
import ChuyenVien from './pages/admin/ChuyenVien';
import StudentDashboard from './pages/student/Dashboard';
import StudentRegisterActivities from './pages/student/RegisterActivities';
import StudentMyActivities from './pages/student/MyActivities';
import StudentTrainingPoints from './pages/student/TrainingPoints';
import StudentProfile from './pages/student/Profile';
import StudentContests from './pages/student/Contests';
import Activities from './pages/admin/Activities';
import HoatDongEditorPage from './pages/HoatDong/HoatDongEditorPage';
import ActivityAttendancePage from './pages/admin/ActivityAttendancePage';
import DoanVienKhoaPage from './pages/admin/DoanVienKhoaPage';
import HoatDongListPage from './pages/admin/HoatDongListPage';
import StudentActivities from './pages/student/Activities';
import ForbiddenPage from './pages/ForbiddenPage';
// BCH pages
import BCHDashboard from './pages/bch/Dashboard';
import BCHActivities from './pages/bch/Activities';
import BCHAttendance from './pages/bch/Attendance';
import BCHScanQR from './pages/bch/ScanQR';
import AttendanceSelectionPage from './pages/bch/AttendanceSelectionPage';
// eNews — layout
import NewsLayout from './components/news/layout/NewsLayout';
// eNews — public pages
import NewsHomePage from './pages/news/NewsHomePage';
import VanBanListPage from './pages/news/VanBanListPage';
import BieuMauListPage from './pages/news/BieuMauListPage';
import HoatDongPublicPage from './pages/news/HoatDongPublicPage';
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
// Cuộc thi & Bình chọn
import CuocThiManagePage    from './pages/admin/CuocThiManagePage';
import BinhChonListPage     from './pages/news/BinhChonListPage';
import BinhChonDetailPage   from './pages/news/BinhChonDetailPage';
import ThiSinhDetailPage    from './pages/news/ThiSinhDetailPage';
// Ký số
import ChuKyManagePage      from './pages/admin/ChuKyManagePage';
import ConDauManagePage     from './pages/admin/ConDauManagePage';
import KySoLichSuPage       from './pages/admin/KySoLichSuPage';
// Thùng thư góp ý
import GopYPage             from './pages/news/GopYPage';
import GopYManagePage       from './pages/admin/GopYManagePage';
import EmailBroadcastPage   from './pages/admin/EmailBroadcastPage';
// Email config
import EmailConfigPage      from './pages/admin/EmailConfigPage';
import SystemSettingsPage   from './pages/admin/SystemSettingsPage';
import ZaloDebugPage        from './pages/admin/ZaloDebugPage';
// Ban hành public
import BanHanhPublicPage    from './pages/public/BanHanhPublicPage';
import DanhSachBanHanhListPage from './pages/news/DanhSachBanHanhListPage';
// Ban hành admin
import AdminBanHanhPage     from './pages/admin/AdminBanHanhPage';
import VanPhongPage         from './pages/admin/VanPhongPage';
import NamHocPage           from './pages/admin/NamHocPage';
import DiemRenLuyenManagePage from './pages/admin/DiemRenLuyenManagePage';
import CauLacBoPage        from './pages/admin/CauLacBoPage';
import ClbPortalPage       from './pages/clb/ClbPortalPage';
import ClbRegistrationPage from './pages/student/ClbRegistrationPage';
import SelfAttendanceScanner from './components/student/SelfAttendanceScanner';
import ChungNhanPage       from './pages/admin/ChungNhanPage';
import ChungNhanTemplateManagePage from './pages/admin/ChungNhanTemplateManagePage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';

import useAuthStore from './stores/authStore';
import useSessionTimeout from './hooks/useSessionTimeout';
import { registerSessionExpiredHandler } from './services/api';
import { ROUTES, ROLES, PERMISSIONS, MANAGER_ROLES } from './utils/constants';

// SessionManager: mounted 1 lần ở gốc app — kích hoạt toàn bộ session logic
function SessionManager() {
  useSessionTimeout();
  return null;
}

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

// Quyền mở khóa trang quản trị (đồng bộ với Login.jsx và Sidebar.jsx)
const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.QUET_QR,  // Tài khoản điểm danh chuyên dụng
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
  // eNews
  PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
  PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
  PERMISSIONS.QUAN_LY_CUOC_THI, PERMISSIONS.TAO_CUOC_THI,
  PERMISSIONS.KIEM_DUYET_BINH_LUAN,
  // Ký số / Góp ý
  PERMISSIONS.QUAN_LY_CON_DAU, PERMISSIONS.XEM_GOP_Y, PERMISSIONS.XU_LY_GOP_Y,
  // Email hàng loạt
  PERMISSIONS.GUI_EMAIL_HANG_LOAT,
];



function App() {
  const { checkAuth, refreshPermissions, reset, isLoading: isAuthLoading, isHydrating } = useAuthStore();

  useEffect(() => {
    // Đăng ký handler cho api.js khi refresh token hết hạn (tránh circular dep)
    registerSessionExpiredHandler(() => {
      reset();
      window.location.href = '/login?expired=true';
    });

    // Validate session ngay khi app load (kiểm tra JWT expiry từ localStorage)
    const auth = checkAuth();
    if (auth) {
      refreshPermissions().catch(() => {});
    }
  }, []);

  // Chờ checkAuth() chạy xong trước khi render routes
  // Tránh flash UI "đã đăng nhập" với token thực ra đã hết hạn
  if (isHydrating) {
    return <Loading fullScreen text="Đang khởi động..." />;
  }

  return (
    <ErrorBoundary>
      {/* Session manager: theo dõi token expiry + inactivity timeout */}
      <SessionManager />

      {/* Thanh cảnh báo chế độ bảo trì (feature-flag hethong.bao_tri) */}
      <MaintenanceBanner />

      {isAuthLoading && <Loading fullScreen text="Đang xử lý..." />}

      <Suspense fallback={<Loading fullScreen text="Đang tải dữ liệu..." />}>
        <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        {/* Đổi mật khẩu bắt buộc — chỉ cần đăng nhập, không cần role, bỏ qua guard MK */}
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={
            <ProtectedRoute skipPasswordCheck>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

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

        {/* Admin Routes — CHỈ các role quản lý (ADMIN, QUAN_LY_KHOA, ...) mới vào được.
            DOAN_VIEN bị chặn tại đây dù có một số quyền trùng (XEM_HOAT_DONG, QUET_QR, ...) */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute
              allowedRoles={MANAGER_ROLES}
              requiredPermissions={[
                PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
                PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
                PERMISSIONS.XEM_KHOA, PERMISSIONS.XEM_NGANH, PERMISSIONS.XEM_LOP, PERMISSIONS.XEM_KHOA_HOC,
                PERMISSIONS.QUAN_LY_CHUC_VU, PERMISSIONS.QUAN_LY_BAN,
                PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
                PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
                PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
                PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.SUA_TIN_TUC, PERMISSIONS.DUYET_TIN_TUC,
                PERMISSIONS.QUAN_LY_VAN_BAN, PERMISSIONS.QUAN_LY_CHUYEN_MUC,
                PERMISSIONS.QUAN_LY_CUOC_THI, PERMISSIONS.TAO_CUOC_THI,
                PERMISSIONS.QUET_QR,
              ]}
            >
              <MainLayout title="Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHubPage />} />
          <Route path="hub/:groupKey" element={<AdminHubPage />} />
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
          <Route path="activities/edit" element={
            <PermissionGate permission={PERMISSIONS.SUA_HOAT_DONG}>
              <HoatDongEditorPage backPath="/admin/activities" />
            </PermissionGate>
          } />
          <Route path="activities/attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH}>
              <ActivityAttendancePage />
            </PermissionGate>
          } />
          <Route path="activities-list" element={
            <PermissionGate permission={PERMISSIONS.XEM_HOAT_DONG}>
              <HoatDongListPage />
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
          <Route path="nam-hoc" element={
            <PermissionGate permission={PERMISSIONS.XEM_NAM_HOC}>
              <NamHocPage />
            </PermissionGate>
          } />
          <Route path="diem-ren-luyen" element={
            <PermissionGate permission={PERMISSIONS.XEM_THONG_KE}>
              <DiemRenLuyenManagePage />
            </PermissionGate>
          } />
          <Route path="cau-lac-bo" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CLB}>
              <CauLacBoPage />
            </PermissionGate>
          } />
          <Route path="clb-portal" element={
            <PermissionGate anyOf={[PERMISSIONS.QUAN_LY_CLB, PERMISSIONS.QUAN_LY_THANH_VIEN_CLB]}>
              <ClbPortalPage />
            </PermissionGate>
          } />
          <Route path="attendance" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH}>
              <AttendanceReport />
            </PermissionGate>
          } />
          <Route path="certificates" element={
            <PermissionGate permission={PERMISSIONS.XEM_DIEM_DANH}>
              <ChungNhanPage />
            </PermissionGate>
          } />
          <Route path="certificates/templates" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_DANG_KY}>
              <ChungNhanTemplateManagePage />
            </PermissionGate>
          } />
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
          <Route path="phan-quyen" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM}>
              <PermissionMatrixPage />
            </PermissionGate>
          } />
          {/* Quản lý đoàn viên cấp dưới theo khoa/chi đoàn */}
          <Route path="doan-vien-khoa" element={
            <PermissionGate permission={PERMISSIONS.XEM_SINH_VIEN}>
              <DoanVienKhoaPage />
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
          {/* Layout editor — admin only */}
          <Route path="layout-editor" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <LayoutEditorPage />
            </PermissionGate>
          } />
          {/* News page layout editor — admin only */}
          <Route path="news-layout-editor" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <NewsLayoutEditorPage />
            </PermissionGate>
          } />
          {/* Content managers */}
          <Route path="slider-manager" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <SliderManagerPage />
            </PermissionGate>
          } />
          <Route path="ticker-manager" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <TickerManagerPage />
            </PermissionGate>
          } />
          <Route path="ad-banner-manager" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <AdBannerManagerPage />
            </PermissionGate>
          } />
          <Route path="bieu-mau" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_VAN_BAN}>
              <BieuMauManagePage />
            </PermissionGate>
          } />
          {/* Cuộc thi & Bình chọn */}
          <Route path="cuoc-thi" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CUOC_THI}>
              <CuocThiManagePage />
            </PermissionGate>
          } />
          {/* Ký số */}
          <Route path="ban-hanh" element={
            <PermissionGate permission={PERMISSIONS.KY_SO_PDF}>
              <AdminBanHanhPage />
            </PermissionGate>
          } />
          <Route path="chu-ky" element={
            <PermissionGate permission={PERMISSIONS.KY_SO_PDF}>
              <ChuKyManagePage />
            </PermissionGate>
          } />
          <Route path="con-dau" element={
            <PermissionGate permission={PERMISSIONS.QUAN_LY_CON_DAU}>
              <ConDauManagePage />
            </PermissionGate>
          } />
          {/* Thùng thư góp ý */}
          <Route path="gop-y" element={
            <PermissionGate permission={PERMISSIONS.XEM_GOP_Y}>
              <GopYManagePage />
            </PermissionGate>
          } />
          {/* Soạn & gửi email hàng loạt */}
          <Route path="gui-email" element={
            <PermissionGate permission={PERMISSIONS.GUI_EMAIL_HANG_LOAT}>
              <EmailBroadcastPage />
            </PermissionGate>
          } />
          <Route path="ky-so-lich-su" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <KySoLichSuPage />
            </PermissionGate>
          } />
          <Route path="zalo-debug" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <ZaloDebugPage />
            </PermissionGate>
          } />
          <Route path="cau-hinh-email" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <EmailConfigPage />
            </PermissionGate>
          } />
          <Route path="cai-dat-he-thong" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <SystemSettingsPage />
            </PermissionGate>
          } />
          {/* Thi trắc nghiệm */}
          <Route path="tn/de-thi" element={
            <PermissionGate permission={PERMISSIONS.THI_TN_QUAN_LY_DE_THI}><TnDeThiListPage /></PermissionGate>
          } />
          <Route path="tn/de-thi/tao" element={
            <PermissionGate permission={PERMISSIONS.THI_TN_QUAN_LY_DE_THI}><TnDeThiFormPage /></PermissionGate>
          } />
          <Route path="tn/de-thi/:id/sua" element={
            <PermissionGate permission={PERMISSIONS.THI_TN_QUAN_LY_DE_THI}><TnDeThiFormPage /></PermissionGate>
          } />
          <Route path="tn/cau-hoi" element={
            <PermissionGate permission={PERMISSIONS.THI_TN_QUAN_LY_CAU_HOI}><TnCauHoiBankPage /></PermissionGate>
          } />
          <Route path="van-phong" element={
            <PermissionGate permission={PERMISSIONS.CAI_DAT_HE_THONG}>
              <VanPhongPage />
            </PermissionGate>
          } />
        </Route>

        {/* Student Routes - chỉ DOAN_VIEN */}
        <Route
          path={ROUTES.STUDENT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.DOAN_VIEN]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="activities" element={<StudentActivities />} />
          <Route path="register-activities" element={<StudentRegisterActivities />} />
          <Route path="my-activities" element={<StudentMyActivities />} />
          <Route path="training-points" element={<StudentTrainingPoints />} />
          <Route path="clb-registration" element={<ClbRegistrationPage />} />
          <Route path="fees" element={<Navigate to="/student/clb-registration?tab=fees" replace />} />
          <Route path="registrations" element={<Navigate to="/student/my-activities" replace />} />
          <Route path="certificates" element={<StudentCertificatesPage />} />
          <Route path="self-scan" element={<SelfAttendanceScanner />} />
          <Route path="contests" element={<StudentContests />} />
          <Route path="tn" element={<TnDanhSachDeThi />} />
          <Route path="tn/lam-bai/:deThiId" element={<TnLamBaiPage />} />
          <Route path="tn/ket-qua/:luotThiId" element={<TnKetQuaPage />} />
          <Route path="gop-y" element={<GopYPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* BCH Routes — chỉ management roles có thể vào (PHO_CHI_DOAN trở lên) */}
        <Route
          path={ROUTES.BCH}
          element={
            <ProtectedRoute
              allowedRoles={MANAGER_ROLES}
              requiredPermissions={[
                PERMISSIONS.TAO_HOAT_DONG, PERMISSIONS.QUET_QR,
                PERMISSIONS.DANG_TIN_TUC, PERMISSIONS.QUAN_LY_VAN_BAN,
                PERMISSIONS.GIAO_DIEM_DANH, PERMISSIONS.XEM_DIEM_DANH,
              ]}
            >
              <MainLayout title="BCH" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="dashboard" element={<BCHDashboard />} />
          <Route path="activities" element={<BCHActivities />} />
          <Route path="activities/create" element={<HoatDongEditorPage backPath="/bch/activities" />} />
          <Route path="activities/edit" element={<HoatDongEditorPage backPath="/bch/activities" />} />
          <Route path="activities/attendance" element={<ActivityAttendancePage />} />
          <Route path="activities-list" element={<HoatDongListPage />} />
          <Route path="diem-danh" element={
            <PermissionGate permission={PERMISSIONS.QUET_QR}>
              <AttendanceSelectionPage />
            </PermissionGate>
          } />
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
          {/* Thùng thư góp ý */}
          <Route path="gop-y" element={
            <PermissionGate permission={PERMISSIONS.XEM_GOP_Y}>
              <GopYManagePage />
            </PermissionGate>
          } />
          {/* Soạn & gửi email hàng loạt */}
          <Route path="gui-email" element={
            <PermissionGate permission={PERMISSIONS.GUI_EMAIL_HANG_LOAT}>
              <EmailBroadcastPage />
            </PermissionGate>
          } />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Unauthorized / Forbidden */}
        <Route path="/unauthorized" element={<ForbiddenPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Ban hành public — không cần đăng nhập */}
        <Route path="/ban-hanh/:maHoatDong" element={<BanHanhPublicPage />} />

        {/* eNews — Trang chủ và các trang công khai đặt tại gốc / */}
        <Route path="/" element={<NewsLayout />}>
          <Route index element={<NewsHomePage />} />
          <Route path="news" element={<Navigate to="/" replace />} />
          <Route path="van-ban" element={<VanBanListPage />} />
          <Route path="bieu-mau" element={<BieuMauListPage />} />
          <Route path="hoat-dong" element={<HoatDongPublicPage />} />
          <Route path="danh-sach-ban-hanh" element={<DanhSachBanHanhListPage />} />
          <Route path="gop-y" element={<GopYPage />} />
          <Route path="binh-chon" element={<BinhChonListPage />} />
          <Route path="binh-chon/:slug" element={<BinhChonDetailPage />} />
          <Route path="binh-chon/:slug/thi-sinh/:thiSinhId" element={<ThiSinhDetailPage />} />
          {/* Catch-all cho các URL động của tin tức (slug chuyên mục/bài viết) */}
          <Route path="*" element={<NewsResolver />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
