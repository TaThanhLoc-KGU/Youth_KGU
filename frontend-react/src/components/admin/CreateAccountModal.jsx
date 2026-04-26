import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { GENDER } from '../../constants/accountConstants';
import permissionService from '../../services/permissionService';
import khoaService from '../../services/khoaService';
import cauLacBoService from '../../services/cauLacBoService';

const CATEGORY_LABELS = {
  HE_THONG: 'Hệ thống', SINH_VIEN: 'Sinh viên', GIANG_VIEN: 'Giảng viên',
  CHUYEN_VIEN: 'Chuyên viên', TO_CHUC: 'Tổ chức', HOAT_DONG: 'Hoạt động',
  DIEM_DANH: 'Điểm danh', BCH: 'BCH Đoàn - Hội',
  TAI_KHOAN: 'Tài khoản', PHAN_QUYEN: 'Phân quyền',
  BAO_CAO: 'Báo cáo', SYSTEM: 'Hệ thống',
  NEWS: 'Tin tức', VAN_BAN: 'Văn bản',
};

const EMPTY_FORM = {
  username: '', email: '', password: '', hoTen: '',
  soDienThoai: '', ngaySinh: '', gioiTinh: '',
};

const CreateAccountModal = ({ isOpen, onClose, createAccountMutation }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vaiTro, setVaiTro] = useState('SINH_VIEN');
  const [laAdmin, setLaAdmin] = useState(false);
  const [maKhoa, setMaKhoa] = useState('');
  const [maClb, setMaClb] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());
  const [errors, setErrors] = useState({});

  // Catalog permissions (chỉ load khi modal mở)
  const { data: allGrouped = {}, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissionsAll'],
    queryFn: () => permissionService.getAllPermissions(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: listKhoa = [] } = useQuery({
    queryKey: ['khoaActive'],
    queryFn: () => khoaService.getActive(),
    enabled: isOpen && vaiTro === 'QUAN_LY',
  });

  const { data: listClb = [] } = useQuery({
    queryKey: ['clbAll'],
    queryFn: () => cauLacBoService.getAll({ isActive: true }),
    enabled: isOpen && vaiTro === 'QUAN_LY',
    staleTime: 5 * 60 * 1000,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleId = (id) => {
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategory = (perms) => {
    const ids = perms.map(p => p.id);
    const allSel = ids.every(id => selectedPermIds.has(id));
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      if (allSel) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Tên đăng nhập không được để trống';
    else if (!/^[a-zA-Z0-9_]{3,50}$/.test(form.username)) e.username = 'Tên đăng nhập 3-50 ký tự (chữ, số, gạch dưới)';
    if (!form.email.trim()) e.email = 'Email không được để trống';
    else if (!/^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i.test(form.email)) e.email = 'Email phải có dạng @vnkgu.edu.vn';
    if (!form.password) e.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!form.hoTen.trim()) e.hoTen = 'Họ tên không được để trống';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      ...form,
      vaiTro,
      laAdmin: vaiTro === 'QUAN_LY' ? laAdmin : false,
      maKhoa: vaiTro === 'QUAN_LY' ? (maKhoa || null) : null,
      maClb: vaiTro === 'QUAN_LY' ? (maClb || null) : null,
      permissionIds: vaiTro === 'QUAN_LY' && !laAdmin ? Array.from(selectedPermIds) : [],
    };
    createAccountMutation.mutate(payload, {
      onSuccess: () => {
        setForm(EMPTY_FORM);
        setVaiTro('SINH_VIEN');
        setLaAdmin(false);
        setMaKhoa('');
        setMaClb('');
        setSelectedPermIds(new Set());
        setErrors({});
        onClose();
      },
    });
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setVaiTro('SINH_VIEN');
    setLaAdmin(false);
    setMaKhoa('');
    setMaClb('');
    setSelectedPermIds(new Set());
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg sm:max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-gray-900">Tạo tài khoản mới</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {createAccountMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {createAccountMutation.error?.message || 'Lỗi tạo tài khoản'}
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'username', label: 'Tên đăng nhập *', placeholder: 'username' },
              { name: 'email', label: 'Email *', placeholder: 'user@vnkgu.edu.vn', type: 'email' },
              { name: 'password', label: 'Mật khẩu *', placeholder: '••••••', type: 'password' },
              { name: 'hoTen', label: 'Họ tên *', placeholder: 'Họ và tên' },
              { name: 'soDienThoai', label: 'Số điện thoại', placeholder: '0987654321', type: 'tel' },
              { name: 'ngaySinh', label: 'Ngày sinh', type: 'date' },
            ].map(({ name, label, placeholder, type = 'text' }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giới tính</label>
              <select
                name="gioiTinh"
                value={form.gioiTinh}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn giới tính</option>
                <option value={GENDER.MALE}>Nam</option>
                <option value={GENDER.FEMALE}>Nữ</option>
                <option value={GENDER.OTHER}>Khác</option>
              </select>
            </div>
          </div>

          {/* Loại tài khoản */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Loại tài khoản *</label>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { value: 'SINH_VIEN', label: 'Sinh viên', desc: 'Truy cập cổng sinh viên, đăng ký hoạt động' },
                { value: 'QUAN_LY', label: 'Quản lý', desc: 'Truy cập dashboard quản trị với quyền được gán' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    vaiTro === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="vaiTro"
                    value={opt.value}
                    checked={vaiTro === opt.value}
                    onChange={() => setVaiTro(opt.value)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Scope Section (chỉ khi QUAN_LY) */}
          {vaiTro === 'QUAN_LY' && (
            <div className="space-y-3">
              {/* Khoa Scope */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-amber-900 mb-1">
                  Phạm vi Khoa (Khoa Scope)
                </label>
                <select
                  value={maKhoa}
                  onChange={(e) => { setMaKhoa(e.target.value); if (e.target.value) setMaClb(''); }}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Đoàn trường (Toàn bộ trường)</option>
                  {listKhoa.map((k) => (
                    <option key={k.maKhoa} value={k.maKhoa}>
                      {k.tenKhoa}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-amber-700 italic">
                  * Nếu chọn Khoa, quản lý này chỉ có thể thấy và quản lý các hoạt động thuộc Khoa đó.
                </p>
              </div>

              {/* CLB Scope */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-orange-900 mb-1">
                  Phạm vi CLB (CLB Scope)
                </label>
                <select
                  value={maClb}
                  onChange={(e) => { setMaClb(e.target.value); if (e.target.value) setMaKhoa(''); }}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Không giới hạn CLB</option>
                  {listClb.map((c) => (
                    <option key={c.maClb} value={c.maClb}>
                      {c.tenClb}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-orange-700 italic">
                  * Nếu chọn CLB, tài khoản này chỉ quản lý CLB đó (tự động vào portal CLB khi đăng nhập).
                </p>
              </div>
            </div>
          )}

          {/* Phân quyền (chỉ khi QUAN_LY) */}
          {vaiTro === 'QUAN_LY' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phân quyền</label>

              {/* Toàn quyền */}
              <label className="flex items-center gap-3 p-3 mb-3 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100">
                <input
                  type="checkbox"
                  checked={laAdmin}
                  onChange={e => setLaAdmin(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div>
                  <p className="font-semibold text-sm text-blue-900">Toàn quyền (Admin)</p>
                  <p className="text-xs text-blue-600">Bỏ qua kiểm tra quyền — truy cập tất cả chức năng</p>
                </div>
              </label>

              {/* Chi tiết permissions */}
              {!laAdmin && (
                loadingPerms ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {Object.entries(allGrouped).map(([cat, perms]) => {
                      const ids = perms.map(p => p.id);
                      const allSel = ids.every(id => selectedPermIds.has(id));
                      const someSel = ids.some(id => selectedPermIds.has(id));
                      return (
                        <div key={cat} className="bg-white rounded-lg border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleCategory(perms)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                              allSel ? 'bg-blue-600 text-white' : someSel ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                              allSel ? 'bg-white border-white' : 'border-current'
                            }`}>
                              {allSel && <span className="w-2 h-2 bg-blue-600 rounded-sm" />}
                            </span>
                            {CATEGORY_LABELS[cat] || cat}
                            <span className="ml-auto font-normal text-xs opacity-70">
                              {ids.filter(id => selectedPermIds.has(id)).length}/{ids.length}
                            </span>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                            {perms.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={selectedPermIds.has(perm.id)}
                                  onChange={() => toggleId(perm.id)}
                                  className="w-3.5 h-3.5 accent-blue-600"
                                />
                                <span className="text-gray-700 truncate">{perm.description || perm.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createAccountMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold"
            >
              {createAccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createAccountMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountModal;
