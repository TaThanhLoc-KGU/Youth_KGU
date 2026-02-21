import api from './api';

const giangvienService = {
  // Get all teachers/lecturers
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/giangvien', { 
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Raw response:', response);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      // Handle both array and wrapped object responses
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      console.log('Processed data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching giangvien list:', error);
      throw error;
    }
  },

  // Get giangvien by ID
  getById: async (maGv) => {
    try {
      const response = await api.get(`/api/giangvien/${maGv}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching giangvien:', error);
      return null;
    }
  },

  // Get giangvien by email
  getByEmail: async (email) => {
    try {
      const response = await api.get(`/api/giangvien/email/${email}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching giangvien by email:', error);
      return null;
    }
  },

  // Create new giangvien
  create: async (giangvienData) => {
    try {
      const response = await api.post('/api/giangvien', giangvienData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Update giangvien
  update: async (maGv, giangvienData) => {
    try {
      const response = await api.put(`/api/giangvien/${maGv}`, giangvienData);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete giangvien (soft delete)
  delete: async (maGv) => {
    try {
      const response = await api.delete(`/api/giangvien/${maGv}`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Restore giangvien
  restore: async (maGv) => {
    try {
      const response = await api.put(`/api/giangvien/${maGv}/restore`);
      return response.data?.data;
    } catch (error) {
      throw error;
    }
  },

  // Search/filter
  search: async (keyword) => {
    try {
      const response = await api.get('/api/giangvien/search', {
        params: { keyword },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching giangvien:', error);
      return [];
    }
  },

  // Get by khoa
  getByKhoa: async (maKhoa) => {
    try {
      const response = await api.get(`/api/giangvien/khoa/${maKhoa}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching giangvien by khoa:', error);
      return [];
    }
  },

  // Get active giangvien only
  getActive: async () => {
    try {
      const response = await api.get('/api/giangvien/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active giangvien:', error);
      return [];
    }
  },

  // Get inactive giangvien
  getInactive: async () => {
    try {
      const response = await api.get('/api/giangvien/inactive');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching inactive giangvien:', error);
      return [];
    }
  },

  // Get count
  getCount: async () => {
    try {
      const response = await api.get('/api/giangvien/count');
      return response.data?.data || 0;
    } catch (error) {
      console.error('Error fetching giangvien count:', error);
      return 0;
    }
  },
};

export default giangvienService;
