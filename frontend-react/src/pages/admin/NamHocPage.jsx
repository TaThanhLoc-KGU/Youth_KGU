/**
 * NamHocPage — Quản lý Năm học & Học kỳ
 * Permissions: XEM_NAM_HOC (view), QUAN_LY_NAM_HOC + QUAN_LY_HOC_KY (manage)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Edit2, Trash2, RotateCcw, ChevronDown, ChevronRight,
  Calendar, Clock, Lock, Unlock, CheckCircle, Star, AlertCircle, Layers,
  X, Save,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/constants';

// ── API helpers ──────────────────────────────────────────────────────────────
const namHocApi = {
  getAll: () => api.get('/api/namhoc/all').then(r => r.data),
  create: (data) => api.post('/api/namhoc', data).then(r => r.data),
  createWithSemesters: (data) => api.post('/api/namhoc/with-semesters', data).then(r => r.data),
  update: (id, data) => api.put(`/api/namhoc/${id}`, data).then(r => r.data),
  softDelete: (id) => api.delete(`/api/namhoc/${id}`),
  restore: (id) => api.put(`/api/namhoc/${id}/restore`).then(r => r.data),
  setCurrent: (id) => api.put(`/api/namhoc/${id}/set-current`).then(r => r.data),
  createSemesters: (id) => api.post(`/api/namhoc/${id}/create-semesters`).then(r => r.data),
};

const hocKyApi = {
  getByYear: (maNamHoc) => api.get(`/api/namhoc/${maNamHoc}/semesters`).then(r => r.data),
  getAll: () => api.get('/api/hocky/all').then(r => r.data),
  create: (maNamHoc, data) => api.post(`/api/hockynamhoc/namhoc/${maNamHoc}/hocky`, data).then(r => r.data),
  update: (id, data) => api.put(`/api/hocky/${id}`, data).then(r => r.data),
  softDelete: (id) => api.delete(`/api/hocky/${id}`),
  restore: (id) => api.put(`/api/hocky/${id}/restore`).then(r => r.data),
  setCurrent: (id) => api.put(`/api/hocky/${id}/set-current`).then(r => r.data),
  lockClb: (id, locked) => api.put(`/api/clb/lock-hoc-ky/${id}`, null, { params: { locked } }).then(r => r.data),
};

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ trangThai, isActive }) => {
  if (!isActive) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <X className="w-3 h-3" /> Đã xóa
    </span>
  );
  const map = {
    'Đang diễn ra': 'bg-green-100 text-green-700',
    'Chưa bắt đầu': 'bg-blue-100 text-blue-700',
    'Đã kết thúc':  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${map[trangThai] || 'bg-gray-100 text-gray-600'}`}>
      {trangThai === 'Đang diễn ra' && <CheckCircle className="w-3 h-3" />}
      {trangThai === 'Chưa bắt đầu' && <Clock className="w-3 h-3" />}
      {trangThai === 'Đã kết thúc'  && <AlertCircle className="w-3 h-3" />}
      {trangThai}
    </span>
  );
};

// ── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ percent }) => {
  if (percent === null || percent === undefined) return null;
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{p}%</span>
    </div>
  );
};

// ── HocKy Form Modal ──────────────────────────────────────────────────────────
function HocKyModal({ hocKy, maNamHoc, onClose }) {
  const isEdit = !!hocKy;
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    maHocKy: hocKy?.maHocKy || '',
    tenHocKy: hocKy?.tenHocKy || '',
    ngayBatDau: hocKy?.ngayBatDau || '',
    ngayKetThuc: hocKy?.ngayKetThuc || '',
    moTa: hocKy?.moTa || '',
    maNamHoc: hocKy?.maNamHoc || maNamHoc || '',
  });

  const mut = useMutation({
    mutationFn: isEdit
      ? (data) => hocKyApi.update(hocKy.maHocKy, data)
      : (data) => hocKyApi.create(maNamHoc, data),
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật học kỳ thành công' : 'Tạo học kỳ thành công');
      qc.invalidateQueries(['namhoc-all']);
      qc.invalidateQueries(['hocky-by-year', maNamHoc]);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi lưu học kỳ'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tenHocKy || !form.ngayBatDau || !form.ngayKetThuc) {
      return toast.warn('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    mut.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã học kỳ *</label>
                <input value={form.maHocKy} onChange={e => setForm(f => ({ ...f, maHocKy: e.target.value }))}
                  placeholder="VD: HK1-2024-2025"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}
            <div className={isEdit ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên học kỳ *</label>
              <input value={form.tenHocKy} onChange={e => setForm(f => ({ ...f, tenHocKy: e.target.value }))}
                placeholder="VD: Học kỳ 1 năm 2024-2025"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
              <input type="date" value={form.ngayBatDau} onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
              <input type="date" value={form.ngayKetThuc} onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.moTa} onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))}
              rows={2} placeholder="Mô tả học kỳ…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {mut.isPending ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Tạo học kỳ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── NamHoc Form Modal ─────────────────────────────────────────────────────────
function NamHocModal({ namHoc, onClose }) {
  const isEdit = !!namHoc;
  const qc = useQueryClient();
  const [withSemesters, setWithSemesters] = useState(!isEdit);

  const [form, setForm] = useState({
    maNamHoc: namHoc?.maNamHoc || '',
    tenNamHoc: namHoc?.tenNamHoc || '',
    ngayBatDau: namHoc?.ngayBatDau || '',
    ngayKetThuc: namHoc?.ngayKetThuc || '',
    moTa: namHoc?.moTa || '',
  });

  const mut = useMutation({
    mutationFn: (data) => {
      if (isEdit) return namHocApi.update(namHoc.maNamHoc, data);
      return withSemesters ? namHocApi.createWithSemesters(data) : namHocApi.create(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật năm học thành công' : 'Tạo năm học thành công');
      qc.invalidateQueries(['namhoc-all']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi lưu năm học'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tenNamHoc || !form.ngayBatDau || !form.ngayKetThuc) {
      return toast.warn('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    mut.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Chỉnh sửa năm học' : 'Thêm năm học mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã năm học</label>
                <input value={form.maNamHoc} onChange={e => setForm(f => ({ ...f, maNamHoc: e.target.value }))}
                  placeholder="VD: 2024-2025 (tự động nếu trống)"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}
            <div className={isEdit ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên năm học *</label>
              <input value={form.tenNamHoc} onChange={e => setForm(f => ({ ...f, tenNamHoc: e.target.value }))}
                placeholder="VD: Năm học 2024-2025"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
              <input type="date" value={form.ngayBatDau} onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
              <input type="date" value={form.ngayKetThuc} onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.moTa} onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))}
              rows={2} placeholder="Mô tả năm học…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
          </div>
          {!isEdit && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${withSemesters ? 'bg-blue-600' : 'bg-gray-300'}`}
                onClick={() => setWithSemesters(v => !v)}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${withSemesters ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-gray-700">
                Tự động tạo 3 học kỳ (1, 2 và hè)
              </span>
            </label>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {mut.isPending ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Tạo năm học')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── HocKy row ────────────────────────────────────────────────────────────────
function HocKyRow({ hk, canManage, onEdit, maNamHoc }) {
  const qc = useQueryClient();

  const setCurrent = useMutation({
    mutationFn: () => hocKyApi.setCurrent(hk.maHocKy),
    onSuccess: () => { toast.success('Đã đặt làm học kỳ hiện tại'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const softDelete = useMutation({
    mutationFn: () => hocKyApi.softDelete(hk.maHocKy),
    onSuccess: () => { toast.success('Đã xóa học kỳ'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi xóa'),
  });

  const restore = useMutation({
    mutationFn: () => hocKyApi.restore(hk.maHocKy),
    onSuccess: () => { toast.success('Đã khôi phục học kỳ'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const lockClb = useMutation({
    mutationFn: (locked) => hocKyApi.lockClb(hk.maHocKy, locked),
    onSuccess: (_, locked) => {
      toast.success(locked ? 'Đã khóa danh sách CLB' : 'Đã mở khóa danh sách CLB');
      qc.invalidateQueries(['namhoc-all']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi thao tác khóa'),
  });

  const isLocked = !!hk.isClbLocked;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
      !hk.isActive ? 'opacity-50 bg-gray-50' :
      hk.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{hk.tenHocKy}</span>
          {hk.isCurrent && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
              Hiện tại
            </span>
          )}
          <StatusBadge trangThai={hk.trangThai} isActive={hk.isActive} />
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              <Lock className="w-3 h-3" /> CLB đã khóa
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {hk.ngayBatDau} → {hk.ngayKetThuc}
          {hk.soNgayConLai != null && hk.trangThai === 'Đang diễn ra' && ` · còn ${hk.soNgayConLai} ngày`}
        </p>
        {hk.isActive && <ProgressBar percent={hk.tiLePhanTram} />}
        {isLocked && hk.clbLockedAt && (
          <p className="text-xs text-yellow-600 mt-0.5">
            Khóa lúc: {new Date(hk.clbLockedAt).toLocaleString('vi-VN')} bởi {hk.clbLockedBy}
          </p>
        )}
      </div>
      {canManage && hk.isActive && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!hk.isCurrent && (
            <button onClick={() => setCurrent.mutate()} disabled={setCurrent.isPending}
              title="Đặt làm học kỳ hiện tại"
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Star className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => lockClb.mutate(!isLocked)} disabled={lockClb.isPending}
            title={isLocked ? 'Mở khóa CLB' : 'Khóa danh sách CLB'}
            className={`p-1.5 rounded-lg transition-colors ${
              isLocked
                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
            }`}>
            {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <button onClick={() => onEdit(hk)}
            title="Chỉnh sửa"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm(`Xóa học kỳ "${hk.tenHocKy}"?`)) softDelete.mutate(); }}
            disabled={softDelete.isPending}
            title="Xóa"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      {canManage && !hk.isActive && (
        <button onClick={() => restore.mutate()} disabled={restore.isPending}
          title="Khôi phục"
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-green-600 hover:bg-green-50 transition-colors">
          <RotateCcw className="w-3 h-3" /> Khôi phục
        </button>
      )}
    </div>
  );
}

// ── NamHoc accordion card ─────────────────────────────────────────────────────
function NamHocCard({ namHoc, canManage, canManageHocKy }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(namHoc.isCurrent);
  const [editHocKy, setEditHocKy] = useState(null);
  const [showAddHocKy, setShowAddHocKy] = useState(false);
  const [editNamHoc, setEditNamHoc] = useState(false);

  // Load semesters when expanded
  const { data: semesters = [], isLoading: semLoading } = useQuery({
    queryKey: ['hocky-by-year', namHoc.maNamHoc],
    queryFn: () => hocKyApi.getByYear(namHoc.maNamHoc),
    enabled: expanded,
  });

  const setCurrent = useMutation({
    mutationFn: () => namHocApi.setCurrent(namHoc.maNamHoc),
    onSuccess: () => { toast.success('Đã đặt làm năm học hiện tại'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const softDelete = useMutation({
    mutationFn: () => namHocApi.softDelete(namHoc.maNamHoc),
    onSuccess: () => { toast.success('Đã xóa năm học'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi xóa'),
  });

  const restore = useMutation({
    mutationFn: () => namHocApi.restore(namHoc.maNamHoc),
    onSuccess: () => { toast.success('Đã khôi phục năm học'); qc.invalidateQueries(['namhoc-all']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const createSemesters = useMutation({
    mutationFn: () => namHocApi.createSemesters(namHoc.maNamHoc),
    onSuccess: () => {
      toast.success('Đã tạo học kỳ mặc định');
      qc.invalidateQueries(['namhoc-all']);
      qc.invalidateQueries(['hocky-by-year', namHoc.maNamHoc]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi tạo học kỳ'),
  });

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${
      !namHoc.isActive ? 'opacity-60' :
      namHoc.isCurrent ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}>
        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{namHoc.tenNamHoc}</h3>
            {namHoc.isCurrent && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                Năm học hiện tại
              </span>
            )}
            <StatusBadge trangThai={namHoc.trangThai} isActive={namHoc.isActive} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {namHoc.ngayBatDau} → {namHoc.ngayKetThuc}
            {namHoc.soHocKy != null && ` · ${namHoc.soHocKy} học kỳ`}
          </p>
          {namHoc.isActive && <ProgressBar percent={namHoc.tiLePhanTram} />}
        </div>

        {canManage && namHoc.isActive && (
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {!namHoc.isCurrent && (
              <button onClick={() => setCurrent.mutate()} disabled={setCurrent.isPending}
                title="Đặt làm năm học hiện tại"
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                <Star className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setEditNamHoc(true)}
              title="Chỉnh sửa"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => { if (window.confirm(`Xóa năm học "${namHoc.tenNamHoc}"?`)) softDelete.mutate(); }}
              disabled={softDelete.isPending}
              title="Xóa"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {canManage && !namHoc.isActive && (
          <button onClick={(e) => { e.stopPropagation(); restore.mutate(); }} disabled={restore.isPending}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-green-600 hover:bg-green-50 transition-colors">
            <RotateCcw className="w-3 h-3" /> Khôi phục
          </button>
        )}
      </div>

      {/* Expanded semesters */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" />
              Học kỳ ({semesters.length})
            </h4>
            {canManageHocKy && namHoc.isActive && (
              <div className="flex gap-2">
                {semesters.length === 0 && (
                  <button onClick={() => createSemesters.mutate()} disabled={createSemesters.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                    <Layers className="w-3.5 h-3.5" />
                    {createSemesters.isPending ? 'Đang tạo…' : 'Tạo HK mặc định'}
                  </button>
                )}
                <button onClick={() => setShowAddHocKy(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Thêm học kỳ
                </button>
              </div>
            )}
          </div>

          {semLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Đang tải…</div>
          ) : semesters.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Chưa có học kỳ nào. Bấm "Tạo HK mặc định" để tự động tạo 3 học kỳ.
            </div>
          ) : (
            <div className="space-y-2">
              {semesters.map(hk => (
                <HocKyRow key={hk.maHocKy} hk={hk} canManage={canManageHocKy}
                  onEdit={(hk) => setEditHocKy(hk)} maNamHoc={namHoc.maNamHoc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {editNamHoc && <NamHocModal namHoc={namHoc} onClose={() => setEditNamHoc(false)} />}
      {editHocKy && <HocKyModal hocKy={editHocKy} maNamHoc={namHoc.maNamHoc} onClose={() => setEditHocKy(null)} />}
      {showAddHocKy && <HocKyModal maNamHoc={namHoc.maNamHoc} onClose={() => setShowAddHocKy(false)} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NamHocPage() {
  const { hasPermission, laAdmin } = useAuthStore();
  const canManage = laAdmin || hasPermission(PERMISSIONS.CAI_DAT_NAM_HOC);
  const canManageHocKy = laAdmin || hasPermission(PERMISSIONS.CAI_DAT_HOC_KY);

  const [showAddNamHoc, setShowAddNamHoc] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { data: namHocList = [], isLoading, isError } = useQuery({
    queryKey: ['namhoc-all'],
    queryFn: namHocApi.getAll,
  });

  const active = namHocList.filter(n => n.isActive);
  const inactive = namHocList.filter(n => !n.isActive);

  // Sort: current first, then by start date desc
  const sorted = [...active].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return (b.ngayBatDau || '').localeCompare(a.ngayBatDau || '');
  });

  // Stats
  const current = active.find(n => n.isCurrent);
  const ongoing = active.filter(n => n.trangThai === 'Đang diễn ra').length;
  const upcoming = active.filter(n => n.trangThai === 'Chưa bắt đầu').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Năm học &amp; Học kỳ
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Quản lý năm học, học kỳ và ngày khóa danh sách CLB
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddNamHoc(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Thêm năm học
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng năm học', value: active.length, icon: BookOpen, color: 'blue' },
          { label: 'Đang diễn ra', value: ongoing,       icon: CheckCircle, color: 'green' },
          { label: 'Sắp bắt đầu', value: upcoming,      icon: Clock,  color: 'amber' },
          { label: 'Năm học hiện tại', value: current?.tenNamHoc || '—', icon: Star, color: 'purple', small: true },
        ].map(({ label, value, icon: Icon, color, small }) => (
          <div key={label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-${color}-100`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`font-bold text-gray-900 ${small ? 'text-sm leading-tight mt-0.5' : 'text-2xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* CLB lock info box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-start gap-3">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
        <div>
          <p className="font-semibold">Về khóa danh sách CLB</p>
          <p className="text-yellow-700 mt-1">
            Mỗi học kỳ có thể bị khóa để chốt danh sách thành viên CLB. Khi khóa, Chủ nhiệm CLB không thể thêm/xóa thành viên.
            Bấm biểu tượng 🔒 trong từng học kỳ để khóa hoặc mở khóa.
          </p>
        </div>
      </div>

      {/* Year list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Đang tải dữ liệu…</div>
      ) : isError ? (
        <div className="text-center py-16 text-red-400">Lỗi tải dữ liệu. Vui lòng thử lại.</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Chưa có năm học nào</p>
          {canManage && (
            <button onClick={() => setShowAddNamHoc(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              Thêm năm học đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(namHoc => (
            <NamHocCard key={namHoc.maNamHoc} namHoc={namHoc}
              canManage={canManage} canManageHocKy={canManageHocKy} />
          ))}
        </div>
      )}

      {/* Deleted years */}
      {inactive.length > 0 && (
        <div>
          <button
            onClick={() => setShowInactive(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            {showInactive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Năm học đã xóa ({inactive.length})
          </button>
          {showInactive && (
            <div className="mt-3 space-y-3">
              {inactive.map(namHoc => (
                <NamHocCard key={namHoc.maNamHoc} namHoc={namHoc}
                  canManage={canManage} canManageHocKy={canManageHocKy} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add NamHoc modal */}
      {showAddNamHoc && <NamHocModal onClose={() => setShowAddNamHoc(false)} />}
    </div>
  );
}
