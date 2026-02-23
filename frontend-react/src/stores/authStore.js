import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import permissionService from '../services/permissionService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],        // Array of permission names (from quyenTongHop)
      laBCH: false,           // Là thành viên BCH Đoàn - Hội
      effectiveRole: null,    // Vai trò hiệu lực (MANAGER/STAFF/SINH_VIEN...)
      danhSachChucVu: [],     // Danh sách chức vụ BCH

      // Login action
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(credentials);

          // Fetch permissions ngay sau khi login thành công
          // Dùng /me (JWT-based) thay vì /account/{id} để tránh lỗi 403 với non-ADMIN
          let permissions = [];
          let laBCH = false;
          let effectiveRole = data.user.vaiTro;
          let danhSachChucVu = [];

          try {
            const permData = await permissionService.getMyPermissions();
            permissions = Array.from(permData?.quyenTongHop || []);
            laBCH = permData?.laBCH || false;
            effectiveRole = permData?.vaiTro || data.user.vaiTro;
            danhSachChucVu = permData?.danhSachChucVu || [];

            // Merge hoTen từ permData nếu login response không có
            // (xảy ra khi TaiKhoan không linked trực tiếp với GiangVien/SinhVien entity)
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
            effectiveRole,
            danhSachChucVu,
          });

          return { ...data, laBCH, effectiveRole };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          get().reset();
        }
      },

      // Reset action to clear all state
      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          permissions: [],
          laBCH: false,
          effectiveRole: null,
          danhSachChucVu: [],
        });
        // Clear local storage explicitly to be safe
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },

      // Update user
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      // Refresh user data
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

      // Refresh permissions (gọi khi cần cập nhật quyền mà không logout)
      refreshPermissions: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const permData = await permissionService.getMyPermissions();
          set({
            permissions: Array.from(permData?.quyenTongHop || []),
            laBCH: permData?.laBCH || false,
            effectiveRole: permData?.vaiTro || user.vaiTro,
            danhSachChucVu: permData?.danhSachChucVu || [],
          });
        } catch (e) {
          console.warn('Không thể làm mới quyền:', e);
        }
      },

      // Check auth status
      checkAuth: () => {
        const isAuth = authService.isAuthenticated();
        const storedUser = authService.getStoredUser();
        set({
          isAuthenticated: isAuth,
          user: storedUser,
        });
        return isAuth;
      },

      // Get user role
      getUserRole: () => {
        const { user } = get();
        return user?.vaiTro || null;
      },

      // Check if user has role (dùng cho ADMIN-only)
      hasRole: (role) => {
        const { user } = get();
        return user?.vaiTro === role;
      },

      // Check if user has any of the roles
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.vaiTro);
      },

      // Kiểm tra quyền cụ thể (ADMIN luôn có mọi quyền)
      hasPermission: (permission) => {
        const { permissions, user } = get();
        if (user?.vaiTro === 'ADMIN') return true;
        return Array.isArray(permissions) && permissions.includes(permission);
      },

      // Kiểm tra có ít nhất 1 trong các quyền
      hasAnyPermission: (perms) => {
        const { permissions, user } = get();
        if (user?.vaiTro === 'ADMIN') return true;
        return Array.isArray(permissions) && perms.some((p) => permissions.includes(p));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        laBCH: state.laBCH,
        effectiveRole: state.effectiveRole,
        danhSachChucVu: state.danhSachChucVu,
      }),
    }
  )
);

export default useAuthStore;
