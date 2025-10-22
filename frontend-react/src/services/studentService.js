import api from './api';

const studentService = {
  // Get all students with pagination
  getAll: async (params = {}) => {
    const { page = 0, size = 10, sortBy = 'maSv', direction = 'asc' } = params;
    const response = await api.get('/api/sinhvien', {
      params: { page, size, sortBy, direction },
    });
    return response.data;
  },

  // Get all active students
  getAllActive: async () => {
    const response = await api.get('/api/sinhvien/active');
    return response.data;
  },

  // Get student by ID
  getById: async (id) => {
    const response = await api.get(`/api/sinhvien/${id}`);
    return response.data;
  },

  // Get student by maSv
  getByMaSv: async (maSv) => {
    const response = await api.get(`/api/sinhvien/by-masv/${maSv}`);
    return response.data;
  },

  // Create student
  create: async (studentData) => {
    const response = await api.post('/api/sinhvien', studentData);
    return response.data;
  },

  // Update student
  update: async (id, studentData) => {
    const response = await api.put(`/api/sinhvien/${id}`, studentData);
    return response.data;
  },

  // Delete student (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/api/sinhvien/${id}`);
    return response.data;
  },

  // Restore student
  restore: async (id) => {
    const response = await api.put(`/api/sinhvien/${id}/restore`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/sinhvien/statistics');
    return response.data;
  },

  // Search with filters
  search: async (params) => {
    const response = await api.get('/api/sinhvien/search', { params });
    return response.data;
  },

  // Bulk update status
  bulkUpdateStatus: async (studentIds, isActive) => {
    const response = await api.post('/api/sinhvien/bulk-update-status', {
      studentIds,
      isActive,
    });
    return response.data;
  },

  // Get count
  getCount: async () => {
    const response = await api.get('/api/sinhvien/count');
    return response.data;
  },
};

export default studentService;
