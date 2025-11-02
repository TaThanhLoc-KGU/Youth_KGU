import api from './api';

const lopService = {
  // Get all classes
  getAll: async (params = {}) => {
    const response = await api.get('/api/lop', { params });
    return response.data || [];
  },

  // Get lop by ID
  getById: async (maLop) => {
    const response = await api.get(`/api/lop/${maLop}`);
    return response.data?.data;
  },

  // Create new lop
  create: async (lopData) => {
    try {
      const response = await api.post('/api/lop', lopData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update lop
  update: async (maLop, lopData) => {
    try {
      const response = await api.put(`/api/lop/${maLop}`, lopData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete lop (soft delete)
  delete: async (maLop) => {
    try {
      const response = await api.delete(`/api/lop/${maLop}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Restore lop
  restore: async (maLop) => {
    try {
      const response = await api.put(`/api/lop/${maLop}/restore`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search/filter
  search: async (keyword) => {
    const response = await api.get('/api/lop/search', {
      params: { keyword },
    });
    return response.data || [];
  },

  // Get by khoa
  getByKhoa: async (maKhoa) => {
    const response = await api.get(`/api/lop/khoa/${maKhoa}`);
    return response.data || [];
  },

  // Get by nganh
  getByNganh: async (maNganh) => {
    const response = await api.get(`/api/lop/nganh/${maNganh}`);
    return response.data || [];
  },

  // Get by khoahoc
  getByKhoaHoc: async (maKhoaHoc) => {
    const response = await api.get(`/api/lop/khoahoc/${maKhoaHoc}`);
    return response.data || [];
  },

  // Get active lop only
  getActive: async () => {
    const response = await api.get('/api/lop/active');
    return response.data || [];
  },

  // Get count
  getCount: async () => {
    const response = await api.get('/api/lop/count');
    return response.data?.data || 0;
  },
};

export default lopService;
