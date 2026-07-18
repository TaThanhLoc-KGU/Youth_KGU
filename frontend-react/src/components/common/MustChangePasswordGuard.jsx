/**
 * MustChangePasswordGuard — chặn tất cả route được bảo vệ nếu user
 * chưa đổi mật khẩu mặc định. Wrap bên ngoài ProtectedRoute.
 */
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

export default function MustChangePasswordGuard({ children }) {
  const user        = useAuthStore(s => s.user);
  const isAuth      = useAuthStore(s => s.isAuthenticated);
  const location    = useLocation();

  // Chưa đăng nhập → không cần guard này xử lý (ProtectedRoute đã xử lý)
  if (!isAuth || !user) return children;

  // Đang ở trang đổi mật khẩu rồi → cho đi qua
  if (location.pathname === ROUTES.CHANGE_PASSWORD) return children;

  // Cần đổi mật khẩu → redirect
  if (user.mustChangePassword) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace state={{ from: location }} />;
  }

  return children;
}
