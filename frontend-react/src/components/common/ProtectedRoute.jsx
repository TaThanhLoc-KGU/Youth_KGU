import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

/**
 * ProtectedRoute - Bảo vệ routes theo role hoặc permission.
 *
 * @param allowedRoles   - Chỉ những role này mới vào được (dùng cho /admin, strict check)
 * @param requiredPermissions - Cần có ít nhất 1 trong các quyền này (dùng cho /bch, /student - flexible)
 *
 * Sinh viên là BCH: có cả quyền sinh viên và quyền BCH → vào được cả 2 nhóm route.
 */
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
  const { isAuthenticated, user, hasAnyPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role check nghiêm ngặt - dùng cho /admin
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission check linh hoạt - dùng cho /bch và /student
  // Người dùng cần có ít nhất 1 trong các quyền yêu cầu
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
