/**
 * SliderManagerPage.jsx
 * Admin trang quản lý Hero Slider — thêm/sửa/xóa/sắp xếp các slide.
 * Mỗi slide có: tiêu đề, mô tả, ảnh (URL), đường dẫn, trạng thái active.
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  ArrowLeft, Save, X, Image, ExternalLink, FolderOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sliderService from '../../services/sliderService';
import ImagePickerModal from '../../components/common/ImagePickerModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ─── Form modal ───────────────────────────────────────────────────────────────

const EMPTY = { tieuDe: '', moTa: '', hinhAnh: '', duongDan: '', isActive: true };

const SliderForm = ({ initial = EMPTY, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const [showPicker, setShowPicker] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const check = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.tieuDe.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Tiêu đề */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
        <input
          value={form.tieuDe} onChange={set('tieuDe')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tiêu đề slide"
        />
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          value={form.moTa} onChange={set('moTa')} rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Mô tả ngắn (hiển thị dưới tiêu đề)"
        />
      </div>

      {/* URL ảnh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Image className="w-3.5 h-3.5" /> Hình ảnh
        </label>
        <div className="flex gap-2">
          <input
            value={form.hinhAnh} onChange={set('hinhAnh')}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            placeholder="https://example.com/image.jpg hoặc /uploads/..."
          />
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <FolderOpen className="w-4 h-4" /> Chọn ảnh
          </button>
        </div>
        {form.hinhAnh && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200" style={{ height: 120 }}>
            <img src={form.hinhAnh} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
          </div>
        )}
      </div>

      <ImagePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(url) => setForm((f) => ({ ...f, hinhAnh: url }))}
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
        <p className="text-xs text-gray-400 mt-1">Đường dẫn nội bộ (không có dấu / đầu) hoặc URL đầy đủ</p>
      </div>

      {/* Active */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={check('isActive')} className="w-4 h-4 accent-blue-600" />
        <span className="text-sm font-medium text-gray-700">Hiển thị slide này</span>
      </label>

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

// ─── Slide card (canvas row) ─────────────────────────────────────────────────

const SlideRow = ({
  item, isDragOver,
  onEdit, onDelete, onToggle,
  onDragStart, onDragEnter, onDragEnd,
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, item.id)}
    onDragEnter={(e) => onDragEnter(e, item.id)}
    onDragEnd={onDragEnd}
    onDragOver={(e) => e.preventDefault()}
    className={`
      group flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab select-none transition-all
      ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-lg scale-[1.01]' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
    `}
  >
    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

    {/* Thumbnail */}
    <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
      {item.hinhAnh
        ? <img src={item.hinhAnh} alt={item.tieuDe} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
        : <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600 opacity-60" />
          </div>
      }
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{item.tieuDe}</p>
      {item.moTa && <p className="text-xs text-gray-400 truncate">{item.moTa}</p>}
      {item.duongDan && (
        <p className="text-xs text-blue-500 truncate">{item.duongDan}</p>
      )}
    </div>

    {/* Status + actions */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={() => onToggle(item)}
        title={item.isActive ? 'Ẩn slide' : 'Hiện slide'}
        className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
      >
        {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
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

const SliderManagerPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmState, setConfirmState] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);    // null = thêm mới
  const [dragOverId, setDragOverId] = useState(null);
  const dragFromId = useRef(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['slider-items-admin'],
    queryFn: sliderService.getAll,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['slider-items-admin'] });

  const createMut = useMutation({ mutationFn: sliderService.create, onSuccess: () => { toast.success('Đã thêm slide'); invalidate(); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => sliderService.update(id, data), onSuccess: () => { toast.success('Đã cập nhật slide'); invalidate(); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: sliderService.delete, onSuccess: () => { toast.success('Đã xóa slide'); invalidate(); } });
  const reorderMut = useMutation({ mutationFn: sliderService.reorder, onSuccess: invalidate });

  // ── Drag-drop reorder ──

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
      const ids = items.map((i) => i.id);
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
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate({ ...form, thuTu: items.length });
  };

  const handleDelete = (id) => {
    setConfirmState({ id });
  };

  const handleToggle = (item) => {
    updateMut.mutate({ id: item.id, data: { ...item, isActive: !item.isActive } });
  };

  const openEdit = (item) => { setEditing(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý Hero Slider</h1>
            <p className="text-sm text-gray-500 mt-0.5">Thêm, sửa, xóa và sắp xếp các slide hiển thị trên trang chủ tin tức</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm slide
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Chỉnh sửa slide' : 'Thêm slide mới'}</h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <SliderForm
                initial={editing ? { tieuDe: editing.tieuDe, moTa: editing.moTa || '', hinhAnh: editing.hinhAnh || '', duongDan: editing.duongDan || '', isActive: editing.isActive } : EMPTY}
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
            Danh sách slides ({items.length})
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
              <Image className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có slide nào. Nhấn "Thêm slide" để bắt đầu.</p>
            </div>
          ) : (
            items.map((item) => (
              <SlideRow
                key={item.id}
                item={item}
                isDragOver={dragOverId === item.id}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>
      </div>

      {/* Preview hint */}
      {items.filter(i => i.isActive).length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {items.filter(i => i.isActive).length} slide đang hiển thị trên trang chủ tin tức
        </p>
      )}

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMut.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa slide"
        description="Bạn có chắc muốn xóa slide này? Hành động này không thể hoàn tác."
        isLoading={deleteMut.isPending}
      />
    </div>
  );
};

export default SliderManagerPage;
