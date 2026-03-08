import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import permissionService from '../services/permissionService';

// Quyền cơ bản — mọi user đã đăng nhập luôn có, không cần config DB
// (Đổi mật khẩu, xem/sửa profile cá nhân)
const ALWAYS_GRANTED_PERMISSIONS = new Set([
  'DOI_MAT_KHAU',
  'XEM_THONG_TIN_CA_NHAN',
  'SUA_THONG_TIN_CA_NHAN',
]);

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],       // Array of permission names (from quyenTongHop)
      laBCH: false,          // Là thành viên BCH Đoàn - Hội
      bchLevel: null,        // Cấp BCH: 1 = Bí thư, 2 = Trưởng ban, 3 = Thành viên
      danhSachChucVu: [],    // Danh sách chức vụ BCH (chỉ để hiển thị)
      loginTime: null,       // Timestamp lúc đăng nhập (ms) — dùng cho session timeout

      // Login
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(credentials);

          let permissions = [];
          let laBCH = false;
          let bchLevel = null;
          let danhSachChucVu = [];

          try {
            const permData = await permissionService.getMyPermissions();
            permissions = Array.from(permData?.quyenTongHop || []);
            laBCH = permData?.laBCH || false;
            bchLevel = permData?.bchLevel ?? null;
            danhSachChucVu = permData?.danhSachChucVu || [];

            // Merge hoTen nếu login response không có
            if (permData?.hoTen && !data.user.hoTen) {
              data.user = { ...data.user, hoTen: permData.hoTen };
            }
          } catch (e) {
            console.warn('Không thể tải quyền:', e);
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            permissions,
            laBCH,
            bchLevel,
            danhSachChucVu,
            loginTime: Date.now(),   // bắt đầu đếm session timeout
          });

          return { ...data, laBCH, bchLevel };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          get().reset();
        }
      },

      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          permissions: [],
          laBCH: false,
          bchLevel: null,
          danhSachChucVu: [],
          loginTime: null,
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Xóa lịch sử thông báo khi đăng xuất
        localStorage.removeItem('notification-history');
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      refreshUser: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
          return user;
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      // Làm mới permissions (gọi sau khi admin thay đổi quyền → user re-login)
      refreshPermissions: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const permData = await permissionService.getMyPermissions();
          set({
            permissions: Array.from(permData?.quyenTongHop || []),
            laBCH: permData?.laBCH || false,
            bchLevel: permData?.bchLevel ?? null,
            danhSachChucVu: permData?.danhSachChucVu || [],
          });
        } catch (e) {
          console.warn('Không thể làm mới quyền:', e);
        }
      },

      checkAuth: () => {
        const isAuth = authService.isAuthenticated();
        const storedUser = authService.getStoredUser();
        set({ isAuthenticated: isAuth, user: storedUser });
        return isAuth;
      },

      getUserRole: () => {
        const { user } = get();
        return user?.vaiTro || null;
      },

      // Kiểm tra role gốc (ADMIN / BCH / SINH_VIEN / ...)
      hasRole: (role) => {
        const { user } = get();
        return user?.vaiTro === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.vaiTro);
      },

      // Kiểm tra quyền
      // Ưu tiên: ADMIN → always-granted (quyền cơ bản) → DB permissions
      hasPermission: (permission) => {
        const { permissions, user } = get();
        if (!user) return false;
        if (user?.vaiTro === 'ADMIN') return true;
        if (ALWAYS_GRANTED_PERMISSIONS.has(permission)) return true; // quyền cơ bản, luôn có
        return Array.isArray(permissions) && permissions.includes(permission);
      },

      hasAnyPermission: (perms) => {
        const { permissions, user } = get();
        if (!user) return false;
        if (user?.vaiTro === 'ADMIN') return true;
        return Array.isArray(permissions) && perms.some(
          (p) => ALWAYS_GRANTED_PERMISSIONS.has(p) || permissions.includes(p)
        );
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        laBCH: state.laBCH,
        bchLevel: state.bchLevel,
        danhSachChucVu: state.danhSachChucVu,
        loginTime: state.loginTime,
      }),
    }
  )
);

export default useAuthStore;
