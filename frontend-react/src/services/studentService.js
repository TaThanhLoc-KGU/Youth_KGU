import api from './api';

const studentService = {
  // Get all students with pagination
  getAll: async (params = {}) => {
    const {
      page = 0,
      size = 10,
      sortBy = 'maSv',
      direction = 'asc',
      search,           // ← THÊM
      maLop,           // ← THÊM
      isActive         // ← THÊM
    } = params;

    // Tạo object params để gửi lên server
    const queryParams = {
      page,
      size,
      sortBy,
      direction
    };

    // Chỉ thêm params nếu có giá trị
    if (search) queryParams.search = search;
    if (maLop) queryParams.classFilter = maLop;  // Backend expects "classFilter"
    if (isActive !== null && isActive !== undefined) {
      queryParams.status = isActive ? 'active' : 'inactive';  // Backend expects "status"
    }

    // Gọi endpoint /search nếu có filter, ngược lại gọi endpoint chính
    const endpoint = (search || maLop || isActive !== null)
      ? '/api/sinhvien/search'
      : '/api/sinhvien';

    const response = await api.get(endpoint, { params: queryParams });
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

  // Validate email format
  validateEmailFormat: async (email) => {
    try {
      const response = await api.get('/api/sinhvien/validate-email', {
        params: { email },
      });
      return response.data?.data || { isValid: false };
    } catch (error) {
      // If API doesn't exist, validate locally
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      return { isValid: emailRegex.test(email) };
    }
  },

  // Check if email is duplicate
  checkDuplicateEmail: async (email, excludeMaSv = null) => {
    try {
      const response = await api.get('/api/sinhvien/check-duplicate-email', {
        params: { email, excludeMaSv },
      });
      return response.data?.data || { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return { isDuplicate: false };
    }
  },

  // Import students from Excel
  importFromExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/sinhvien/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export students to Excel
  exportToExcel: async (params = {}) => {
    const response = await api.get('/api/sinhvien/export-excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Download Excel template
  downloadTemplate: async () => {
    const response = await api.get('/api/sinhvien/template-excel', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Preview Excel import
  previewExcelImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/sinhvien/import-excel/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Confirm Excel import
  confirmExcelImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/sinhvien/import-excel/confirm', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default studentService;
