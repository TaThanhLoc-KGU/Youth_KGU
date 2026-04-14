/**
 * TickerManagerPage.jsx
 * Admin trang quản lý Tin chạy chữ — thêm/sửa/xóa/sắp xếp các ticker item.
 * Mỗi item có: nội dung văn bản, đường dẫn (tuỳ chọn), trạng thái active.
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  ArrowLeft, Save, X, Volume2, Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tickerService from '../../services/tickerService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ─── Form modal ───────────────────────────────────────────────────────────────

const EMPTY = { noiDung: '', duongDan: '', isActive: true };

const TickerForm = ({ initial = EMPTY, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial);
  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const check = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.noiDung.trim()) { toast.error('Vui lòng nhập nội dung'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Nội dung */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nội dung <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.noiDung} onChange={set('noiDung')} rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Nhập nội dung tin chạy chữ..."
        />
        <p className="text-xs text-gray-400 mt-1">{form.noiDung.length} ký tự</p>
      </div>

      {/* Đường dẫn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <LinkIcon className="w-3.5 h-3.5" /> Đường dẫn (tuỳ chọn)
        </label>
        <input
          value={form.duongDan} onChange={set('duongDan')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="tin-tuc/bai-viet hoặc để trống"
        />
        <p className="text-xs text-gray-400 mt-1">Bỏ trống nếu không muốn link khi nhấn vào</p>
      </div>

      {/* Active */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={check('isActive')} className="w-4 h-4 accent-blue-600" />
        <span className="text-sm font-medium text-gray-700">Hiển thị nội dung này</span>
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

// ─── Ticker row ───────────────────────────────────────────────────────────────

const TickerRow = ({
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
      group flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-grab select-none transition-all
      ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-lg scale-[1.01]' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
    `}
  >
    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium truncate ${item.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
        {item.noiDung}
      </p>
      {item.duongDan && (
        <p className="text-xs text-blue-400 truncate mt-0.5">{item.duongDan}</p>
      )}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={() => onToggle(item)}
        title={item.isActive ? 'Ẩn' : 'Hiện'}
        className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
      >
        {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
        title="Sửa"
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

// ─── Preview strip ────────────────────────────────────────────────────────────

const TickerPreview = ({ items }) => {
  const active = items.filter((i) => i.isActive);
  if (!active.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500">Xem trước — Tin chạy chữ</p>
      </div>
      <div className="bg-blue-700 text-white flex items-center overflow-hidden" style={{ height: 40 }}>
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 px-3 h-full text-sm font-semibold whitespace-nowrap">
          <Volume2 className="w-4 h-4 animate-pulse" />
          Tin mới
        </div>
        <div className="flex-1 px-4 overflow-hidden">
          <p className="text-sm text-white/90 truncate">
            {active.map((i) => i.noiDung).join('  ·  ')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TickerManagerPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmState, setConfirmState] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragFromId = useRef(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ticker-items-admin'],
    queryFn: tickerService.getAll,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ticker-items-admin'] });

  const createMut = useMutation({ mutationFn: tickerService.create, onSuccess: () => { toast.success('Đã thêm nội dung'); invalidate(); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => tickerService.update(id, data), onSuccess: () => { toast.success('Đã cập nhật'); invalidate(); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: tickerService.delete, onSuccess: () => { toast.success('Đã xóa'); invalidate(); } });
  const reorderMut = useMutation({ mutationFn: tickerService.reorder, onSuccess: invalidate });

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

  const openEdit  = (item) => { setEditing(item); setShowForm(true); };
  const closeForm = ()     => { setShowForm(false); setEditing(null); };

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
            <h1 className="text-xl font-bold text-gray-900">Quản lý Tin chạy chữ</h1>
            <p className="text-sm text-gray-500 mt-0.5">Thêm, sửa, xóa nội dung chạy chữ hiển thị trên trang chủ tin tức</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm nội dung
        </button>
      </div>

      {/* Preview */}
      <TickerPreview items={items} />

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Chỉnh sửa nội dung' : 'Thêm nội dung mới'}</h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <TickerForm
                initial={editing ? { noiDung: editing.noiDung, duongDan: editing.duongDan || '', isActive: editing.isActive } : EMPTY}
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
            Danh sách nội dung ({items.length})
          </span>
          <span className="text-xs text-gray-400">Kéo để sắp xếp thứ tự</span>
        </div>

        <div className="p-4 space-y-2 min-h-[200px]">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Volume2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có nội dung nào. Nhấn "Thêm nội dung" để bắt đầu.</p>
            </div>
          ) : (
            items.map((item) => (
              <TickerRow
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

      {items.filter(i => i.isActive).length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {items.filter(i => i.isActive).length} nội dung đang hiển thị trên trang chủ tin tức
        </p>
      )}

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { deleteMut.mutate(confirmState?.id); setConfirmState(null); }}
        title="Xóa nội dung"
        description="Bạn có chắc muốn xóa nội dung tin chạy chữ này? Hành động này không thể hoàn tác."
        isLoading={deleteMut.isPending}
      />
    </div>
  );
};

export default TickerManagerPage;
