import api from './api';
import { ACCOUNT_API } from '../constants/accountConstants';

/**
 * Service để quản lý tài khoản người dùng
 */
const accountService = {
  /**
   * Đăng ký tài khoản mới
   * @param {object} data - Thông tin đăng ký
   * @returns {Promise}
   */
  register: async (data) => {
    try {
      const response = await api.post(ACCOUNT_API.REGISTER, {
        username: data.username,
        email: data.email,
        password: data.password,
        hoTen: data.hoTen,
        soDienThoai: data.soDienThoai,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi đăng ký tài khoản';
    }
  },

  /**
   * Lấy thông tin tài khoản của chính mình (không cần permission đặc biệt)
   * @returns {Promise}
   */
  getMyProfile: async () => {
    try {
      const response = await api.get('/api/accounts/me');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy thông tin tài khoản';
    }
  },

  /**
   * Lấy thông tin tài khoản theo ID
   * @param {number} accountId - ID tài khoản
   * @returns {Promise}
   */
  getAccount: async (accountId) => {
    try {
      const response = await api.get(ACCOUNT_API.GET_BY_ID(accountId));
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy thông tin tài khoản';
    }
  },

  /**
   * Cập nhật thông tin hồ sơ
   * @param {number} accountId - ID tài khoản
   * @param {object} data - Thông tin cần cập nhật
   * @returns {Promise}
   */
  updateProfile: async (accountId, data) => {
    try {
      const response = await api.put(ACCOUNT_API.UPDATE_PROFILE(accountId), {
        hoTen: data.hoTen,
        soDienThoai: data.soDienThoai,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh,
        avatar: data.avatar,
        banChuyenMon: data.banChuyenMon
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi cập nhật hồ sơ';
    }
  },

  /**
   * Phê duyệt tài khoản
   * @param {number} accountId - ID tài khoản
   * @param {string} ghiChu - Ghi chú phê duyệt
   * @returns {Promise}
   */
  approveAccount: async (accountId, ghiChu = '') => {
    try {
      const response = await api.post(
        ACCOUNT_API.APPROVE(accountId),
        {},
        { params: { ghiChu } }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi phê duyệt tài khoản';
    }
  },

  /**
   * Từ chối tài khoản
   * @param {number} accountId - ID tài khoản
   * @param {string} lyDo - Lý do từ chối
   * @returns {Promise}
   */
  rejectAccount: async (accountId, lyDo) => {
    try {
      const response = await api.post(
        ACCOUNT_API.REJECT(accountId),
        {},
        { params: { lyDo } }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi từ chối tài khoản';
    }
  },

  /**
   * Lấy danh sách tài khoản chờ phê duyệt
   * @returns {Promise}
   */
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/api/accounts/pending-approval');
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy danh sách tài khoản chờ phê duyệt';
    }
  },

  /**
   * Tìm kiếm tài khoản
   * @param {string} keyword - Từ khóa tìm kiếm
   * @returns {Promise}
   */
  searchAccounts: async (keyword) => {
    try {
      const response = await api.get(ACCOUNT_API.SEARCH, {
        params: { keyword }
      });
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi tìm kiếm tài khoản';
    }
  },

  /**
   * Lấy danh sách tài khoản theo vai trò
   * @param {string} vaiTro - Vai trò
   * @returns {Promise}
   */
  getAccountsByRole: async (vaiTro) => {
    try {
      const response = await api.get(ACCOUNT_API.BY_ROLE(vaiTro));
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy danh sách tài khoản';
    }
  },

  /**
   * Thay đổi vai trò tài khoản
   * @param {number} accountId - ID tài khoản
   * @param {string} vaiTro - Vai trò mới
   * @returns {Promise}
   */
  changeRole: async (accountId, vaiTro) => {
    try {
      const response = await api.patch(
        ACCOUNT_API.CHANGE_ROLE(accountId),
        {},
        { params: { vaiTro } }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi thay đổi vai trò';
    }
  },

  /**
   * Kích hoạt/Vô hiệu hóa tài khoản
   * @param {number} accountId - ID tài khoản
   * @param {boolean} isActive - Trạng thái hoạt động
   * @returns {Promise}
   */
  setAccountActive: async (accountId, isActive) => {
    try {
      const response = await api.patch(
        ACCOUNT_API.SET_ACTIVE(accountId),
        { isActive }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi cập nhật trạng thái tài khoản';
    }
  },

  /**
   * Lấy thống kê toàn bộ hệ thống
   * @returns {Promise}
   */
  getSystemStatistics: async () => {
    try {
      const response = await api.get(ACCOUNT_API.STATISTICS_SYSTEM);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy thống kê';
    }
  },

  /**
   * Lấy số tài khoản chờ phê duyệt
   * @returns {Promise<number>}
   */
  getPendingApprovalsCount: async () => {
    try {
      const response = await api.get(ACCOUNT_API.STATISTICS_PENDING_COUNT);
      return response.data.data || 0;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy số tài khoản chờ phê duyệt';
    }
  },

  /**
   * Lấy thống kê tài khoản theo vai trò
   * @returns {Promise}
   */
  getStatisticsByRole: async () => {
    try {
      const response = await api.get(ACCOUNT_API.STATISTICS_BY_ROLE);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy thống kê vai trò';
    }
  },

  /**
   * Lấy thống kê tài khoản theo tổ chức
   * @returns {Promise}
   */
  getStatisticsByOrganization: async () => {
    try {
      const response = await api.get(ACCOUNT_API.STATISTICS_BY_ORGANIZATION);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy thống kê tổ chức';
    }
  },

  /**
   * Tạo tài khoản thủ công (Admin only)
   * @param {object} data - Thông tin tài khoản
   * @returns {Promise}
   */
  createAccountManually: async (data) => {
    try {
      const response = await api.post(ACCOUNT_API.CREATE_MANUAL, {
        username: data.username,
        email: data.email,
        password: data.password,
        hoTen: data.hoTen,
        soDienThoai: data.soDienThoai,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh,
        vaiTro: data.vaiTro,
        bchLevel: data.bchLevel ? parseInt(data.bchLevel) : null,
        banChuyenMon: data.banChuyenMon || null,
        avatar: data.avatar
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi tạo tài khoản';
    }
  },

  /**
   * Lấy danh sách tất cả tài khoản
   * @returns {Promise}
   */
  getAllAccounts: async () => {
    try {
      const response = await api.get('/api/accounts');
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy danh sách tài khoản';
    }
  },

  /**
   * Cập nhật tài khoản
   * @param {number} accountId - ID tài khoản
   * @param {object} data - Thông tin cập nhật
   * @returns {Promise}
   */
  updateAccount: async (accountId, data) => {
    try {
      const response = await api.put(`/api/accounts/${accountId}`, {
        hoTen: data.hoTen,
        soDienThoai: data.soDienThoai,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh,
        avatar: data.avatar,
        vaiTro: data.vaiTro,
        bchLevel: data.bchLevel ? parseInt(data.bchLevel) : null,
        banChuyenMon: data.banChuyenMon || null
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi cập nhật tài khoản';
    }
  },

  /**
   * Xóa tài khoản
   * @param {number} accountId - ID tài khoản
   * @returns {Promise}
   */
  deleteAccount: async (accountId) => {
    try {
      await api.delete(`/api/accounts/${accountId}`);
      return true;
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi xóa tài khoản';
    }
  },

  /**
   * Reset mật khẩu về mặc định KGU@123456
   * @param {number} accountId - ID tài khoản
   * @returns {Promise<string>} - Message thành công
   */
  resetPassword: async (accountId) => {
    try {
      const response = await api.post(`/api/accounts/${accountId}/reset-password`);
      return response.data?.message || 'Reset mật khẩu thành công';
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi reset mật khẩu';
    }
  },

  /**
   * Lấy danh sách sinh viên/giảng viên/chuyên viên chưa có tài khoản
   * @param {string} type - SINH_VIEN | GIANG_VIEN | CHUYEN_VIEN
   * @returns {Promise<Array>}
   */
  getWithoutAccount: async (type) => {
    try {
      const response = await api.get(`/api/accounts/without-account/${type}`);
      return response.data?.data || [];
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi lấy danh sách';
    }
  },

  /**
   * Tạo hàng loạt tài khoản
   * @param {Array} requests - Danh sách CreateAccountRequest
   * @returns {Promise<Object>} - { created, errors, errorMessages }
   */
  bulkCreate: async (requests) => {
    try {
      const response = await api.post('/api/accounts/bulk-create', requests);
      return response.data?.data || {};
    } catch (error) {
      throw error.response?.data?.message || 'Lỗi tạo hàng loạt tài khoản';
    }
  }
};

export default accountService;
