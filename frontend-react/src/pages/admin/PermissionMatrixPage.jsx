import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Loader2, CheckSquare, Square, Info, Users, Search, X, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import permissionService from '../../services/permissionService';
import accountService from '../../services/accountService';

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  HE_THONG:    'Hệ thống',
  SINH_VIEN:   'Sinh viên / Đoàn viên',
  GIANG_VIEN:  'Giảng viên',
  CHUYEN_VIEN: 'Chuyên viên',
  TO_CHUC:     'Tổ chức',
  CLB:         'Câu lạc bộ',
  HOAT_DONG:   'Hoạt động',
  DIEM_DANH:   'Điểm danh',
  BCH:         'Ban Chấp Hành',
  TAI_KHOAN:   'Tài khoản',
  PHAN_QUYEN:  'Phân quyền',
  BAO_CAO:     'Báo cáo',
  SYSTEM:      'System (IT)',
  TIN_TUC:     'Tin tức',
};

const ROLE_CONFIG = [
  { key: 'ADMIN',            label: 'Admin',          sub: 'Quản trị viên hệ thống',   color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'QUAN_LY_KHOA',    label: 'BT Đoàn khoa',  sub: 'Bí thư Đoàn khoa',         color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'PHO_QUAN_LY_KHOA',label: 'Phó BT ĐK',     sub: 'Phó bí thư Đoàn khoa',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'QUAN_LY_CHI_DOAN',label: 'BT Chi đoàn',   sub: 'Bí thư chi đoàn',          color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'PHO_CHI_DOAN',    label: 'Phó BT CĐ',     sub: 'Phó bí thư chi đoàn',      color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { key: 'DOAN_VIEN',       label: 'Đoàn viên',     sub: 'Quyền mặc định đoàn viên', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'DIEM_DANH_VIEN', label: 'CTV Điểm danh', sub: 'Cộng tác viên điểm danh',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'QUAN_LY_CLB',   label: 'Chủ nhiệm CLB', sub: 'Chủ nhiệm CLB/Đội/Nhóm',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
];

const EMPTY_MATRIX = Object.fromEntries(ROLE_CONFIG.map(r => [r.key, new Set()]));

// ─── Tab 1: Ma trận quyền theo Vai trò ───────────────────────────────────────
function RoleMatrixTab() {
  const queryClient = useQueryClient();
  const [localMatrix, setLocalMatrix] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const { data: defaults = {}, isLoading: loadingDefaults } = useQuery({
    queryKey: ['role-defaults'],
    queryFn: permissionService.getRoleDefaults,
  });

  const { data: allPermsGrouped = {}, isLoading: loadingPerms } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: permissionService.getAllPermissions,
  });

  // Khi data load xong, init localMatrix từ server data
  React.useEffect(() => {
    if (Object.keys(defaults).length > 0 && !localMatrix) {
      const mat = {};
      ROLE_CONFIG.forEach(r => {
        mat[r.key] = new Set((defaults[r.key] || []).map(Number));
      });
      setLocalMatrix(mat);
    }
  }, [defaults]);

  const matrix = localMatrix || (() => {
    const mat = {};
    ROLE_CONFIG.forEach(r => {
      mat[r.key] = new Set((defaults[r.key] || []).map(Number));
    });
    return mat;
  })();

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        ROLE_CONFIG.map(r =>
          permissionService.setRoleDefaults(r.key, Array.from(matrix[r.key]))
        )
      );
    },
    onSuccess: () => {
      toast.success('Đã lưu ma trận quyền. Người dùng cần đăng nhập lại để áp dụng.');
      queryClient.invalidateQueries({ queryKey: ['role-defaults'] });
      setIsDirty(false);
    },
    onError: (e) => toast.error('Lưu thất bại: ' + (e?.response?.data?.message || e.message)),
  });

  const toggle = (roleKey, permId) => {
    setLocalMatrix(prev => {
      const next = { ...prev };
      const s = new Set(prev[roleKey]);
      s.has(permId) ? s.delete(permId) : s.add(permId);
      next[roleKey] = s;
      return next;
    });
    setIsDirty(true);
  };

  const toggleCategory = (roleKey, perms, allChecked) => {
    const ids = perms.map(p => p.id);
    setLocalMatrix(prev => {
      const next = { ...prev };
      const s = new Set(prev[roleKey]);
      ids.forEach(id => allChecked ? s.delete(id) : s.add(id));
      next[roleKey] = s;
      return next;
    });
    setIsDirty(true);
  };

  const isLoading = loadingDefaults || loadingPerms;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Đang tải cấu hình quyền...</span>
      </div>
    );
  }

  const categories = Object.entries(allPermsGrouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-5">
      {/* Role summary cards */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1">
          {ROLE_CONFIG.map(r => (
            <div key={r.key} className={`rounded-xl border p-2.5 text-center ${r.color}`}>
              <div className="font-bold text-xs">{r.label}</div>
              <div className="mt-1 text-xl font-bold">{matrix[r.key]?.size ?? 0}</div>
              <div className="text-xs opacity-60">quyền</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
            isDirty ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[200px]">Quyền</th>
                {ROLE_CONFIG.map(r => (
                  <th key={r.key} className="text-center px-2 py-3 font-semibold text-gray-700 min-w-[90px]">
                    <div className="text-xs">{r.label}</div>
                    <div className="text-[10px] font-normal text-gray-400 hidden sm:block">{r.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(([cat, perms]) => {
                const catLabel = CATEGORY_LABELS[cat] || cat;
                const permIds = perms.map(p => p.id);
                return [
                  <tr key={`cat-${cat}`} className="bg-gray-50/70 border-t border-gray-100">
                    <td className="px-4 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      {catLabel}
                    </td>
                    {ROLE_CONFIG.map(r => {
                      const allChecked = permIds.every(id => matrix[r.key]?.has(id));
                      const someChecked = permIds.some(id => matrix[r.key]?.has(id));
                      return (
                        <td key={r.key} className="text-center px-2 py-2">
                          <button
                            onClick={() => toggleCategory(r.key, perms, allChecked)}
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
                  ...perms.map(perm => (
                    <tr key={perm.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700">
                        <div className="font-medium text-xs">{perm.description || perm.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{perm.name}</div>
                      </td>
                      {ROLE_CONFIG.map(r => {
                        const checked = matrix[r.key]?.has(perm.id);
                        return (
                          <td key={r.key} className="text-center px-2 py-2.5">
                            <button onClick={() => toggle(r.key, perm.id)} className="transition-transform hover:scale-110">
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

// ─── Tab 2: Quyền cá nhân (cấp thêm ngoài role defaults) ─────────────────────
function AccountPermissionsTab({ initialAccountId = null }) {
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId ? String(initialAccountId) : '');
  const [selectedAccountLabel, setSelectedAccountLabel] = useState('');
  const [extraGrantIds, setExtraGrantIds] = useState(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: searchResults = [], isFetching: searching, error: searchError } = useQuery({
    queryKey: ['accountSearch', submittedKeyword],
    queryFn: () => accountService.searchAccounts(submittedKeyword),
    enabled: !!submittedKeyword,
    staleTime: 30_000,
  });

  const handleSearch = () => {
    const kw = searchInput.trim();
    if (!kw) return;
    setSubmittedKeyword(kw);
    setSelectedAccountId('');
    setSelectedAccountLabel('');
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSubmittedKeyword('');
    setSelectedAccountId('');
    setSelectedAccountLabel('');
    inputRef.current?.focus();
  };

  const handleSelectAccount = (acc) => {
    setSelectedAccountId(String(acc.id));
    setSelectedAccountLabel(`${acc.hoTen || acc.username} (${acc.username})`);
  };

  const { data: permData, isLoading: permLoading, error: permError } = useQuery({
    queryKey: ['accountPermissions', selectedAccountId],
    queryFn: () => permissionService.getAccountPermissions(Number(selectedAccountId)),
    enabled: !!selectedAccountId,
  });

  const { data: allPermissions = {} } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: permissionService.getAllPermissions,
  });

  // Quyền mặc định từ role — không thể bỏ chọn
  const basePermIds = React.useMemo(
    () => new Set((permData?.defaultQuyenIds || []).map(Number)),
    [permData]
  );

  // Quyền tùy chỉnh thêm ngoài role defaults
  const originalExtras = React.useMemo(
    () => new Set((permData?.customQuyenIds || []).map(Number)),
    [permData]
  );

  React.useEffect(() => {
    setExtraGrantIds(new Set(originalExtras));
  }, [JSON.stringify([...originalExtras])]);

  // Khi vào từ deep-link (có initialAccountId), tự set label từ permData
  React.useEffect(() => {
    if (permData && !selectedAccountLabel) {
      setSelectedAccountLabel(`${permData.hoTen || permData.username} (${permData.username})`);
    }
  }, [permData]);

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
      toast.success('Đã xóa quyền đặc biệt. Tài khoản chỉ còn quyền mặc định theo vai trò.');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
    },
    onError: e => toast.error(e?.response?.data?.message || 'Lỗi reset quyền'),
  });

  const categories = Object.entries(allPermissions).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-5">
      {/* Tìm kiếm tài khoản */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Tìm tài khoản để cấp thêm quyền đặc biệt
        </label>
        <p className="text-xs text-gray-500">
          Dùng cho các tài khoản cần quyền ngoài mặc định — ví dụ: đoàn viên điểm danh, tài khoản thống kê...
        </p>

        <div className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập tên hoặc tên đăng nhập..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button onClick={handleClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim() || searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-semibold flex items-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            {searching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>

        {submittedKeyword && !searching && (
          <>
            {searchError && <p className="text-sm text-red-500">Lỗi tìm kiếm: {searchError.message}</p>}
            {!searchError && searchResults.length === 0 && (
              <p className="text-sm text-gray-500">Không tìm thấy tài khoản nào khớp với "<strong>{submittedKeyword}</strong>".</p>
            )}
            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {searchResults.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                      selectedAccountId === String(acc.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 font-semibold text-sm">
                      {(acc.hoTen || acc.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{acc.hoTen || acc.username}</p>
                      <p className="text-xs text-gray-500">
                        <span className="font-mono">{acc.username}</span>
                        {acc.vaiTro && <span className="ml-2">— {acc.vaiTro}</span>}
                      </p>
                    </div>
                    {selectedAccountId === String(acc.id) && (
                      <span className="text-xs text-blue-600 font-semibold shrink-0">✓ Đang xem</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selectedAccountId && selectedAccountLabel && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400">Đang cấu hình:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{selectedAccountLabel}</span>
          </div>
        )}
      </div>

      {!selectedAccountId && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tìm và chọn tài khoản để cấp quyền bổ sung</p>
          <p className="text-sm mt-1 text-gray-400">Ví dụ: đoàn viên điểm danh cần thêm quyền QUET_QR</p>
        </div>
      )}

      {selectedAccountId && (
        <>
          {permLoading && <div className="text-gray-500 text-sm p-4">Đang tải...</div>}
          {permError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">Lỗi: {permError.message}</div>}

          {permData && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              {/* Account info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-500">Họ tên</p>
                  <p className="font-semibold text-sm">{permData.hoTen || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tên đăng nhập</p>
                  <p className="font-semibold text-sm font-mono">{permData.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vai trò</p>
                  <p className="font-semibold text-sm">{permData.tenVaiTro || permData.vaiTro}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quyền mặc định</p>
                  <p className="font-semibold text-sm">{basePermIds.size} quyền từ vai trò</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <p className="text-sm text-gray-600">
                  Chọn quyền bổ sung ngoài mặc định của vai trò. Quyền mặc định (<span className="text-blue-600 font-semibold">🔒 mặc định</span>) không thể thay đổi ở đây.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`Xóa toàn bộ quyền bổ sung của ${permData.hoTen || permData.username}?`))
                        resetMutation.mutate();
                    }}
                    disabled={resetMutation.isPending}
                    className="px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold disabled:opacity-50"
                  >
                    {resetMutation.isPending ? 'Đang xóa...' : 'Xóa bổ sung'}
                  </button>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={!isDirty || saveMutation.isPending}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2 text-sm"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </div>

              {/* Permission checklist */}
              {categories.map(([category, perms]) => (
                <div key={category}>
                  <h4 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1.5 border-b pb-1">
                    {CATEGORY_LABELS[category] || category}
                  </h4>
                  <div className="grid grid-cols-1 gap-0.5">
                    {perms.map(p => {
                      const isBase = basePermIds.has(p.id);
                      const isExtra = extraGrantIds.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
                            isBase ? 'bg-blue-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isBase || isExtra}
                            disabled={isBase}
                            onChange={() => toggleExtra(p.id)}
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-800">{p.description || p.name}</span>
                            <span className="ml-2 text-xs text-gray-400 font-mono">{p.name}</span>
                          </div>
                          {isBase && (
                            <span className="shrink-0 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">🔒 mặc định</span>
                          )}
                          {isExtra && !isBase && (
                            <span className="shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">+ bổ sung</span>
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PermissionMatrixPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const accountIdParam = searchParams.get('id');
  const [activeTab, setActiveTab] = useState(tabParam === 'account' ? 'account' : 'role');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ma trận phân quyền</h1>
          <p className="text-sm text-gray-500">
            Cấu hình quyền mặc định theo vai trò và cấp quyền bổ sung cho từng tài khoản.
            Thay đổi có hiệu lực sau khi người dùng đăng nhập lại.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('role')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'role' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Quyền theo Vai trò
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'account' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Quyền bổ sung tài khoản
        </button>
      </div>

      {activeTab === 'role' ? (
        <RoleMatrixTab />
      ) : (
        <AccountPermissionsTab initialAccountId={accountIdParam} />
      )}
    </div>
  );
}
