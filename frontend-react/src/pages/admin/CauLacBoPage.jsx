import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, ChevronLeft,
  BookOpen, UserPlus, UserMinus, Building2, Star, Award,
  Calendar, Filter, X, Save, AlertCircle, Lock, Unlock,
} from 'lucide-react';
import cauLacBoService from '../../services/cauLacBoService';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';

// ── Hằng số ──────────────────────────────────────────────────────────────────

const LOAI_OPTIONS = [
  { value: 'CLB',  label: 'Câu lạc bộ',  icon: '🎭', color: 'blue' },
  { value: 'DOI',  label: 'Đội',          icon: '⚽', color: 'green' },
  { value: 'NHOM', label: 'Nhóm',         icon: '👥', color: 'purple' },
];

const CHUC_VU_OPTIONS = [
  { value: 'CHU_NHIEM',     label: 'Chủ nhiệm',      badge: 'bg-amber-100 text-amber-800' },
  { value: 'PHO_CHU_NHIEM', label: 'Phó chủ nhiệm',  badge: 'bg-blue-100 text-blue-800' },
  { value: 'BAN_QUAN_LY',   label: 'Ban quản lý',    badge: 'bg-violet-100 text-violet-800' },
  { value: 'CO_VAN',        label: 'Cố vấn',         badge: 'bg-green-100 text-green-800' },
  { value: 'THANH_VIEN',    label: 'Thành viên',     badge: 'bg-gray-100 text-gray-700' },
];

const loaiColor = {
  CLB:  'bg-blue-50 text-blue-700 border-blue-200',
  DOI:  'bg-green-50 text-green-700 border-green-200',
  NHOM: 'bg-purple-50 text-purple-700 border-purple-200',
};

function ChucVuBadge({ chucVu }) {
  const opt = CHUC_VU_OPTIONS.find(c => c.value === chucVu) ?? CHUC_VU_OPTIONS[4];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${opt.badge}`}>
      {opt.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM TẠO / SỬA CLB
// ══════════════════════════════════════════════════════════════════════════════
function ClbFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? {
    maClb: '', tenClb: '', loai: 'CLB', moTa: '', linhVuc: '',
    maKhoa: '', maBan: '', truongClbMaSv: '', ngayThanhLap: '',
  });
  const [errors, setErrors] = useState({});

  const { data: khoaList = [] } = useQuery({
    queryKey: ['khoa-list'],
    queryFn: () => api.get('/api/khoa').then(r => r.data.data || []),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.maClb.trim()) e.maClb = 'Bắt buộc';
    if (!form.tenClb.trim()) e.tenClb = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {initial ? 'Cập nhật CLB' : 'Tạo mới CLB / Đội / Nhóm'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mã + Loại */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã CLB *</label>
              <input
                className={`w-full px-3 py-2 border rounded-lg text-sm uppercase ${errors.maClb ? 'border-red-400' : 'border-gray-300'}`}
                value={form.maClb} onChange={e => set('maClb', e.target.value.toUpperCase())}
                placeholder="VD: CLB001" disabled={!!initial}
              />
              {errors.maClb && <p className="text-red-500 text-xs mt-1">{errors.maClb}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={form.loai} onChange={e => set('loai', e.target.value)}>
                {LOAI_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tên CLB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên {form.loai === 'CLB' ? 'câu lạc bộ' : form.loai === 'DOI' ? 'đội' : 'nhóm'} *</label>
            <input
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.tenClb ? 'border-red-400' : 'border-gray-300'}`}
              value={form.tenClb} onChange={e => set('tenClb', e.target.value)}
              placeholder="Tên đầy đủ..."
            />
            {errors.tenClb && <p className="text-red-500 text-xs mt-1">{errors.tenClb}</p>}
          </div>

          {/* Lĩnh vực + Khoa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lĩnh vực hoạt động</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                     value={form.linhVuc} onChange={e => set('linhVuc', e.target.value)}
                     placeholder="VD: Văn nghệ, Thể thao..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trực thuộc Khoa</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={form.maKhoa} onChange={e => set('maKhoa', e.target.value)}>
                <option value="">Đoàn trường / Hội SV cấp trường</option>
                {khoaList.map(k => (
                  <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ngày thành lập + MSSV Trưởng CLB */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thành lập</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                     value={form.ngayThanhLap} onChange={e => set('ngayThanhLap', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MSSV Trưởng CLB</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                     value={form.truongClbMaSv} onChange={e => set('truongClbMaSv', e.target.value)}
                     placeholder="MSSV..." />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả hoạt động</label>
            <textarea rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              value={form.moTa} onChange={e => set('moTa', e.target.value)}
              placeholder="Giới thiệu về CLB, mục tiêu, hoạt động chính..." />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
                    className="px-5 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {initial ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM THÊM THÀNH VIÊN
// ══════════════════════════════════════════════════════════════════════════════
function AddThanhVienModal({ maClb, onClose, onSave }) {
  const [maSv, setMaSv] = useState('');
  const [keyword, setKeyword] = useState('');
  const [chucVu, setChucVu] = useState('THANH_VIEN');
  const [maHocKy, setMaHocKy] = useState('');
  const [ngayThamGia, setNgayThamGia] = useState(new Date().toISOString().split('T')[0]);
  const [ghiChu, setGhiChu] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['sv-search-clb', keyword],
    queryFn: () => api.get('/api/sinhvien', { params: { search: keyword, size: 10, isActive: true } })
                      .then(r => r.data.data?.content ?? r.data.data ?? []),
    enabled: keyword.length >= 2,
  });

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hoc-ky-active'],
    queryFn: () => api.get('/api/hocky').then(r => r.data.data || []),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected && !maSv.trim()) {
      toast.error('Chọn hoặc nhập MSSV sinh viên');
      return;
    }
    onSave({ maSv: selected?.maSv ?? maSv.trim(), chucVu, maHocKy: maHocKy || null, ngayThamGia: ngayThamGia || null, ghiChu: ghiChu || null });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Thêm thành viên</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tìm kiếm SV */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sinh viên *</label>
            {selected ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  {selected.hoTen?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{selected.hoTen}</p>
                  <p className="text-xs text-gray-500">{selected.maSv} · {selected.tenLop ?? ''}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)}
                        className="p-1 hover:bg-blue-100 rounded-lg"><X className="w-4 h-4 text-blue-600" /></button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm"
                    placeholder="Tìm theo tên hoặc MSSV..."
                    value={keyword}
                    onChange={e => { setKeyword(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                  />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {searchResults.map(sv => (
                      <button key={sv.maSv} type="button"
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                              onClick={() => { setSelected(sv); setMaSv(sv.maSv); setShowDropdown(false); setKeyword(''); }}>
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                          {sv.hoTen?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sv.hoTen}</p>
                          <p className="text-xs text-gray-500">{sv.maSv} · {sv.tenLop ?? ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chức vụ + Học kỳ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      value={chucVu} onChange={e => setChucVu(e.target.value)}>
                {CHUC_VU_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      value={maHocKy} onChange={e => setMaHocKy(e.target.value)}>
                <option value="">Tất cả học kỳ</option>
                {hocKyList.map(hk => (
                  <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ngày tham gia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                   value={ngayThamGia} onChange={e => setNgayThamGia(e.target.value)} />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none"
                      rows={2} value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ghi chú về thành viên này..." />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Thêm thành viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM SỬA THÀNH VIÊN
// ══════════════════════════════════════════════════════════════════════════════
function EditThanhVienModal({ tv, onClose, onSave }) {
  const [chucVu, setChucVu] = useState(tv.chucVu ?? 'THANH_VIEN');
  const [ngayThamGia, setNgayThamGia] = useState(tv.ngayThamGia ?? '');
  const [ngayRoiClb, setNgayRoiClb] = useState(tv.ngayRoiClb ?? '');
  const [ghiChu, setGhiChu] = useState(tv.ghiChu ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ chucVu, ngayThamGia: ngayThamGia || null, ngayRoiClb: ngayRoiClb || null, ghiChu: ghiChu || null });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa thành viên</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Thông tin sinh viên (read-only) */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {tv.hoTen?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{tv.hoTen}</p>
              <p className="text-xs text-gray-500">{tv.maSv} · {tv.tenLop ?? ''}</p>
            </div>
          </div>

          {/* Chức vụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    value={chucVu} onChange={e => setChucVu(e.target.value)}>
              {CHUC_VU_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Ngày tham gia + Ngày rời */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                     value={ngayThamGia} onChange={e => setNgayThamGia(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày rời CLB</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                     value={ngayRoiClb} onChange={e => setNgayRoiClb(e.target.value)}
                     placeholder="Để trống nếu còn sinh hoạt" />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none"
                      rows={3} value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                      placeholder="Ghi chú về thành viên..." />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">Hủy</button>
            <button type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHI TIẾT CLB — Thành viên + Hoạt động
// ══════════════════════════════════════════════════════════════════════════════
function ClbDetailView({ maClb, onBack }) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_THANH_VIEN_CLB);
  const [tab, setTab] = useState('members');
  const [maHocKy, setMaHocKy] = useState('');
  const [maNamHoc, setMaNamHoc] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTv, setEditingTv] = useState(null);

  const { data: clb, isLoading } = useQuery({
    queryKey: ['clb-detail', maClb],
    queryFn: () => cauLacBoService.getDetail(maClb),
  });

  const { data: thanhViens = [], isLoading: tvLoading } = useQuery({
    queryKey: ['clb-tv', maClb, maHocKy],
    queryFn: () => cauLacBoService.getThanhVien(maClb, maHocKy),
    enabled: tab === 'members',
  });

  const { data: hoatDongs = [], isLoading: hdLoading } = useQuery({
    queryKey: ['clb-hd', maClb, maNamHoc],
    queryFn: () => cauLacBoService.getHoatDong(maClb, maNamHoc),
    enabled: tab === 'activities',
  });

  const { data: hocKyList = [] } = useQuery({
    queryKey: ['hoc-ky-active'],
    queryFn: () => api.get('/api/hocky').then(r => r.data.data || []),
  });

  const addMutation = useMutation({
    mutationFn: (data) => cauLacBoService.addThanhVien(maClb, data),
    onSuccess: () => {
      toast.success('Thêm thành viên thành công');
      queryClient.invalidateQueries(['clb-tv', maClb]);
      queryClient.invalidateQueries(['clb-detail', maClb]);
      setShowAddModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Thêm thất bại'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => cauLacBoService.removeThanhVien(maClb, id),
    onSuccess: () => {
      toast.success('Đã xóa thành viên');
      queryClient.invalidateQueries(['clb-tv', maClb]);
      queryClient.invalidateQueries(['clb-detail', maClb]);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Xóa thất bại'),
  });

  const updateTvMutation = useMutation({
    mutationFn: ({ id, data }) => cauLacBoService.updateThanhVien(maClb, id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành viên thành công');
      queryClient.invalidateQueries(['clb-tv', maClb]);
      setEditingTv(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Cập nhật thất bại'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ maHocKy, locked }) => cauLacBoService.lockHocKy(maHocKy, locked),
    onSuccess: (_, { locked }) => {
      toast.success(locked ? 'Đã khóa danh sách thành viên học kỳ này' : 'Đã mở khóa danh sách thành viên');
      queryClient.invalidateQueries(['hoc-ky-active']);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Thao tác thất bại'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>;
  if (!clb) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{clb.tenClb}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${loaiColor[clb.loai] ?? 'bg-gray-100 text-gray-600'}`}>
              {LOAI_OPTIONS.find(o => o.value === clb.loai)?.icon} {LOAI_OPTIONS.find(o => o.value === clb.loai)?.label ?? clb.loai}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {clb.tenKhoa ?? 'Đoàn trường'} {clb.linhVuc ? `· ${clb.linhVuc}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">{clb.soThanhVien}</p>
          <p className="text-xs text-gray-500">thành viên active</p>
        </div>
      </div>

      {/* Trưởng CLB + Mô tả */}
      {(clb.truongClbHoTen || clb.moTa) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 grid grid-cols-2 gap-4">
          {clb.truongClbHoTen && (
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">Trưởng CLB</p>
                <p className="font-semibold text-gray-800">{clb.truongClbHoTen}</p>
                <p className="text-xs text-gray-400">{clb.truongClbMaSv}</p>
              </div>
            </div>
          )}
          {clb.moTa && (
            <p className="text-sm text-gray-600 leading-relaxed col-span-2">{clb.moTa}</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'members',    label: 'Thành viên', icon: Users },
            { key: 'activities', label: 'Hoạt động',  icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── THÀNH VIÊN ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-600">Học kỳ:</label>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      value={maHocKy} onChange={e => setMaHocKy(e.target.value)}>
                <option value="">Tất cả</option>
                {hocKyList.map(hk => (
                  <option key={hk.maHocKy} value={hk.maHocKy}>{hk.tenHocKy}</option>
                ))}
              </select>
              {/* Nút khóa/mở khóa học kỳ */}
              {canManage && maHocKy && (() => {
                const hk = hocKyList.find(h => h.maHocKy === maHocKy);
                if (!hk) return null;
                return (
                  <button
                    onClick={() => lockMutation.mutate({ maHocKy, locked: !hk.isClbLocked })}
                    disabled={lockMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      hk.isClbLocked
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {hk.isClbLocked
                      ? <><Lock className="w-3.5 h-3.5" /> Đang khóa — Mở khóa</>
                      : <><Unlock className="w-3.5 h-3.5" /> Khóa danh sách</>
                    }
                  </button>
                );
              })()}
            </div>
            {canManage && (
              <button onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                <UserPlus className="w-4 h-4" /> Thêm thành viên
              </button>
            )}
          </div>

          {tvLoading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : thanhViens.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có thành viên nào{maHocKy ? ' trong học kỳ này' : ''}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {thanhViens.map(tv => (
                <div key={tv.id}
                     className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {tv.hoTen?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{tv.hoTen}</p>
                      <ChucVuBadge chucVu={tv.chucVu} />
                    </div>
                    <p className="text-xs text-gray-500">{tv.maSv} · {tv.tenLop ?? ''} {tv.tenKhoa ? `· ${tv.tenKhoa}` : ''}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {tv.ngayThamGia && (
                        <p className="text-xs text-gray-400">Tham gia: {tv.ngayThamGia}</p>
                      )}
                      {tv.ngayRoiClb && (
                        <p className="text-xs text-red-400">Rời CLB: {tv.ngayRoiClb}</p>
                      )}
                    </div>
                    {tv.ghiChu && (
                      <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{tv.ghiChu}</p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingTv(tv)}
                        className="p-2 hover:bg-blue-50 rounded-xl text-blue-400 hover:text-blue-600 transition-colors"
                        title="Chỉnh sửa thành viên"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa ${tv.hoTen} khỏi CLB?`))
                            removeMutation.mutate(tv.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                        title="Xóa khỏi CLB"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HOẠT ĐỘNG ── */}
      {tab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Năm học:</label>
            <input className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-32"
                   placeholder="2024-2025"
                   value={maNamHoc} onChange={e => setMaNamHoc(e.target.value)} />
          </div>

          {hdLoading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : hoatDongs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có hoạt động nào{maNamHoc ? ' trong năm học này' : ''}</p>
              <p className="text-xs mt-1">Tạo hoạt động và chọn CLB này để liên kết</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hoatDongs.map(hd => (
                <div key={hd.maHoatDong}
                     className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{hd.tenHoatDong}</p>
                    <p className="text-xs text-gray-500">{hd.ngayToChuc} · {hd.diaDiem ?? '—'}</p>
                    {hd.diemRenLuyen != null && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5">+{hd.diemRenLuyen} điểm rèn luyện</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    hd.trangThai === 'DA_HOAN_THANH' ? 'bg-green-100 text-green-700' :
                    hd.trangThai === 'DA_HUY'        ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {hd.trangThai?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddThanhVienModal
          maClb={maClb}
          onClose={() => setShowAddModal(false)}
          onSave={(data) => addMutation.mutate(data)}
        />
      )}

      {editingTv && (
        <EditThanhVienModal
          tv={editingTv}
          onClose={() => setEditingTv(null)}
          onSave={(data) => updateTvMutation.mutate({ id: editingTv.id, data })}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRANG CHÍNH
// ══════════════════════════════════════════════════════════════════════════════
export default function CauLacBoPage() {
  const queryClient = useQueryClient();
  const { hasPermission, maClb: userMaClb, tenClb: userTenClb, isClbScoped } = useAuthStore();
  const clbScoped = isClbScoped();  // true nếu tài khoản bị giới hạn theo CLB
  const canManage = hasPermission(PERMISSIONS.QUAN_LY_CLB);

  const [selectedClb, setSelectedClb] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget]  = useState(null);
  const [keyword, setKeyword]        = useState('');
  const [loaiFilter, setLoaiFilter]  = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const { data: clbList = [], isLoading } = useQuery({
    queryKey: ['clb-list', loaiFilter, appliedKeyword],
    queryFn: () => cauLacBoService.getAll({
      loai: loaiFilter || undefined,
      keyword: appliedKeyword || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => cauLacBoService.create(data),
    onSuccess: () => {
      toast.success('Tạo CLB thành công');
      queryClient.invalidateQueries(['clb-list']);
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ maClb, data }) => cauLacBoService.update(maClb, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries(['clb-list']);
      setShowForm(false);
      setEditTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (maClb) => cauLacBoService.delete(maClb),
    onSuccess: () => {
      toast.success('Đã xóa CLB');
      queryClient.invalidateQueries(['clb-list']);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Xóa thất bại'),
  });

  // Nếu đang xem chi tiết
  if (selectedClb) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ClbDetailView maClb={selectedClb} onBack={() => setSelectedClb(null)} />
      </div>
    );
  }

  const stats = {
    total: clbList.length,
    clb:  clbList.filter(c => c.loai === 'CLB').length,
    doi:  clbList.filter(c => c.loai === 'DOI').length,
    nhom: clbList.filter(c => c.loai === 'NHOM').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── CLB Scope Banner ──────────────────────────── */}
      {clbScoped && (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm">
          <Award className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span className="text-orange-800">
            Bạn đang quản lý <strong>{userTenClb || userMaClb}</strong>.
            Chỉ hiển thị dữ liệu của CLB này.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CLB / Đội / Nhóm</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý câu lạc bộ, đội, nhóm trực thuộc Đoàn - Hội</p>
        </div>
        {canManage && !clbScoped && (
          <button onClick={() => { setEditTarget(null); setShowForm(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        )}
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng cộng',    count: stats.total, icon: Award,     color: 'blue' },
          { label: 'Câu lạc bộ',   count: stats.clb,   icon: '🎭',      color: 'blue' },
          { label: 'Đội',          count: stats.doi,   icon: '⚽',      color: 'green' },
          { label: 'Nhóm',         count: stats.nhom,  icon: '👥',      color: 'purple' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold text-${color}-600 mt-1`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm"
            placeholder="Tìm theo tên, lĩnh vực..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAppliedKeyword(keyword)}
          />
        </div>
        <button onClick={() => setAppliedKeyword(keyword)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          Tìm
        </button>
        <div className="flex items-center gap-2">
          {['', 'CLB', 'DOI', 'NHOM'].map(v => (
            <button key={v}
                    onClick={() => setLoaiFilter(v)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      loaiFilter === v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
              {v === '' ? 'Tất cả' : LOAI_OPTIONS.find(o => o.value === v)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Đang tải danh sách CLB...</div>
      ) : clbList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Chưa có CLB / Đội / Nhóm nào</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              Tạo ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clbList.map(clb => (
            <div key={clb.maClb}
                 className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer group"
                 onClick={() => setSelectedClb(clb.maClb)}>
              {/* Badge loại */}
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${loaiColor[clb.loai] ?? 'bg-gray-100 text-gray-600'}`}>
                  {LOAI_OPTIONS.find(o => o.value === clb.loai)?.icon} {LOAI_OPTIONS.find(o => o.value === clb.loai)?.label ?? clb.loai}
                </span>
                {canManage && !clbScoped && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditTarget(clb); setShowForm(true); }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {
                              if (window.confirm(`Xóa CLB "${clb.tenClb}"?`))
                                deleteMutation.mutate(clb.maClb);
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tên CLB */}
              <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-blue-600 transition-colors">
                {clb.tenClb}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {clb.tenKhoa ?? 'Đoàn trường'} {clb.linhVuc ? `· ${clb.linhVuc}` : ''}
              </p>

              {/* Trưởng CLB */}
              {clb.truongClbHoTen && (
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs text-gray-600">{clb.truongClbHoTen}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-blue-600">{clb.soThanhVien ?? 0}</span>
                  <span className="text-xs text-gray-500">thành viên</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ClbFormModal
          initial={editTarget ? {
            maClb: editTarget.maClb,
            tenClb: editTarget.tenClb,
            loai: editTarget.loai,
            moTa: editTarget.moTa ?? '',
            linhVuc: editTarget.linhVuc ?? '',
            maKhoa: editTarget.maKhoa ?? '',
            maBan: editTarget.maBan ?? '',
            truongClbMaSv: editTarget.truongClbMaSv ?? '',
            ngayThanhLap: editTarget.ngayThanhLap ?? '',
          } : null}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={(data) => {
            if (editTarget) {
              updateMutation.mutate({ maClb: editTarget.maClb, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}
