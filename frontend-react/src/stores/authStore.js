import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import permissionService from '../services/permissionService';

// Quyền cơ bản — mọi user đã đăng nhập luôn có, không cần config DB
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
      isHydrating: true,   // true cho đến khi checkAuth() được gọi lần đầu
      permissions: [],
      laAdmin: false,
      maKhoa: null,
      tenKhoa: null,
      maClb: null,
      tenClb: null,
      loginTime: null,
      tokenExpiry: null,   // ms timestamp khi accessToken hết hạn

      // Login
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(credentials);

          let permissions = [];
          let laAdmin = false;
          let maKhoa = null;
          let tenKhoa = null;
          let maClb = null;
          let tenClb = null;

          try {
            const permData = await permissionService.getMyPermissions();
            permissions = Array.from(permData?.quyenTongHop || []);
            laAdmin = permData?.laAdmin || false;
            maKhoa = permData?.maKhoa || null;
            tenKhoa = permData?.tenKhoa || null;
            maClb = permData?.maClb || null;
            tenClb = permData?.tenClb || null;

            // Merge hoTen nếu login response không có
            if (permData?.hoTen && !data.user.hoTen) {
              data.user = { ...data.user, hoTen: permData.hoTen };
            }
          } catch (e) {
            console.warn('Không thể tải quyền:', e);
          }

          const accessToken  = localStorage.getItem('accessToken');
          const tokenExpiry  = authService.getTokenExpiry(accessToken);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isHydrating: false,
            permissions,
            laAdmin,
            maKhoa,
            tenKhoa,
            maClb,
            tenClb,
            loginTime: Date.now(),
            tokenExpiry,
          });

          return { ...data, laAdmin };
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
          isHydrating: false,
          permissions: [],
          laAdmin: false,
          maKhoa: null,
          tenKhoa: null,
          maClb: null,
          tenClb: null,
          loginTime: null,
          tokenExpiry: null,
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActiveTime');
        localStorage.removeItem('notification-history');
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      // Xóa cờ mustChangePassword sau khi đổi mật khẩu thành công
      clearMustChangePassword: () => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, mustChangePassword: false };
        set({ user: updated });
        // Cập nhật cả localStorage để checkAuth() không bị stale
        localStorage.setItem('user', JSON.stringify(updated));
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

      // Làm mới permissions (gọi sau khi admin thay đổi quyền)
      refreshPermissions: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const permData = await permissionService.getMyPermissions();
          set({
            permissions: Array.from(permData?.quyenTongHop || []),
            laAdmin: permData?.laAdmin || false,
            maKhoa: permData?.maKhoa || null,
            tenKhoa: permData?.tenKhoa || null,
            maClb: permData?.maClb || null,
            tenClb: permData?.tenClb || null,
          });
        } catch (e) {
          console.warn('Không thể làm mới quyền:', e);
        }
      },

      checkAuth: () => {
        const accessToken  = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Không có token → đăng xuất sạch
        if (!accessToken) {
          get().reset();
          set({ isHydrating: false });
          return false;
        }

        const accessExpired  = authService.isTokenExpired(accessToken);
        const refreshExpired = !refreshToken || authService.isTokenExpired(refreshToken);

        // Cả hai đều hết hạn → session vô hiệu
        if (accessExpired && refreshExpired) {
          get().reset();
          set({ isHydrating: false });
          return false;
        }

        // Còn hợp lệ (hoặc có thể refresh) → tin vào persisted state
        const storedUser  = authService.getStoredUser();
        const tokenExpiry = authService.getTokenExpiry(accessToken);

        if (!storedUser) {
          get().reset();
          set({ isHydrating: false });
          return false;
        }

        set({ isAuthenticated: true, user: storedUser, tokenExpiry, isHydrating: false });
        return true;
      },

      getUserRole: () => {
        const { user } = get();
        return user?.vaiTro || null;
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.vaiTro === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.vaiTro);
      },

      // true nếu user có role quản lý (không phải đoàn viên thường)
      isManager: () => {
        const { user } = get();
        const MANAGER_ROLES = ['ADMIN', 'QUAN_LY_KHOA', 'PHO_QUAN_LY_KHOA', 'QUAN_LY_CHI_DOAN', 'PHO_CHI_DOAN'];
        return MANAGER_ROLES.includes(user?.vaiTro);
      },

      // Kiểm tra quyền
      // Ưu tiên: ADMIN role hoặc laAdmin=true → bypass toàn bộ → always-granted → DB permissions
      hasPermission: (permission) => {
        const { permissions, user, laAdmin } = get();
        if (!user) return false;
        // ADMIN role hoặc laAdmin flag → toàn quyền (double-check: phòng lag khi laAdmin chưa kịp load)
        if (laAdmin || user.vaiTro === 'ADMIN') return true;
        if (ALWAYS_GRANTED_PERMISSIONS.has(permission)) return true;
        return Array.isArray(permissions) && permissions.includes(permission);
      },

      hasAnyPermission: (perms) => {
        const { permissions, user, laAdmin } = get();
        if (!user) return false;
        if (laAdmin || user.vaiTro === 'ADMIN') return true;
        return Array.isArray(permissions) && perms.some(
          (p) => ALWAYS_GRANTED_PERMISSIONS.has(p) || permissions.includes(p)
        );
      },

      // true nếu tài khoản bị giới hạn phạm vi theo khoa (không phải Đoàn trường)
      isKhoaScoped: () => {
        const { maKhoa } = get();
        return !!maKhoa;
      },

      // Trả về { maKhoa, tenKhoa } của tài khoản, hoặc null nếu không có scope
      getKhoaScope: () => {
        const { maKhoa, tenKhoa } = get();
        if (!maKhoa) return null;
        return { maKhoa, tenKhoa };
      },

      // true nếu tài khoản bị giới hạn phạm vi theo CLB
      isClbScoped: () => {
        const { maClb } = get();
        return !!maClb;
      },

      // Trả về { maClb, tenClb } của tài khoản, hoặc null nếu không có scope
      getClbScope: () => {
        const { maClb, tenClb } = get();
        if (!maClb) return null;
        return { maClb, tenClb };
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        laAdmin: state.laAdmin,
        maKhoa: state.maKhoa,
        tenKhoa: state.tenKhoa,
        maClb: state.maClb,
        tenClb: state.tenClb,
        loginTime: state.loginTime,
        tokenExpiry: state.tokenExpiry,
        // isHydrating KHÔNG persist — luôn bắt đầu là true khi reload
      }),
    }
  )
);

export default useAuthStore;
