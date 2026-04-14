import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

/**
 * ProtectedRoute - Bảo vệ routes theo role hoặc permission.
 *
 * @param allowedRoles         - Chỉ những role này mới vào được (e.g. ['QUAN_LY'])
 * @param requiredPermissions  - Cần có ít nhất 1 trong các quyền này (hasAnyPermission)
 *
 * QUAN_LY + laAdmin=true → hasAnyPermission luôn trả true → qua mọi permission check.
 */
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
  const { isAuthenticated, user, hasAnyPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role check — dùng cho /admin (chỉ QUAN_LY)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission check — user cần có ít nhất 1 quyền yêu cầu
  // (laAdmin = true → hasAnyPermission = true → qua hết)
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
