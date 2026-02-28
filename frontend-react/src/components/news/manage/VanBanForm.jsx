import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import vanBanService from '../../../services/vanBanService';

const LOAI_OPTIONS = [
  { value: 'KE_HOACH', label: 'Kế hoạch' }, { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'QUYET_DINH', label: 'Quyết định' }, { value: 'THONG_BAO', label: 'Thông báo' },
  { value: 'BAO_CAO', label: 'Báo cáo' }, { value: 'HUONG_DAN', label: 'Hướng dẫn' },
  { value: 'BIEN_BAN', label: 'Biên bản' }, { value: 'TO_TRINH', label: 'Tờ trình' },
  { value: 'KHAC', label: 'Khác' },
];
const HIEU_LUC_OPTIONS = [
  { value: 'CON_HIEU_LUC', label: 'Còn hiệu lực' },
  { value: 'CHUA_HIEU_LUC', label: 'Chưa hiệu lực' },
  { value: 'HET_HIEU_LUC', label: 'Hết hiệu lực' },
];

/**
 * Form tạo/sửa văn bản.
 * Props: initial (VanBanDTO | null), onClose (fn)
 */
const VanBanForm = ({ initial = null, onClose }) => {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const isPublished = initial?.trangThai === 'PUBLISHED';
  const [form, setForm] = useState({
    soHieu: initial?.soHieu || '',
    trichYeu: initial?.trichYeu || '',
    loaiVanBan: initial?.loaiVanBan || 'KE_HOACH',
    coQuanBanHanh: initial?.coQuanBanHanh || '',
    nguoiKy: initial?.nguoiKy || '',
    ngayBanHanh: initial?.ngayBanHanh || '',
    ngayHieuLuc: initial?.ngayHieuLuc || '',
    ngayHetHan: initial?.ngayHetHan || '',
    hieuLuc: initial?.hieuLuc || 'CON_HIEU_LUC',
  });
  const [file, setFile] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (d) => isEdit ? vanBanService.update(initial.id, d.dto) : vanBanService.create(d.dto, d.file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['van-ban-manage'] });
      toast.success(isEdit ? 'Đã cập nhật văn bản' : 'Đã tạo văn bản mới');
      onClose();
    },
  });

  const replaceFileMutation = useMutation({
    mutationFn: (f) => vanBanService.replaceFile(initial.id, f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['van-ban-manage'] }); toast.success('Đã thay file'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.trichYeu.trim()) { toast.error('Vui lòng nhập trích yếu'); return; }
    mutation.mutate({ dto: form, file });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Sửa văn bản' : 'Upload văn bản mới'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isPublished && (
          <div className="mx-5 mt-4 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            ⚠️ Văn bản đã ban hành — không thể chỉnh sửa nội dung
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu</label>
              <input value={form.soHieu} onChange={(e) => set('soHieu', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50"
                placeholder="VD: 12/KH-ĐTN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại văn bản *</label>
              <select value={form.loaiVanBan} onChange={(e) => set('loaiVanBan', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50">
                {LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trích yếu *</label>
            <textarea value={form.trichYeu} onChange={(e) => set('trichYeu', e.target.value)} disabled={isPublished}
              rows={2} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none disabled:bg-gray-50"
              placeholder="Tóm tắt nội dung văn bản..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cơ quan ban hành</label>
              <input value={form.coQuanBanHanh} onChange={(e) => set('coQuanBanHanh', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người ký</label>
              <input value={form.nguoiKy} onChange={(e) => set('nguoiKy', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ban hành</label>
              <input type="date" value={form.ngayBanHanh} onChange={(e) => set('ngayBanHanh', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Có hiệu lực</label>
              <input type="date" value={form.ngayHieuLuc} onChange={(e) => set('ngayHieuLuc', e.target.value)} disabled={isPublished}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn</label>
              <input type="date" value={form.ngayHetHan} onChange={(e) => set('ngayHetHan', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hiệu lực</label>
            <select value={form.hieuLuc} onChange={(e) => set('hieuLuc', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400">
              {HIEU_LUC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* File upload */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File đính kèm (PDF/Word/Excel, tối đa 50MB)</label>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-red-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {file ? <><FileText className="inline w-4 h-4 mr-1" />{file.name}</> : 'Chọn file...'}
                </span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => setFile(e.target.files[0])} />
              </label>
            </div>
          )}

          {/* Replace file (edit mode, draft only) */}
          {isEdit && !isPublished && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thay thế file</label>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-red-400 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{file ? file.name : 'Chọn file mới...'}</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files[0])} />
                </label>
                {file && (
                  <button type="button" onClick={() => replaceFileMutation.mutate(file)}
                    disabled={replaceFileMutation.isPending}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {replaceFileMutation.isPending ? 'Đang upload...' : 'Upload'}
                  </button>
                )}
              </div>
              {initial?.tenFile && <p className="text-xs text-gray-400 mt-1">📎 File hiện tại: {initial.tenFile}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          {!isPublished && (
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
              {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo văn bản')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VanBanForm;
