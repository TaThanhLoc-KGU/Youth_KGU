import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

/**
 * ProtectedRoute - Bảo vệ routes theo role, permission, hoặc BCH membership.
 *
 * @param allowedRoles        - Chỉ những role này mới vào được (dùng cho /student)
 * @param requiredPermissions - Cần có ít nhất 1 trong các quyền này (dùng cho /admin)
 * @param requireBCH          - Chỉ BCH members (laBCH=true) hoặc ADMIN mới vào được (/bch)
 *
 * Sinh viên là BCH: vaiTro=SINH_VIEN nhưng laBCH=true → vào được /bch
 * ADMIN luôn pass mọi check.
 */
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [], requireBCH = false }) => {
  const { isAuthenticated, user, hasAnyPermission, laBCH } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role check nghiêm ngặt - dùng cho /student
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // BCH membership check - dùng cho /bch
  // ADMIN luôn pass, còn lại phải có laBCH=true từ backend
  if (requireBCH && user?.vaiTro !== 'ADMIN' && !laBCH) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission check linh hoạt - dùng cho /admin
  // Người dùng cần có ít nhất 1 trong các quyền yêu cầu
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
