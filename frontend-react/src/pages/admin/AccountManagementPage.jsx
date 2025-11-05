import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import accountService from '../../services/accountService';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  ROLE_LABELS,
  GENDER_LABELS,
  ROLE_OPTIONS,
  DEPARTMENT_OPTIONS,
  GENDER
} from '../../constants/accountConstants';
import { formatDate } from '../../utils/dateFormat';

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all'); // all, pending, search, create
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    hoTen: '',
    soDienThoai: '',
    ngaySinh: '',
    gioiTinh: '',
    vaiTro: '',
    banChuyenMon: ''
  });
  const [editFormData, setEditFormData] = useState({
    hoTen: '',
    soDienThoai: '',
    ngaySinh: '',
    gioiTinh: '',
    avatar: '',
    vaiTro: '',
    banChuyenMon: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Query: All Accounts
  const { data: allAccounts = [], isLoading: allAccountsLoading } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: () => accountService.getAllAccounts(),
    enabled: activeTab === 'all'
  });

  // Query: Pending Approvals
  const { data: pendingAccounts = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingAccounts'],
    queryFn: () => accountService.getPendingApprovals()
  });

  // Query: Search Results
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['searchAccounts', searchKeyword],
    queryFn: () => accountService.searchAccounts(searchKeyword),
    enabled: searchKeyword.length > 0
  });

  // Mutation: Approve Account
  const approveMutation = useMutation({
    mutationFn: ({ accountId, note }) =>
      accountService.approveAccount(accountId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setShowApproveModal(false);
      setSelectedAccount(null);
      setApproveNote('');
    }
  });

  // Mutation: Reject Account
  const rejectMutation = useMutation({
    mutationFn: ({ accountId, reason }) =>
      accountService.rejectAccount(accountId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setShowRejectModal(false);
      setSelectedAccount(null);
      setRejectReason('');
    }
  });

  // Mutation: Change Role
  const changeRoleMutation = useMutation({
    mutationFn: ({ accountId, vaiTro }) =>
      accountService.changeRole(accountId, vaiTro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    }
  });

  // Mutation: Set Account Active
  const setActiveMutation = useMutation({
    mutationFn: ({ accountId, isActive }) =>
      accountService.setAccountActive(accountId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    }
  });

  // Mutation: Create Account Manually
  const createAccountMutation = useMutation({
    mutationFn: (data) => accountService.createAccountManually(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setShowCreateModal(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        hoTen: '',
        soDienThoai: '',
        ngaySinh: '',
        gioiTinh: '',
        vaiTro: '',
        banChuyenMon: ''
      });
      setCreateErrors({});
    },
    onError: (error) => {
      setCreateErrors({ submit: error.message || 'Lỗi tạo tài khoản' });
    }
  });

  // Mutation: Update Account
  const updateAccountMutation = useMutation({
    mutationFn: ({ accountId, data }) =>
      accountService.updateAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      setShowEditModal(false);
      setSelectedAccount(null);
      setEditFormData({
        hoTen: '',
        soDienThoai: '',
        ngaySinh: '',
        gioiTinh: '',
        avatar: '',
        vaiTro: '',
        banChuyenMon: ''
      });
      setEditErrors({});
    },
    onError: (error) => {
      setEditErrors({ submit: error.message || 'Lỗi cập nhật tài khoản' });
    }
  });

  // Mutation: Delete Account
  const deleteAccountMutation = useMutation({
    mutationFn: (accountId) =>
      accountService.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      setShowDeleteModal(false);
      setSelectedAccount(null);
    }
  });

  const handleApprove = (account) => {
    setSelectedAccount(account);
    setShowApproveModal(true);
  };

  const handleReject = (account) => {
    setSelectedAccount(account);
    setShowRejectModal(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setEditFormData({
      hoTen: account.hoTen || '',
      soDienThoai: account.soDienThoai || '',
      ngaySinh: account.ngaySinh || '',
      gioiTinh: account.gioiTinh || '',
      avatar: account.avatar || '',
      vaiTro: account.vaiTro || '',
      banChuyenMon: account.banChuyenMon || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const handleConfirmApprove = () => {
    if (selectedAccount) {
      approveMutation.mutate({
        accountId: selectedAccount.id,
        note: approveNote
      });
    }
  };

  const handleConfirmReject = () => {
    if (selectedAccount && rejectReason.trim()) {
      rejectMutation.mutate({
        accountId: selectedAccount.id,
        reason: rejectReason
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedAccount) {
      deleteAccountMutation.mutate(selectedAccount.id);
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createFormData.username.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    } else if (!/^[a-zA-Z0-9_]{3,50}$/.test(createFormData.username)) {
      errors.username = 'Tên đăng nhập phải chứa 3-50 ký tự (chữ, số, dấu gạch dưới)';
    }

    if (!createFormData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i.test(createFormData.email)) {
      errors.email = 'Email phải có dạng @vnkgu.edu.vn';
    }

    if (!createFormData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (createFormData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!createFormData.hoTen.trim()) {
      errors.hoTen = 'Họ tên không được để trống';
    }

    if (!createFormData.vaiTro) {
      errors.vaiTro = 'Vai trò không được để trống';
    }

    return errors;
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.hoTen.trim()) {
      errors.hoTen = 'Họ tên không được để trống';
    }

    if (!editFormData.vaiTro) {
      errors.vaiTro = 'Vai trò không được để trống';
    }

    return errors;
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (createErrors[name]) {
      setCreateErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateAccount = () => {
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    createAccountMutation.mutate(createFormData);
  };

  const handleUpdateAccount = () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    if (selectedAccount) {
      updateAccountMutation.mutate({
        accountId: selectedAccount.id,
        data: editFormData
      });
    }
  };

  const AccountTable = ({ accounts, loading, showActions = true }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên đăng nhập</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Vai trò</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
            {showActions && (
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Hành động</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={showActions ? "6" : "5"} className="px-4 py-4 text-center text-gray-500">
                Đang tải...
              </td>
            </tr>
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={showActions ? "6" : "5"} className="px-4 py-4 text-center text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{account.username}</td>
                <td className="px-4 py-3 text-sm">{account.email}</td>
                <td className="px-4 py-3">{account.hoTen || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">
                  {ROLE_LABELS[account.vaiTro] || account.vaiTro}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{
                      backgroundColor: APPROVAL_STATUS_COLORS[account.trangThaiPheDuyet]
                    }}
                  >
                    {APPROVAL_STATUS_LABELS[account.trangThaiPheDuyet]}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {account.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
                        <>
                          <button
                            onClick={() => handleApprove(account)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                          >
                            Phê duyệt
                          </button>
                          <button
                            onClick={() => handleReject(account)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {activeTab === 'all' && (
                        <>
                          <button
                            onClick={() => handleEditAccount(account)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(account)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                      {activeTab !== 'all' && account.isActive && (
                        <button
                          onClick={() =>
                            setActiveMutation.mutate({
                              accountId: account.id,
                              isActive: false
                            })
                          }
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
                        >
                          Vô hiệu
                        </button>
                      )}
                      {activeTab !== 'all' && !account.isActive && (
                        <button
                          onClick={() =>
                            setActiveMutation.mutate({
                              accountId: account.id,
                              isActive: true
                            })
                          }
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                        >
                          Kích hoạt
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <p className="text-gray-600 mt-2">Quản lý tài khoản người dùng và phê duyệt đơn đăng ký</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => {
            setActiveTab('all');
            setSearchKeyword('');
          }}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => {
            setActiveTab('pending');
            setSearchKeyword('');
          }}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Chờ phê duyệt ({pendingAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Tìm kiếm
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Thêm tài khoản
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo username, email hoặc tên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'all' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tất cả tài khoản</h2>
            <AccountTable accounts={allAccounts} loading={allAccountsLoading} showActions={true} />
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tài khoản chờ phê duyệt</h2>
            <AccountTable accounts={pendingAccounts} loading={pendingLoading} />
          </div>
        )}

        {activeTab === 'search' && searchKeyword && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm</h2>
            <AccountTable accounts={searchResults} loading={searchLoading} />
          </div>
        )}

        {activeTab === 'search' && !searchKeyword && (
          <div className="p-6 text-center text-gray-500">
            Nhập từ khóa để tìm kiếm tài khoản
          </div>
        )}

        {activeTab === 'create' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Tạo tài khoản mới</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              + Tạo tài khoản
            </button>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Phê duyệt tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Phê duyệt tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea
              placeholder="Ghi chú (tùy chọn)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {approveMutation.isPending ? 'Đang xử lý...' : 'Phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Từ chối tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Từ chối tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea
              placeholder="Lý do từ chối (bắt buộc)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-6">Chỉnh sửa tài khoản</h2>

            {editErrors.submit && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {editErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  name="hoTen"
                  value={editFormData.hoTen}
                  onChange={handleEditFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.hoTen ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Họ và tên"
                />
                {editErrors.hoTen && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.hoTen}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="soDienThoai"
                  value={editFormData.soDienThoai}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0987654321"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="ngaySinh"
                  value={editFormData.ngaySinh}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  name="gioiTinh"
                  value={editFormData.gioiTinh}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value={GENDER.MALE}>Nam</option>
                  <option value={GENDER.FEMALE}>Nữ</option>
                  <option value={GENDER.OTHER}>Khác</option>
                </select>
              </div>

              {/* Avatar URL */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={editFormData.avatar}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Vai trò *
                </label>
                <select
                  name="vaiTro"
                  value={editFormData.vaiTro}
                  onChange={handleEditFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.vaiTro ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn vai trò</option>
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {editErrors.vaiTro && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.vaiTro}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ban chuyên môn
                </label>
                <select
                  name="banChuyenMon"
                  value={editFormData.banChuyenMon}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn ban chuyên môn</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({
                    hoTen: '',
                    soDienThoai: '',
                    ngaySinh: '',
                    gioiTinh: '',
                    avatar: '',
                    vaiTro: '',
                    banChuyenMon: ''
                  });
                  setEditErrors({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateAccount}
                disabled={updateAccountMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
              >
                {updateAccountMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{selectedAccount.username}</strong>?
            </p>
            <p className="text-red-600 text-sm mb-4">
              Hành động này không thể hoàn tác!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteAccountMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-6">Tạo tài khoản mới</h2>

            {createErrors.submit && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {createErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  name="username"
                  value={createFormData.username}
                  onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    createErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="username"
                />
                {createErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{createErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={createFormData.email}
                  onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    createErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="user@vnkgu.edu.vn"
                />
                {createErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{createErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  value={createFormData.password}
                  onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    createErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu"
                />
                {createErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{createErrors.password}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  name="hoTen"
                  value={createFormData.hoTen}
                  onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    createErrors.hoTen ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Họ và tên"
                />
                {createErrors.hoTen && (
                  <p className="text-red-500 text-xs mt-1">{createErrors.hoTen}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="soDienThoai"
                  value={createFormData.soDienThoai}
                  onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0987654321"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="ngaySinh"
                  value={createFormData.ngaySinh}
                  onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  name="gioiTinh"
                  value={createFormData.gioiTinh}
                  onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value={GENDER.MALE}>Nam</option>
                  <option value={GENDER.FEMALE}>Nữ</option>
                  <option value={GENDER.OTHER}>Khác</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Vai trò *
                </label>
                <select
                  name="vaiTro"
                  value={createFormData.vaiTro}
                  onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    createErrors.vaiTro ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn vai trò</option>
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {createErrors.vaiTro && (
                  <p className="text-red-500 text-xs mt-1">{createErrors.vaiTro}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ban chuyên môn
                </label>
                <select
                  name="banChuyenMon"
                  value={createFormData.banChuyenMon}
                  onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn ban chuyên môn</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    username: '',
                    email: '',
                    password: '',
                    hoTen: '',
                    soDienThoai: '',
                    ngaySinh: '',
                    gioiTinh: '',
                    vaiTro: '',
                    banChuyenMon: ''
                  });
                  setCreateErrors({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={createAccountMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
              >
                {createAccountMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
