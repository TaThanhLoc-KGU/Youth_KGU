import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Activity,
  TrendingUp,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Clock,
  Newspaper,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import activityService from '../../services/activityService';
import dangKyService from '../../services/dangKyService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import { ROUTES } from '../../utils/constants';
import {
  getLoaiHoatDongLabel,
  getTrangThaiBadgeVariant,
  getTrangThaiLabel,
} from '../../constants/activityConstants';

const CATEGORY_COLORS = {
  I: '#6366f1',
  II: '#22c55e',
  III: '#f59e0b',
  IV: '#3b82f6',
  V: '#ec4899',
  VI: '#14b8a6',
};

/* ── Skeleton helpers ────────────────────────────────────────────── */
const SkeletonBox = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
);

const StudentDashboard = () => {
  const { user } = useAuthStore();
  // maSv: ưu tiên linkedEntityId, fallback sang username (vì username = maSv với tài khoản sinh viên)
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);

  // Open activities
  const { data: openActivities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['open-activities'],
    queryFn: () => activityService.getByStatus('DANG_MO_DANG_KY'),
    staleTime: 5 * 60 * 1000,
  });

  // All activities (for training point lookup)
  const { data: allActivitiesPage } = useQuery({
    queryKey: ['all-activities-map'],
    queryFn: () => activityService.getAllWithPagination({ page: 0, size: 500 }),
    staleTime: 10 * 60 * 1000,
  });

  // Student's registrations
  const { data: registrations = [], isLoading: loadingRegs } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  const isLoading = loadingActivities || loadingRegs;

  // Build activity map for quick lookup
  const activityMap = useMemo(() => {
    const map = {};
    (allActivitiesPage?.content || []).forEach((a) => {
      map[a.maHoatDong] = a;
    });
    return map;
  }, [allActivitiesPage]);

  // Stats
  const attendedRegs = useMemo(
    () => registrations.filter((r) => r.daDiemDanh === true),
    [registrations]
  );

  const totalPoints = useMemo(() => {
    return attendedRegs.reduce((sum, reg) => {
      const activity = activityMap[reg.maHoatDong];
      return sum + (activity?.diemRenLuyen || 0);
    }, 0);
  }, [attendedRegs, activityMap]);

  // Training points by category (for chart)
  const chartData = useMemo(() => {
    const cats = {};
    attendedRegs.forEach((reg) => {
      const activity = activityMap[reg.maHoatDong];
      if (activity?.maDanhMucRenLuyen && activity?.diemRenLuyen) {
        const cat = activity.maDanhMucRenLuyen;
        cats[cat] = (cats[cat] || 0) + activity.diemRenLuyen;
      }
    });
    return Object.entries(cats).map(([key, value]) => ({
      name: `Mục ${key}`,
      value,
      key,
    }));
  }, [attendedRegs, activityMap]);

  const statCards = [
    {
      label: 'Đã đăng ký',
      value: registrations.length,
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      label: 'Đã tham gia',
      value: attendedRegs.length,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
    },
    {
      label: 'Điểm RL',
      value: totalPoints,
      icon: TrendingUp,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-700',
    },
    {
      label: 'Đang mở',
      value: openActivities.length,
      icon: Activity,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
    },
  ];

  /* ── Loading skeleton ──────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-4 py-4 px-4">
        <SkeletonBox className="h-28" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox className="h-20" />
          <SkeletonBox className="h-20" />
          <SkeletonBox className="h-20" />
          <SkeletonBox className="h-20" />
        </div>
        <SkeletonBox className="h-40" />
        <SkeletonBox className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* ── Hero greeting card ───────────────────────────────────────── */}
      <div className="px-4">
        <div className="bg-gradient-to-br from-primary to-[#155a73] text-white rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white/70 text-xs mb-0.5">Xin chào,</p>
              <h1 className="text-lg font-bold leading-snug truncate">
                {user?.hoTen || user?.username}
              </h1>
              {maSv && (
                <p className="text-white/70 text-xs mt-1">MSSV: {maSv}</p>
              )}
              <p className="text-white/80 text-xs mt-2 leading-relaxed">
                Hệ thống quản lý hoạt động Đoàn – Hội KGU
              </p>
            </div>
            <Link
              to={ROUTES.NEWS_HOME}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs px-3 py-1.5 rounded-xl font-medium"
            >
              <Newspaper className="w-3.5 h-3.5" />
              Tin tức
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats 2x2 grid ──────────────────────────────────────────── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-2xl font-bold ${stat.textColor} leading-none`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Hoạt động đang mở — horizontal scroll ───────────────────── */}
      <div>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Hoạt động đang mở đăng ký</h2>
          <Link
            to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
            className="text-xs text-primary flex items-center gap-0.5 font-medium"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {openActivities.length === 0 ? (
          <div className="mx-4 bg-white rounded-2xl border border-gray-100 py-8 text-center">
            <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chưa có hoạt động nào đang mở</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-1 no-scrollbar">
            {openActivities.slice(0, 5).map((activity) => (
              <div
                key={activity.maHoatDong}
                className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 snap-start flex flex-col gap-2"
              >
                {/* Type badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    activity.trangThai === 'DANG_MO_DANG_KY'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {getTrangThaiLabel(activity.trangThai)}
                  </span>
                </div>
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
                  {activity.tenHoatDong}
                </h3>
                {/* Info */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    {formatDate(activity.ngayToChuc)}
                  </div>
                  {activity.diaDiem && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{activity.diaDiem}</span>
                    </div>
                  )}
                </div>
                {/* Register button */}
                <Link
                  to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
                  className="mt-1 text-center text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 py-1.5 rounded-xl transition-colors"
                >
                  → Đăng ký
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Đăng ký gần đây ─────────────────────────────────────────── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Đăng ký gần đây</h2>
          <Link
            to={ROUTES.STUDENT_MY_ACTIVITIES}
            className="text-xs text-primary flex items-center gap-0.5 font-medium"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-8 text-center">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bạn chưa đăng ký hoạt động nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {registrations.slice(0, 5).map((reg) => (
              <div key={`${reg.maSv}-${reg.maHoatDong}`} className="flex items-center gap-3 px-4 py-3">
                {/* Icon circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  reg.daDiemDanh ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {reg.daDiemDanh
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <Clock className="w-4 h-4 text-amber-500" />
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{reg.tenHoatDong}</p>
                  <p className="text-xs text-gray-400">{formatDate(reg.ngayToChuc)}</p>
                </div>
                {/* Status badge */}
                {reg.daDiemDanh ? (
                  <span className="flex-shrink-0 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                    Đã tham gia
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Chờ tham gia
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Training Points Chart ────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Điểm theo danh mục rèn luyện</h2>
              <Link
                to={ROUTES.STUDENT_TRAINING_POINTS}
                className="text-xs text-primary flex items-center gap-0.5 font-medium"
              >
                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value} điểm`, 'Điểm rèn luyện']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={CATEGORY_COLORS[entry.key] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
