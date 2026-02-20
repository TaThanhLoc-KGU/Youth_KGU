import api from './api';

const bulkAccountService = {
  /**
   * Tạo tài khoản hàng loạt
   * @param {Object} data - Data containing account lists and options
   * @returns {Promise} Response with results
   */
  createBulk: async (data) => {
    try {
      const response = await api.post('/api/accounts/bulk/create', data);
      return response.data?.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Preview dữ liệu trước khi tạo (nếu backend support)
   * @param {Object} data - Data to preview
   * @returns {Promise} Preview result
   */
  previewBulk: async (data) => {
    try {
      const response = await api.post('/api/accounts/bulk/preview', data);
      return response.data?.data || response.data;
    } catch (error) {
      // Nếu endpoint preview không có, return mock response
      return {
        success: true,
        message: 'Preview (client-side)',
        data: data
      };
    }
  },

  /**
   * Lấy template Excel
   * @returns {Blob} Excel file
   */
  downloadTemplate: async () => {
    try {
      const response = await api.get('/api/accounts/bulk/template', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Nếu backend không có, tạo template client-side
      return null;
    }
  },

  /**
   * Lấy danh sách chức vụ từ BCH
   * @returns {Promise} List of positions
   */
  getBCHPositions: async () => {
    try {
      const response = await api.get('/api/bch/positions');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching BCH positions:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách ban chấp hành
   * @param {Object} filters - Filter options (term, department, etc.)
   * @returns {Promise} List of BCH members
   */
  getBCHMembers: async (filters = {}) => {
    try {
      const response = await api.get('/api/bch', { params: filters });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching BCH members:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách sinh viên
   * @param {Object} filters - Filter options
   * @returns {Promise} List of students
   */
  getStudents: async (filters = {}) => {
    try {
      const response = await api.get('/api/sinhvien', { params: filters });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách giảng viên
   * @param {Object} filters - Filter options
   * @returns {Promise} List of teachers
   */
  getTeachers: async (filters = {}) => {
    try {
      const response = await api.get('/api/giangvien', { params: filters });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách chuyên viên
   * @param {Object} filters - Filter options
   * @returns {Promise} List of specialists
   */
  getSpecialists: async (filters = {}) => {
    try {
      const response = await api.get('/api/chuyenvien', { params: filters });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching specialists:', error);
      return [];
    }
  }
};

export default bulkAccountService;
