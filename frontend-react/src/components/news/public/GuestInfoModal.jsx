import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

/**
 * Popup thu thập thông tin khách khi bình luận mà chưa đăng nhập.
 * Họ tên / số điện thoại / email đều bắt buộc (đánh dấu *).
 */
const GuestInfoModal = ({ noiDung, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ hoTen: '', soDienThoai: '', email: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.hoTen.trim()) e.hoTen = 'Vui lòng nhập họ tên';
    if (!form.soDienThoai.trim()) e.soDienThoai = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9+\s-]{8,15}$/.test(form.soDienThoai.trim())) e.soDienThoai = 'Số điện thoại không hợp lệ';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ noiDung, ...form });
  };

  const fieldClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      hasError ? 'border-red-300' : 'border-gray-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Thông tin người bình luận</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-gray-500 -mt-1">
            Bạn chưa đăng nhập — vui lòng nhập đầy đủ thông tin bên dưới để gửi bình luận.
            Các trường có dấu <span className="text-red-500">*</span> là bắt buộc.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              value={form.hoTen}
              onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))}
              className={fieldClass(errors.hoTen)}
              placeholder="Nguyễn Văn A"
              autoFocus
            />
            {errors.hoTen && <p className="text-xs text-red-600 mt-1">{errors.hoTen}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              value={form.soDienThoai}
              onChange={(e) => setForm((f) => ({ ...f, soDienThoai: e.target.value }))}
              className={fieldClass(errors.soDienThoai)}
              placeholder="09xxxxxxxx"
            />
            {errors.soDienThoai && <p className="text-xs text-red-600 mt-1">{errors.soDienThoai}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={fieldClass(errors.email)}
              placeholder="ban@example.com"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Gửi bình luận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestInfoModal;
