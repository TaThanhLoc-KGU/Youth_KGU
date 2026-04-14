import React, { useState, useMemo, useEffect, useCallback } from 'react';

const PAGE_SIZE = 20;
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import accountService from '../../services/accountService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
import PermissionAssignModal from '../../components/admin/PermissionAssignModal';
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
  GIANG_VIEN: 'QUAN_LY',
  CHUYEN_VIEN: 'QUAN_LY',
};

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canApprove = hasPermission(PERMISSIONS.APPROVE_TAI_KHOAN);
  const canCreate  = hasPermission(PERMISSIONS.CREATE_TAI_KHOAN);
  const canEdit    = hasPermission(PERMISSIONS.EDIT_TAI_KHOAN);
  const canDelete  = hasPermission(PERMISSIONS.DELETE_TAI_KHOAN);
  const [activeTab, setActiveTab] = useState('all'); // all | pending | create | bulk
  const [searchKeyword, setSearchKeyword] = useState('');
  const [allSearchKeyword, setAllSearchKeyword] = useState('');
  const [appliedAllSearch, setAppliedAllSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | SINH_VIEN | QUAN_LY
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [createFormData, setCreateFormData] = useState({
    username: '', email: '', password: '', hoTen: '',
    soDienThoai: '', ngaySinh: '', gioiTinh: '', vaiTro: '', banChuyenMon: '', maKhoa: ''
  });
  const [editFormData, setEditFormData] = useState({
    hoTen: '', soDienThoai: '', ngaySinh: '', gioiTinh: '', avatar: '', vaiTro: '', banChuyenMon: '', maKhoa: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Bulk-create state
  const [sourceType, setSourceType] = useState('SINH_VIEN');
  const [selectedMas, setSelectedMas] = useState(new Set());
  const [defaultPassword, setDefaultPassword] = useState('KGU@123456');
  const [bulkCreateResult, setBulkCreateResult] = useState(null);

  // Permission assign modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionAccount, setPermissionAccount] = useState(null);
  const canManagePermissions = hasPermission(PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN);

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

  const { data: historyLogsData, isLoading: historyLoading } = useQuery({
    queryKey: ['accountHistory', historyAccount?.username],
    queryFn: () => logsService.search({ userId: historyAccount.username, size: 50 }),
    enabled: showHistoryModal && historyAccount !== null
  });

  // Ensure historyLogs is always an array
  const historyLogs = Array.isArray(historyLogsData) ? historyLogsData : (historyLogsData?.content || []);

  const { data: banList = [] } = useQuery({
    queryKey: ['banList'],
    queryFn: () => api.get('/api/ban').then(r => r.data?.data || r.data || [])
  });

  const { data: khoaList = [] } = useQuery({
    queryKey: ['khoaActive'],
    queryFn: () => api.get('/api/khoa/active').then(r => r.data?.data || r.data || [])
  });

  // Client-side filtered accounts for the 'all' tab
  // appliedAllSearch chỉ cập nhật khi nhấn Enter hoặc nút Tìm (không real-time)
  const filteredAccounts = useMemo(() => {
    let result = allAccounts;
    if (roleFilter === 'SINH_VIEN') {
      result = result.filter(a => a.vaiTro === 'SINH_VIEN');
    } else if (roleFilter === 'QUAN_LY') {
      result = result.filter(a => a.vaiTro === 'QUAN_LY');
    }
    if (appliedAllSearch.trim()) {
      const kw = appliedAllSearch.toLowerCase();
      result = result.filter(a =>
        a.username?.toLowerCase().includes(kw) ||
        a.email?.toLowerCase().includes(kw) ||
        a.hoTen?.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [allAccounts, roleFilter, appliedAllSearch]);

  // Reset về trang 1 khi filter/search thay đổi
  useEffect(() => { setCurrentPage(1); }, [roleFilter, appliedAllSearch]);

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, currentPage]);

  const handleApplySearch = useCallback(() => {
    setAppliedAllSearch(allSearchKeyword);
    setCurrentPage(1);
  }, [allSearchKeyword]);

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
      setEditFormData({ hoTen: '', soDienThoai: '', ngaySinh: '', gioiTinh: '', avatar: '', vaiTro: '', banChuyenMon: '', maKhoa: '' });
      setEditErrors({})
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

  const resetPasswordMutation = useMutation({
    mutationFn: (accountId) => accountService.resetPassword(accountId),
    onSuccess: (message) => {
      toast.success(message || 'Đã reset mật khẩu về KGU@123456');
    },
    onError: (error) => {
      toast.error(typeof error === 'string' ? error : 'Lỗi reset mật khẩu');
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (requests) => accountService.bulkCreate(requests),
    onSuccess: (result) => {
      setBulkCreateResult(result);
      setSelectedMas(new Set());
      queryClient.invalidateQueries({ queryKey: ['withoutAccount', sourceType] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || 'Lỗi tạo hàng loạt';
      setBulkCreateResult({ error: msg });
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
      banChuyenMon: account.banChuyenMon || '', maKhoa: account.maKhoa || '',
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
      const generatedEmail = emailOk ? e.email : `${e.ma.toLowerCase().replace(/[^a-z0-9]/g, '')}@vnkgu.edu.vn`;
      return {
        username: e.ma,
        email: generatedEmail,
        password: defaultPassword,
        hoTen: e.hoTen,
        vaiTro: DEFAULT_ROLE_FOR_TYPE[sourceType],
        banChuyenMon: null,
        maSv: sourceType === 'SINH_VIEN' ? e.ma : null,
        maGv: sourceType === 'GIANG_VIEN' ? e.ma : null,
        maChuyenVien: sourceType === 'CHUYEN_VIEN' ? e.ma : null,
      };
    });
    setBulkCreateResult(null);
    bulkCreateMutation.mutate(requests);
  };

  // =================== Sub-components ===================

  const AccountTable = ({ accounts, loading, showActions = true }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Tên đăng nhập</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Email</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Họ tên</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Vai trò</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Trạng thái</th>
            {showActions && (
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Hành động</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={showActions ? '6' : '5'} className="px-3 py-4 text-center text-gray-500 text-sm">Đang tải...</td>
            </tr>
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={showActions ? '6' : '5'} className="px-3 py-4 text-center text-gray-500 text-sm">Không có dữ liệu</td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-medium text-sm">{account.username}</td>
                <td className="px-3 py-2 text-xs text-gray-600 hidden sm:table-cell">{account.email}</td>
                <td className="px-3 py-2 text-xs hidden md:table-cell">{account.hoTen || 'N/A'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {ROLE_LABELS[account.vaiTro] || account.vaiTro}
                  {account.vaiTro === 'QUAN_LY' && account.laAdmin && (
                    <span className="ml-1 px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">Admin</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
                    style={{ backgroundColor: APPROVAL_STATUS_COLORS[account.trangThaiPheDuyet] }}
                  >
                    {APPROVAL_STATUS_LABELS[account.trangThaiPheDuyet]}
                  </span>
                </td>
                {showActions && (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 flex-nowrap">
                      {account.trangThaiPheDuyet === 'CHO_PHE_DUYET' && canApprove && (
                        <>
                          <button onClick={() => handleApprove(account)}
                            className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded whitespace-nowrap">
                            Phê duyệt
                          </button>
                          <button onClick={() => handleReject(account)}
                            className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded whitespace-nowrap">
                            Từ chối
                          </button>
                        </>
                      )}
                      {activeTab === 'all' && (
                        <>
                          {canEdit && (
                            <button onClick={() => handleEditAccount(account)}
                              className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded">
                              Sửa
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteConfirm(account)}
                              className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded">
                              Xóa
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Reset mật khẩu của "${account.hoTen || account.username}" về KGU@123456?`))
                                  resetPasswordMutation.mutate(account.id);
                              }}
                              disabled={resetPasswordMutation.isPending}
                              className="px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white text-xs rounded whitespace-nowrap">
                              Reset MK
                            </button>
                          )}
                          <button onClick={() => handleHistoryView(account)}
                            className="px-2 py-0.5 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded">
                            Lịch sử
                          </button>
                          {account.vaiTro === 'QUAN_LY' && canManagePermissions && (
                            <button
                              onClick={() => { setPermissionAccount(account); setShowPermissionModal(true); }}
                              className="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded whitespace-nowrap">
                              Phân quyền
                            </button>
                          )}
                        </>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => setActiveMutation.mutate({ accountId: account.id, isActive: !account.isActive })}
                          disabled={setActiveMutation.isPending}
                          title={account.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ml-1 ${
                            account.isActive ? 'bg-green-500' : 'bg-gray-300'
                          } ${setActiveMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                              account.isActive ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
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
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <p className="text-gray-600 mt-2">Quản lý tài khoản người dùng và phê duyệt đơn đăng ký</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: `Chờ phê duyệt (${pendingAccounts.length})` },
          ...(canCreate ? [
            { key: 'create', label: 'Thêm tài khoản' },
            { key: 'bulk', label: 'Tạo từ danh sách' },
          ] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearchKeyword(''); setAllSearchKeyword(''); setAppliedAllSearch(''); setRoleFilter('ALL'); setCurrentPage(1); }}
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

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {/* All accounts */}
        {activeTab === 'all' && (
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-bold text-gray-800">
                  Tất cả tài khoản
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    ({filteredAccounts.length} / {allAccounts.length})
                  </span>
                </h2>
                {/* Role filter sub-tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: 'ALL', label: `Tất cả (${allAccounts.length})` },
                    { key: 'SINH_VIEN', label: `Sinh viên (${allAccounts.filter(a => a.vaiTro === 'SINH_VIEN').length})` },
                    { key: 'QUAN_LY', label: `Quản lý (${allAccounts.filter(a => a.vaiTro === 'QUAN_LY').length})` },
                  ].map(rf => (
                    <button
                      key={rf.key}
                      onClick={() => setRoleFilter(rf.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        roleFilter === rf.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nhập mã / họ tên → Enter"
                  value={allSearchKeyword}
                  onChange={(e) => setAllSearchKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplySearch(); }}
                  className="w-full sm:w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApplySearch}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  Tìm
                </button>
                {appliedAllSearch && (
                  <button
                    onClick={() => { setAllSearchKeyword(''); setAppliedAllSearch(''); }}
                    className="px-2 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <AccountTable accounts={paginatedAccounts} loading={allAccountsLoading} showActions={true} />

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
                <span className="text-sm text-gray-500">
                  Trang {currentPage}/{totalPages} · Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAccounts.length)} / {filteredAccounts.length} tài khoản
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                  >«</button>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                  >‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const page = start + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                      >{page}</button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                  >›</button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                  >»</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending */}
        {activeTab === 'pending' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tài khoản chờ phê duyệt</h2>
            <AccountTable accounts={pendingAccounts} loading={pendingLoading} />
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                <input type="date" lang="vi" name="ngaySinh" value={createFormData.ngaySinh} onChange={handleCreateFormChange}
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

            {/* Khoa Scope — chỉ hiện khi vai trò là QUAN_LY */}
            {createFormData.vaiTro === 'QUAN_LY' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-amber-900 mb-1">
                  Phạm vi Khoa <span className="font-normal text-amber-700">(tuỳ chọn)</span>
                </label>
                <select name="maKhoa" value={createFormData.maKhoa} onChange={handleCreateFormChange}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Đoàn trường — không giới hạn khoa</option>
                  {khoaList.map(k => (
                    <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-amber-700 italic">
                  Nếu chọn Khoa, tài khoản này chỉ thấy và quản lý hoạt động của Khoa đó.
                </p>
              </div>
            )}

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
            <div className="flex flex-wrap gap-3 mb-5">
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
            <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-gray-50 rounded-lg">
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

                <div className="flex flex-wrap items-center justify-between gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                <input type="date" lang="vi" name="ngaySinh" value={editFormData.ngaySinh} onChange={handleEditFormChange}
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
            {editFormData.vaiTro === 'QUAN_LY' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  Phạm vi Khoa <span className="font-normal text-amber-700">(tuỳ chọn)</span>
                </label>
                <select name="maKhoa" value={editFormData.maKhoa} onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Đoàn trường — không giới hạn khoa</option>
                  {khoaList.map(k => (
                    <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa}</option>
                  ))}
                </select>
                <p className="text-xs text-amber-600 mt-1">
                  Chọn khoa để giới hạn tài khoản này chỉ quản lý dữ liệu của khoa đó.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-4">
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

      {/* =================== Permission Modal =================== */}
      {showPermissionModal && permissionAccount && (
        <PermissionAssignModal
          account={permissionAccount}
          isOpen={showPermissionModal}
          onClose={() => { setShowPermissionModal(false); setPermissionAccount(null); }}
        />
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
