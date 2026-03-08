import { useState } from 'react';
import { CalendarX, Clock, Users, LogIn, CheckCircle, Loader2, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/authStore';
import activityService from '../../../services/activityService';
import { formatDate } from '../../../utils/dateFormat';

/**
 * Nút đăng ký hoạt động trong bài viết chi tiết.
 *
 * - Chưa đăng nhập  → hiển thị inline login form (không redirect)
 * - Sau login thành công → tự động đăng ký hoạt động
 * - Đã đăng nhập    → gọi API đăng ký trực tiếp
 */
const ActivityRegisterBtn = ({ hoatDongId, trangThaiHoatDong, hanDangKy, soChoConLai }) => {
  const { isAuthenticated, user, login } = useAuthStore();
  const [loading,    setLoading]    = useState(false);
  const [registered, setRegistered] = useState(false);

  // Inline login form state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginForm, setLoginForm]         = useState({ taiKhoan: '', matKhau: '' });
  const [loginLoading, setLoginLoading]   = useState(false);
  const [loginError, setLoginError]       = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  if (!hoatDongId) return null;

  // ── Đã hủy ──────────────────────────────────────────────────────────────
  if (trangThaiHoatDong === 'DA_HUY') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
        <CalendarX className="w-4 h-4 flex-shrink-0" />
        Hoạt động này đã bị hủy
      </div>
    );
  }

  // ── Đã qua hạn / đóng đăng ký ───────────────────────────────────────────
  const isExpired = hanDangKy && new Date(hanDangKy) < new Date();
  if (trangThaiHoatDong === 'DONG_DANG_KY' || isExpired) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-4 py-3 text-sm font-medium">
        <Clock className="w-4 h-4 flex-shrink-0" />
        Đã đóng đăng ký
        {hanDangKy && (
          <span className="text-xs text-gray-400 ml-1">
            (hạn {formatDate(hanDangKy)})
          </span>
        )}
      </div>
    );
  }

  // ── Hết chỗ ─────────────────────────────────────────────────────────────
  if (soChoConLai === 0) {
    return (
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm font-medium">
        <Users className="w-4 h-4 flex-shrink-0" />
        Đã hết chỗ
      </div>
    );
  }

  // ── Đã đăng ký thành công ────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        Bạn đã đăng ký tham gia hoạt động thành công!
      </div>
    );
  }

  // ── Xử lý đăng ký (khi đã đăng nhập) ─────────────────────────────────────
  const doRegister = async (loggedInUser) => {
    const resolvedUser = loggedInUser || user;
    const maSv = resolvedUser?.maSv || resolvedUser?.username;
    if (!maSv) {
      toast.error('Không tìm thấy thông tin sinh viên. Vui lòng liên hệ quản trị viên.');
      return;
    }
    setLoading(true);
    try {
      await activityService.register({ maSv, maHoatDong: hoatDongId });
      setRegistered(true);
      toast.success('🎉 Đăng ký tham gia thành công!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginForm(true);
      setLoginError('');
      return;
    }
    doRegister();
  };

  // ── Xử lý đăng nhập inline → rồi tự đăng ký ────────────────────────────
  const handleLoginAndRegister = async (e) => {
    e.preventDefault();
    if (!loginForm.taiKhoan.trim() || !loginForm.matKhau.trim()) {
      setLoginError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await login({ taiKhoan: loginForm.taiKhoan.trim(), matKhau: loginForm.matKhau });
      // login() updates auth store and returns { user, ... }
      setShowLoginForm(false);
      toast.success(`Chào ${result.user?.hoTen || result.user?.taiKhoan || 'bạn'}!`);
      // Now register
      await doRegister(result.user);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản / mật khẩu.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Inline login form ────────────────────────────────────────────────────
  if (showLoginForm) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Đăng nhập để đăng ký tham gia
          </p>
          <button
            type="button"
            onClick={() => setShowLoginForm(false)}
            className="text-blue-400 hover:text-blue-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLoginAndRegister} className="space-y-3">
          {/* Tài khoản */}
          <input
            type="text"
            value={loginForm.taiKhoan}
            onChange={(e) => setLoginForm((f) => ({ ...f, taiKhoan: e.target.value }))}
            placeholder="Tài khoản (MSSV hoặc email)"
            autoFocus
            className="w-full border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
          />

          {/* Mật khẩu */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={loginForm.matKhau}
              onChange={(e) => setLoginForm((f) => ({ ...f, matKhau: e.target.value }))}
              placeholder="Mật khẩu"
              className="w-full border border-blue-200 bg-white rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error message */}
          {loginError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {loginError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowLoginForm(false)}
              className="flex-1 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loginLoading || loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loginLoading || loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogIn className="w-4 h-4" />}
              {loading ? 'Đang đăng ký...' : loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập & Đăng ký'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Default: open registration button ────────────────────────────────────
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-green-800 text-sm">Hoạt động đang mở đăng ký</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-green-600">
            {hanDangKy && (
              <span>Hạn: {formatDate(hanDangKy)}</span>
            )}
            {soChoConLai != null && soChoConLai > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Còn {soChoConLai} chỗ
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : !isAuthenticated
              ? <LogIn className="w-4 h-4" />
              : null}
          {loading
            ? 'Đang đăng ký...'
            : isAuthenticated
              ? 'Đăng ký tham gia'
              : 'Đăng nhập để đăng ký'}
        </button>
      </div>
    </div>
  );
};

export default ActivityRegisterBtn;
