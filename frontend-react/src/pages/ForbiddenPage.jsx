import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { ROUTES, MANAGER_ROLES } from '../utils/constants';

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const getHomeRoute = () => {
    if (!user) return ROUTES.LOGIN;
    if (MANAGER_ROLES.includes(user.vaiTro)) return ROUTES.ADMIN;
    if (user.vaiTro === 'DOAN_VIEN') return ROUTES.STUDENT_DASHBOARD;
    return ROUTES.PROFILE;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md w-full">
        <ShieldOff className="w-16 h-16 sm:w-20 sm:h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">403</h1>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">Không có quyền truy cập</h2>
        <p className="text-gray-500 mb-8 text-sm sm:text-base">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={() => navigate(getHomeRoute())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
