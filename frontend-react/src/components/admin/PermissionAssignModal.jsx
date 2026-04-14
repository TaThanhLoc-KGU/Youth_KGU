import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Shield, X, Save, Loader2, AlertTriangle, CheckSquare, Square, Wand2 } from 'lucide-react';
import permissionService from '../../services/permissionService';

// ─── Preset: Toàn quyền cấp Khoa ──────────────────────────────────────────────
// Tất cả quyền liên quan hoạt động / điểm danh / BCH / xem sinh viên-lớp /
// báo cáo / tin tức.
// KHÔNG bao gồm: quản lý tài khoản, cài đặt hệ thống, nhập liệu danh mục.
const PRESET_KHOA_ADMIN = [
  // Hoạt động
  'XEM_HOAT_DONG', 'TAO_HOAT_DONG', 'SUA_HOAT_DONG', 'XOA_HOAT_DONG',
  'QUAN_LY_DANG_KY', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG',
  // Điểm danh
  'XEM_DIEM_DANH', 'QUET_QR', 'CHINH_SUA_DIEM_DANH', 'PHAN_CONG_DIEM_DANH', 'XEM_LICH_SU_THAM_GIA',
  // BCH
  'XEM_BCH', 'THEM_BCH', 'SUA_BCH', 'XOA_BCH',
  // Sinh viên / Lớp / Khoa (chỉ xem)
  'XEM_SINH_VIEN', 'XEM_LOP', 'XEM_KHOA', 'XEM_NGANH',
  // Giảng viên (xem)
  'XEM_GIANG_VIEN',
  // Báo cáo
  'XEM_BAO_CAO', 'XUAT_BAO_CAO', 'XEM_THONG_KE',
  // Tin tức cấp khoa
  'DANG_TIN_TUC', 'SUA_TIN_TUC', 'XOA_TIN_TUC', 'DUYET_TIN_TUC',
  // Cuộc thi
  'TAO_CUOC_THI', 'SUA_CUOC_THI', 'XOA_CUOC_THI', 'QUAN_LY_CUOC_THI',
];

// ─── Preset: BCH cấp Khoa ─────────────────────────────────────────────────────
// Quyền tối thiểu cho cán bộ BCH khoa: quét QR, điểm danh, xem danh sách.
const PRESET_BCH_KHOA = [
  // Hoạt động
  'XEM_HOAT_DONG', 'DANG_KY_HOAT_DONG', 'HUY_DANG_KY_HOAT_DONG',
  // Điểm danh
  'XEM_DIEM_DANH', 'QUET_QR', 'PHAN_CONG_DIEM_DANH', 'XEM_LICH_SU_THAM_GIA',
  // BCH
  'XEM_BCH', 'THEM_BCH', 'SUA_BCH',
  // Sinh viên / Lớp / Khoa (chỉ xem)
  'XEM_SINH_VIEN', 'XEM_LOP', 'XEM_KHOA',
  // Báo cáo (chỉ xem)
  'XEM_BAO_CAO', 'XEM_LICH_SU_THAM_GIA',
];

/**
 * Modal phân quyền tài khoản QUAN_LY.
 *
 * @param {Object}   account   - { id, username, hoTen, maKhoa, tenKhoa }
 * @param {boolean}  isOpen
 * @param {Function} onClose
 */
const PermissionAssignModal = ({ account, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [laAdmin, setLaAdmin] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: allGrouped = {}, isLoading: loadingAll } = useQuery({
    queryKey: ['permissionsAll'],
    queryFn: () => permissionService.getAllPermissions(),
    enabled: isOpen,
  });

  const { data: accountPerms, isLoading: loadingAccount } = useQuery({
    queryKey: ['accountPermissions', account?.id],
    queryFn: () => permissionService.getAccountPermissions(account.id),
    enabled: isOpen && !!account?.id,
  });

  useEffect(() => {
    if (accountPerms) {
      setLaAdmin(accountPerms.laAdmin || false);
      setSelectedIds(new Set(accountPerms.quyenIds || []));
    }
  }, [accountPerms]);

  const saveMutation = useMutation({
    mutationFn: () => permissionService.setAccountPermissions(account.id, {
      laAdmin,
      permissionIds: laAdmin ? [] : Array.from(selectedIds),
      adminId: null,
    }),
    onSuccess: () => {
      toast.success(`Đã cập nhật quyền cho ${account.username}`);
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', account?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
      onClose();
    },
    onError: (err) => {
      toast.error(typeof err === 'string' ? err : 'Lỗi cập nhật quyền');
    },
  });

  // ── helpers ──────────────────────────────────────────────────────────────────
  const allPermissions = Object.values(allGrouped).flat();
  const allPermissionIds = allPermissions.map(p => p.id);
  const allSelected = allPermissionIds.length > 0 && allPermissionIds.every(id => selectedIds.has(id));

  /** Build map name → id từ allGrouped để áp preset */
  const nameToId = () => {
    const map = {};
    allPermissions.forEach(p => { map[p.name] = p.id; });
    return map;
  };

  const applyPreset = (names) => {
    const map = nameToId();
    const ids = names.filter(n => map[n]).map(n => map[n]);
    setSelectedIds(new Set(ids));
    const notFound = names.filter(n => !map[n]);
    if (notFound.length > 0) {
      console.warn('Preset: quyền chưa có trong DB:', notFound);
    }
  };

  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategory = (items) => {
    const ids = items.map(p => p.id);
    const allSel = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      allSel ? ids.forEach(id => next.delete(id)) : ids.forEach(id => next.add(id));
      return next;
    });
  };

  const CATEGORY_LABELS = {
    HE_THONG: 'Hệ thống', SINH_VIEN: 'Sinh viên', GIANG_VIEN: 'Giảng viên',
    CHUYEN_VIEN: 'Chuyên viên', TO_CHUC: 'Tổ chức', HOAT_DONG: 'Hoạt động',
    DIEM_DANH: 'Điểm danh', BCH: 'BCH Đoàn - Hội',
    TAI_KHOAN: 'Tài khoản', PHAN_QUYEN: 'Phân quyền',
    BAO_CAO: 'Báo cáo', SYSTEM: 'Hệ thống',
    NEWS: 'Tin tức', VAN_BAN: 'Văn bản',
  };

  if (!isOpen) return null;

  const isLoading = loadingAll || loadingAccount;
  const isKhoaScoped = !!(account?.maKhoa || accountPerms?.maKhoa);
  const tenKhoa = account?.tenKhoa || accountPerms?.tenKhoa || account?.maKhoa;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Phân quyền tài khoản</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {account?.hoTen || account?.username}
                {isKhoaScoped && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700">
                    📍 {tenKhoa}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Toàn quyền Admin toggle */}
              <label className="flex items-center gap-3 p-3 mb-3 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  checked={laAdmin}
                  onChange={e => setLaAdmin(e.target.checked)}
                  className="w-5 h-5 accent-blue-600"
                />
                <div>
                  <p className="font-semibold text-blue-900">Toàn quyền Admin — cấp Đoàn trường</p>
                  <p className="text-xs text-blue-600">Bypass kiểm tra quyền · truy cập toàn bộ hệ thống · không bị giới hạn khoa</p>
                </div>
              </label>

              {/* Cảnh báo laAdmin + maKhoa */}
              {laAdmin && isKhoaScoped && (
                <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-orange-50 border border-orange-300 text-orange-800 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                  <span>
                    Tài khoản này đang giới hạn theo <strong>{tenKhoa}</strong>.
                    Dùng "Toàn quyền Admin" sẽ bypass kiểm tra quyền nhưng backend vẫn lọc đúng khoa.
                    <strong> Khuyến nghị:</strong> bỏ tick và dùng preset <em>"Toàn quyền cấp Khoa"</em>.
                  </span>
                </div>
              )}

              {/* ── Preset buttons ── */}
              {!laAdmin && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Bộ quyền nhanh
                  </p>
                  <div className="flex flex-wrap gap-2">

                    {/* Toàn quyền cấp Khoa */}
                    <button
                      type="button"
                      onClick={() => applyPreset(PRESET_KHOA_ADMIN)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      Toàn quyền cấp Khoa
                    </button>

                    {/* BCH cấp Khoa */}
                    <button
                      type="button"
                      onClick={() => applyPreset(PRESET_BCH_KHOA)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      BCH cấp Khoa
                    </button>

                    {/* Divider */}
                    <span className="self-center text-gray-300 text-sm">|</span>

                    {/* Chọn tất cả */}
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set(allPermissionIds))}
                      disabled={allSelected}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Tất cả
                    </button>

                    {/* Bỏ chọn tất cả */}
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      disabled={selectedIds.size === 0}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-600 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Bỏ tất cả
                    </button>
                  </div>

                  {/* Mô tả preset đang active */}
                  {isKhoaScoped && selectedIds.size > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      💡 Backend tự giới hạn dữ liệu theo <strong>{tenKhoa}</strong> — chỉ cần chọn đúng quyền chức năng.
                    </p>
                  )}
                </div>
              )}

              {/* ── Danh sách quyền chi tiết ── */}
              {!laAdmin && (
                <>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm text-gray-500">
                      Đã chọn <strong>{selectedIds.size}</strong> / {allPermissionIds.length} quyền
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(allGrouped).map(([category, perms]) => {
                      const label = CATEGORY_LABELS[category] || category;
                      const ids = perms.map(p => p.id);
                      const allSel = ids.every(id => selectedIds.has(id));
                      const someSel = ids.some(id => selectedIds.has(id));

                      return (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleCategory(perms)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-left font-semibold text-sm transition-colors ${
                              allSel ? 'bg-blue-600 text-white'
                              : someSel ? 'bg-blue-50 text-blue-800'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                              allSel ? 'bg-white border-white'
                              : someSel ? 'border-blue-500'
                              : 'border-gray-400'
                            }`}>
                              {allSel && <span className="w-2 h-2 bg-blue-600 rounded-sm" />}
                              {someSel && !allSel && <span className="w-2 h-0.5 bg-blue-500 rounded" />}
                            </span>
                            {label}
                            <span className="ml-auto text-xs font-normal opacity-70">
                              {ids.filter(id => selectedIds.has(id)).length}/{ids.length}
                            </span>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 p-3 bg-white">
                            {perms.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(perm.id)}
                                  onChange={() => toggleId(perm.id)}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-gray-700 truncate">{perm.description || perm.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {laAdmin && (
                <p className="text-center text-sm text-gray-500 py-8">
                  Tài khoản này có toàn quyền Admin — không cần chọn quyền chi tiết.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t bg-gray-50">
          {!laAdmin ? (
            <p className="text-sm text-gray-500">
              Đã chọn <strong>{selectedIds.size}</strong> quyền
            </p>
          ) : <div />}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu quyền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionAssignModal;
