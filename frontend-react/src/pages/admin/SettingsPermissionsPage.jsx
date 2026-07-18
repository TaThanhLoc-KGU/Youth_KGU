import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Info, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import permissionService from '../../services/permissionService';
import accountService from '../../services/accountService';
import chucVuService from '../../services/chucVuService';
import useAuthStore from '../../stores/authStore';
import {
  NHOM_VAI_TRO_LABELS,
  NHOM_VAI_TRO_COLORS,
} from '../../constants/permissionConstants';

const THUOC_BAN_LABELS = {
  DOAN: 'Đoàn Thanh niên',
  HOI: 'Hội Sinh viên',
  BAN: 'Ban chuyên môn',
  DOI: 'Đội',
  CLB: 'Câu lạc bộ',
  KHAC: 'Khác',
};

// ─── Tab 1: Phân quyền theo chức vụ (legacy, vẫn hữu ích cho edge case) ─────
function RolePermissionsTab() {
  const [selectedChucVuMa, setSelectedChucVuMa] = useState('');
  const [localSelected, setLocalSelected] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: danhSachChucVu = [], isLoading: loadingChucVu } = useQuery({
    queryKey: ['chuc-vu-all'],
    queryFn: chucVuService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allPermissions = {}, isLoading: loadingPerms } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  const { data: chucVuPermIds = [], isLoading: loadingChucVuPerms } = useQuery({
    queryKey: ['rolePermissions', selectedChucVuMa],
    queryFn: () => permissionService.getRolePermissions(selectedChucVuMa),
    enabled: !!selectedChucVuMa,
  });

  React.useEffect(() => {
    if (chucVuPermIds) setLocalSelected(new Set(chucVuPermIds));
  }, [JSON.stringify(chucVuPermIds)]);

  const saveMutation = useMutation({
    mutationFn: () => permissionService.updateRolePermissions(selectedChucVuMa, [...localSelected]),
    onSuccess: () => {
      toast.success('Cập nhật quyền chức vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedChucVuMa] });
    },
    onError: e => toast.error(e?.response?.data?.message || 'Lỗi cập nhật'),
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
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Trang này cấu hình quyền gắn với mã chức vụ (CV001, CV002...). Quyền cấp theo
            <strong> Level BCH</strong> được quản lý tại trang <strong>Phân quyền BCH</strong>.
          </p>
        </div>

        {loadingChucVu ? (
          <div className="text-gray-400 text-sm">Đang tải danh sách chức vụ...</div>
        ) : (
          <select
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedChucVuMa}
            onChange={e => setSelectedChucVuMa(e.target.value)}>
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
                  onClick={() => saveMutation.mutate()}
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
    </div>
  );
}

// ─── Tab 2: Cấp quyền đặc biệt cho từng tài khoản ──────────────────────────
function AccountPermissionsTab() {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccountLabel, setSelectedAccountLabel] = useState('');
  const [extraGrantIds, setExtraGrantIds] = useState(new Set());
  const [ghiChu, setGhiChu] = useState('');

  // Search state — chỉ search khi nhấn Tìm
  const [searchInput, setSearchInput] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const inputRef = useRef(null);

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: searchResults = [],
    isFetching: searching,
    error: searchError,
  } = useQuery({
    queryKey: ['accountSearch', submittedKeyword],
    queryFn: () => accountService.searchAccounts(submittedKeyword),
    enabled: !!submittedKeyword,
    staleTime: 30_000,
  });

  const handleSearch = () => {
    const kw = searchInput.trim();
    if (!kw) return;
    setSubmittedKeyword(kw);
    // Reset tài khoản đã chọn khi tìm mới
    setSelectedAccountId('');
    setSelectedAccountLabel('');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
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
    queryFn: () => api.get('/api/permissions/all').then(r => r.data?.data || {}),
  });

  // IDs quyền gốc từ Level/Role (khoá — không thể bỏ)
  // Dùng quyenCobanIds (được backend trả đúng trong hệ thống level mới)
  const basePermIds = React.useMemo(() => {
    if (!permData?.quyenCobanIds) return new Set();
    return new Set(Array.isArray(permData.quyenCobanIds) ? permData.quyenCobanIds : []);
  }, [permData]);

  // Lấy extras ban đầu từ overrideMap (isGranted = true)
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

  // Lưu quyền đặc biệt (không cần password nữa)
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

  // Reset về quyền gốc (xóa tất cả extras)
  const resetMutation = useMutation({
    mutationFn: () => permissionService.resetAccountPermissions(Number(selectedAccountId)),
    onSuccess: () => {
      toast.success('Đã xóa quyền đặc biệt. Tài khoản chỉ còn quyền gốc từ Level.');
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', selectedAccountId] });
    },
    onError: e => toast.error(e?.response?.data?.message || 'Lỗi reset quyền'),
  });

  const LEVEL_LABELS = { 1: 'Level 1', 2: 'Level 2', 3: 'Level 3', 4: 'Level 4' };

  return (
    <div className="space-y-5">
      {/* Tìm kiếm tài khoản */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Tìm tài khoản để cấu hình quyền đặc biệt
        </label>

        {/* Ô tìm kiếm */}
        <div className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Nhập tên hoặc tên đăng nhập..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim() || searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-semibold flex items-center gap-2 shrink-0">
            <Search className="w-4 h-4" />
            {searching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>

        {/* Kết quả tìm kiếm */}
        {submittedKeyword && !searching && (
          <>
            {searchError && (
              <p className="text-sm text-red-500">Lỗi tìm kiếm: {searchError.message}</p>
            )}
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
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 font-semibold text-sm">
                      {(acc.hoTen || acc.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {acc.hoTen || acc.username}
                      </p>
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

        {/* Badge tài khoản đang được chọn */}
        {selectedAccountId && selectedAccountLabel && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400">Đang cấu hình:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{selectedAccountLabel}</span>
          </div>
        )}
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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {permData.laBCH ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-semibold">
                        ✓ Ban Chấp Hành
                      </span>
                      {permData.bchLevel && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {LEVEL_LABELS[permData.bchLevel] || `Level ${permData.bchLevel}`}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">— quyền 🔒 gốc từ Level không thể bỏ</span>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      Không thuộc BCH
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
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Quyền đặc biệt: <span className="text-blue-600">{permData.hoTen || permData.username}</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Quyền <span className="font-medium">🔒 khoá</span> là quyền gốc từ Level — không thể bỏ chọn.
                        Tích thêm để cấp quyền đặc biệt ngoài Level cho tài khoản này.
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa toàn bộ quyền đặc biệt của ${permData.hoTen || permData.username}?`))
                            resetMutation.mutate();
                        }}
                        disabled={resetMutation.isPending}
                        className="px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold disabled:opacity-50">
                        {resetMutation.isPending ? 'Đang xóa...' : 'Xóa quyền đặc biệt'}
                      </button>
                      <button
                        onClick={() => saveMutation.mutate()}
                        disabled={!isDirty || saveMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" />
                        {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú lý do phân quyền</label>
                    <input
                      value={ghiChu}
                      onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ví dụ: BCH ủy quyền thêm chức năng xuất báo cáo..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                                isBase ? 'bg-blue-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'
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
                                  🔒 Quyền gốc (Level)
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

      {!selectedAccountId && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tìm và chọn tài khoản để cấu hình quyền đặc biệt</p>
          <p className="text-sm mt-1">Nhập tên hoặc tên đăng nhập rồi bấm <strong>Tìm</strong></p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPermissionsPage() {
  const [tab, setTab] = useState('account');
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quyền đặc biệt tài khoản</h1>
          <p className="text-sm text-gray-500">
            Cấp thêm quyền ngoài Level cho tài khoản cụ thể. Quyền theo Level được quản lý tại <strong>Phân quyền BCH</strong>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'account', label: 'Quyền tài khoản', icon: Users },
          { key: 'role',    label: 'Quyền theo chức vụ (legacy)', icon: Shield },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'account' ? <AccountPermissionsTab /> : <RolePermissionsTab />}
    </div>
  );
}
