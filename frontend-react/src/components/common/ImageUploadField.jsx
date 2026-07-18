import { useState } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';
import ImagePickerModal from './ImagePickerModal';

/**
 * ImageUploadField – thay thế text-input URL ảnh bằng nút chọn ảnh có preview.
 * Props:
 *   label      – tiêu đề field
 *   value      – URL hiện tại
 *   onChange   – fn(url: string)
 *   aspectRatio – tỷ lệ crop (vd: 16/9). Nếu undefined thì không crop
 *   cropTitle  – tiêu đề cửa sổ crop
 *   previewClass – class Tailwind cho thẻ img preview (mặc định h-32 w-full)
 *   required   – boolean
 */
export default function ImageUploadField({
  label,
  value = '',
  onChange,
  aspectRatio,
  cropTitle,
  previewClass = 'h-32 w-full object-cover rounded-xl',
  required = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <ImageIcon className="w-4 h-4 text-gray-400" />
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="preview" className={previewClass} onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 gap-2">
            <button type="button" onClick={() => setOpen(true)}
              className="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg shadow flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Đổi ảnh
            </button>
            <button type="button" onClick={() => onChange('')}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Xóa
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-1.5">
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">Nhấn để chọn ảnh</span>
          <span className="text-xs text-gray-400">Tải lên hoặc chọn từ thư viện</span>
        </button>
      )}

      <ImagePickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => { onChange(url); setOpen(false); }}
        aspectRatio={aspectRatio}
        cropTitle={cropTitle}
      />
    </div>
  );
}
