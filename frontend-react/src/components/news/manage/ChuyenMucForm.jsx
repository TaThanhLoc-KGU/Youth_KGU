import { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import chuyenMucService from '../../../services/chuyenMucService';
import TreePickerModal from './TreePickerModal';

const TO_CHUC_OPTIONS = [
  { value: 'DOAN', label: 'Đoàn Thanh niên' },
  { value: 'HOI', label: 'Hội Sinh viên' },
  { value: 'BAN_DOI_CLB', label: 'Ban – Đội – CLB' },
  { value: 'CHUNG', label: 'Chung' },
];

/**
 * Form tạo/sửa chuyên mục.
 * Props: initial (ChuyenMucDTO | null), onClose (fn)
 */
const ChuyenMucForm = ({ initial = null, onClose }) => {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    ten: initial?.ten || '',
    moTa: initial?.moTa || '',
    toChuc: initial?.toChuc || 'CHUNG',
    thuTu: initial?.thuTu ?? 0,
    isActive: initial?.isActive ?? true,
    parentId: initial?.parentId || null,
  });
  const [parentNode, setParentNode] = useState(
    initial?.parentId ? { id: initial.parentId, ten: initial.tenParent, fullPathSlug: '' } : null
  );
  const [showPicker, setShowPicker] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? chuyenMucService.update(initial.id, data) : chuyenMucService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chuyen-muc-tree'] });
      qc.invalidateQueries({ queryKey: ['chuyen-muc-all'] });
      toast.success(isEdit ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới');
      onClose();
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ten.trim()) { toast.error('Vui lòng nhập tên danh mục'); return; }
    mutation.mutate({ ...form, parentId: parentNode?.id || null });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{isEdit ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h2>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
              <input value={form.ten} onChange={(e) => set('ten', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                placeholder="Ví dụ: Ba chương trình" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha (để trống = cấp 1)</label>
              <button type="button" onClick={() => setShowPicker(true)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-red-400 transition-colors">
                {parentNode ? parentNode.ten : <span className="text-gray-400">Chọn danh mục cha...</span>}
              </button>
              {parentNode && (
                <button type="button" onClick={() => setParentNode(null)}
                  className="mt-1 text-xs text-red-500 hover:underline">Bỏ chọn cha</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổ chức</label>
                <select value={form.toChuc} onChange={(e) => set('toChuc', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400">
                  {TO_CHUC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                <input type="number" value={form.thuTu} onChange={(e) => set('thuTu', +e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" min={0} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea value={form.moTa} onChange={(e) => set('moTa', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
                placeholder="Mô tả ngắn gọn..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 rounded text-red-600" />
              <span className="text-sm text-gray-700">Hiển thị trên website</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
              {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo danh mục')}
            </button>
          </div>
        </form>
      </div>
      {showPicker && (
        <TreePickerModal
          value={parentNode}
          onChange={(node) => { setParentNode(node); setForm((f) => ({ ...f, parentId: node.id })); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};

export default ChuyenMucForm;
