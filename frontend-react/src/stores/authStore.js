import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(credentials);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return data;
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
          set({
            user: null,
            isAuthenticated: false,
          });
        }
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

      // Check if user has role
      hasRole: (role) => {
        const { user } = get();
        return user?.vaiTro === role;
      },

      // Check if user has any of the roles
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.vaiTro);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
