import api from './api';

const lopService = {
  // Get all classes
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/lop', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching lop list:', error);
      return [];
    }
  },

  // Get lop by ID
  getById: async (maLop) => {
    try {
      const response = await api.get(`/api/lop/${maLop}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching lop:', error);
      return null;
    }
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
    try {
      const response = await api.get('/api/lop/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching lop:', error);
      return [];
    }
  },

  // Get by khoa
  getByKhoa: async (maKhoa) => {
    try {
      const response = await api.get(`/api/lop/khoa/${maKhoa}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching lop by khoa:', error);
      return [];
    }
  },

  // Get by nganh
  getByNganh: async (maNganh) => {
    try {
      const response = await api.get(`/api/lop/nganh/${maNganh}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching lop by nganh:', error);
      return [];
    }
  },

  // Get by khoahoc
  getByKhoaHoc: async (maKhoaHoc) => {
    try {
      const response = await api.get(`/api/lop/khoahoc/${maKhoaHoc}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching lop by khoahoc:', error);
      return [];
    }
  },

  // Get active lop only
  getActive: async () => {
    try {
      const response = await api.get('/api/lop/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active lop:', error);
      return [];
    }
  },

  // Get count
  getCount: async () => {
    try {
      const response = await api.get('/api/lop/count');
      return response.data?.data || 0;
    } catch (error) {
      console.error('Error fetching lop count:', error);
      return 0;
    }
  },
};

export default lopService;
