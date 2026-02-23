import useAuthStore from '../../stores/authStore';

/**
 * PermissionGate - Ẩn/hiện UI dựa trên permission.
 *
 * @param {string}      permission  - Tên quyền cần kiểm tra (từ PERMISSIONS constant)
 * @param {string[]}    anyOf       - Cần có ít nhất 1 trong danh sách quyền này
 * @param {ReactNode}   fallback    - Nội dung hiển thị khi không có quyền (mặc định: null)
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
const PermissionGate = ({ permission, anyOf, fallback = null, children }) => {
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
