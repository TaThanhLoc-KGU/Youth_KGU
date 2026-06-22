import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Shield, X, Save, Loader2, CheckSquare, Square, Info, Lock } from 'lucide-react';
import permissionService from '../../services/permissionService';
import { ROLE_LABELS } from '../../constants/accountConstants';

const CATEGORY_LABELS = {
  HE_THONG: 'Hệ thống', SINH_VIEN: 'Sinh viên', GIANG_VIEN: 'Giảng viên',
  CHUYEN_VIEN: 'Chuyên viên', TO_CHUC: 'Tổ chức', HOAT_DONG: 'Hoạt động',
  DIEM_DANH: 'Điểm danh', BCH: 'BCH Đoàn - Hội',
  TAI_KHOAN: 'Tài khoản', PHAN_QUYEN: 'Phân quyền',
  BAO_CAO: 'Báo cáo', SYSTEM: 'Hệ thống (log)', NEWS: 'Tin tức',
};

/**
 * Modal phân quyền tài khoản — hệ thống 6 vai trò mới.
 *
 * Hiển thị quyền mặc định của role (khóa, không bỏ được) và cho phép
 * thêm quyền tùy chỉnh ngoài role defaults.
 *
 * @param {Object}   account  - { id, username, hoTen, vaiTro, tenVaiTro, maKhoa, tenKhoa, maLop, tenLop }
 * @param {boolean}  isOpen
 * @param {Function} onClose
 */
const PermissionAssignModal = ({ account, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  // customIds: quyền extra ngoài role defaults
  const [customIds, setCustomIds] = useState(new Set());

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
      setCustomIds(new Set(accountPerms.customQuyenIds || []));
    }
  }, [accountPerms]);

  const defaultIds = new Set(accountPerms?.defaultQuyenIds || []);
  const isAdmin = account?.vaiTro === 'ADMIN' || accountPerms?.laAdmin;

  const saveMutation = useMutation({
    mutationFn: () => permissionService.setAccountPermissions(account.id, {
      permissionIds: Array.from(customIds),
    }),
    onSuccess: () => {
      toast.success(`Đã cập nhật quyền tùy chỉnh cho ${account?.username}`);
      queryClient.invalidateQueries({ queryKey: ['accountPermissions', account?.id] });
      onClose();
    },
    onError: (err) => {
      toast.error(typeof err === 'string' ? err : 'Lỗi cập nhật quyền');
    },
  });

  const allPermissions = Object.values(allGrouped).flat();

  const toggleCustom = (id) => {
    if (defaultIds.has(id)) return; // không toggle quyền default
    setCustomIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategoryCustom = (items) => {
    const nonDefaultIds = items.map(p => p.id).filter(id => !defaultIds.has(id));
    const allChecked = nonDefaultIds.every(id => customIds.has(id) || defaultIds.has(id));
    setCustomIds(prev => {
      const next = new Set(prev);
      allChecked
        ? nonDefaultIds.forEach(id => next.delete(id))
        : nonDefaultIds.forEach(id => next.add(id));
      return next;
    });
  };

  const selectAllCustom = () => {
    const nonDefault = allPermissions.map(p => p.id).filter(id => !defaultIds.has(id));
    setCustomIds(new Set(nonDefault));
  };

  const clearCustom = () => setCustomIds(new Set());

  if (!isOpen) return null;

  const isLoading = loadingAll || loadingAccount;
  const roleLabel = ROLE_LABELS[account?.vaiTro] || account?.tenVaiTro || account?.vaiTro;
  const totalEffective = defaultIds.size + customIds.size;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Phân quyền tài khoản</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm text-gray-600">{account?.hoTen || account?.username}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {roleLabel}
                </span>
                {account?.maKhoa && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    📍 {account?.tenKhoa || account?.maKhoa}
                  </span>
                )}
                {account?.maLop && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    🏫 {account?.tenLop || account?.maLop}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : isAdmin ? (
            <div className="text-center py-10">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">Tài khoản ADMIN</p>
              <p className="text-sm text-gray-500 mt-1">Có toàn quyền — bypass mọi kiểm tra quyền trong hệ thống.</p>
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Quyền mặc định theo vai trò ({defaultIds.size} quyền)</strong> — tự động áp dụng, không thể bỏ.
                  Bạn có thể tick thêm quyền bổ sung bên dưới.
                  <br/>
                  <span className="text-blue-600">Tổng hiệu lực: {totalEffective} quyền</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 mr-auto">
                  Quyền bổ sung: <strong>{customIds.size}</strong>
                </span>
                <button
                  type="button"
                  onClick={selectAllCustom}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Chọn tất cả extra
                </button>
                <button
                  type="button"
                  onClick={clearCustom}
                  disabled={customIds.size === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700"
                >
                  <Square className="w-3.5 h-3.5" /> Xóa extra
                </button>
              </div>

              {/* Permission groups */}
              <div className="space-y-2">
                {Object.entries(allGrouped).map(([category, perms]) => {
                  const label = CATEGORY_LABELS[category] || category;
                  const allEffective = perms.every(p => defaultIds.has(p.id) || customIds.has(p.id));
                  const someEffective = perms.some(p => defaultIds.has(p.id) || customIds.has(p.id));

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategoryCustom(perms)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                          allEffective ? 'bg-blue-600 text-white'
                          : someEffective ? 'bg-blue-50 text-blue-800'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          allEffective ? 'bg-white border-white'
                          : someEffective ? 'border-blue-500'
                          : 'border-gray-400'
                        }`}>
                          {allEffective && <span className="w-2 h-2 bg-blue-600 rounded-sm" />}
                          {someEffective && !allEffective && <span className="w-2 h-0.5 bg-blue-500 rounded" />}
                        </span>
                        {label}
                        <span className="ml-auto text-xs font-normal opacity-75">
                          {perms.filter(p => defaultIds.has(p.id) || customIds.has(p.id)).length}/{perms.length}
                        </span>
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 p-3 bg-white">
                        {perms.map(perm => {
                          const isDefault = defaultIds.has(perm.id);
                          const isCustom = customIds.has(perm.id);
                          const isChecked = isDefault || isCustom;
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer ${
                                isDefault ? 'bg-blue-50 cursor-not-allowed' : 'hover:bg-gray-50'
                              }`}
                              title={isDefault ? 'Quyền mặc định theo vai trò — không thể bỏ chọn' : ''}
                            >
                              <div className="relative flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDefault}
                                  onChange={() => toggleCustom(perm.id)}
                                  className="w-4 h-4 accent-blue-600 disabled:opacity-60"
                                />
                                {isDefault && (
                                  <Lock className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-blue-400" />
                                )}
                              </div>
                              <span className={`truncate ${isDefault ? 'text-blue-700' : 'text-gray-700'}`}>
                                {perm.description || perm.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isAdmin && (
          <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              <span className="text-blue-600 font-medium">{defaultIds.size}</span> quyền vai trò
              {customIds.size > 0 && (
                <> + <span className="text-green-600 font-medium">{customIds.size}</span> bổ sung</>
              )}
            </p>
            <div className="flex gap-2">
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
                Lưu quyền bổ sung
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionAssignModal;
