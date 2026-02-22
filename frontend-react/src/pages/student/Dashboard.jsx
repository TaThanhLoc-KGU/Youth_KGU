import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Activity,
  Award,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
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
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import {
  getTrangThaiBadgeVariant,
  getTrangThaiLabel,
  getLoaiHoatDongLabel,
} from '../../constants/activityConstants';

const CATEGORY_COLORS = {
  I: '#6366f1',
  II: '#22c55e',
  III: '#f59e0b',
  IV: '#3b82f6',
  V: '#ec4899',
  VI: '#14b8a6',
};

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
      title: 'Hoạt động đã đăng ký',
      value: registrations.length,
      icon: Calendar,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Hoạt động đã tham gia',
      value: attendedRegs.length,
      icon: CheckCircle2,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Điểm rèn luyện',
      value: totalPoints,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Hoạt động đang mở',
      value: openActivities.length,
      icon: Activity,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.hoTen || user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">
          Chào mừng bạn đến với hệ thống quản lý hoạt động Đoàn - Hội KGU
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Hoạt động đang mở đăng ký</h3>
            <Link
              to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {openActivities.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có hoạt động nào đang mở</p>
              </div>
            ) : (
              openActivities.slice(0, 5).map((activity) => (
                <div key={activity.maHoatDong} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {activity.tenHoatDong}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(activity.ngayToChuc)}
                        </span>
                        {activity.diaDiem && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.diaDiem}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={ROUTES.STUDENT_REGISTER_ACTIVITIES}
                      className="flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium hover:bg-green-100 transition-colors"
                    >
                      Đăng ký
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Đăng ký gần đây</h3>
            <Link
              to={ROUTES.STUDENT_MY_ACTIVITIES}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {registrations.length === 0 ? (
              <div className="py-10 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Bạn chưa đăng ký hoạt động nào</p>
              </div>
            ) : (
              registrations.slice(0, 5).map((reg) => (
                <div key={`${reg.maSv}-${reg.maHoatDong}`} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {reg.tenHoatDong}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(reg.ngayToChuc)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {reg.daDiemDanh ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã tham gia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Chờ tham gia
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Training Points Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Điểm rèn luyện theo danh mục</h3>
            <Link
              to={ROUTES.STUDENT_TRAINING_POINTS}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              Chi tiết <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
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
      )}
    </div>
  );
};

export default StudentDashboard;
