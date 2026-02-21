import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import permissionService from '../../services/permissionService';
import accountService from '../../services/accountService';
import chucVuService from '../../services/chucVuService';
import useAuthStore from '../../stores/authStore';
import {
  NHOM_VAI_TRO_LABELS,
  NHOM_VAI_TRO_COLORS,
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

const THUOC_BAN_LABELS = {
  DOAN: 'Đoàn Thanh niên',
  HOI: 'Hội Sinh viên',
  BAN: 'Ban chuyên môn',
  DOI: 'Đội',
  CLB: 'Câu lạc bộ',
  KHAC: 'Khác',
};

// Tab 1: Phân quyền nhóm theo Chức vụ (đọc/ghi từ role_permissions, role_name = maChucVu)
function RolePermissionsTab() {
  const [selectedChucVuMa, setSelectedChucVuMa] = useState('');
  const [localSelected, setLocalSelected] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  // Danh sách chức vụ từ DB
  const { data: danhSachChucVu = [], isLoading: loadingChucVu } = useQuery({
    queryKey: ['chuc-vu-all'],
    queryFn: chucVuService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Tất cả permissions từ DB, nhóm theo category
  const { data: allPermissions = {}, isLoading: loadingPerms } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  // Permission IDs đang được gán cho chức vụ đang chọn (role_name = maChucVu)
  const { data: chucVuPermIds = [], isLoading: loadingChucVuPerms } = useQuery({
    queryKey: ['rolePermissions', selectedChucVuMa],
    queryFn: () => permissionService.getRolePermissions(selectedChucVuMa),
    enabled: !!selectedChucVuMa,
  });

  // Sync localSelected khi chuyển chức vụ
  // FIX: Added JSON.stringify(chucVuPermIds) to dependency array to prevent infinite loop
  // when chucVuPermIds is a new array reference but same content
  React.useEffect(() => {
    if (chucVuPermIds) {
      setLocalSelected(new Set(chucVuPermIds));
    }
  }, [JSON.stringify(chucVuPermIds)]);

  const saveMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      permissionService.updateRolePermissions(selectedChucVuMa, [...localSelected], adminUsername, adminPassword),
    onSuccess: () => {
      setSuccess('Cập nhật quyền chức vụ thành công!');
      setShowConfirm(false);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedChucVuMa] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => {
      setError(e?.response?.data?.message || 'Lỗi cập nhật');
      setShowConfirm(false);
    },
  });

  const toggle = (id) => {
    setLocalSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const isDirty = selectedChucVuMa &&
    JSON.stringify([...localSelected].sort((a, b) => a - b)) !==
    JSON.stringify([...chucVuPermIds].sort((a, b) => a - b));

  // Group chức vụ theo thuocBan cho optgroup
  const nhomChucVu = danhSachChucVu.reduce((acc, cv) => {
    const nhom = cv.thuocBan || 'KHAC';
    if (!acc[nhom]) acc[nhom] = [];
    acc[nhom].push(cv);
    return acc;
  }, {});

  const selectedInfo = danhSachChucVu.find(cv => cv.maChucVu === selectedChucVuMa);

  return (
    <div className="bg-white rounded-xl border p-6 space-y-5">
      <div>
        <h3 className="font-bold text-gray-800 mb-1">Phân quyền theo chức vụ</h3>
        <p className="text-sm text-gray-500 mb-4">
          Cấu hình quyền mặc định cho từng chức vụ BCH. Tài khoản giữ chức vụ sẽ kế thừa các quyền được tích.
          Admin có thể cấp thêm/thu hồi riêng lẻ ở tab <strong>Phân quyền tài khoản</strong>.
        </p>

        {loadingChucVu ? (
          <div className="text-gray-400 text-sm">Đang tải danh sách chức vụ...</div>
        ) : (
          <select
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedChucVuMa}
            onChange={e => { setSelectedChucVuMa(e.target.value); setError(''); setSuccess(''); }}>
            <option value="">-- Chọn chức vụ --</option>
            {Object.entries(nhomChucVu).map(([thuocBan, list]) => (
              <optgroup key={thuocBan} label={THUOC_BAN_LABELS[thuocBan] || thuocBan}>
                {[...list]
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
      </div>

      {selectedChucVuMa && (
        <>
          {selectedInfo && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {selectedInfo.tenChucVu}
              </span>
              <span className="text-sm text-gray-500">
                {THUOC_BAN_LABELS[selectedInfo.thuocBan] || selectedInfo.thuocBan}
                {selectedInfo.thuTu ? ` · Thứ tự ${selectedInfo.thuTu}` : ''}
              </span>
            </div>
          )}

          {(loadingPerms || loadingChucVuPerms) && (
            <div className="text-gray-400 text-sm">Đang tải danh sách quyền...</div>
          )}

          {!loadingPerms && !loadingChucVuPerms && (
            <>
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
              )}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              {Object.entries(allPermissions).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2 border-b pb-1">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSelected.has(p.id)}
                          onChange={() => toggle(p.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800">{p.description}</span>
                          <span className="ml-2 text-xs text-gray-400 font-mono">{p.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isDirty || saveMutation.isPending}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {!selectedChucVuMa && !loadingChucVu && (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chọn một chức vụ để cấu hình quyền mặc định</p>
        </div>
      )}

      {showConfirm && (
        <PasswordConfirmModal
          title={`Cập nhật quyền chức vụ: ${selectedInfo?.tenChucVu || selectedChucVuMa}`}
          onConfirm={(u, p) => saveMutation.mutate({ adminUsername: u, adminPassword: p })}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// Tab 2: Cấp thêm quyền đặc biệt cho tài khoản (dựa trên quyền chức vụ từ role_permissions)
function AccountPermissionsTab() {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [extraGrantIds, setExtraGrantIds] = useState(new Set());
  const [ghiChu, setGhiChu] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: () => accountService.getAllAccounts(),
  });

  const { data: permData, isLoading: permLoading, error: permError } = useQuery({
    queryKey: ['accountPermissions', selectedAccountId],
    queryFn: () => permissionService.getAccountPermissions(Number(selectedAccountId)),
    enabled: !!selectedAccountId,
  });

  const { data: allPermissions = {} } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  // Map: permission name → id (để tìm ID từ quyenTuChucVu)
  const permNameToId = React.useMemo(() => {
    const map = {};
    Object.values(allPermissions).flat().forEach(p => { map[p.name] = p.id; });
    return map;
  }, [allPermissions]);

  // Set IDs của quyền đã được cấu hình cho chức vụ (khoá, không thể bỏ)
  const basePermIds = React.useMemo(() => {
    const names = Array.isArray(permData?.quyenTuChucVu) ? permData.quyenTuChucVu : [];
    return new Set(names.map(name => permNameToId[name]).filter(Boolean));
  }, [permData, permNameToId]);

  // Lưu bản gốc extras từ overrideMap để so sánh isDirty
  const originalExtras = React.useMemo(() => {
    const grants = new Set();
    Object.entries(permData?.overrideMap || {}).forEach(([idStr, isGranted]) => {
      if (isGranted) grants.add(parseInt(idStr));
    });
    return grants;
  }, [permData]);

  // FIX: Added JSON.stringify(originalExtras) to dependency array to prevent infinite loop
  React.useEffect(() => {
    setExtraGrantIds(new Set(originalExtras));
    setGhiChu('');
    setError('');
    setSuccess('');
  }, [JSON.stringify([...originalExtras])]);

  const toggleExtra = (id) => {
    if (basePermIds.has(id)) return; // quyền từ chức vụ không được chỉnh
    setExtraGrantIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const isDirty =
    JSON.stringify([...extraGrantIds].sort((a, b) => a - b)) !==
    JSON.stringify([...originalExtras].sort((a, b) => a - b));

  const saveMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      api.put(`/api/permissions/account/${selectedAccountId}`, {
        grantIds: [...extraGrantIds],
        revokeIds: [],
        ghiChu, adminUsername, adminPassword, grantedBy: user?.id
      }),
    onSuccess: () => {
      setSuccess('Phân quyền tài khoản thành công!');
      setShowConfirm(false); setError('');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => { setError(e?.response?.data?.message || 'Lỗi'); setShowConfirm(false); }
  });

  const resetMutation = useMutation({
    mutationFn: ({ adminUsername, adminPassword }) =>
      api.delete(`/api/permissions/account/${selectedAccountId}/reset`, {
        data: { adminUsername, adminPassword }
      }),
    onSuccess: () => {
      setSuccess('Đã xóa quyền đặc biệt. Tài khoản chỉ còn quyền từ chức vụ.');
      setShowResetConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: e => { setError(e?.response?.data?.message || 'Lỗi'); setShowResetConfirm(false); }
  });

  return (
    <div className="space-y-5">
      {/* Chọn tài khoản */}
      <div className="bg-white rounded-xl border p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn tài khoản để cấu hình quyền
        </label>
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedAccountId}
          onChange={e => { setSelectedAccountId(e.target.value); }}>
          <option value="">-- Chọn tài khoản --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.hoTen || acc.username} ({acc.username}) — {acc.vaiTro}
            </option>
          ))}
        </select>
      </div>

      {selectedAccountId && (
        <>
          {permLoading && <div className="text-gray-500 text-sm p-4">Đang tải...</div>}
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
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {permData.laBCH ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-semibold">
                        ✓ Ban Chấp Hành
                      </span>
                      <span className="text-sm text-gray-500">— quyền 🔒 từ chức vụ không thể bỏ chọn</span>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      Thành viên thường — chưa có chức vụ BCH
                    </span>
                  )}
                </div>

                {permData.laBCH && permData.danhSachChucVu?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Chức vụ đang giữ:</p>
                    <div className="flex flex-wrap gap-2">
                      {permData.danhSachChucVu.map((cv, i) => (
                        <div key={i} className="border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5">
                          <p className="font-semibold text-blue-800 text-sm">{cv.tenChucVu}</p>
                          {cv.tenBan && <p className="text-xs text-blue-600">{cv.tenBan}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phân quyền đặc biệt */}
              {Object.keys(allPermissions).length > 0 && (
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Cấp quyền đặc biệt: <span className="text-blue-600">{permData.hoTen || permData.username}</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Quyền <span className="font-medium">🔒 khoá</span> từ nhóm chức vụ — không thể bỏ chọn.
                        Tích thêm những quyền còn lại để cấp đặc biệt cho tài khoản này.
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button onClick={() => setShowResetConfirm(true)}
                        className="px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold">
                        Xóa quyền đặc biệt
                      </button>
                      <button onClick={() => setShowConfirm(true)}
                        disabled={!isDirty || saveMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" />
                        {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>

                  {success && <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
                  {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

                  <div className="mt-4 mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú lý do phân quyền</label>
                    <input value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ví dụ: BCH ủy quyền thêm chức năng xuất báo cáo..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {Object.entries(allPermissions).map(([category, perms]) => (
                    <div key={category} className="mb-5">
                      <h4 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2 border-b pb-1">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 gap-1">
                        {perms.map(p => {
                          const isBase = basePermIds.has(p.id);
                          const isExtra = extraGrantIds.has(p.id);
                          return (
                            <label key={p.id}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                isBase
                                  ? 'bg-blue-50 cursor-default'
                                  : 'hover:bg-gray-50 cursor-pointer'
                              }`}>
                              <input
                                type="checkbox"
                                checked={isBase || isExtra}
                                disabled={isBase}
                                onChange={() => toggleExtra(p.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-800">{p.description}</span>
                                <span className="ml-2 text-xs text-gray-400 font-mono">{p.name}</span>
                              </div>
                              {isBase && (
                                <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  🔒 Từ chức vụ
                                </span>
                              )}
                              {isExtra && !isBase && (
                                <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  + Đặc biệt
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {showConfirm && permData && (
        <PasswordConfirmModal
          title={`Cấp quyền đặc biệt cho: ${permData.hoTen || permData.username}`}
          onConfirm={(u, p) => saveMutation.mutate({ adminUsername: u, adminPassword: p })}
          onCancel={() => setShowConfirm(false)} />
      )}
      {showResetConfirm && permData && (
        <PasswordConfirmModal
          title={`Xóa toàn bộ quyền đặc biệt của: ${permData.hoTen || permData.username}`}
          onConfirm={(u, p) => resetMutation.mutate({ adminUsername: u, adminPassword: p })}
          onCancel={() => setShowResetConfirm(false)} />
      )}
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
