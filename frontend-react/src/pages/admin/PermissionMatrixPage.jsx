import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Loader2, CheckSquare, Square, Info, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import permissionService from '../../services/permissionService';
import accountService from '../../services/accountService';
import useAuthStore from '../../stores/authStore';
import {
  NHOM_VAI_TRO_LABELS,
  NHOM_VAI_TRO_COLORS,
} from '../../constants/permissionConstants';

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  HE_THONG:    'Hệ thống',
  SINH_VIEN:   'Sinh viên',
  GIANG_VIEN:  'Giảng viên',
  CHUYEN_VIEN: 'Chuyên viên',
  TO_CHUC:     'Tổ chức',
  HOAT_DONG:   'Hoạt động',
  DIEM_DANH:   'Điểm danh',
  BCH:         'Ban Chấp Hành',
  TAI_KHOAN:   'Tài khoản',
  PHAN_QUYEN:  'Phân quyền',
  BAO_CAO:     'Báo cáo',
  SYSTEM:      'System (IT)',
  TIN_TUC:     'Tin tức',
};

const LEVEL_CONFIG = [
  { key: 'BCH_LEVEL_1', label: 'Level 1', sub: 'Bí thư · Chủ tịch HSV',      color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'BCH_LEVEL_2', label: 'Level 2', sub: 'Phó Bí thư · Phó Chủ tịch',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'BCH_LEVEL_3', label: 'Level 3', sub: 'Ủy viên BCH · Ban thư ký',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'BCH_LEVEL_4', label: 'Level 4', sub: 'Quyền đặc biệt',             color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const LEVEL_LABELS = { 1: 'Level 1', 2: 'Level 2', 3: 'Level 3', 4: 'Level 4' };

// ─── Tab 1: Ma trận quyền theo Level ─────────────────────────────────────────
function LevelMatrixTab() {
  const queryClient = useQueryClient();
  const [localMatrix, setLocalMatrix] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: permissionService.getPermissionMatrix,
    onSuccess: (d) => {
      if (!localMatrix) {
        setLocalMatrix({
          BCH_LEVEL_1: new Set(d.matrix?.BCH_LEVEL_1 || []),
          BCH_LEVEL_2: new Set(d.matrix?.BCH_LEVEL_2 || []),
          BCH_LEVEL_3: new Set(d.matrix?.BCH_LEVEL_3 || []),
          BCH_LEVEL_4: new Set(d.matrix?.BCH_LEVEL_4 || []),
        });
      }
    },
  });

  const matrix = localMatrix || {
    BCH_LEVEL_1: new Set(data?.matrix?.BCH_LEVEL_1 || []),
    BCH_LEVEL_2: new Set(data?.matrix?.BCH_LEVEL_2 || []),
    BCH_LEVEL_3: new Set(data?.matrix?.BCH_LEVEL_3 || []),
    BCH_LEVEL_4: new Set(data?.matrix?.BCH_LEVEL_4 || []),
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        LEVEL_CONFIG.map((lv) =>
          permissionService.updateLevelPermissions(
            parseInt(lv.key.replace('BCH_LEVEL_', '')),
            Array.from(matrix[lv.key])
          )
        )
      );
    },
    onSuccess: () => {
      toast.success('Đã lưu cấu hình quyền. Người dùng cần đăng nhập lại để áp dụng.');
      queryClient.invalidateQueries(['permission-matrix']);
      setIsDirty(false);
    },
    onError: (e) => toast.error('Lưu thất bại: ' + (e?.response?.data?.message || e.message)),
  });

  const buildUpdated = (prev) => ({
    BCH_LEVEL_1: new Set(prev?.BCH_LEVEL_1 || matrix.BCH_LEVEL_1),
    BCH_LEVEL_2: new Set(prev?.BCH_LEVEL_2 || matrix.BCH_LEVEL_2),
    BCH_LEVEL_3: new Set(prev?.BCH_LEVEL_3 || matrix.BCH_LEVEL_3),
    BCH_LEVEL_4: new Set(prev?.BCH_LEVEL_4 || matrix.BCH_LEVEL_4),
  });

  const toggle = (levelKey, permId) => {
    setLocalMatrix((prev) => {
      const updated = buildUpdated(prev);
      if (updated[levelKey].has(permId)) updated[levelKey].delete(permId);
      else updated[levelKey].add(permId);
      return updated;
    });
    setIsDirty(true);
  };

  const toggleAll = (levelKey, permIds, checked) => {
    setLocalMatrix((prev) => {
      const updated = buildUpdated(prev);
      permIds.forEach((id) => checked ? updated[levelKey].add(id) : updated[levelKey].delete(id));
      return updated;
    });
    setIsDirty(true);
  };

  const toggleCategory = (levelKey, categoryPerms, allChecked) => {
    toggleAll(levelKey, categoryPerms.map((p) => p.id), !allChecked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Đang tải cấu hình quyền...</span>
      </div>
    );
  }

  const permissionsGrouped = data?.permissions || {};
  const categories = Object.entries(permissionsGrouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-5">
      {/* Save button + dirty notice */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {LEVEL_CONFIG.map((lv) => (
            <div key={lv.key} className={`rounded-xl border p-3 ${lv.color}`}>
              <div className="font-bold text-sm">{lv.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{lv.sub}</div>
              <div className="mt-1.5 text-xl font-bold">{matrix[lv.key].size}</div>
              <div className="text-xs opacity-60">quyền được cấp</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
            isDirty ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {isDirty && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Bạn có thay đổi chưa lưu. Nhấn <strong>Lưu thay đổi</strong> để áp dụng.</span>
        </div>
      )}

      {/* Matrix table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-64">Quyền</th>
                {LEVEL_CONFIG.map((lv) => (
                  <th key={lv.key} className="text-center px-3 py-3 font-semibold text-gray-700 w-32">
                    <div>{lv.label}</div>
                    <div className="text-xs font-normal text-gray-400 whitespace-nowrap">{lv.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(([cat, perms]) => {
                const catLabel = CATEGORY_LABELS[cat] || cat;
                const permIds = perms.map((p) => p.id);
                return [
                  <tr key={`cat-${cat}`} className="bg-gray-50/70 border-t border-gray-100">
                    <td className="px-4 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      {catLabel}
                    </td>
                    {LEVEL_CONFIG.map((lv) => {
                      const allChecked = permIds.every((id) => matrix[lv.key].has(id));
                      const someChecked = permIds.some((id) => matrix[lv.key].has(id));
                      return (
                        <td key={lv.key} className="text-center px-3 py-2">
                          <button
                            onClick={() => toggleCategory(lv.key, perms, allChecked)}
                            className="hover:scale-110 transition-transform"
                            title={allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                          >
                            {allChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                            ) : someChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-300 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>,
                  ...perms.map((perm) => (
                    <tr key={perm.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700">
                        <div className="font-medium text-xs">{perm.name}</div>
                        {perm.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{perm.description}</div>
                        )}
                      </td>
                      {LEVEL_CONFIG.map((lv) => {
                        const checked = matrix[lv.key].has(perm.id);
                        return (
                          <td key={lv.key} className="text-center px-3 py-2.5">
                            <button onClick={() => toggle(lv.key, perm.id)} className="transition-transform hover:scale-110">
                              {checked ? (
                                <CheckSquare className="w-5 h-5 text-blue-600 mx-auto" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-300 mx-auto" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  )),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isDirty && (
        <div className="flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-md"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Quyền cá nhân (cấp thêm ngoài Level) ─────────────────────────────
function AccountPermissionsTab() {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [extraGrantIds, setExtraGrantIds] = useState(new Set());
  const [ghiChu, setGhiChu] = useState('');
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

  // Quyền gốc từ Level (khoá, không thể bỏ)
  const basePermIds = React.useMemo(() => {
    if (!permData?.quyenCobanIds) return new Set();
    return new Set(Array.isArray(permData.quyenCobanIds) ? permData.quyenCobanIds : []);
  }, [permData]);

  // Extra grants ban đầu từ overrideMap
  const originalExtras = React.useMemo(() => {
    const grants = new Set();
    Object.entries(permData?.overrideMap || {}).forEach(([idStr, isGranted]) => {
      if (isGranted) grants.add(parseInt(idStr));
    });
    return grants;
  }, [permData]);

  React.useEffect(() => {
    setExtraGrantIds(new Set(originalExtras));
    setGhiChu('');
  }, [JSON.stringify([...originalExtras])]);

  const toggleExtra = (id) => {
    if (basePermIds.has(id)) return;
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
    mutationFn: () =>
      permissionService.updateAccountPermissions(Number(selectedAccountId), {
        grantIds: [...extraGrantIds],
        revokeIds: [],
        ghiChu,
        grantedBy: user?.id,
      }),
    onSuccess: () => {
      toast.success('Phân quyền tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
    },
    onError: e => toast.error(e?.response?.data?.message || 'Lỗi phân quyền'),
  });

  const resetMutation = useMutation({
    mutationFn: () => permissionService.resetAccountPermissions(Number(selectedAccountId)),
    onSuccess: () => {
      toast.success('Đã xóa quyền đặc biệt. Tài khoản chỉ còn quyền gốc từ Level.');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
    },
    onError: e => toast.error(e?.response?.data?.message || 'Lỗi reset quyền'),
  });

  return (
    <div className="space-y-5">
      {/* Chọn tài khoản */}
      <div className="bg-white rounded-xl border p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Chọn tài khoản cần cấp quyền đặc biệt
        </label>
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}>
          <option value="">-- Chọn tài khoản --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.hoTen || acc.username} ({acc.username}) — {acc.vaiTro}
            </option>
          ))}
        </select>
      </div>

      {!selectedAccountId && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chọn tài khoản để cấp quyền ngoài Level</p>
          <p className="text-sm mt-1 text-gray-400">Ví dụ: cấp thêm quyền xuất báo cáo cho một tài khoản Level 3</p>
        </div>
      )}

      {selectedAccountId && (
        <>
          {permLoading && <div className="text-gray-500 text-sm p-4">Đang tải...</div>}
          {permError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">Lỗi: {permError.message}</div>}

          {permData && (
            <>
              {/* Thông tin */}
              <div className="bg-white rounded-xl border p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Họ tên</p>
                    <p className="font-semibold text-sm">{permData.hoTen || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tên đăng nhập</p>
                    <p className="font-semibold text-sm">{permData.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vai trò</p>
                    <p className="font-semibold text-sm">{permData.tenVaiTro || permData.vaiTro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nhóm</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${
                      NHOM_VAI_TRO_COLORS[permData.nhomVaiTro] || 'bg-gray-100 text-gray-700'}`}>
                      {NHOM_VAI_TRO_LABELS[permData.nhomVaiTro] || permData.nhomVaiTro}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {permData.laBCH ? (
                    <>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">✓ BCH</span>
                      {permData.bchLevel && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {LEVEL_LABELS[permData.bchLevel] || `Level ${permData.bchLevel}`}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">— quyền 🔒 từ Level không thể bỏ chọn</span>
                    </>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Không thuộc BCH</span>
                  )}
                  {permData.danhSachChucVu?.map((cv, i) => (
                    <span key={i} className="px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {cv.tenChucVu}{cv.tenBan ? ` · ${cv.tenBan}` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Phân quyền đặc biệt */}
              {Object.keys(allPermissions).length > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Quyền đặc biệt — <span className="text-blue-600">{permData.hoTen || permData.username}</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tích thêm để cấp quyền ngoài Level. Quyền 🔒 từ Level không chỉnh được.
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa toàn bộ quyền đặc biệt của ${permData.hoTen || permData.username}?`))
                            resetMutation.mutate();
                        }}
                        disabled={resetMutation.isPending}
                        className="px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold disabled:opacity-50">
                        {resetMutation.isPending ? 'Đang xóa...' : 'Xóa đặc biệt'}
                      </button>
                      <button
                        onClick={() => saveMutation.mutate()}
                        disabled={!isDirty || saveMutation.isPending}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2 text-sm">
                        <Shield className="w-3.5 h-3.5" />
                        {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú lý do</label>
                    <input
                      value={ghiChu}
                      onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ví dụ: BCH ủy quyền thêm xuất báo cáo cho kỳ học..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {Object.entries(allPermissions).map(([category, perms]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1.5 border-b pb-1">
                        {CATEGORY_LABELS[category] || category}
                      </h4>
                      <div className="grid grid-cols-1 gap-0.5">
                        {perms.map(p => {
                          const isBase = basePermIds.has(p.id);
                          const isExtra = extraGrantIds.has(p.id);
                          return (
                            <label key={p.id}
                              className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
                                isBase ? 'bg-blue-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                              }`}>
                              <input
                                type="checkbox"
                                checked={isBase || isExtra}
                                disabled={isBase}
                                onChange={() => toggleExtra(p.id)}
                                className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-800">{p.description}</span>
                                <span className="ml-2 text-xs text-gray-400 font-mono">{p.name}</span>
                              </div>
                              {isBase && (
                                <span className="shrink-0 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">🔒 Level</span>
                              )}
                              {isExtra && !isBase && (
                                <span className="shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">+ Đặc biệt</span>
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PermissionMatrixPage() {
  const [activeTab, setActiveTab] = useState('level');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân quyền BCH</h1>
          <p className="text-sm text-gray-500">
            Cấu hình quyền theo Level và cấp quyền đặc biệt cho từng tài khoản.
            Thay đổi có hiệu lực sau khi người dùng đăng nhập lại.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('level')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'level'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Shield className="w-4 h-4" />
          Quyền theo Level
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4" />
          Quyền cá nhân tài khoản
        </button>
      </div>

      {activeTab === 'level' ? <LevelMatrixTab /> : <AccountPermissionsTab />}
    </div>
  );
}
