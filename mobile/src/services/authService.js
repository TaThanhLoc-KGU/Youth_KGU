import * as SecureStore from 'expo-secure-store';
import api from './api';

const authService = {
  login: async ({ username, password }) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    const { accessToken, refreshToken, user } = data.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return user;
  },

  logout: async () => {
    try { await api.post('/api/auth/logout'); } catch { /* silent */ }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
  },

  getStoredUser: async () => {
    const str = await SecureStore.getItemAsync('user');
    return str ? JSON.parse(str) : null;
  },

  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  },

  me: async () => {
    const { data } = await api.get('/api/auth/me');
    const user = data.data;
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return user;
  },
};

export default authService;
