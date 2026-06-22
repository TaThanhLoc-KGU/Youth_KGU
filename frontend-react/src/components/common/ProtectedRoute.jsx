import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROUTES } from '../../utils/constants';

/**
 * ProtectedRoute - Bảo vệ routes theo role và/hoặc permission.
 *
 * @param allowedRoles        - Chỉ những role này mới vào được. Empty = mọi role.
 * @param requiredPermissions - Cần có ít nhất 1 trong các quyền này. Empty = không check.
 *
 * Logic:
 *  - DOAN_VIEN cố vào /admin hoặc /bch → về /student (không phải /unauthorized)
 *  - Management role cố vào /student → về /admin
 *  - Không có quyền → về /unauthorized
 */
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
  const { isAuthenticated, user, hasAnyPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const vaiTro = user?.vaiTro;
  const isDoanVien = vaiTro === 'DOAN_VIEN';
  const isManagerRole = ['ADMIN', 'QUAN_LY_KHOA', 'PHO_QUAN_LY_KHOA', 'QUAN_LY_CHI_DOAN', 'PHO_CHI_DOAN'].includes(vaiTro);

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(vaiTro)) {
    // DOAN_VIEN cố vào khu vực quản lý → về student dashboard
    if (isDoanVien) return <Navigate to={ROUTES.STUDENT || '/student'} replace />;
    // Management role cố vào /student → về admin
    if (isManagerRole) return <Navigate to={ROUTES.ADMIN || '/admin'} replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission check
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
