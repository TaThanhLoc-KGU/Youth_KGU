import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Calendar, MapPin, Users, ChevronRight, X,
  UserCheck, Trophy, Zap, LogIn, CheckCircle2, AlertCircle,
  Clock, UserX, Loader2, FileCheck, Download,
} from 'lucide-react';
import activityService from '../../services/activityService';
import banHanhService from '../../services/banHanhService';
import cuocThiService from '../../services/cuocThiService';
import authService from '../../services/authService';
import useAuthStore from '../../stores/authStore';
import {
  getLoaiHoatDongLabel,
  getLoaiHoatDongColor,
  getTrangThaiLabel,
  getTrangThaiBadgeVariant,
} from '../../constants/activityConstants';
import { formatDate } from '../../utils/dateFormat';

// ─── Badge trạng thái ─────────────────────────────────────────────────────────
const BADGE_STYLE = {
  success:   'bg-green-100 text-green-700 border-green-200',
  warning:   'bg-amber-100 text-amber-700 border-amber-200',
  info:      'bg-blue-100 text-blue-700 border-blue-200',
  secondary: 'bg-gray-100 text-gray-600 border-gray-200',
  danger:    'bg-red-100 text-red-700 border-red-200',
};

const StatusBadge = ({ trangThai }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLE[getTrangThaiBadgeVariant(trangThai)] || BADGE_STYLE.secondary}`}>
    {getTrangThaiLabel(trangThai)}
  </span>
);

// ─── Modal đăng nhập inline ────────────────────────────────────────────────────
const LoginModal = ({ onClose, onSuccess }) => {
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(form);
      await login(res);
      onSuccess?.();
    } catch {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-enews-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6 text-enews-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Đăng nhập để đăng ký</h3>
          <p className="text-gray-500 text-sm mt-1">Vui lòng đăng nhập bằng tài khoản sinh viên</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-3 py-2.5 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            required
            type="text"
            placeholder="Tên đăng nhập / MSSV"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-enews-400 focus:ring-2 focus:ring-enews-100"
          />
          <input
            required
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-enews-400 focus:ring-2 focus:ring-enews-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-enews-600 text-white text-sm font-medium rounded-xl hover:bg-enews-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Chưa có tài khoản?{' '}
          <Link to="/login" onClick={onClose} className="text-enews-600 hover:underline font-medium">
            Liên hệ phòng CTSV
          </Link>
        </p>
      </div>
    </div>
  );
};

// ─── Nút đăng ký hoạt động ────────────────────────────────────────────────────
const RegisterButton = ({ activity, onNeedLogin }) => {
  const { isAuthenticated, laAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');

  const canRegister = activity.trangThai === 'DANG_MO_DANG_KY';

  const { data: status, isLoading: checkLoading } = useQuery({
    queryKey: ['check-dang-ky', activity.maHoatDong],
    queryFn: () => activityService.publicCheckRegister(activity.maHoatDong),
    enabled: isAuthenticated && !laAdmin && canRegister,
    retry: false,
  });

  const daDangKy = status?.daDangKy ?? false;

  const registerMut = useMutation({
    mutationFn: () => activityService.publicRegister(activity.maHoatDong),
    onSuccess: () => {
      queryClient.invalidateQueries(['check-dang-ky', activity.maHoatDong]);
      queryClient.invalidateQueries(['public-tham-gia', activity.maHoatDong]);
      setMsg('Đăng ký thành công! ✅');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (err) => {
      setMsg(err?.response?.data?.message || 'Đăng ký thất bại');
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => activityService.publicCancelRegister(activity.maHoatDong),
    onSuccess: () => {
      queryClient.invalidateQueries(['check-dang-ky', activity.maHoatDong]);
      setMsg('Đã hủy đăng ký');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (err) => {
      setMsg(err?.response?.data?.message || 'Hủy thất bại');
      setTimeout(() => setMsg(''), 4000);
    },
  });

  if (!canRegister) return null;

  // Admin không được đăng ký
  if (laAdmin) {
    return (
      <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Tài khoản quản trị không thể đăng ký hoạt động
      </div>
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <button
        onClick={onNeedLogin}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-enews-600 text-white text-sm font-medium rounded-xl hover:bg-enews-700 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Đăng nhập để đăng ký hoạt động
      </button>
    );
  }

  if (checkLoading) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 py-2.5 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
      </div>
    );
  }

  const busy = registerMut.isPending || cancelMut.isPending;

  return (
    <div className="mt-4 space-y-2">
      {msg && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${msg.includes('✅') || msg.includes('thành công') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {msg.includes('✅') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg}
        </div>
      )}
      {daDangKy ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Bạn đã đăng ký hoạt động này
          </div>
          <button
            onClick={() => cancelMut.mutate()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
            Hủy đăng ký
          </button>
        </div>
      ) : (
        <button
          onClick={() => registerMut.mutate()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-enews-600 text-white text-sm font-medium rounded-xl hover:bg-enews-700 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Đăng ký tham gia
        </button>
      )}
    </div>
  );
};

// ─── Item hoạt động trong danh sách ──────────────────────────────────────────
const ActivityItem = ({ activity, onClick }) => {
  const color = getLoaiHoatDongColor(activity.loaiHoatDong);
  const canRegister = activity.trangThai === 'DANG_MO_DANG_KY';

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-enews-300 hover:shadow-sm transition-all duration-150 cursor-pointer group"
      onClick={() => onClick(activity)}
    >
      <div className="flex items-stretch gap-0">
        <div className="w-1 rounded-l-xl flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-[15px] leading-snug group-hover:text-enews-700 transition-colors line-clamp-2">
                {activity.tenHoatDong}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: color }}>
                  {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                </span>
                {activity.capDo && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                    {activity.capDo}
                  </span>
                )}
                <StatusBadge trangThai={activity.trangThai} />
                {canRegister && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-enews-100 text-enews-700 border border-enews-200 animate-pulse">
                    📋 Mở đăng ký
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-500">
                {activity.ngayToChuc && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(activity.ngayToChuc)}
                    {activity.thoiGianBatDau && (
                      <span className="text-gray-400 ml-0.5">
                        · {activity.thoiGianBatDau.slice(0, 5)}
                        {activity.thoiGianKetThuc && ` – ${activity.thoiGianKetThuc.slice(0, 5)}`}
                      </span>
                    )}
                  </span>
                )}
                {activity.diaDiem && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{activity.diaDiem}</span>
                  </span>
                )}
                {activity.diemRenLuyen != null && (
                  <span className="font-medium text-enews-600">+{activity.diemRenLuyen} điểm RL</span>
                )}
                {activity.hanDangKy && canRegister && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Hạn: {formatDate(activity.hanDangKy)}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-enews-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Modal chi tiết + đăng ký ────────────────────────────────────────────────
const ActivityDetailModal = ({ activity, onClose }) => {
  const [search, setSearch] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['public-tham-gia', activity?.maHoatDong],
    queryFn: () => activityService.getPublicThamGia(activity.maHoatDong),
    enabled: !!activity?.maHoatDong,
    staleTime: 2 * 60 * 1000,
  });

  const { data: banHanhList = [] } = useQuery({
    queryKey: ['ban-hanh-public', activity?.maHoatDong],
    queryFn: () => banHanhService.getAllPublic(activity.maHoatDong),
    enabled: !!activity?.maHoatDong,
    staleTime: 5 * 60 * 1000,
  });
  const latestBanHanh = banHanhList[0] ?? null;

  const filtered = useMemo(() => {
    if (!search) return participants;
    const kw = search.toLowerCase();
    return participants.filter(p =>
      p.hoTen?.toLowerCase().includes(kw) || p.tenLop?.toLowerCase().includes(kw)
    );
  }, [participants, search]);

  if (!activity) return null;
  const color = getLoaiHoatDongColor(activity.loaiHoatDong);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    queryClient.invalidateQueries(['check-dang-ky', activity.maHoatDong]);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                  </span>
                  <StatusBadge trangThai={activity.trangThai} />
                </div>
                <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                  {activity.tenHoatDong}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                  {activity.ngayToChuc && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(activity.ngayToChuc)}
                    </span>
                  )}
                  {activity.diaDiem && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {activity.diaDiem}
                    </span>
                  )}
                  {activity.diemRenLuyen != null && (
                    <span className="font-semibold text-enews-600">+{activity.diemRenLuyen} điểm RL</span>
                  )}
                  {activity.hanDangKy && (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Hạn ĐK: {formatDate(activity.hanDangKy)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nút đăng ký */}
            <RegisterButton
              activity={activity}
              onNeedLogin={() => setShowLogin(true)}
            />
          </div>

          {/* Ban hành chính thức */}
          {latestBanHanh && (
            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">Danh sách đã ban hành chính thức</span>
                  <span className="text-xs text-emerald-500">
                    · {latestBanHanh.tongSv} SV · {latestBanHanh.createdAt ? new Date(latestBanHanh.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
                <a
                  href={latestBanHanh.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải danh sách
                </a>
              </div>
              {banHanhList.length > 1 && (
                <p className="text-xs text-emerald-500 mt-1">
                  {banHanhList.length} phiên bản — xem tất cả tại{' '}
                  <a
                    href={`/ban-hanh/${activity.maHoatDong}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-emerald-700"
                    onClick={e => e.stopPropagation()}
                  >
                    trang ban hành
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Subheader danh sách */}
          {!isLoading && (
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <strong className="text-green-700">{participants.length}</strong>
                  <span>sinh viên đã đăng ký</span>
                  {participants.filter(p => p.daDiemDanh).length > 0 && (
                    <span className="text-xs text-green-600 ml-1">
                      ({participants.filter(p => p.daDiemDanh).length} đã điểm danh)
                    </span>
                  )}
                </div>
                {participants.length > 0 && (
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, lớp..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-enews-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Chưa có sinh viên tham gia</p>
                <p className="text-xs mt-0.5">Hoạt động chưa diễn ra hoặc chưa có điểm danh</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Không tìm thấy sinh viên phù hợp
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                      {p.hoTen ? p.hoTen.split(' ').pop()[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.hoTen || '—'}</p>
                      {p.tenLop && <p className="text-xs text-gray-500 truncate">{p.tenLop}</p>}
                    </div>
                    {p.daDiemDanh && (
                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">✓ Đã ĐD</span>
                    )}
                    <span className="text-xs text-gray-400 flex-shrink-0">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Login modal overlay */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
};

// ─── Competition Banner ────────────────────────────────────────────────────────
const CuocThiBanner = () => {
  const navigate = useNavigate();
  const { data: cuocThis = [] } = useQuery({
    queryKey: ['cuoc-thi-dang-mo-banner'],
    queryFn: cuocThiService.getDangMo,
    staleTime: 5 * 60 * 1000,
  });

  if (!cuocThis.length) return null;

  return (
    <div className="mb-5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-yellow-400 rounded-lg">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-yellow-900">Cuộc thi đang mở bình chọn</span>
        <span className="ml-auto text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-medium">
          {cuocThis.length} cuộc thi
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {cuocThis.slice(0, 3).map(ct => (
          <button
            key={ct.id}
            onClick={() => navigate(`/binh-chon/${ct.slug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-yellow-200 rounded-xl text-sm text-yellow-800 hover:bg-yellow-50 hover:border-yellow-400 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            {ct.tieuDe}
            <span className="text-xs text-yellow-500">❤️ {ct.tongSoVote?.toLocaleString() || 0}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate('/binh-chon')}
        className="flex items-center gap-1 text-sm text-yellow-700 font-medium hover:text-yellow-900"
      >
        Xem tất cả cuộc thi <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TRANG_THAI_FILTER = [
  { value: '',               label: 'Tất cả trạng thái' },
  { value: 'SAP_DIEN_RA',   label: 'Sắp diễn ra' },
  { value: 'DANG_MO_DANG_KY', label: '📋 Đang mở đăng ký' },
  { value: 'DANG_DIEN_RA',  label: 'Đang diễn ra' },
  { value: 'DA_HOAN_THANH', label: 'Đã hoàn thành' },
  { value: 'DA_KET_THUC',   label: 'Đã kết thúc' },
  { value: 'DA_HUY',        label: 'Đã hủy' },
];

const HoatDongPublicPage = () => {
  const [keyword, setKeyword]     = useState('');
  const [search, setSearch]       = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [selected, setSelected]   = useState(null);

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['public-hoat-dong'],
    queryFn: activityService.getPublic,
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });

  // Thứ tự ưu tiên trạng thái — đang diễn ra lên đầu, đã hủy xuống cuối
  const STATUS_PRIORITY = {
    DANG_DIEN_RA:    1,
    DANG_MO_DANG_KY: 2,
    SAP_DIEN_RA:     3,
    DA_KET_THUC:     4,
    DA_HOAN_THANH:   5,
    DA_HUY:          7,
  };

  const filtered = useMemo(() => {
    return activities
      .filter((a) => {
        const matchStatus = !trangThai || a.trangThai === trangThai;
        const matchSearch =
          !search ||
          a.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
          a.diaDiem?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        // 1. Ưu tiên trạng thái
        const pa = STATUS_PRIORITY[a.trangThai] ?? 9;
        const pb = STATUS_PRIORITY[b.trangThai] ?? 9;
        if (pa !== pb) return pa - pb;

        // 2. Cùng trạng thái → ngày tổ chức mới hơn trước
        const da = a.ngayToChuc ? new Date(a.ngayToChuc) : null;
        const db = b.ngayToChuc ? new Date(b.ngayToChuc) : null;
        if (da && db) {
          const cmp = db - da;
          if (cmp !== 0) return cmp;
        } else if (!da && db) return 1;
        else if (da && !db) return -1;

        // 3. Cùng ngày → mới tạo nhất trước
        const ca = a.createdAt ? new Date(a.createdAt) : null;
        const cb = b.createdAt ? new Date(b.createdAt) : null;
        if (ca && cb) return cb - ca;
        if (!ca) return 1;
        return -1;
      });
  }, [activities, search, trangThai]);

  const completed  = activities.filter(a => ['DA_HOAN_THANH', 'DA_KET_THUC'].includes(a.trangThai)).length;
  const inProgress = activities.filter(a => ['DANG_DIEN_RA', 'DANG_MO_DANG_KY'].includes(a.trangThai)).length;
  const openReg    = activities.filter(a => a.trangThai === 'DANG_MO_DANG_KY').length;

  return (
    <>
      <Helmet>
        <title>Hoạt động Đoàn | Youth KGU</title>
        <meta name="description" content="Danh sách các hoạt động Đoàn – Hội Sinh viên Trường Đại học Kiên Giang" />
      </Helmet>

      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Hoạt động Đoàn – Hội</h1>
        <p className="text-gray-500 text-sm">
          Danh sách các hoạt động của Đoàn – Hội Sinh viên Trường Đại học Kiên Giang
        </p>
      </div>

      <CuocThiBanner />

      {/* Thống kê */}
      {!isLoading && activities.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { label: 'Tổng hoạt động',    value: activities.length, cls: 'text-enews-700 bg-enews-50 border-enews-100' },
            { label: 'Đã hoàn thành',     value: completed,         cls: 'text-green-700 bg-green-50 border-green-100' },
            { label: 'Đang / Sắp diễn ra',value: inProgress,        cls: 'text-amber-700 bg-amber-50 border-amber-100' },
            ...(openReg > 0 ? [{ label: 'Đang mở đăng ký', value: openReg, cls: 'text-enews-700 bg-blue-50 border-blue-100 animate-pulse' }] : []),
          ].map(s => (
            <div key={s.label} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${s.cls}`}>
              <strong>{s.value}</strong>
              <span className="font-normal text-xs opacity-80">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <form
          onSubmit={e => { e.preventDefault(); setSearch(keyword); }}
          className="flex flex-1 gap-2"
        >
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm theo tên hoạt động, địa điểm..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-enews-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-enews-600 text-white text-sm font-medium rounded-xl hover:bg-enews-700 transition-colors flex-shrink-0">
            Tìm
          </button>
        </form>
        <select
          value={trangThai}
          onChange={e => setTrangThai(e.target.value)}
          className="w-full sm:w-auto border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-enews-400 bg-white"
        >
          {TRANG_THAI_FILTER.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-gray-200 min-h-[50px]" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-red-400" />
          <p className="font-medium text-red-500">Không thể tải danh sách hoạt động</p>
          <p className="text-xs mt-1">Vui lòng thử lại sau</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {activities.length === 0 ? 'Chưa có hoạt động nào' : 'Không tìm thấy hoạt động phù hợp'}
          </p>
          {(search || trangThai) && (
            <button
              onClick={() => { setSearch(''); setKeyword(''); setTrangThai(''); }}
              className="mt-2 text-sm text-enews-600 hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          {(search || trangThai) && (
            <p className="text-xs text-gray-500 mb-3">
              Tìm thấy <strong className="text-gray-700">{filtered.length}</strong> hoạt động
            </p>
          )}
          <div className="space-y-2.5">
            {filtered.map(act => (
              <ActivityItem key={act.maHoatDong} activity={act} onClick={setSelected} />
            ))}
          </div>
        </>
      )}

      {selected && (
        <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};

export default HoatDongPublicPage;
