import { useState, useEffect } from 'react';
import { X, Image, Pin } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import newsService from '../../../services/newsService';
import RichTextEditor from './RichTextEditor';
import TreePickerModal from './TreePickerModal';
import VanBanSearchBox from './VanBanSearchBox';
import { ChevronRight } from 'lucide-react';

// Simple slug preview (client-side only for display)
const toSlugPreview = (str) =>
  str.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

/**
 * Form tạo/sửa bài đăng tin tức.
 * Props: initial (TinTucDetailDTO | null), onClose (fn), onSuccess (fn)
 */
const TinTucForm = ({ initial = null, onClose, onSuccess }) => {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    tieuDe: initial?.tieuDe || '',
    tomTat: initial?.tomTat || '',
    noiDung: initial?.noiDung || '',
    anhDaiDien: initial?.anhDaiDien || '',
    isGhim: initial?.isGhim || false,
    chuyenMucId: initial?.chuyenMuc?.id || null,
    vanBanId: initial?.vanBan?.id || null,
    hoatDongId: initial?.hoatDongId || '',
  });
  const [chuyenMuc, setChuyenMuc] = useState(initial?.chuyenMuc || null);
  const [vanBan, setVanBan] = useState(initial?.vanBan || null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitAction, setSubmitAction] = useState('draft'); // 'draft' | 'publish'

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { set('chuyenMucId', chuyenMuc?.id || null); }, [chuyenMuc]);
  useEffect(() => { set('vanBanId', vanBan?.id || null); }, [vanBan]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let result;
      if (isEdit) {
        result = await newsService.update(initial.id, data);
      } else {
        result = await newsService.create(data);
      }
      if (submitAction === 'publish') {
        await newsService.publish(result.id || initial.id);
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-manage'] });
      toast.success(submitAction === 'publish' ? 'Bài đã được đăng!' : 'Đã lưu nháp');
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tieuDe.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!form.chuyenMucId) { toast.error('Vui lòng chọn chuyên mục'); return; }
    saveMutation.mutate(form);
  };

  const slugPreview = chuyenMuc
    ? `${chuyenMuc.fullPathSlug}/${toSlugPreview(form.tieuDe)}`
    : toSlugPreview(form.tieuDe);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <h2 className="font-semibold text-gray-900 text-lg">{isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Tiêu đề */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
              <input value={form.tieuDe} onChange={(e) => set('tieuDe', e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-red-400"
                placeholder="Nhập tiêu đề bài viết..." />
              {form.tieuDe && (
                <p className="mt-1 text-xs text-gray-400">
                  🔗 URL: <span className="font-mono text-gray-500">{slugPreview}</span>
                </p>
              )}
            </div>

            {/* Chuyên mục */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên mục *</label>
              <button type="button" onClick={() => setShowPicker(true)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-red-400 transition-colors">
                {chuyenMuc ? (
                  <span className="flex items-center gap-1 text-red-700 flex-wrap">
                    <span>Trang chủ</span>
                    {chuyenMuc.fullPathSlug?.split('/').map((part, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />{part}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400">Chọn chuyên mục...</span>
                )}
              </button>
            </div>

            {/* Tóm tắt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tóm tắt
                <span className="ml-2 text-xs text-gray-400 font-normal">{form.tomTat.length}/300</span>
              </label>
              <textarea value={form.tomTat} onChange={(e) => set('tomTat', e.target.value.slice(0, 300))}
                rows={2} maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
                placeholder="Tóm tắt ngắn gọn về bài viết..." />
            </div>

            {/* Nội dung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
              <RichTextEditor value={form.noiDung} onChange={(v) => set('noiDung', v)} />
            </div>

            {/* Ảnh đại diện */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Image className="w-4 h-4" /> Ảnh đại diện (URL)
              </label>
              <input value={form.anhDaiDien} onChange={(e) => set('anhDaiDien', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                placeholder="https://..." />
              {form.anhDaiDien && (
                <img src={form.anhDaiDien} alt="Preview" className="mt-2 h-32 rounded-xl object-cover" />
              )}
            </div>

            {/* Văn bản đính kèm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Văn bản đính kèm (tuỳ chọn)</label>
              <VanBanSearchBox value={vanBan} onChange={setVanBan} />
            </div>

            {/* Hoạt động liên kết */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã hoạt động liên kết (tuỳ chọn)</label>
              <input value={form.hoatDongId} onChange={(e) => set('hoatDongId', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                placeholder="Mã hoạt động (để trống nếu không liên quan)" />
            </div>

            {/* Ghim */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isGhim} onChange={(e) => set('isGhim', e.target.checked)}
                className="w-4 h-4 rounded text-red-600" />
              <Pin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Ghim bài viết lên đầu</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <div className="flex gap-2">
              <button type="submit" onClick={() => setSubmitAction('draft')} disabled={saveMutation.isPending}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                {saveMutation.isPending && submitAction === 'draft' ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              <button type="submit" onClick={() => setSubmitAction('publish')} disabled={saveMutation.isPending}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
                {saveMutation.isPending && submitAction === 'publish' ? 'Đang đăng...' : 'Đăng bài'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {showPicker && (
        <TreePickerModal value={chuyenMuc} onChange={setChuyenMuc} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
};

export default TinTucForm;
