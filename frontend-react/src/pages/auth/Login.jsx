import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  LogIn, Eye, EyeOff, Info, KeyRound, Phone, Mail,
  Bell, ShieldCheck, BookOpen, ChevronRight
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';

const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
];

const canAccessFromPath = (from, vaiTro, laBCHFlag, hasAdminPerm) => {
  if (!from || from === ROUTES.LOGIN || from === '/') return false;
  if (from.startsWith('/admin'))   return vaiTro === ROLES.ADMIN || hasAdminPerm;
  if (from.startsWith('/bch'))     return laBCHFlag;
  if (from.startsWith('/student')) return vaiTro === ROLES.SINHVIEN;
  return true;
};

// Danh sách thông báo hiển thị bên phải
const NOTICES = [
  {
    icon: KeyRound,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    title: 'Mật khẩu mặc định',
    content: (
      <>
        Tài khoản mới được cấp có mật khẩu mặc định:{' '}
        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-sm">
          KGU@12345
        </span>
        {' '}hoặc{' '}
        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-sm">
          KGU@123456
        </span>
        . Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên.
      </>
    ),
  },
  {
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'Tên đăng nhập',
    content: 'Sinh viên dùng mã số sinh viên (VD: 21072006095). Ban chấp hành Đoàn và Ban thư ký dùng tài khoản do admin cấp.',
  },
  {
    icon: ShieldCheck,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    title: 'Bảo mật tài khoản',
    content: 'Không chia sẻ mật khẩu với người khác. Hệ thống sẽ tự đăng xuất sau một thời gian không hoạt động.',
  },
  {
    icon: Phone,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    title: 'Hỗ trợ kỹ thuật',
    content: (
        <>
          Liên hệ BCH Đoàn qua email{' '}
          <a href="mailto:thanhlocta2408@gmail.com" className="text-purple-700 underline font-medium">
            thanhlocta2408@gmail.com
          </a>{' '}
          hoặc gọi qua số điện thoại{' '}
          <a href="tel:0967006704" className="text-purple-700 underline font-medium">
            0967.006.704
          </a>{' '}
          nếu quên mật khẩu hoặc gặp sự cố đăng nhập.
        </>
    ),
  },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const laBCH = useAuthStore((state) => state.laBCH);

  useEffect(() => {
    if (!isAuthenticated || !authUser) return;
    const from = location.state?.from?.pathname;
    const hasAdminPerm = ADMIN_SECTION_PERMS.some((p) => permissions.includes(p));
    if (canAccessFromPath(from, authUser.vaiTro, laBCH, hasAdminPerm)) {
      navigate(from, { replace: true });
      return;
    }
    if (authUser.vaiTro === ROLES.ADMIN || hasAdminPerm) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } else if (laBCH) {
      navigate(ROUTES.BCH_DASHBOARD, { replace: true });
    } else if (authUser.vaiTro === ROLES.SINHVIEN) {
      navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
    } else {
      navigate(ROUTES.PROFILE, { replace: true });
    }
  }, [isAuthenticated]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (!data.username || !data.password) {
      toast.error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(data);
      toast.success('Đăng nhập thành công!');
      queryClient.clear();

      const vaiTro = result.user.vaiTro;
      const laBCH  = result.laBCH;
      const { permissions: loadedPerms } = useAuthStore.getState();
      const hasAdminPerm = ADMIN_SECTION_PERMS.some((p) => loadedPerms.includes(p));

      const from = location.state?.from?.pathname;
      if (canAccessFromPath(from, vaiTro, laBCH, hasAdminPerm)) {
        navigate(from, { replace: true });
        return;
      }
      if (vaiTro === ROLES.ADMIN || hasAdminPerm) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (laBCH) {
        navigate(ROUTES.BCH_DASHBOARD);
      } else if (vaiTro === ROLES.SINHVIEN) {
        navigate(ROUTES.STUDENT_DASHBOARD);
      } else {
        navigate(ROUTES.PROFILE);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0017B0]/10 via-white to-[#ED2124]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
              alt="Logo Đoàn"
              className="w-16 h-16 object-contain drop-shadow-md"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-[#0017B0] leading-tight">
                HỆ THỐNG QUẢN LÝ
              </h1>
              <p className="text-[#ED2124] font-semibold text-base">
                Hoạt động Đoàn – Hội Sinh viên KGU
              </p>
            </div>
          </div>
          <div className="h-0.5 w-24 bg-gradient-to-r from-[#0017B0] to-[#ED2124] mx-auto rounded-full" />
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ===== LEFT: Login Form (3/5) ===== */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Blue header bar */}
              <div className="bg-gradient-to-r from-[#0017B0] to-[#0033FF] px-6 py-4 flex items-center gap-3">
                <LogIn className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Đăng nhập hệ thống</h2>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      autoComplete="username"
                      disabled={isLoading}
                      placeholder="Mã sinh viên hoặc tên tài khoản"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                        focus:ring-2 focus:ring-[#0017B0]/30 focus:border-[#0017B0]
                        disabled:bg-gray-50 disabled:text-gray-400
                        ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                      {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
                    />
                    {errors.username && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        placeholder="Nhập mật khẩu"
                        className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm transition-colors outline-none
                          focus:ring-2 focus:ring-[#0017B0]/30 focus:border-[#0017B0]
                          disabled:bg-gray-50 disabled:text-gray-400
                          ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                        {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isLoading}
                        className="w-4 h-4 rounded border-gray-300 text-[#0017B0] focus:ring-[#0017B0]"
                        {...register('rememberMe')}
                      />
                      <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                    </label>
                    <Link
                      to={ROUTES.FORGOT_PASSWORD}
                      className="text-sm text-[#0017B0] hover:text-[#ED2124] transition-colors font-medium"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-semibold text-white text-sm
                      bg-gradient-to-r from-[#0017B0] to-[#0033FF]
                      hover:from-[#0022D4] hover:to-[#0044FF]
                      active:scale-[0.99] transition-all shadow-md hover:shadow-lg
                      flex items-center justify-center gap-2
                      ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Đăng nhập
                      </>
                    )}
                  </button>
                </form>

                {/* Default password hint */}
                <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">Lần đầu đăng nhập?</span> Mật khẩu mặc định là{' '}
                    <span className="font-mono font-bold bg-amber-100 px-1 rounded">KGU@12345</span>
                    {' '}hoặc{' '}
                    <span className="font-mono font-bold bg-amber-100 px-1 rounded">KGU@123456</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Notice Panel (2/5) ===== */}
          <div className="lg:col-span-2 space-y-3">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-1">
              <Bell className="w-4 h-4 text-[#0017B0]" />
              <span className="text-sm font-semibold text-[#0017B0]">Thông tin & hỗ trợ</span>
            </div>

            {NOTICES.map((notice, idx) => {
              const Icon = notice.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3.5 ${notice.bg} transition-shadow hover:shadow-sm`}
                >
                  <div className="flex gap-2.5">
                    <div className={`flex-shrink-0 mt-0.5 ${notice.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold mb-0.5 ${notice.color}`}>
                        {notice.title}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick links */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Truy cập nhanh
              </p>
              <div className="space-y-1">
                {[
                  { label: 'Trang tin tức Đoàn', href: '/news' },
                  { label: 'Danh sách hoạt động', href: '/news/hoat-dong' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between group text-xs text-gray-600 hover:text-[#0017B0] py-1 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Youth KGU – Đoàn Thanh niên Cộng sản Hồ Chí Minh Trường ĐH Kiên Giang
        </p>
      </div>
    </div>
  );
};

export default Login;
