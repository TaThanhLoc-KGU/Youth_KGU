/**
 * ChangePasswordPage — bắt buộc đổi mật khẩu mặc định
 * Hiện ra khi user.mustChangePassword = true (sau login lần đầu hoặc dùng MK mặc định)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ShieldAlert, Eye, EyeOff, KeyRound, Check, Info, LogOut } from 'lucide-react';
import authService  from '../../services/authService';
import useAuthStore from '../../stores/authStore';
import { ROUTES, MANAGER_ROLES } from '../../utils/constants';

// ── Password strength meter ───────────────────────────────────────────────────

function strength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const map = [
    { label: '',          color: 'bg-gray-200'  },
    { label: 'Yếu',       color: 'bg-red-400'   },
    { label: 'Trung bình', color: 'bg-amber-400' },
    { label: 'Khá',       color: 'bg-blue-400'  },
    { label: 'Mạnh',      color: 'bg-green-500' },
  ];
  return { score: s, ...map[s] };
}

// ── Req row ───────────────────────────────────────────────────────────────────

function Req({ ok, text }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-gray-200'}`}>
        {ok && <Check className="w-2.5 h-2.5 text-white" />}
      </span>
      {text}
    </li>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChangePasswordPage() {
  const navigate       = useNavigate();
  const { user, clearMustChangePassword, logout } = useAuthStore();
  const [showOld, setShowOld]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPw = watch('newPassword', '');
  const sw    = strength(newPw);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authService.changePassword({
        username:        user.username,
        oldPassword:     data.oldPassword,
        newPassword:     data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      // Clear flag in store + localStorage
      clearMustChangePassword();

      toast.success('Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống.');

      // Redirect based on role
      const vaiTro = user.vaiTro;
      if (MANAGER_ROLES.includes(vaiTro)) {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (vaiTro === 'DOAN_VIEN') {
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.PROFILE, { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu bắt buộc</h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Tài khoản của bạn đang dùng mật khẩu mặc định.<br/>
            Vui lòng đặt mật khẩu mới để bảo vệ tài khoản.
          </p>
        </div>

        {/* Warning banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Tài khoản: {user?.username}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Mật khẩu mặc định <span className="font-mono font-bold bg-amber-100 px-1 rounded">KGU@123456</span> rất dễ bị đoán.
              Đặt mật khẩu mạnh để bảo vệ thông tin của bạn.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Tạo mật khẩu mới
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

            {/* Old password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu mặc định (KGU@123456)"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors
                    ${errors.oldPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('oldPassword', { required: 'Nhập mật khẩu hiện tại' })}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowOld(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> {errors.oldPassword.message}
                </p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors
                    ${errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('newPassword', {
                    required: 'Nhập mật khẩu mới',
                    minLength: { value: 8, message: 'Tối thiểu 8 ký tự' },
                    validate: {
                      notDefault: v =>
                        v !== 'KGU@123456' && v !== 'KGU@12345'
                        || 'Không được dùng mật khẩu mặc định',
                    },
                  })}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> {errors.newPassword.message}
                </p>
              )}

              {/* Strength meter */}
              {newPw && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= sw.score ? sw.color : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                  {sw.label && (
                    <p className={`text-xs font-medium ${
                      sw.score <= 1 ? 'text-red-500'
                      : sw.score === 2 ? 'text-amber-500'
                      : sw.score === 3 ? 'text-blue-500'
                      : 'text-green-600'
                    }`}>Độ mạnh: {sw.label}</p>
                  )}
                  <ul className="space-y-0.5 mt-1">
                    <Req ok={newPw.length >= 8}           text="Ít nhất 8 ký tự" />
                    <Req ok={/[A-Z]/.test(newPw)}         text="Có chữ hoa" />
                    <Req ok={/[0-9]/.test(newPw)}         text="Có chữ số" />
                    <Req ok={/[^A-Za-z0-9]/.test(newPw)} text="Có ký tự đặc biệt (@, #, !...)" />
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors
                    ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('confirmPassword', {
                    required: 'Xác nhận mật khẩu',
                    validate: v => v === newPw || 'Mật khẩu xác nhận không khớp',
                  })}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md transition-all active:scale-[0.99]">
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
              ) : (
                <><Check className="w-4 h-4" /> Đặt mật khẩu mới</>
              )}
            </button>

            {/* Skip — only if not truly forced (user can logout) */}
            <div className="text-center pt-1">
              <button type="button" onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          © {new Date().getFullYear()} Youth KGU
        </p>
      </div>
    </div>
  );
}
