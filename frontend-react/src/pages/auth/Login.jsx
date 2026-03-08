import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import { ROUTES, ROLES, PERMISSIONS } from '../../utils/constants';

// Quyền "mở khóa" trang quản trị (phải đồng bộ với ADMIN_SECTION_PERMS trong Sidebar)
const ADMIN_SECTION_PERMS = [
  PERMISSIONS.XEM_SINH_VIEN, PERMISSIONS.XEM_GIANG_VIEN, PERMISSIONS.XEM_CHUYEN_VIEN,
  PERMISSIONS.XEM_BCH, PERMISSIONS.XEM_HOAT_DONG, PERMISSIONS.XEM_DIEM_DANH,
  PERMISSIONS.CAI_DAT_HE_THONG, PERMISSIONS.XEM_TAI_KHOAN, PERMISSIONS.XEM_THONG_KE,
  PERMISSIONS.XEM_SYSTEM_LOG, PERMISSIONS.QUAN_LY_PHAN_QUYEN_NHOM,
  PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN,
];

/**
 * Kiểm tra user mới đăng nhập có thể vào đường dẫn `from` không.
 * Tránh redirect user A vào route của user B sau khi đổi tài khoản.
 */
const canAccessFromPath = (from, vaiTro, laBCHFlag, hasAdminPerm) => {
  if (!from || from === ROUTES.LOGIN || from === '/') return false;
  if (from.startsWith('/admin'))   return vaiTro === ROLES.ADMIN || hasAdminPerm;
  if (from.startsWith('/bch'))     return laBCHFlag;
  if (from.startsWith('/student')) return vaiTro === ROLES.SINHVIEN;
  return true; // /profile và các route công khai
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);
  const reset = useAuthStore((state) => state.reset);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const laBCH = useAuthStore((state) => state.laBCH);

  // Nếu đã đăng nhập, tự động chuyển đến trang phù hợp
  useEffect(() => {
    if (!isAuthenticated || !authUser) return;
    const from = location.state?.from?.pathname;
    const hasAdminPerm = ADMIN_SECTION_PERMS.some((p) => permissions.includes(p));
    // Validate: chỉ redirect về `from` nếu user này thực sự có quyền vào đó
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
    setIsLoading(true);
    try {
      // 1. Reset everything before login to be 100% clean
      reset();
      queryClient.clear();

      const result = await login(data);
      toast.success('Đăng nhập thành công!');

      // 2. Clear query cache again after login just in case
      queryClient.clear();

      // Redirect theo role + permissions
      const vaiTro = result.user.vaiTro;
      const laBCH  = result.laBCH;

      // Lấy permissions từ store sau khi login đã cập nhật xong
      const { permissions: loadedPerms } = useAuthStore.getState();
      const hasAdminPerm = ADMIN_SECTION_PERMS.some((p) => loadedPerms.includes(p));

      // Nếu có trang được yêu cầu trước đó, quay lại — nhưng chỉ khi user này có quyền vào đó.
      // Tránh trường hợp user A logout ở /admin/students → user B login → bị redirect vào /admin/students
      const from = location.state?.from?.pathname;
      if (canAccessFromPath(from, vaiTro, laBCH, hasAdminPerm)) {
        navigate(from, { replace: true });
        return;
      }

      if (vaiTro === ROLES.ADMIN) {
        // ADMIN role → dashboard quản trị
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (hasAdminPerm) {
        // Không phải ADMIN nhưng có quyền quản trị (GV001 Bí thư, BCH cấp cao...)
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (laBCH) {
        // BCH thông thường (chỉ có quyền BCH, không có quyền quản trị)
        navigate(ROUTES.BCH_DASHBOARD);
      } else if (vaiTro === ROLES.SINHVIEN) {
        navigate(ROUTES.STUDENT_DASHBOARD);
      } else {
        // GIANG_VIEN, CHUYEN_VIEN không có quyền đặc biệt → hồ sơ
        navigate(ROUTES.PROFILE);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0017B0]/10 via-[#FFFFFF] to-[#0022D4]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo Đoàn"
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-[#0017B0] mb-2">
            Hệ thống Quản lý
          </h1>
          <p className="text-[#ED2124] font-medium">Hoạt động Đoàn - Hội Sinh viên</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-center mb-6 text-[#0017B0]">Đăng nhập</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="form-label">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="username"
                  className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Nhập tên đăng nhập"
                  {...register('username', {
                    required: 'Vui lòng nhập tên đăng nhập',
                  })}
                />
                {errors.username && (
                  <p className="form-error">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    disabled={isLoading}
                    className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Nhập mật khẩu"
                    {...register('password', {
                      required: 'Vui lòng nhập mật khẩu',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#0017B0] focus:ring-[#0017B0]"
                    disabled={isLoading}
                    {...register('rememberMe')}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-[#0017B0] hover:text-[#0022D4]"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`btn w-full bg-[#0017B0] hover:bg-[#0022D4] text-[#FFFFFF] border-none flex items-center justify-center ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 Youth KGU. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
