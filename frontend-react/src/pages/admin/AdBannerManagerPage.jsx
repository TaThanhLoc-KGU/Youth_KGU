/**
 * AdBannerManagerPage.jsx
 * Admin trang quản lý Banner & Widget quảng cáo trang News.
 * - MAIN  : banner ngang đặt giữa nội dung trang
 * - SIDEBAR : widget nhỏ đặt ở cột phải trang news
 *
 * Mỗi loại chỉ hiển thị DUY NHẤT 1 banner tại một thời điểm.
 * Nhấn "Hiển thị" để kích hoạt; nhấn "Tắt" để ẩn.
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Radio, Check,
  ArrowLeft, Save, X, Image, ExternalLink, LayoutTemplate, Columns, FolderOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adBannerService from '../../services/adBannerService';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import ImageUploadField from '../../components/common/ImageUploadField';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ─── Form modal ───────────────────────────────────────────────────────────────

const EMPTY = { tieuDe: '', hinhAnh: '', duongDan: '', loai: 'MAIN' };

const BannerForm = ({ initial = EMPTY, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.tieuDe.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Loại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loại banner</label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { value: 'MAIN',    label: 'Banner chính (ngang)',    icon: LayoutTemplate },
            { value: 'SIDEBAR', label: 'Widget sidebar (phải)',   icon: Columns },
          ].map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors
                ${form.loai === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <input type="radio" name="loai" value={value} checked={form.loai === value} onChange={set('loai')} className="sr-only" />
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tiêu đề */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
        <input
          value={form.tieuDe} onChange={set('tieuDe')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tên / tiêu đề banner"
        />
      </div>

      {/* Ảnh banner */}
      <ImageUploadField
        label="Hình ảnh banner"
        value={form.hinhAnh}
        onChange={(url) => setForm((f) => ({ ...f, hinhAnh: url }))}
        aspectRatio={form.loai === 'SIDEBAR' ? 1 : 4}
        cropTitle={form.loai === 'SIDEBAR' ? 'Cắt ảnh sidebar (1:1)' : 'Cắt ảnh banner chính (4:1)'}
        previewClass={`w-full object-cover ${form.loai === 'MAIN' ? 'h-24' : 'h-36'}`}
        required
      />

      {/* Đường dẫn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <ExternalLink className="w-3.5 h-3.5" /> Đường dẫn khi click
        </label>
        <input
          value={form.duongDan} onChange={set('duongDan')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="tin-tuc/bai-viet hoặc https://..."
        />
        <p className="text-xs text-gray-400 mt-1">Đường dẫn nội bộ (không có dấu / đầu) hoặc URL đầy đủ. Để trống nếu không cần click.</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Hủy
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
          <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
};

// ─── Banner row (draggable) ───────────────────────────────────────────────────

const BannerRow = ({
  item, isDragOver,
  onEdit, onDelete, onActivate, onDeactivate,
  onDragStart, onDragEnter, onDragEnd,
  activatePending,
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, item.id)}
    onDragEnter={(e) => onDragEnter(e, item.id)}
    onDragEnd={onDragEnd}
    onDragOver={(e) => e.preventDefault()}
    className={`
      group flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab select-none transition-all
      ${item.isActive
        ? 'border-green-400 bg-green-50 shadow-sm'
        : isDragOver
          ? 'border-blue-400 bg-blue-50 shadow-lg scale-[1.01]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
    `}
  >
    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

    {/* Thumbnail */}
    <div className={`flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200
      ${item.loai === 'MAIN' ? 'w-28 h-12' : 'w-12 h-16'}`}
    >
      {item.hinhAnh
        ? <img src={item.hinhAnh} alt={item.tieuDe} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
        : <div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center">
            <Image className="w-4 h-4 text-purple-600 opacity-60" />
          </div>
      }
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.tieuDe}</p>
        <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
          ${item.loai === 'MAIN' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {item.loai === 'MAIN' ? 'MAIN' : 'SIDEBAR'}
        </span>
        {item.isActive && (
          <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
            <Check className="w-2.5 h-2.5" /> Đang hiển thị
          </span>
        )}
      </div>
      {item.duongDan && <p className="text-xs text-blue-500 truncate mt-0.5">{item.duongDan}</p>}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {/* Activate / Deactivate */}
      {item.isActive ? (
        <button
          onClick={() => onDeactivate(item.id)}
          disabled={activatePending}
          title="Tắt hiển thị"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600 border border-green-200 hover:border-red-200 transition-colors disabled:opacity-50"
        >
          <EyeOff className="w-3.5 h-3.5" /> Tắt
        </button>
      ) : (
        <button
          onClick={() => onActivate(item.id)}
          disabled={activatePending}
          title="Đặt làm banner hiển thị"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors disabled:opacity-50"
        >
          <Eye className="w-3.5 h-3.5" /> Hiển thị
        </button>
      )}
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
        title="Chỉnh sửa"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const AdBannerManagerPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmState, setConfirmState] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');   // ALL | MAIN | SIDEBAR
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragFromId = useRef(null);

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['ad-banners-admin'],
    queryFn: adBannerService.getAll,
  });

  const items = activeTab === 'ALL'
    ? allItems
    : allItems.filter((b) => b.loai === activeTab);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ad-banners-admin'] });

  const invalidatePublic = () => {
    qc.invalidateQueries({ queryKey: ['ad-banners-main-public'] });
    qc.invalidateQueries({ queryKey: ['ad-banners-sidebar-public'] });
  };

  const createMut     = useMutation({ mutationFn: adBannerService.create,  onSuccess: () => { toast.success('Đã thêm banner'); invalidate(); setShowForm(false); } });
  const updateMut     = useMutation({ mutationFn: ({ id, data }) => adBannerService.update(id, data), onSuccess: () => { toast.success('Đã cập nhật banner'); invalidate(); setEditing(null); setShowForm(false); } });
  const deleteMut     = useMutation({ mutationFn: adBannerService.delete,  onSuccess: () => { toast.success('Đã xóa banner'); invalidate(); } });
  const reorderMut    = useMutation({ mutationFn: adBannerService.reorder, onSuccess: invalidate });
  const activateMut   = useMutation({
    mutationFn: adBannerService.activate,
    onSuccess: (data) => {
      toast.success(`Đã đặt "${data.tieuDe}" làm banner hiển thị`);
      invalidate(); invalidatePublic();
    },
  });
  const deactivateMut = useMutation({
    mutationFn: adBannerService.deactivate,
    onSuccess: () => {
      toast.info('Đã tắt hiển thị banner');
      invalidate(); invalidatePublic();
    },
  });

  // ── Drag-drop ──

  const handleDragStart = useCallback((e, id) => {
    dragFromId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnter = useCallback((e, id) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragFromId.current && dragOverId && dragFromId.current !== dragOverId) {
      const ids = items.map((b) => b.id);
      const from = ids.indexOf(dragFromId.current);
      const to   = ids.indexOf(dragOverId);
      const reordered = [...ids];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      reorderMut.mutate(reordered);
    }
    dragFromId.current = null;
    setDragOverId(null);
  }, [dragOverId, items, reorderMut]);

  // ── Actions ──

  const handleSave = (form) => {
    // Preserve isActive when editing; new banners start inactive
    if (editing && !editing.__defaultLoai) updateMut.mutate({ id: editing.id, data: { ...form, isActive: editing.isActive } });
    else createMut.mutate({ ...form, thuTu: allItems.length, isActive: false });
  };

  const handleDelete = (id) => {
    setConfirmState({ id });
  };

  const openEdit  = (item) => { setEditing(item); setShowForm(true); };
  const openCreate = (defaultLoai) => {
    setEditing(null);
    setShowForm(true);
    if (defaultLoai) setEditing({ __defaultLoai: defaultLoai });
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const isSaving = createMut.isPending || updateMut.isPending;
  const activatePending = activateMut.isPending || deactivateMut.isPending;

  // Currently active per type
  const activeMain    = allItems.find(b => b.isActive && b.loai === 'MAIN');
  const activeSidebar = allItems.find(b => b.isActive && b.loai === 'SIDEBAR');

  const TABS = [
    { key: 'ALL',     label: `Tất cả (${allItems.length})` },
    { key: 'MAIN',    label: `Banner chính (${allItems.filter(b => b.loai === 'MAIN').length})` },
    { key: 'SIDEBAR', label: `Widget sidebar (${allItems.filter(b => b.loai === 'SIDEBAR').length})` },
  ];

  // Form initial based on editing state
  const formInitial = editing && !editing.__defaultLoai
    ? { tieuDe: editing.tieuDe, hinhAnh: editing.hinhAnh || '', duongDan: editing.duongDan || '', loai: editing.loai || 'MAIN' }
    : { ...EMPTY, loai: (editing?.__defaultLoai) || (activeTab !== 'ALL' ? activeTab : 'MAIN') };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý Banner & Widget</h1>
            <p className="text-sm text-gray-500 mt-0.5">Thêm banner ngang và widget sidebar cho trang tin tức</p>
          </div>
        </div>
        <button
          onClick={() => openCreate(activeTab !== 'ALL' ? activeTab : 'MAIN')}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm banner
        </button>
      </div>

      {/* Active status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: 'Banner chính (MAIN)', icon: LayoutTemplate, active: activeMain },
          { label: 'Widget sidebar', icon: Columns, active: activeSidebar },
        ].map(({ label, icon: Icon, active }) => (
          <div key={label} className={`flex items-center gap-3 rounded-xl border-2 p-3 ${active ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
            <div className={`p-2 rounded-lg flex-shrink-0 ${active ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              {active
                ? <p className="text-sm font-semibold text-green-800 truncate">{active.tieuDe}</p>
                : <p className="text-sm text-gray-400 italic">Chưa có banner hiển thị</p>
              }
            </div>
            {active && (
              <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                <Check className="w-2.5 h-2.5" /> Live
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
        <Radio className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          Nhấn <strong className="text-blue-600">"Hiển thị"</strong> để chọn banner muốn hiển thị ra ngoài — tự động tắt banner cũ cùng loại.
          Nhấn <strong className="text-red-500">"Tắt"</strong> để ẩn hoàn toàn.
        </span>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editing && !editing.__defaultLoai ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
              </h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <BannerForm
                initial={formInitial}
                onSave={handleSave}
                onCancel={closeForm}
                loading={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Danh sách banner ({items.length})
          </span>
          <span className="text-xs text-gray-400">Kéo để sắp xếp thứ tự</span>
        </div>

        <div className="p-4 space-y-2 min-h-[200px]">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <LayoutTemplate className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có banner nào. Nhấn "Thêm banner" để bắt đầu.</p>
            </div>
          ) : (
            items.map((item) => (
              <BannerRow
                key={item.id}
                item={item}
                isDragOver={dragOverId === item.id}
                onEdit={openEdit}
                onDelete={handleDelete}
                onActivate={(id) => activateMut.mutate(id)}
                onDeactivate={(id) => deactivateMut.mutate(id)}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                activatePending={activatePending}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMut.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa banner"
        description="Bạn có chắc muốn xóa banner này? Hành động này không thể hoàn tác."
        isLoading={deleteMut.isPending}
      />
    </div>
  );
};

export default AdBannerManagerPage;
