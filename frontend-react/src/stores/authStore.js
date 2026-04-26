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
      permissions: [],   // Array of permission names (from quyenTongHop)
      laAdmin: false,    // true = QUAN_LY có toàn quyền
      maKhoa: null,      // null = Đoàn trường (không giới hạn), non-null = chỉ khoa này
      tenKhoa: null,     // Tên khoa hiển thị (VD: "Khoa Công nghệ Thông tin")
      maClb: null,       // null = không giới hạn, non-null = chỉ quản lý CLB này
      tenClb: null,      // Tên CLB hiển thị (VD: "CLB Lập trình")
      loginTime: null,   // Timestamp lúc đăng nhập (ms) — dùng cho session timeout

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

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            permissions,
            laAdmin,
            maKhoa,
            tenKhoa,
            maClb,
            tenClb,
            loginTime: Date.now(),
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
          permissions: [],
          laAdmin: false,
          maKhoa: null,
          tenKhoa: null,
          maClb: null,
          tenClb: null,
          loginTime: null,
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
        const isAuth = authService.isAuthenticated();
        const storedUser = authService.getStoredUser();
        set({ isAuthenticated: isAuth, user: storedUser });
        return isAuth;
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

      // Kiểm tra quyền
      // Ưu tiên: laAdmin=true → always-granted → DB permissions
      hasPermission: (permission) => {
        const { permissions, user, laAdmin } = get();
        if (!user) return false;
        if (laAdmin) return true;
        if (ALWAYS_GRANTED_PERMISSIONS.has(permission)) return true;
        return Array.isArray(permissions) && permissions.includes(permission);
      },

      hasAnyPermission: (perms) => {
        const { permissions, user, laAdmin } = get();
        if (!user) return false;
        if (laAdmin) return true;
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
      }),
    }
  )
);

export default useAuthStore;
