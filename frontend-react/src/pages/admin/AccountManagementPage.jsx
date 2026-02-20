import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import accountService from '../../services/accountService';
import logsService from '../../services/logsService';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  ROLE_LABELS,
  GENDER_LABELS,
  ROLE_OPTIONS,
  GENDER
} from '../../constants/accountConstants';
import api from '../../services/api';
import { formatDate } from '../../utils/dateFormat';

// ---- minimal log display helpers ----
const ACTION_LABELS = {
  CREATE: 'đã tạo mới', UPDATE: 'đã cập nhật', DELETE: 'đã xóa',
  LOGIN_SUCCESS: 'đã đăng nhập', LOGIN_FAILED: 'đăng nhập thất bại',
};
const ACTION_BG = {
  CREATE: 'bg-green-100 text-green-700', UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700', LOGIN_SUCCESS: 'bg-purple-100 text-purple-700',
  LOGIN_FAILED: 'bg-orange-100 text-orange-700',
};
const MODULE_LABELS = {
  AUTHENTICATION: 'Xác thực', HOAT_DONG: 'Hoạt động', SINH_VIEN: 'Sinh viên',
  TAI_KHOAN: 'Tài khoản', GIANG_VIEN: 'Giảng viên', DIEM_DANH: 'Điểm danh',
  SYSTEM: 'Hệ thống',
};

const DEFAULT_ROLE_FOR_TYPE = {
  SINH_VIEN: 'SINH_VIEN',
  GIANG_VIEN: 'GIANG_VIEN',
  CHUYEN_VIEN: 'CAN_BO_VAN_PHONG_DOAN',
};

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all'); // all | pending | search | create | bulk
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [createFormData, setCreateFormData] = useState({
    username: '', email: '', password: '', hoTen: '',
    soDienThoai: '', ngaySinh: '', gioiTinh: '', vaiTro: '', banChuyenMon: ''
  });
  const [editFormData, setEditFormData] = useState({
    hoTen: '', soDienThoai: '', ngaySinh: '', gioiTinh: '', avatar: '', vaiTro: '', banChuyenMon: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Bulk-create state
  const [sourceType, setSourceType] = useState('SINH_VIEN');
  const [selectedMas, setSelectedMas] = useState(new Set());
  const [defaultPassword, setDefaultPassword] = useState('KGU@123456');
  const [bulkCreateResult, setBulkCreateResult] = useState(null);

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyAccount, setHistoryAccount] = useState(null);

  // =================== Queries ===================

  const { data: allAccounts = [], isLoading: allAccountsLoading } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: () => accountService.getAllAccounts(),
    enabled: activeTab === 'all'
  });

  const { data: pendingAccounts = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingAccounts'],
    queryFn: () => accountService.getPendingApprovals(),
    enabled: activeTab === 'pending'
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['searchAccounts', searchKeyword],
    queryFn: () => accountService.searchAccounts(searchKeyword),
    enabled: activeTab === 'search' && searchKeyword.length > 0
  });

  const { data: withoutList = [], isLoading: withoutListLoading } = useQuery({
    queryKey: ['withoutAccount', sourceType],
    queryFn: () => accountService.getWithoutAccount(sourceType),
    enabled: activeTab === 'bulk'
  });

  const { data: historyLogs = [], isLoading: historyLoading } = useQuery({
    queryKey: ['accountHistory', historyAccount?.username],
    queryFn: () => logsService.search({ userId: historyAccount.username, size: 50 }),
    enabled: showHistoryModal && historyAccount !== null
  });

  const { data: banList = [] } = useQuery({
    queryKey: ['banList'],
    queryFn: () => api.get('/api/ban').then(r => r.data?.data || r.data || [])
  });

  // =================== Mutations ===================

  const approveMutation = useMutation({
    mutationFn: ({ accountId, note }) => accountService.approveAccount(accountId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setShowApproveModal(false);
      setSelectedAccount(null);
      setApproveNote('');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ accountId, reason }) => accountService.rejectAccount(accountId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setShowRejectModal(false);
      setSelectedAccount(null);
      setRejectReason('');
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ accountId, vaiTro }) => accountService.changeRole(accountId, vaiTro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ accountId, isActive }) => accountService.setAccountActive(accountId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => accountService.createAccountManually(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setCreateFormData({
        username: '', email: '', password: '', hoTen: '',
        soDienThoai: '', ngaySinh: '', gioiTinh: '', vaiTro: '', banChuyenMon: ''
      });
      setCreateErrors({});
    },
    onError: (error) => {
      setCreateErrors({ submit: error || 'Lỗi tạo tài khoản' });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ accountId, data }) => accountService.updateAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      setShowEditModal(false);
      setSelectedAccount(null);
      setEditFormData({ hoTen: '', soDienThoai: '', ngaySinh: '', gioiTinh: '', avatar: '', vaiTro: '', banChuyenMon: '' });
      setEditErrors({});
    },
    onError: (error) => {
      setEditErrors({ submit: error || 'Lỗi cập nhật tài khoản' });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (accountId) => accountService.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      setShowDeleteModal(false);
      setSelectedAccount(null);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (requests) => accountService.bulkCreate(requests),
    onSuccess: (result) => {
      setBulkCreateResult(result);
      setSelectedMas(new Set());
      queryClient.invalidateQueries({ queryKey: ['withoutAccount'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    },
    onError: (error) => {
      setBulkCreateResult({ error: error || 'Lỗi tạo hàng loạt' });
    }
  });

  // =================== Handlers ===================

  const handleApprove = (account) => { setSelectedAccount(account); setShowApproveModal(true); };
  const handleReject = (account) => { setSelectedAccount(account); setShowRejectModal(true); };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setEditFormData({
      hoTen: account.hoTen || '', soDienThoai: account.soDienThoai || '',
      ngaySinh: account.ngaySinh || '', gioiTinh: account.gioiTinh || '',
      avatar: account.avatar || '', vaiTro: account.vaiTro || '',
      banChuyenMon: account.banChuyenMon || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (account) => { setSelectedAccount(account); setShowDeleteModal(true); };

  const handleHistoryView = (account) => { setHistoryAccount(account); setShowHistoryModal(true); };

  const handleConfirmApprove = () => {
    if (selectedAccount) approveMutation.mutate({ accountId: selectedAccount.id, note: approveNote });
  };

  const handleConfirmReject = () => {
    if (selectedAccount && rejectReason.trim())
      rejectMutation.mutate({ accountId: selectedAccount.id, reason: rejectReason });
  };

  const handleConfirmDelete = () => {
    if (selectedAccount) deleteAccountMutation.mutate(selectedAccount.id);
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
    if (!createFormData.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống';
    if (!createFormData.vaiTro) errors.vaiTro = 'Vai trò không được để trống';
    return errors;
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống';
    if (!editFormData.vaiTro) errors.vaiTro = 'Vai trò không được để trống';
    return errors;
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
    if (createErrors[name]) setCreateErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCreateAccount = () => {
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }
    createAccountMutation.mutate({ ...createFormData, banChuyenMon: createFormData.banChuyenMon || '' });
  };

  const handleUpdateAccount = () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    if (selectedAccount)
      updateAccountMutation.mutate({ accountId: selectedAccount.id, data: { ...editFormData, banChuyenMon: editFormData.banChuyenMon || '' } });
  };

  // Bulk-create helpers
  const toggleSelectMa = (ma) => {
    setSelectedMas(prev => {
      const next = new Set(prev);
      next.has(ma) ? next.delete(ma) : next.add(ma);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMas.size === withoutList.length) {
      setSelectedMas(new Set());
    } else {
      setSelectedMas(new Set(withoutList.map(e => e.ma)));
    }
  };

  const handleBulkCreate = () => {
    const selected = withoutList.filter(e => selectedMas.has(e.ma));
    const requests = selected.map(e => {
      const emailOk = e.email && /^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i.test(e.email);
      const email = emailOk ? e.email : `${e.ma.toLowerCase().replace(/[^a-z0-9]/g, '')}@vnkgu.edu.vn`;
      return {
        username: e.ma,
        email,
        password: defaultPassword,
        hoTen: e.hoTen,
        vaiTro: DEFAULT_ROLE_FOR_TYPE[sourceType],
        banChuyenMon: null
      };
    });
    setBulkCreateResult(null);
    bulkCreateMutation.mutate(requests);
  };

  // =================== Sub-components ===================

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
              <td colSpan={showActions ? '6' : '5'} className="px-4 py-4 text-center text-gray-500">Đang tải...</td>
            </tr>
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={showActions ? '6' : '5'} className="px-4 py-4 text-center text-gray-500">Không có dữ liệu</td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{account.username}</td>
                <td className="px-4 py-3 text-sm">{account.email}</td>
                <td className="px-4 py-3">{account.hoTen || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">{ROLE_LABELS[account.vaiTro] || account.vaiTro}</td>
                <td className="px-4 py-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: APPROVAL_STATUS_COLORS[account.trangThaiPheDuyet] }}
                  >
                    {APPROVAL_STATUS_LABELS[account.trangThaiPheDuyet]}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {account.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
                        <>
                          <button onClick={() => handleApprove(account)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded">
                            Phê duyệt
                          </button>
                          <button onClick={() => handleReject(account)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded">
                            Từ chối
                          </button>
                        </>
                      )}
                      {activeTab === 'all' && (
                        <>
                          <button onClick={() => handleEditAccount(account)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">
                            Sửa
                          </button>
                          <button onClick={() => handleDeleteConfirm(account)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded">
                            Xóa
                          </button>
                          <button onClick={() => handleHistoryView(account)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded">
                            Lịch sử
                          </button>
                        </>
                      )}
                      {activeTab !== 'all' && account.isActive && (
                        <button
                          onClick={() => setActiveMutation.mutate({ accountId: account.id, isActive: false })}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded">
                          Vô hiệu
                        </button>
                      )}
                      {activeTab !== 'all' && !account.isActive && (
                        <button
                          onClick={() => setActiveMutation.mutate({ accountId: account.id, isActive: true })}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">
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

  // =================== Render ===================

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <p className="text-gray-600 mt-2">Quản lý tài khoản người dùng và phê duyệt đơn đăng ký</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: `Chờ phê duyệt (${pendingAccounts.length})` },
          { key: 'search', label: 'Tìm kiếm' },
          { key: 'create', label: 'Thêm tài khoản' },
          { key: 'bulk', label: 'Tạo từ danh sách' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearchKeyword(''); }}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
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
        {/* All accounts */}
        {activeTab === 'all' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tất cả tài khoản</h2>
            <AccountTable accounts={allAccounts} loading={allAccountsLoading} showActions={true} />
          </div>
        )}

        {/* Pending */}
        {activeTab === 'pending' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tài khoản chờ phê duyệt</h2>
            <AccountTable accounts={pendingAccounts} loading={pendingLoading} />
          </div>
        )}

        {/* Search results */}
        {activeTab === 'search' && searchKeyword && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Kết quả tìm kiếm</h2>
            <AccountTable accounts={searchResults} loading={searchLoading} />
          </div>
        )}
        {activeTab === 'search' && !searchKeyword && (
          <div className="p-6 text-center text-gray-500">Nhập từ khóa để tìm kiếm tài khoản</div>
        )}

        {/* Create manual */}
        {activeTab === 'create' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Tạo tài khoản mới</h2>
            {createErrors.submit && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{createErrors.submit}</div>
            )}
            {createAccountMutation.isSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">Tạo tài khoản thành công!</div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập *</label>
                <input type="text" name="username" value={createFormData.username} onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="username" />
                {createErrors.username && <p className="text-red-500 text-xs mt-1">{createErrors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={createFormData.email} onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="user@vnkgu.edu.vn" />
                {createErrors.email && <p className="text-red-500 text-xs mt-1">{createErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu *</label>
                <input type="password" name="password" value={createFormData.password} onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nhập mật khẩu" />
                {createErrors.password && <p className="text-red-500 text-xs mt-1">{createErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ tên *</label>
                <input type="text" name="hoTen" value={createFormData.hoTen} onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.hoTen ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Họ và tên" />
                {createErrors.hoTen && <p className="text-red-500 text-xs mt-1">{createErrors.hoTen}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input type="tel" name="soDienThoai" value={createFormData.soDienThoai} onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0987654321" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label>
                <input type="date" name="ngaySinh" value={createFormData.ngaySinh} onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Giới tính</label>
                <select name="gioiTinh" value={createFormData.gioiTinh} onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn giới tính</option>
                  <option value={GENDER.MALE}>Nam</option>
                  <option value={GENDER.FEMALE}>Nữ</option>
                  <option value={GENDER.OTHER}>Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vai trò *</label>
                <select name="vaiTro" value={createFormData.vaiTro} onChange={handleCreateFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.vaiTro ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Chọn vai trò</option>
                  {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                {createErrors.vaiTro && <p className="text-red-500 text-xs mt-1">{createErrors.vaiTro}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ban chuyên môn</label>
                <select name="banChuyenMon" value={createFormData.banChuyenMon} onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Không chọn</option>
                  {banList.map(ban => (
                    <option key={ban.maBan} value={ban.maBan}>{ban.tenBan}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCreateAccount} disabled={createAccountMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold">
                {createAccountMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        )}

        {/* Bulk create from list */}
        {activeTab === 'bulk' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">Tạo tài khoản từ danh sách</h2>
            <p className="text-gray-500 text-sm mb-6">
              Chọn sinh viên / giảng viên / chuyên viên chưa có tài khoản để tạo hàng loạt.
            </p>

            {/* Source type selector */}
            <div className="flex gap-3 mb-5">
              {[
                { value: 'SINH_VIEN', label: 'Sinh viên' },
                { value: 'GIANG_VIEN', label: 'Giảng viên' },
                { value: 'CHUYEN_VIEN', label: 'Chuyên viên' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSourceType(opt.value); setSelectedMas(new Set()); setBulkCreateResult(null); }}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
                    sourceType === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Default password */}
            <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-semibold text-gray-700 shrink-0">Mật khẩu mặc định:</label>
              <input
                type="text"
                value={defaultPassword}
                onChange={e => setDefaultPassword(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <span className="text-xs text-gray-400">Tất cả tài khoản mới sẽ dùng mật khẩu này</span>
            </div>

            {/* Result banner */}
            {bulkCreateResult && !bulkCreateResult.error && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-800">
                  Hoàn tất: Tạo thành công <strong>{bulkCreateResult.created}</strong> tài khoản
                  {bulkCreateResult.errors > 0 && `, ${bulkCreateResult.errors} lỗi`}.
                </p>
                {bulkCreateResult.errorMessages?.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {bulkCreateResult.errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                )}
              </div>
            )}
            {bulkCreateResult?.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{bulkCreateResult.error}</div>
            )}

            {/* Table */}
            {withoutListLoading ? (
              <div className="text-center py-8 text-gray-500">Đang tải danh sách...</div>
            ) : withoutList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Tất cả đã có tài khoản hoặc không có dữ liệu.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left w-12">
                          <input type="checkbox"
                            checked={selectedMas.size === withoutList.length && withoutList.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 cursor-pointer" />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Username sẽ tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withoutList.map(entity => {
                        const emailOk = entity.email && /^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i.test(entity.email);
                        const generatedEmail = emailOk ? entity.email : `${entity.ma.toLowerCase().replace(/[^a-z0-9]/g, '')}@vnkgu.edu.vn`;
                        return (
                          <tr key={entity.ma} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={selectedMas.has(entity.ma)}
                                onChange={() => toggleSelectMa(entity.ma)}
                                className="w-4 h-4 cursor-pointer" />
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">{entity.ma}</td>
                            <td className="px-4 py-3">{entity.hoTen}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {entity.email || <span className="text-orange-500 text-xs">→ {generatedEmail}</span>}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-blue-600">{entity.ma}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Đã chọn <strong>{selectedMas.size}</strong> / {withoutList.length} bản ghi
                  </span>
                  <button
                    onClick={handleBulkCreate}
                    disabled={selectedMas.size === 0 || bulkCreateMutation.isPending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-semibold"
                  >
                    {bulkCreateMutation.isPending ? 'Đang tạo...' : `Tạo ${selectedMas.size} tài khoản`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* =================== Approve Modal =================== */}
      {showApproveModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Phê duyệt tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Phê duyệt tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea placeholder="Ghi chú (tùy chọn)" value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleConfirmApprove} disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg">
                {approveMutation.isPending ? 'Đang xử lý...' : 'Phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Reject Modal =================== */}
      {showRejectModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Từ chối tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Từ chối tài khoản cho <strong>{selectedAccount.username}</strong>?
            </p>
            <textarea placeholder="Lý do từ chối (bắt buộc)" value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" rows="3" />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleConfirmReject} disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg">
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Edit Account Modal =================== */}
      {showEditModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-6">Chỉnh sửa tài khoản</h2>
            {editErrors.submit && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{editErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ tên *</label>
                <input type="text" name="hoTen" value={editFormData.hoTen} onChange={handleEditFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.hoTen ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Họ và tên" />
                {editErrors.hoTen && <p className="text-red-500 text-xs mt-1">{editErrors.hoTen}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input type="tel" name="soDienThoai" value={editFormData.soDienThoai} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0987654321" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label>
                <input type="date" name="ngaySinh" value={editFormData.ngaySinh} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Giới tính</label>
                <select name="gioiTinh" value={editFormData.gioiTinh} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn giới tính</option>
                  <option value={GENDER.MALE}>Nam</option>
                  <option value={GENDER.FEMALE}>Nữ</option>
                  <option value={GENDER.OTHER}>Khác</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Avatar URL</label>
                <input type="text" name="avatar" value={editFormData.avatar} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vai trò *</label>
                <select name="vaiTro" value={editFormData.vaiTro} onChange={handleEditFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.vaiTro ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Chọn vai trò</option>
                  {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                {editErrors.vaiTro && <p className="text-red-500 text-xs mt-1">{editErrors.vaiTro}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ban chuyên môn</label>
                <select name="banChuyenMon" value={editFormData.banChuyenMon} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Không chọn</option>
                  {banList.map(ban => (
                    <option key={ban.maBan} value={ban.maBan}>{ban.tenBan}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowEditModal(false); setEditErrors({}); }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">Hủy</button>
              <button onClick={handleUpdateAccount} disabled={updateAccountMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold">
                {updateAccountMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Delete Modal =================== */}
      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{selectedAccount.username}</strong>?
            </p>
            <p className="text-red-600 text-sm mb-4">Hành động này không thể hoàn tác!</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleConfirmDelete} disabled={deleteAccountMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg">
                {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== History Modal =================== */}
      {showHistoryModal && historyAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Lịch sử thao tác</h2>
                <p className="text-sm text-gray-500 mt-0.5">@{historyAccount.username} — {historyAccount.hoTen}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {historyLoading ? (
                <div className="py-8 text-center text-gray-400">Đang tải...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-400">Chưa có lịch sử thao tác nào.</div>
              ) : (
                historyLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-3">
                    <div className={`mt-0.5 p-1.5 rounded-full shrink-0 text-xs ${ACTION_BG[log.action] || 'bg-gray-100 text-gray-500'}`}>
                      {log.action?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ACTION_BG[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {MODULE_LABELS[log.module] || log.module}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{log.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{log.timeAgo || ''}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t mt-2">
              <button onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
