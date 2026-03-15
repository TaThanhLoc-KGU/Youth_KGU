import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import accountService from '../../services/accountService';
import permissionService from '../../services/permissionService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';
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
import { Shield, Lock, AlertTriangle, X } from 'lucide-react';

// ---- Xác nhận mật khẩu admin trước khi phân quyền ----
function PasswordConfirmModal({ onConfirm, onCancel, title, error }) {
  const [password, setPassword] = useState('');
  const { user } = useAuthStore();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Xác nhận phân quyền</h3>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">Nhập mật khẩu của bạn để xác nhận việc phân quyền.</p>
        </div>
        {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu xác nhận</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu của bạn..." autoFocus
          className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => e.key === 'Enter' && password && onConfirm(user?.username, password)} />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => onConfirm(user?.username, password)} disabled={!password}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold">
            Xác nhận & Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

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
  CHUYEN_VIEN: 'CHUYEN_VIEN',
};

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, user: currentUser } = useAuthStore();
  const canApprove = hasPermission(PERMISSIONS.DUYET_TAI_KHOAN);
  const canCreate  = hasPermission(PERMISSIONS.TAO_TAI_KHOAN);
  const canEdit    = hasPermission(PERMISSIONS.SUA_TAI_KHOAN);
  const canDelete  = hasPermission(PERMISSIONS.XOA_TAI_KHOAN);
  const canManagePerms = hasPermission(PERMISSIONS.QUAN_LY_PHAN_QUYEN_TAI_KHOAN);
  const [activeTab, setActiveTab] = useState('all'); // all | pending | create | bulk
  const [searchKeyword, setSearchKeyword] = useState('');
  const [allSearchKeyword, setAllSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | SINH_VIEN | GV_CV | QUAN_TRI
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

  // Permission states — tạo tài khoản
  const [createPermIds, setCreatePermIds] = useState(new Set());
  const [pendingNewAccountId, setPendingNewAccountId] = useState(null);
  const [pendingPermIds, setPendingPermIds] = useState([]);
  const [showCreatePermConfirm, setShowCreatePermConfirm] = useState(false);
  const [createPermConfirmError, setCreatePermConfirmError] = useState('');

  // Permission states — quản lý quyền tài khoản hiện có
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalAccount, setPermModalAccount] = useState(null);
  const [permModalPermIds, setPermModalPermIds] = useState(new Set());
  const [permModalOriginalIds, setPermModalOriginalIds] = useState(new Set());
  const [permModalBaseIds, setPermModalBaseIds] = useState(new Set());
  const [permModalShowConfirm, setPermModalShowConfirm] = useState(false);
  const [permModalError, setPermModalError] = useState('');
  const [permModalSuccess, setPermModalSuccess] = useState('');

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

  // Danh sách tất cả permissions (cần khi tạo TK quản lý hoặc mở modal phân quyền)
  const { data: allPermissions = {} } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
    enabled: canManagePerms && (activeTab === 'create' || showPermModal),
    staleTime: 5 * 60 * 1000,
  });

  // Quyền hiện tại của tài khoản đang mở modal
  const { data: permModalData, isLoading: permModalLoading } = useQuery({
    queryKey: ['accountPermissions', permModalAccount?.id],
    queryFn: () => permissionService.getAccountPermissions(Number(permModalAccount.id)),
    enabled: showPermModal && !!permModalAccount,
  });

  // Khi permModalData thay đổi → sync state
  React.useEffect(() => {
    if (!permModalData || !Object.keys(allPermissions).length) return;
    const permNameToId = {};
    Object.values(allPermissions).flat().forEach(p => { permNameToId[p.name] = p.id; });
    const baseSet = new Set(
      (permModalData.quyenTuChucVu || []).map(name => permNameToId[name]).filter(Boolean)
    );
    const extraSet = new Set();
    Object.entries(permModalData.overrideMap || {}).forEach(([idStr, isGranted]) => {
      if (isGranted) extraSet.add(parseInt(idStr));
    });
    setPermModalBaseIds(baseSet);
    setPermModalOriginalIds(new Set(extraSet));
    setPermModalPermIds(new Set(extraSet));
    setPermModalError('');
    setPermModalSuccess('');
  }, [permModalData, JSON.stringify(allPermissions)]);

  // Client-side filtered accounts for the 'all' tab
  const filteredAccounts = useMemo(() => {
    let result = allAccounts;
    if (roleFilter === 'SINH_VIEN') {
      result = result.filter(a => a.vaiTro === 'SINH_VIEN');
    } else if (roleFilter === 'GV_CV') {
      result = result.filter(a => a.vaiTro === 'GIANG_VIEN' || a.vaiTro === 'CHUYEN_VIEN');
    } else if (roleFilter === 'QUAN_TRI') {
      result = result.filter(a => a.vaiTro !== 'SINH_VIEN' && a.vaiTro !== 'GIANG_VIEN' && a.vaiTro !== 'CHUYEN_VIEN');
    }
    if (allSearchKeyword.trim()) {
      const kw = allSearchKeyword.toLowerCase();
      result = result.filter(a =>
        a.username?.toLowerCase().includes(kw) ||
        a.email?.toLowerCase().includes(kw) ||
        a.hoTen?.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [allAccounts, roleFilter, allSearchKeyword]);

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
    mutationFn: ({ _permIds, ...data }) => accountService.createAccountManually(data),
    onSuccess: (newAccount, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['searchAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      setCreateFormData({
        username: '', email: '', password: '', hoTen: '',
        soDienThoai: '', ngaySinh: '', gioiTinh: '', vaiTro: '', banChuyenMon: ''
      });
      setCreateErrors({});
      const permIds = variables._permIds || [];
      if (newAccount?.id && permIds.length > 0) {
        setPendingNewAccountId(newAccount.id);
        setPendingPermIds(permIds);
        setCreatePermConfirmError('');
        setShowCreatePermConfirm(true);
      } else {
        setCreatePermIds(new Set());
      }
    },
    onError: (error) => {
      setCreateErrors({ submit: error || 'Lỗi tạo tài khoản' });
    }
  });

  const assignPermsMutation = useMutation({
    mutationFn: ({ accountId, grantIds, adminUsername, adminPassword }) =>
      permissionService.updateAccountPermissions(accountId, {
        grantIds, revokeIds: [], ghiChu: 'Gán quyền khi tạo tài khoản',
        adminUsername, adminPassword, grantedBy: currentUser?.id,
      }),
    onSuccess: () => {
      setShowCreatePermConfirm(false);
      setPendingNewAccountId(null);
      setPendingPermIds([]);
      setCreatePermIds(new Set());
      setCreatePermConfirmError('');
    },
    onError: (e) => {
      setCreatePermConfirmError(e?.response?.data?.message || e?.message || 'Lỗi phân quyền');
    },
  });

  const updatePermModalMutation = useMutation({
    mutationFn: ({ accountId, grantIds, adminUsername, adminPassword }) =>
      permissionService.updateAccountPermissions(accountId, {
        grantIds, revokeIds: [],
        ghiChu: 'Cập nhật quyền từ Quản lý Tài khoản',
        adminUsername, adminPassword, grantedBy: currentUser?.id,
      }),
    onSuccess: () => {
      setPermModalShowConfirm(false);
      setPermModalSuccess('Phân quyền thành công!');
      setPermModalError('');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', permModalAccount?.id] });
      setTimeout(() => setPermModalSuccess(''), 3000);
    },
    onError: (e) => {
      setPermModalError(e?.response?.data?.message || e?.message || 'Lỗi phân quyền');
      setPermModalShowConfirm(false);
    },
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
    createAccountMutation.mutate({
      ...createFormData,
      banChuyenMon: createFormData.banChuyenMon || '',
      _permIds: createFormData.vaiTro !== 'SINH_VIEN' ? [...createPermIds] : [],
    });
  };

  const handleManagePerms = (account) => {
    setPermModalAccount(account);
    setPermModalPermIds(new Set());
    setPermModalOriginalIds(new Set());
    setPermModalBaseIds(new Set());
    setPermModalShowConfirm(false);
    setPermModalError('');
    setPermModalSuccess('');
    setShowPermModal(true);
  };

  const togglePermModalPerm = (id) => {
    if (permModalBaseIds.has(id)) return;
    setPermModalPermIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const allPermIds = useMemo(
    () => Object.values(allPermissions).flat().map(p => p.id),
    [allPermissions]
  );

  const toggleCreateToanQuyen = () => {
    if (createPermIds.size === allPermIds.length) {
      setCreatePermIds(new Set());
    } else {
      setCreatePermIds(new Set(allPermIds));
    }
  };

  const toggleCreatePerm = (id) => {
    setCreatePermIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
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
                      {account.trangThaiPheDuyet === 'CHO_PHE_DUYET' && canApprove && (
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
                          {canEdit && (
                            <button onClick={() => handleEditAccount(account)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">
                              Sửa
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteConfirm(account)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded">
                              Xóa
                            </button>
                          )}
                          <button onClick={() => handleHistoryView(account)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded">
                            Lịch sử
                          </button>
                          {canManagePerms && account.vaiTro !== 'SINH_VIEN' && (
                            <button onClick={() => handleManagePerms(account)}
                              className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Phân quyền
                            </button>
                          )}
                        </>
                      )}
                      {canEdit && (
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => setActiveMutation.mutate({ accountId: account.id, isActive: !account.isActive })}
                            disabled={setActiveMutation.isPending}
                            title={account.isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              account.isActive ? 'bg-green-500' : 'bg-gray-300'
                            } ${setActiveMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                account.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-medium ${account.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {account.isActive ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </div>
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
            onClick={() => { setActiveTab(tab.key); setSearchKeyword(''); setAllSearchKeyword(''); setRoleFilter('ALL'); }}
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
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">Tất cả tài khoản</h2>
              <input
                type="text"
                placeholder="Tìm kiếm username, email, họ tên..."
                value={allSearchKeyword}
                onChange={(e) => setAllSearchKeyword(e.target.value)}
                className="sm:w-72 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role filter sub-tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { key: 'ALL', label: `Tất cả (${allAccounts.length})` },
                { key: 'SINH_VIEN', label: `Sinh viên (${allAccounts.filter(a => a.vaiTro === 'SINH_VIEN').length})` },
                { key: 'GV_CV', label: `GV / Chuyên viên (${allAccounts.filter(a => a.vaiTro === 'GIANG_VIEN' || a.vaiTro === 'CHUYEN_VIEN').length})` },
                { key: 'QUAN_TRI', label: `Quản trị (${allAccounts.filter(a => a.vaiTro !== 'SINH_VIEN' && a.vaiTro !== 'GIANG_VIEN' && a.vaiTro !== 'CHUYEN_VIEN').length})` },
              ].map(rf => (
                <button
                  key={rf.key}
                  onClick={() => setRoleFilter(rf.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    roleFilter === rf.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <AccountTable accounts={filteredAccounts} loading={allAccountsLoading} showActions={true} />
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
            {/* ── Phân quyền (chỉ hiển thị khi vai trò không phải sinh viên) ── */}
            {canManagePerms && createFormData.vaiTro && createFormData.vaiTro !== 'SINH_VIEN' && (
              <div className="mb-4 border border-blue-200 rounded-xl p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-800">Phân quyền tài khoản</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Đã chọn: <strong className="text-blue-700">{createPermIds.size}</strong>/{allPermIds.length} quyền
                    </span>
                    <button
                      type="button"
                      onClick={toggleCreateToanQuyen}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${
                        createPermIds.size === allPermIds.length && allPermIds.length > 0
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      TOÀN QUYỀN
                    </button>
                    {createPermIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setCreatePermIds(new Set())}
                        className="px-3 py-1 rounded-lg text-sm text-gray-500 border border-gray-300 hover:bg-gray-100"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                </div>
                {Object.keys(allPermissions).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Đang tải danh sách quyền...</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {Object.entries(allPermissions).map(([category, perms]) => (
                      <div key={category}>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 sticky top-0 bg-blue-50">{category}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {perms.map(p => (
                            <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-blue-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={createPermIds.has(p.id)}
                                onChange={() => toggleCreatePerm(p.id)}
                                className="w-3.5 h-3.5 text-blue-600 rounded"
                              />
                              <span className="text-xs text-gray-700">{p.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* =================== Phân quyền sau khi tạo TK =================== */}
      {showCreatePermConfirm && (
        <PasswordConfirmModal
          title={`Gán ${pendingPermIds.length} quyền cho tài khoản vừa tạo`}
          error={createPermConfirmError}
          onConfirm={(username, password) =>
            assignPermsMutation.mutate({
              accountId: pendingNewAccountId,
              grantIds: pendingPermIds,
              adminUsername: username,
              adminPassword: password,
            })
          }
          onCancel={() => {
            setShowCreatePermConfirm(false);
            setCreatePermConfirmError('');
            setCreatePermIds(new Set());
          }}
        />
      )}

      {/* =================== Modal quản lý quyền tài khoản =================== */}
      {showPermModal && permModalAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Phân quyền tài khoản</h2>
                  <p className="text-sm text-gray-500">{permModalAccount.hoTen || permModalAccount.username} ({permModalAccount.username})</p>
                </div>
              </div>
              <button onClick={() => setShowPermModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {permModalLoading ? (
                <p className="text-gray-400 text-sm">Đang tải...</p>
              ) : (
                <>
                  {permModalSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{permModalSuccess}</div>
                  )}
                  {permModalError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{permModalError}</div>
                  )}

                  {/* TOÀN QUYỀN & stats */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Đang chọn: <strong className="text-blue-700">{permModalPermIds.size + permModalBaseIds.size}</strong>/{allPermIds.length} quyền
                      {permModalBaseIds.size > 0 && <span className="ml-1 text-xs text-gray-400">({permModalBaseIds.size} từ chức vụ 🔒)</span>}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allExtra = new Set(allPermIds.filter(id => !permModalBaseIds.has(id)));
                          if (permModalPermIds.size === allExtra.size) {
                            setPermModalPermIds(new Set());
                          } else {
                            setPermModalPermIds(allExtra);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        TOÀN QUYỀN
                      </button>
                    </div>
                  </div>

                  {/* Permission checkboxes */}
                  <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
                    {Object.entries(allPermissions).map(([category, perms]) => (
                      <div key={category} className="p-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{category}</p>
                        <div className="grid grid-cols-1 gap-1">
                          {perms.map(p => {
                            const isBase = permModalBaseIds.has(p.id);
                            const isExtra = permModalPermIds.has(p.id);
                            return (
                              <label key={p.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${isBase ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <input
                                  type="checkbox"
                                  checked={isBase || isExtra}
                                  disabled={isBase}
                                  onChange={() => togglePermModalPerm(p.id)}
                                  className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span className="text-xs text-gray-700 flex-1">{p.description}</span>
                                {isBase && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">🔒 Chức vụ</span>}
                                {isExtra && !isBase && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">+ Thêm</span>}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-5 border-t">
              <button onClick={() => setShowPermModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">Đóng</button>
              {!permModalLoading && (
                <button
                  onClick={() => { setPermModalError(''); setPermModalShowConfirm(true); }}
                  disabled={updatePermModalMutation.isPending}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Lưu quyền
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {permModalShowConfirm && permModalAccount && (
        <PasswordConfirmModal
          title={`Cập nhật quyền cho: ${permModalAccount.hoTen || permModalAccount.username}`}
          error={permModalError}
          onConfirm={(username, password) =>
            updatePermModalMutation.mutate({
              accountId: permModalAccount.id,
              grantIds: [...permModalPermIds],
              adminUsername: username,
              adminPassword: password,
            })
          }
          onCancel={() => { setPermModalShowConfirm(false); setPermModalError(''); }}
        />
      )}
    </div>
  );
}
