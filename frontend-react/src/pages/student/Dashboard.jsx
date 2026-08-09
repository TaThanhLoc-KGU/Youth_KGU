import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar, Activity, TrendingUp, MapPin, ChevronRight,
  CheckCircle2, Clock, Newspaper, Camera, Trophy, Star,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import activityService  from '../../services/activityService';
import dangKyService    from '../../services/dangKyService';
import cuocThiService   from '../../services/cuocThiService';
import useAuthStore     from '../../stores/authStore';
import { formatDate }   from '../../utils/dateFormat';
import { ROUTES }       from '../../utils/constants';
import {
  getLoaiHoatDongLabel,
  getTrangThaiLabel,
} from '../../constants/activityConstants';

const CATEGORY_COLORS = {
  I: '#6366f1', II: '#22c55e', III: '#f59e0b',
  IV: '#3b82f6', V: '#ec4899', VI: '#14b8a6',
};

const SkeletonBox = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
);

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'DOAN_VIEN' ? user?.username : null);

  const { data: openActivities = [], isLoading: loadingOpen, isError: errorActivities } = useQuery({
    queryKey: ['open-activities'],
    queryFn: () => activityService.getByStatus('DANG_MO_DANG_KY'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: registrations = [], isLoading: loadingRegs, isError: errorRegs } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  const { data: allContests = [] } = useQuery({
    queryKey: ['cuoc-thi-dang-mo'],
    queryFn: () => cuocThiService.getDangMo(),
    staleTime: 2 * 60 * 1000,
  });
  const contestsNhanBai = allContests.filter(c => c.choPhepNopBai);

  const attendedRegs = useMemo(
    () => registrations.filter(r => r.daDiemDanh === true),
    [registrations],
  );

  const attendedMaHoatDong = useMemo(
    () => [...new Set(attendedRegs.map(r => r.maHoatDong))],
    [attendedRegs],
  );

  const activityQueries = useQueries({
    queries: attendedMaHoatDong.map(ma => ({
      queryKey: ['hoat-dong', ma],
      queryFn: () => activityService.getById(ma),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const loadingActivities = activityQueries.some(q => q.isLoading);
  const isLoading = loadingOpen || loadingActivities || loadingRegs;

  const activityMap = useMemo(() => {
    const map = {};
    activityQueries.forEach(q => { if (q.data) map[q.data.maHoatDong] = q.data; });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityQueries]);

  const totalPoints = useMemo(() =>
    attendedRegs.reduce((sum, reg) => {
      const act = activityMap[reg.maHoatDong];
      return sum + (act?.diemRenLuyen || 0);
    }, 0),
  [attendedRegs, activityMap]);

  const chartData = useMemo(() => {
    const cats = {};
    attendedRegs.forEach(reg => {
      const act = activityMap[reg.maHoatDong];
      if (act?.maDanhMucRenLuyen && act?.diemRenLuyen) {
        cats[act.maDanhMucRenLuyen] = (cats[act.maDanhMucRenLuyen] || 0) + act.diemRenLuyen;
      }
    });
    return Object.entries(cats).map(([key, value]) => ({ name: `Mục ${key}`, value, key }));
  }, [attendedRegs, activityMap]);

  const statCards = [
    { label: 'Đã đăng ký',  value: registrations.length,  icon: Calendar,     bg: 'bg-blue-50',   fg: 'text-blue-600',   num: 'text-blue-700'   },
    { label: 'Đã tham gia', value: attendedRegs.length,    icon: CheckCircle2, bg: 'bg-green-50',  fg: 'text-green-600',  num: 'text-green-700'  },
    { label: 'Điểm RL',     value: totalPoints,            icon: TrendingUp,   bg: 'bg-indigo-50', fg: 'text-indigo-600', num: 'text-indigo-700' },
    { label: 'HĐ đang mở', value: openActivities.length,  icon: Activity,     bg: 'bg-amber-50',  fg: 'text-amber-600',  num: 'text-amber-700'  },
  ];

  if (errorActivities || errorRegs) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <p className="text-red-500 font-medium">Tải dữ liệu thất bại</p>
      <p className="text-gray-400 text-sm mt-1">Vui lòng tải lại trang</p>
    </div>
  );

  if (isLoading) return (
    <div className="space-y-4 py-4 px-4 lg:px-6">
      <SkeletonBox className="h-28" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <SkeletonBox key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBox className="h-64" />
        <SkeletonBox className="h-64" />
      </div>
    </div>
  );

  return (
    <div className="py-5 px-4 lg:px-6 space-y-6 max-w-6xl mx-auto w-full">

      {/* ── Hero greeting ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-[#155a73] text-white rounded-2xl p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white/70 text-xs mb-0.5">Xin chào,</p>
            <h1 className="text-xl lg:text-2xl font-bold leading-snug truncate">
              {user?.hoTen || user?.username}
            </h1>
            {maSv && <p className="text-white/70 text-sm mt-1">MSSV: {maSv}</p>}
            <p className="text-white/75 text-sm mt-2">Hệ thống quản lý hoạt động Đoàn – Hội KGU</p>
          </div>
          <Link to={ROUTES.NEWS_HOME}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs px-3 py-2 rounded-xl font-medium">
            <Newspaper className="w-4 h-4" /> Tin tức
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${s.fg}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${s.num} leading-none`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main 2-column grid (lg+) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Hoạt động đang mở */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Hoạt động đang mở đăng ký</h2>
            <Link to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
              className="text-xs text-primary flex items-center gap-0.5 font-medium">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {openActivities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Chưa có hoạt động nào đang mở</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openActivities.slice(0, 5).map(activity => (
                <div key={activity.maHoatDong}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start">
                  {/* Left accent */}
                  <div className="w-1 self-stretch rounded-full bg-primary/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                      </span>
                      <span className="text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        {getTrangThaiLabel(activity.trangThai)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{activity.tenHoatDong}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(activity.ngayToChuc)}
                      </span>
                      {activity.diaDiem && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{activity.diaDiem}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
                    className="flex-shrink-0 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors">
                    Đăng ký
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Đăng ký gần đây + Chart */}
        <div className="space-y-6">

          {/* Đăng ký gần đây */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Đăng ký gần đây</h2>
              <Link to={ROUTES.STUDENT_MY_ACTIVITIES}
                className="text-xs text-primary flex items-center gap-0.5 font-medium">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {registrations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Bạn chưa đăng ký hoạt động nào</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {registrations.slice(0, 5).map(reg => (
                  <div key={`${reg.maSv}-${reg.maHoatDong}`} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      reg.daDiemDanh ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {reg.daDiemDanh
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Clock className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{reg.tenHoatDong}</p>
                      <p className="text-xs text-gray-400">{formatDate(reg.ngayToChuc)}</p>
                    </div>
                    {reg.daDiemDanh ? (
                      <span className="flex-shrink-0 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Đã tham gia</span>
                    ) : (
                      <span className="flex-shrink-0 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Chờ tham gia</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Training points chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" /> Điểm rèn luyện theo danh mục
                </h2>
                <Link to={ROUTES.STUDENT_TRAINING_POINTS}
                  className="text-xs text-primary flex items-center gap-0.5 font-medium">
                  Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={v => [`${v} điểm`, 'Điểm rèn luyện']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map(e => (
                      <Cell key={e.key} fill={CATEGORY_COLORS[e.key] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Cuộc thi đang nhận bài ─────────────────────────────────────────── */}
      {contestsNhanBai.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-500" /> Cuộc thi đang nhận bài dự thi
            </h2>
            <Link to={ROUTES.STUDENT_CONTESTS}
              className="text-xs text-orange-500 flex items-center gap-0.5 font-medium">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestsNhanBai.map(ct => (
              <div key={ct.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col">
                {ct.anhBia && (
                  <div className="h-36 overflow-hidden">
                    <img src={ct.anhBia} alt={ct.tieuDe} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Đang nhận bài
                    </span>
                    {ct.hanNop && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        HH: {new Date(ct.hanNop).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{ct.tieuDe}</h3>
                  <Link to={`/binh-chon/${ct.slug}`}
                    className="text-center text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 py-2 rounded-xl transition-colors">
                    📷 Đăng ký tham dự
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
