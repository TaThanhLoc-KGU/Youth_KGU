import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckSquare, Square, Lock, AlertTriangle, Eye } from 'lucide-react';
import api from '../../services/api';
import permissionService from '../../services/permissionService';
import accountService from '../../services/accountService';
import chucVuService from '../../services/chucVuService';
import useAuthStore from '../../stores/authStore';
import {
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  NHOM_VAI_TRO_LABELS,
  NHOM_VAI_TRO_COLORS,
  TO_CHUC_LABELS,
} from '../../constants/permissionConstants';

// Modal xác nhận mật khẩu
function PasswordConfirmModal({ onConfirm, onCancel, title }) {
  const [password, setPassword] = useState('');
  const { user } = useAuthStore();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          <p className="text-sm text-yellow-700">Hành động này sẽ thay đổi quyền truy cập. Nhập mật khẩu của bạn để xác nhận.</p>
        </div>
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

// Helper: Map quyền theo chức vụ (Logic frontend để hiển thị)
const getQuyenByChucVu = (chucVu) => {
  if (!chucVu) return [];
  
  const { thuocBan, thuTu } = chucVu;
  const isQuanLy = thuocBan === 'DOAN' || thuocBan === 'HOI';
  const capCao = (thuTu || 99) <= 2;

  const base = ['DANG_NHAP', 'DOI_MAT_KHAU', 'XEM_HOAT_DONG'];

  if (isQuanLy && capCao) {
    return [...base, 'QUAN_LY_HOAT_DONG', 'DUYET_HOAT_DONG', 'DIEM_DANH',
                     'PHAN_CONG_DIEM_DANH', 'QUAN_LY_DANG_KY', 'XEM_BAO_CAO', 'XUAT_BAO_CAO'];
  }
  if (isQuanLy && !capCao) {
    return [...base, 'TAO_HOAT_DONG', 'DIEM_DANH', 'QUAN_LY_DANG_KY', 'XEM_BAO_CAO'];
  }
  // PHU_VU (Ban/Đội/CLB)
  if (capCao) {
    return [...base, 'TAO_HOAT_DONG', 'DIEM_DANH', 'PHAN_CONG_DIEM_DANH', 'XEM_DANH_SACH_DANG_KY'];
  }
  return [...base, 'DIEM_DANH', 'XEM_DANH_SACH_DANG_KY'];
};

const THUOC_BAN_LABELS = {
  DOAN: 'Đoàn Thanh niên',
  HOI: 'Hội Sinh viên',
  BAN: 'Ban chuyên môn',
  DOI: 'Đội',
  CLB: 'Câu lạc bộ',
  KHAC: 'Khác',
};

// Tab 1: Phân quyền nhóm vai trò (Dynamic from ChucVu)
function RolePermissionsTab() {
  const [selectedChucVu, setSelectedChucVu] = useState('');
  const [localSelected, setLocalSelected] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  // Load danh sách chức vụ
  const { data: danhSachChucVu = [], isLoading: loadingChucVu } = useQuery({
    queryKey: ['chuc-vu-all'],
    queryFn: chucVuService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Load tất cả quyền (để hiển thị checkbox)
  const { data: allPermissions = {} } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  // Load quyền hiện tại của chức vụ (từ API backend nếu có, hoặc dùng logic frontend tạm thời)
  // Hiện tại backend chưa có API get permissions by chucVu, nên ta dùng logic frontend `getQuyenByChucVu`
  // Khi nào backend có API, ta sẽ thay thế đoạn này.
  
  const selectedChucVuInfo = useMemo(() => 
    danhSachChucVu.find(cv => cv.maChucVu === selectedChucVu), 
  [danhSachChucVu, selectedChucVu]);

  React.useEffect(() => {
    if (selectedChucVuInfo) {
      // Giả lập load quyền từ backend
      const permissions = getQuyenByChucVu(selectedChucVuInfo);
      // Cần map permission names sang IDs. 
      // Vì allPermissions là Map<Category, List<Permission>>, ta cần flatten nó để tìm ID.
      const permIds = new Set();
      Object.values(allPermissions).flat().forEach(p => {
        if (permissions.includes(p.name)) {
          permIds.add(p.id);
        }
      });
      setLocalSelected(permIds);
    } else {
      setLocalSelected(new Set());
    }
  }, [selectedChucVuInfo, allPermissions]);

  // Nhóm chức vụ theo thuocBan
  const nhomChucVu = useMemo(() => {
    return danhSachChucVu.reduce((acc, cv) => {
      const nhom = cv.thuocBan || 'KHAC';
      if (!acc[nhom]) acc[nhom] = [];
      acc[nhom].push(cv);
      return acc;
    }, {});
  }, [danhSachChucVu]);

  const saveMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      // Lưu ý: Backend cần endpoint update quyền theo chức vụ. 
      // Hiện tại dùng tạm endpoint role cũ nhưng truyền maChucVu làm roleName (cần backend hỗ trợ hoặc sửa lại)
      // Tạm thời: Log ra console vì chưa có API backend chuẩn cho việc này.
      new Promise((resolve) => {
        console.log('Saving permissions for chucVu:', selectedChucVu, [...localSelected]);
        setTimeout(resolve, 1000);
      }),
    onSuccess: () => {
      setSuccess('Cập nhật quyền chức vụ thành công (Giả lập)!');
      setShowConfirm(false); setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => { setError('Lỗi cập nhật'); setShowConfirm(false); }
  });

  const toggle = (id) => setLocalSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-1 bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Chọn chức vụ</h3>
        {loadingChucVu ? (
          <div className="text-sm text-gray-500">Đang tải danh sách...</div>
        ) : (
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedChucVu} 
            onChange={(e) => setSelectedChucVu(e.target.value)}
          >
            <option value="">-- Chọn chức vụ --</option>
            {Object.entries(nhomChucVu).map(([thuocBan, chucVuList]) => (
              <optgroup key={thuocBan} label={THUOC_BAN_LABELS[thuocBan] || thuocBan}>
                {chucVuList
                  .sort((a, b) => (a.thuTu || 99) - (b.thuTu || 99))
                  .map(cv => (
                    <option key={cv.maChucVu} value={cv.maChucVu}>
                      {cv.tenChucVu}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        )}
        
        {selectedChucVuInfo && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold text-blue-800">{selectedChucVuInfo.tenChucVu}</p>
            <p className="text-blue-600 text-xs mt-1">{THUOC_BAN_LABELS[selectedChucVuInfo.thuocBan]}</p>
            <p className="text-gray-500 text-xs mt-2">{selectedChucVuInfo.moTa || 'Không có mô tả'}</p>
          </div>
        )}
      </div>

      <div className="col-span-3">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">
              Quyền của chức vụ: <span className="text-blue-600">{selectedChucVuInfo?.tenChucVu || '...'}</span>
            </h3>
            <button onClick={() => setShowConfirm(true)} disabled={!selectedChucVu}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:bg-gray-300">
              <Shield className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>

          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {Object.entries(allPermissions).map(([category, perms]) => (
            <div key={category} className="mb-5">
              <h4 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2 border-b pb-1">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {perms.map(p => (
                  <label key={p.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <button type="button" onClick={() => toggle(p.id)} className="mt-0.5 flex-shrink-0">
                      {localSelected.has(p.id)
                        ? <CheckSquare className="w-5 h-5 text-blue-600" />
                        : <Square className="w-5 h-5 text-gray-300" />}
                    </button>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{p.description}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfirm && (
        <PasswordConfirmModal
          title={`Cập nhật quyền cho chức vụ "${selectedChucVuInfo?.tenChucVu}"`}
          onConfirm={(u, p) => saveMutation.mutate({ adminUsername: u, adminPassword: p })}
          onCancel={() => setShowConfirm(false)} />
      )}
    </div>
  );
}

// Tab 2: Xem & phân quyền tài khoản cụ thể
function AccountPermissionsTab() {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [localGrant, setLocalGrant] = useState(new Set());
  const [localRevoke, setLocalRevoke] = useState(new Set());
  const [ghiChu, setGhiChu] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Danh sách tài khoản
  const { data: accounts = [] } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: () => accountService.getAllAccounts(),
  });

  // Quyền tổng hợp của tài khoản được chọn
  const { data: permData, isLoading: permLoading, error: permError } = useQuery({
    queryKey: ['accountPermissions', selectedAccountId],
    queryFn: () => permissionService.getAccountPermissions(Number(selectedAccountId)),
    enabled: !!selectedAccountId,
  });

  // All permissions for override UI
  const { data: allPermissions = {} } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  React.useEffect(() => {
    if (permData?.overrideMap) {
      const grants = new Set();
      const revokes = new Set();
      Object.entries(permData.overrideMap).forEach(([idStr, isGranted]) => {
        const id = parseInt(idStr);
        if (isGranted) grants.add(id); else revokes.add(id);
      });
      setLocalGrant(grants); setLocalRevoke(revokes);
    } else {
      setLocalGrant(new Set()); setLocalRevoke(new Set());
    }
  }, [permData]);

  const saveMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      api.put(`/api/permissions/account/${selectedAccountId}`, {
        grantIds: [...localGrant], revokeIds: [...localRevoke],
        ghiChu, adminUsername, adminPassword, grantedBy: user?.id
      }),
    onSuccess: () => {
      setSuccess('Phân quyền tài khoản thành công!');
      setShowConfirm(false); setError('');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => { setError(e.response?.data?.message || 'Lỗi'); setShowConfirm(false); }
  });

  const resetMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      api.delete(`/api/permissions/account/${selectedAccountId}/reset`, {
        data: { adminUsername, adminPassword }
      }),
    onSuccess: () => {
      setSuccess('Reset quyền về mặc định nhóm thành công!');
      setShowResetConfirm(false); setLocalGrant(new Set()); setLocalRevoke(new Set());
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => { setError(e.response?.data?.message || 'Lỗi'); setShowResetConfirm(false); }
  });

  const toggleGrant = (id) => {
    setLocalGrant(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setLocalRevoke(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const toggleRevoke = (id) => {
    setLocalRevoke(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setLocalGrant(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <div className="space-y-5">
      {/* Chọn tài khoản */}
      <div className="bg-white rounded-xl border p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn tài khoản để xem/cấu hình quyền
        </label>
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedAccountId}
          onChange={e => { setSelectedAccountId(e.target.value); setError(''); setSuccess(''); }}>
          <option value="">-- Chọn tài khoản --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.hoTen || acc.username} ({acc.username})
            </option>
          ))}
        </select>
      </div>

      {selectedAccountId && (
        <>
          {permLoading && <div className="text-gray-500 text-sm">Đang tải...</div>}
          {permError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">Lỗi: {permError.message}</div>}

          {permData && (
            <>
              {/* Thông tin tài khoản */}
              <div className="bg-white rounded-xl border p-5">
                <h2 className="text-lg font-bold mb-4">Thông tin tài khoản</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Họ tên</p>
                    <p className="font-semibold">{permData.hoTen || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tên đăng nhập</p>
                    <p className="font-semibold">{permData.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vai trò</p>
                    <p className="font-semibold">{permData.tenVaiTro || permData.vaiTro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nhóm</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                      NHOM_VAI_TRO_COLORS[permData.nhomVaiTro] || 'bg-gray-100 text-gray-700'}`}>
                      {NHOM_VAI_TRO_LABELS[permData.nhomVaiTro] || permData.nhomVaiTro}
                      {permData.toChuc && ` — ${TO_CHUC_LABELS[permData.toChuc] || permData.toChuc}`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {permData.laBCH ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-semibold">
                        ✓ Ban Chấp Hành
                      </span>
                      <span className="text-sm text-gray-500">— có thêm quyền từ chức vụ đang giữ</span>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      Thành viên thường
                    </span>
                  )}
                </div>

                {/* Danh sách chức vụ BCH */}
                {permData.laBCH && permData.danhSachChucVu?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Chức vụ đang giữ:</p>
                    <div className="flex flex-wrap gap-2">
                      {permData.danhSachChucVu.map((cv, i) => (
                        <div key={i} className="border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5">
                          <p className="font-semibold text-blue-800 text-sm">{cv.tenChucVu}</p>
                          {cv.tenBan && <p className="text-xs text-blue-600">{cv.tenBan}</p>}
                          <p className="text-xs text-gray-400">{cv.thuocBan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quyền hiệu lực (read-only view) */}
              <div className="bg-white rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Quyền hiệu lực</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Tổng hợp từ vai trò{permData.laBCH ? ' + chức vụ BCH' : ''}.
                  {(permData.overrideMap && Object.keys(permData.overrideMap).length > 0) ? ' Có override cá nhân.' : ''}
                </p>
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.label} className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.permissions.map(perm => {
                        const coQuyen = Array.isArray(permData.quyenTongHop)
                          ? permData.quyenTongHop.includes(perm)
                          : permData.quyenTongHop instanceof Set
                            ? permData.quyenTongHop.has(perm)
                            : false;
                        const tuChucVu = Array.isArray(permData.quyenTuChucVu)
                          ? permData.quyenTuChucVu.includes(perm)
                          : false;
                        return (
                          <div key={perm} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            coQuyen ? 'bg-green-50' : 'bg-gray-50 opacity-60'}`}>
                            <span className="text-base">{coQuyen ? '✅' : '⬜'}</span>
                            <span className={coQuyen ? 'text-gray-800' : 'text-gray-400'}>
                              {PERMISSION_LABELS[perm] || perm}
                            </span>
                            {tuChucVu && (
                              <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">BCH</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Override cá nhân */}
              {Object.keys(allPermissions).length > 0 && (
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Override quyền: <span className="text-blue-600">{permData.hoTen || permData.username}</span>
                      </h2>
                      <p className="text-sm text-gray-500">
                        Vai trò: {permData.tenVaiTro || permData.vaiTro} ({permData.nhomVaiTro})
                        {permData.laBCH && permData.danhSachChucVu?.length > 0 && (
                          <span className="ml-2 text-purple-600">
                            · BCH: {permData.danhSachChucVu.map(cv => cv.tenChucVu).join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowResetConfirm(true)}
                        className="px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold">
                        Reset về nhóm
                      </button>
                      <button onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" /> Lưu phân quyền
                      </button>
                    </div>
                  </div>

                  {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
                  {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <strong>Hướng dẫn:</strong> ✅ Cấp thêm quyền | ❌ Thu hồi quyền | ⬜ Theo nhóm (mặc định)
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú lý do phân quyền</label>
                    <input value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ví dụ: BCH ủy quyền quản lý hoạt động..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {Object.entries(allPermissions).map(([category, perms]) => (
                    <div key={category} className="mb-5">
                      <h4 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2 border-b pb-1">{category}</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {perms.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800">{p.description}</span>
                              <span className="ml-2 text-xs text-gray-400 font-mono">{p.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => toggleGrant(p.id)}
                                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                  localGrant.has(p.id) ? 'bg-green-600 text-white' : 'border text-gray-400 hover:border-green-400 hover:text-green-600'}`}>
                                ✅ Cấp
                              </button>
                              <button onClick={() => toggleRevoke(p.id)}
                                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                  localRevoke.has(p.id) ? 'bg-red-600 text-white' : 'border text-gray-400 hover:border-red-400 hover:text-red-600'}`}>
                                ❌ Thu hồi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {showConfirm && <PasswordConfirmModal
        title={`Phân quyền tài khoản ID #${selectedAccountId}`}
        onConfirm={(u, p) => saveMutation.mutate({ adminUsername: u, adminPassword: p })}
        onCancel={() => setShowConfirm(false)} />}

      {showResetConfirm && <PasswordConfirmModal
        title={`Reset quyền tài khoản ID #${selectedAccountId} về mặc định nhóm`}
        onConfirm={(u, p) => resetMutation.mutate({ adminUsername: u, adminPassword: p })}
        onCancel={() => setShowResetConfirm(false)} />}
    </div>
  );
}

// Main page
export default function SettingsPermissionsPage() {
  const [tab, setTab] = useState('role');
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt & Phân quyền</h1>
          <p className="text-gray-500 text-sm">Quản lý quyền truy cập theo nhóm và từng tài khoản cụ thể</p>
        </div>
      </div>
      <div className="flex gap-4 border-b mb-6">
        {[{ key: 'role', label: 'Phân quyền nhóm' }, { key: 'account', label: 'Phân quyền tài khoản' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'role' ? <RolePermissionsTab /> : <AccountPermissionsTab />}
    </div>
  );
}
