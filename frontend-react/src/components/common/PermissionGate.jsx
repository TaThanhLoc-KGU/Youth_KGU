import { ShieldOff } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

/**
 * Hiển thị mặc định khi PermissionGate bọc quanh element của một <Route> và
 * người dùng không đủ quyền — thay cho trang trắng.
 */
export const UnauthorizedFallback = ({ feature }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center px-4">
    <ShieldOff className="w-16 h-16 text-gray-300 mb-4" />
    <h2 className="text-xl font-semibold text-gray-700 mb-2">Không có quyền truy cập</h2>
    <p className="text-gray-500 max-w-sm">
      Bạn không có quyền truy cập {feature ? `chức năng "${feature}"` : 'chức năng này'}.
    </p>
    <p className="text-sm text-gray-400 mt-1">
      Vui lòng liên hệ quản trị viên để được cấp quyền.
    </p>
  </div>
);

/**
 * PermissionGate - Ẩn/hiện UI dựa trên permission.
 *
 * @param {string}      permission  - Tên quyền cần kiểm tra (từ PERMISSIONS constant)
 * @param {string[]}    anyOf       - Cần có ít nhất 1 trong danh sách quyền này
 * @param {ReactNode}   fallback    - Nội dung hiển thị khi không có quyền (mặc định: <UnauthorizedFallback />)
 * @param {ReactNode}   children    - Nội dung hiển thị khi có quyền
 *
 * @example
 * // Kiểm tra 1 quyền
 * <PermissionGate permission={PERMISSIONS.THEM_SINH_VIEN}>
 *   <button>Thêm sinh viên</button>
 * </PermissionGate>
 *
 * @example
 * // Kiểm tra bất kỳ trong nhiều quyền
 * <PermissionGate anyOf={[PERMISSIONS.SUA_SINH_VIEN, PERMISSIONS.XOA_SINH_VIEN]}>
 *   <ActionButtons />
 * </PermissionGate>
 */
const PermissionGate = ({ permission, anyOf, fallback = <UnauthorizedFallback />, children }) => {
  const { hasPermission, hasAnyPermission } = useAuthStore();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(anyOf);
  } else {
    // Không chỉ định quyền → hiển thị luôn
    allowed = true;
  }

  if (!allowed) return fallback;
  return children;
};

export default PermissionGate;
