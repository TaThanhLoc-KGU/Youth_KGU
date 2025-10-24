import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LogIn, Eye, EyeOff, Building2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Loading from '../../components/common/Loading';
import { ROUTES, ROLES } from '../../utils/constants';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data);
      toast.success('Đăng nhập thành công!');

      // Redirect based on user role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from);
      } else {
        switch (result.user.vaiTro) {
          case ROLES.ADMIN:
            navigate(ROUTES.ADMIN_DASHBOARD);
            break;
          case ROLES.BCH:
            navigate(ROUTES.BCH_DASHBOARD);
            break;
          case ROLES.SINHVIEN:
            navigate(ROUTES.STUDENT_DASHBOARD);
            break;
          default:
            navigate(ROUTES.HOME);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Đang đăng nhập..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hệ thống Quản lý
          </h1>
          <p className="text-gray-600">Hoạt động Đoàn - Hội Sinh viên</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>

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
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    {...register('rememberMe')}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary hover:text-primary-600"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-full">
                <LogIn className="w-5 h-5 mr-2" />
                Đăng nhập
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
